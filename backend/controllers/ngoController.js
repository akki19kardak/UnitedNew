import NGO from "../models/Ngo.js";
import Campaign from "../models/Campaign.js";
import mongoose from "mongoose";

// POST /api/ngos/register
export const registerNGO = async (req, res) => {
  try {
    const {
      name, email, phone, description, cause,
      address, city, state, pincode, darpanId, website,
      logoUrl, bannerUrl,
    } = req.body;

    const existing = await NGO.findOne({ firebaseUid: req.user.uid });
    if (existing) return res.status(400).json({ message: "NGO already registered" });

    const ngo = await NGO.create({
      firebaseUid: req.user.uid,
      name, email, phone, description,
      cause, address, city, state, pincode,
      darpanId, website, logoUrl, bannerUrl,
      status: "pending",
      isVerified: false,
    });

    res.status(201).json(ngo);
  } catch (error) {
    console.error("NGO register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/ngos — public
export const getAllNGOs = async (req, res) => {
  try {
    const { cause, city } = req.query;
    const filter = { status: "approved", isVerified: true };
    if (cause) filter.cause = cause;
    if (city)  filter.city  = city;

    const ngos = await NGO.find(filter).select("-__v");
    res.json(ngos);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/ngos/:id — public
// id can be MongoDB _id OR firebaseUid (handles both cases)
export const getNGOById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try ObjectId first, then fall back to firebaseUid
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
    const ngo = isObjectId
      ? await NGO.findById(id)
      : await NGO.findOne({ firebaseUid: id });

    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    // Attach live campaign count — always use ngo._id (ObjectId)
    const campaignCount = await Campaign.countDocuments({ ngoId: ngo._id });

    res.json({ ...ngo.toObject(), campaignCount });
  } catch (error) {
    console.error("getNGOById error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/ngos/:id/verify — Admin only
export const verifyNGO = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      status,
      isVerified: status === "approved",
      verifiedBy: req.user.uid,
      ...(status === "approved" && { verifiedAt: new Date() }),
      ...(status === "rejected" && { rejectionReason }),
    };

    const ngo = await NGO.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    res.json(ngo);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/ngos/me
export const getMyNGO = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid });
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });
    res.json(ngo);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
