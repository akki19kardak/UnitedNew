import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";

const router = express.Router();

// GET /api/admin/pending-ngos
router.get("/pending-ngos", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const pending = await User.find({ role: "ngo", isVerified: false })
      .select("uid name organizationName email city darpanId createdAt phone")
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const [totalUsers, totalCampaigns, pendingNGOs, donationAgg] = await Promise.all([
      User.countDocuments(),
      Campaign.countDocuments(),
      User.countDocuments({ role: "ngo", isVerified: false }),
      Donation.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalCampaigns,
      pendingNGOs,
      platformDonations: donationAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/ngos
router.get("/ngos", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const NGO = (await import("../models/User.js")).default;
    const ngos = await NGO.find({ role: "ngo" }).sort({ createdAt: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/dashboard
router.get("/dashboard", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const [users, ngos, campaigns, completedDonations, allDonationsCount] = await Promise.all([
      User.countDocuments(),
      User.find({ role: "ngo" }),
      Campaign.find(),
      Donation.find({ status: "completed" }),
      Donation.countDocuments(),
    ]);

    const stats = {
      totalUsers: users,
      totalNGOs: ngos.length,
      verifiedNGOs: ngos.filter(n => n.isVerified).length,
      pendingNGOs: ngos.filter(n => !n.isVerified).length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === "active").length,
      pendingCampaigns: campaigns.filter(c => c.approvalStatus === "pending").length,
      totalDonations: allDonationsCount,
      totalRaised: completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
      pendingReports: 0,
    };

    // Recent activity
    const recentActivity = [
      ...ngos.filter(n => !n.isVerified).map(n => ({
        type: "ngo_pending",
        title: n.organizationName || n.name,
        subtitle: "New NGO Registration",
        createdAt: n.createdAt,
        status: "pending"
      })),
      ...campaigns.filter(c => c.status === "pending").map(c => ({
        type: "campaign_pending",
        title: c.title,
        subtitle: "New Campaign Submitted",
        createdAt: c.createdAt,
        status: "pending"
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ stats, recentActivity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/admin/verify-ngo/:uid
router.patch("/verify-ngo/:uid", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { uid } = req.params;
    const { approve } = req.body;

    // Update User model
    const ngoUser = await User.findOneAndUpdate(
      { uid },
      {
        isVerified: approve,
        ...(approve ? { verificationDate: new Date() } : {}),
      },
      { new: true }
    );

    if (!ngoUser) return res.status(404).json({ message: "NGO not found" });

    // Also update NGO model (campaign ownership relies on this)
    const NGO = (await import("../models/Ngo.js")).default;
    await NGO.findOneAndUpdate(
      { firebaseUid: uid },
      {
        isVerified: !!approve,
        status: approve ? "approved" : "rejected",
        ...(approve ? { verifiedAt: new Date(), verifiedBy: req.user.uid } : {}),
      }
    );

    res.json({ message: approve ? "NGO approved" : "NGO rejected", user: ngoUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
