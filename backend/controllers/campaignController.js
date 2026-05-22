import Campaign from "../models/Campaign.js";
import NGO from "../models/Ngo.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";

const POPULATE_NGO = "name organizationName logoUrl email website city state firebaseUid _id isVerified status cause";
const POPULATE_NGO_FULL = "name organizationName logoUrl bannerUrl email phone website city state pincode darpanId isVerified verifiedAt firebaseUid _id description cause totalDonations totalDonors totalCampaigns";

// ── Haversine distance in km ──────────────────────────────────
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Geocode city+state using Nominatim (free, no API key) ─────
const geocodeLocation = async (city, state) => {
  try {
    const query = encodeURIComponent(`${city}, ${state}, India`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "UnitedImpact/1.0" },
    });
    const data = await res.json();
    if (data?.length > 0) {
      console.log(`✅ Geocoded "${city}, ${state}" → lat:${data[0].lat}, lng:${data[0].lon}`);
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.warn("⚠️ Geocoding failed:", err.message);
  }
  return { latitude: 0, longitude: 0 };
};

// ── GET /api/campaigns — public ───────────────────────────────
export const getCampaigns = async (req, res) => {
  try {
    const {
      category, status, isUrgent, ngoId, search,
      state, goalMin, goalMax,
      lat, lng, distanceKm,
    } = req.query;

    const filter = {};

    // Only admins can see pending/rejected campaigns if they explicitly ask via status query
    const isAdmin = req.user?.role === "admin";
    if (status && ["pending", "rejected"].includes(status)) {
      if (isAdmin) {
        filter.approvalStatus = status;
      } else {
        // Non-admins can't see pending/rejected, force approved
        filter.approvalStatus = "approved";
      }
    } else {
      // Default to approved only for public/donors
      filter.approvalStatus = "approved";
    }

    if (status && status !== "all" && !["pending", "rejected"].includes(status)) {
      filter.status = status;
    }
    if (category) filter.category = category;
    if (isUrgent === "true") filter.isUrgent = true;
    if (state) filter["location.state"] = state;
    if (goalMin || goalMax) {
      filter.goalAmount = {};
      if (goalMin) filter.goalAmount.$gte = Number(goalMin);
      if (goalMax) filter.goalAmount.$lte = Number(goalMax);
    }
    if (search) filter.title = { $regex: search, $options: "i" };

    if (ngoId) {
      const isObjectId = /^[a-f\d]{24}$/i.test(ngoId);
      if (isObjectId) {
        filter.ngoId = ngoId;
      } else {
        const ngo = await NGO.findOne({ firebaseUid: ngoId }).select("_id");
        if (!ngo) return res.json([]);
        filter.ngoId = ngo._id;
      }
    }

    let campaigns = await Campaign.find(filter)
      .populate("ngoId", POPULATE_NGO)
      .sort({ createdAt: -1 });

    // Only show campaigns from verified+approved NGOs
    campaigns = campaigns.filter((c) => {
      const ngo = typeof c.ngoId === "object" ? c.ngoId : null;
      return ngo?.isVerified === true && ngo?.status === "approved";
    });

    // Geo-distance filter (haversine)
    if (lat && lng && distanceKm) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const maxKm = Number(distanceKm);
      campaigns = campaigns.filter((c) => {
        const cLat = c.location?.coordinates?.latitude;
        const cLng = c.location?.coordinates?.longitude;
        if (!cLat || !cLng) return false;
        return haversineKm(userLat, userLng, cLat, cLng) <= maxKm;
      });
    }

    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── GET /api/campaigns/:id — public, single campaign ─────────
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("ngoId", POPULATE_NGO_FULL);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const Donation = (await import("../models/Donation.js")).default;
    const donations = await Donation.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ campaign, donations: donations || [] });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── GET /api/campaigns/ngo/mine — NGO's own campaigns ────────
export const getMyCampaigns = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    const campaigns = await Campaign.find({ ngoId: ngo._id })
      .populate("ngoId", POPULATE_NGO)
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── POST /api/campaigns — NGO creates campaign ────────────────
export const createCampaign = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid })
      .select("_id isVerified status");

    if (!ngo) {
      return res.status(403).json({
        message: "NGO profile not found. Please register your NGO first.",
      });
    }

    // ✅ Accept both "goalAmount" and "targetAmount" from frontend
    const goalAmount = Number(req.body.goalAmount || req.body.targetAmount);
    if (!goalAmount || goalAmount <= 0) {
      return res.status(400).json({ message: "A valid goal amount is required." });
    }

    // ✅ Auto-approve campaigns from verified+approved NGOs
    const isVerifiedNgo = ngo.isVerified === true && ngo.status === "approved";

    // ✅ Use provided coordinates if available, otherwise geocode
    const city = req.body.location?.city || "";
    const state = req.body.location?.state || "";
    let coordinates = {
      latitude: req.body.location?.coordinates?.latitude || 0,
      longitude: req.body.location?.coordinates?.longitude || 0
    };
    if (coordinates.latitude === 0 && coordinates.longitude === 0 && (city || state)) {
      coordinates = await geocodeLocation(city, state);
    }

    const campaign = await Campaign.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "other",
      goalAmount,
      imageUrl: req.body.imageUrl || "",
      images: req.body.images || [],
      tags: req.body.tags || [],
      isUrgent: req.body.isUrgent || false,
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate,
      location: {
        city,
        state,
        coordinates,  // ✅ lat/lng saved at creation — map pin works instantly
      },
      ngoId: ngo._id,
      currentAmount: 0,
      approvalStatus: "pending",
      status: "inactive",
    });

    const populated = await Campaign.findById(campaign._id)
      .populate("ngoId", POPULATE_NGO);

    res.status(201).json({ campaign: populated });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// ── PATCH /api/campaigns/:id/status — admin approves/rejects ─
export const updateCampaignStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      approvalStatus: status,
      ...(status === "approved" && { status: "active" }),
      ...(status === "rejected" && { rejectionReason }),
    };

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    ).populate("ngoId", POPULATE_NGO);

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── PATCH /api/campaigns/:id — NGO edits their campaign ──────
export const updateCampaign = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    if (!ngo) return res.status(403).json({ message: "NGO not found" });

    const campaign = await Campaign.findOne({ _id: req.params.id, ngoId: ngo._id });
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found or not yours" });

    delete req.body.ngoId;
    delete req.body.currentAmount;
    delete req.body.approvalStatus;

    // ✅ Handle targetAmount alias in updates too
    if (req.body.targetAmount && !req.body.goalAmount) {
      req.body.goalAmount = Number(req.body.targetAmount);
      delete req.body.targetAmount;
    }

    // ✅ Update coordinates if changed
    if (req.body.location?.city || req.body.location?.state || req.body.location?.coordinates) {
      const city = req.body.location.city || campaign.location?.city || "";
      const state = req.body.location.state || campaign.location?.state || "";
      let coordinates = req.body.location.coordinates;
      if (!coordinates || (coordinates.latitude === 0 && coordinates.longitude === 0)) {
        coordinates = await geocodeLocation(city, state);
      }
      req.body.location = { city, state, coordinates };
    }

    const updated = await Campaign.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    ).populate("ngoId", POPULATE_NGO);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── PATCH /api/campaigns/:id/location ────────────────────────
export const updateCampaignLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, state, latitude, longitude, location } = req.body || {};

    const nextLat = latitude ?? location?.coordinates?.latitude ?? location?.latitude;
    const nextLng = longitude ?? location?.coordinates?.longitude ?? location?.longitude;
    const nextCity = city ?? location?.city;
    const nextState = state ?? location?.state;

    if (typeof nextLat !== "number" || typeof nextLng !== "number") {
      return res.status(400).json({ message: "latitude and longitude are required numbers" });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    const isOwner = ngo && campaign.ngoId.equals(ngo._id);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden: not owner or admin" });
    }

    campaign.location = {
      city: nextCity || campaign.location?.city,
      state: nextState || campaign.location?.state,
      coordinates: { latitude: nextLat, longitude: nextLng },
      updatedAt: new Date(),
    };

    await campaign.save();
    await campaign.populate("ngoId", POPULATE_NGO);

    const io = getIO();
    io.emit("campaign:location:update", {
      campaignId: campaign._id.toString(),
      location: campaign.location,
    });

    res.json(campaign);
  } catch (error) {
    console.error("updateCampaignLocation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── DELETE /api/campaigns/:id ─────────────────────────────────
export const deleteCampaign = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    if (!ngo) return res.status(403).json({ message: "NGO not found" });

    const campaign = await Campaign.findOne({ _id: req.params.id, ngoId: ngo._id });
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found or not yours" });

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── volunteerForCampaign /api/campaigns/:id/volunteer ──────────
export const volunteerForCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, message } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Check if already volunteered
    const exists = (campaign.volunteers || []).find(v => v.uid === req.user.uid);
    if (exists) return res.status(400).json({ message: "Already applied for this campaign" });

    // Ensure volunteers array exists (in case of old records)
    if (!campaign.volunteers) campaign.volunteers = [];

    // Look up User doc for real name (req.user.firstName is often empty)
    const volunteerUser = await User.findOne({ uid: req.user.uid }).select("name");
    const volunteerName = volunteerUser?.name || req.user.email || "Volunteer";

    campaign.volunteers.push({
      uid: req.user.uid,
      name: volunteerName,
      role: role || "Volunteer",
      message,
      status: "pending",
      joinedAt: new Date(),
    });

    await campaign.save();
    res.json({ message: "Volunteer request sent", campaign });
  } catch (error) {
    console.error("volunteerForCampaign error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
