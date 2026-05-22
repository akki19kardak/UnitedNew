import express from "express";
import Donation from "../models/Donation.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// GET /api/donations/my — donor sees their own history
router.get("/my", verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user.uid })
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/campaign/:campaignId — donations for a campaign
router.get("/campaign/:campaignId", verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find({
      campaignId: req.params.campaignId,
      status: "completed",
      isAnonymous: false,       // hide anonymous donors
    }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/admin/recent — recent donations with populated info
router.get("/admin/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(donations);
  } catch (error) {
    console.error("Fetch recent donations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/ngo/stats — NGO sees their fundraising stats
router.get("/ngo/stats", verifyToken, async (req, res) => {
  try {
    const NGO = (await import("../models/Ngo.js")).default;
    const Campaign = (await import("../models/Campaign.js")).default;

    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    const campaigns = await Campaign.find({ ngoId: ngo._id });
    const campaignIds = campaigns.map(c => c._id);

    const donations = await Donation.find({
      campaignId: { $in: campaignIds },
      status: "completed",
    });

    const uniqueDonors = new Set(donations.map(d => d.donorId)).size;

    res.json({
      activeCampaigns: campaigns.filter(c => c.status === "active").length,
      totalRaised: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
      totalDonors: uniqueDonors,
      totalDonations: donations.length,
    });
  } catch (error) {
    console.error("NGO stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/volunteer/schedule — Volunteer sees their joined campaigns schedule
router.get("/volunteer/schedule", verifyToken, async (req, res) => {
  try {
    const Campaign = (await import("../models/Campaign.js")).default;

    // Campaigns where this volunteer has signed up (any status)
    const campaigns = await Campaign.find({
      "volunteers.uid": req.user.uid,
    })
      .select("title category status startDate endDate location imageUrl approvalStatus volunteers")
      .sort({ startDate: 1 })
      .lean();

    // Attach the volunteer's own entry for status/hours
    const schedule = campaigns.map((c) => {
      const myEntry = (c.volunteers || []).find((v) => v.uid === req.user.uid);
      return {
        _id: c._id,
        title: c.title,
        category: c.category,
        status: c.status,
        approvalStatus: c.approvalStatus,
        startDate: c.startDate,
        endDate: c.endDate,
        location: c.location,
        imageUrl: c.imageUrl,
        volunteerStatus: myEntry?.status || "pending",
        volunteerRole: myEntry?.role || "Volunteer",
        hoursLogged: myEntry?.hoursLogged || 0,
        joinedAt: myEntry?.joinedAt,
      };
    });

    res.json(schedule);
  } catch (error) {
    console.error("Volunteer schedule error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/volunteer/stats — Volunteer sees their stats
router.get("/volunteer/stats", verifyToken, async (req, res) => {
  try {
    const Campaign = (await import("../models/Campaign.js")).default;

    // Find campaigns the volunteer has joined (via volunteers array)
    const campaigns = await Campaign.find({
      "volunteers.uid": req.user.uid,
    });

    let hoursLogged = 0;
    let approvedCampaigns = 0;
    campaigns.forEach((c) => {
      const vol = (c.volunteers || []).find(v => v.uid === req.user.uid);
      hoursLogged += vol?.hoursLogged || 0;
      if (vol?.status === "approved") approvedCampaigns++;
    });

    // Estimate ~5 people helped per hour volunteered
    const peopleHelped = hoursLogged > 0 ? hoursLogged * 5 : approvedCampaigns * 10;

    res.json({
      campaignsJoined: campaigns.length,
      approvedCampaigns,
      hoursLogged,
      peopleHelped,
    });
  } catch (error) {
    console.error("Volunteer stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/donations/all — admin only
router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
