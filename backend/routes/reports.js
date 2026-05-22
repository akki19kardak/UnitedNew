import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";

const router = express.Router();

// GET /api/reports  — list campaigns the caller has reports for
router.get("/", verifyToken, async (req, res) => {
  try {
    const callerUid = req.user.uid;
    const role = req.user.role;

    let campaigns = [];

    if (role === "ngo") {
      // NGO: find their NGO doc first to get the MongoDB _id
      const NGO = (await import("../models/Ngo.js")).default;
      const ngo = await NGO.findOne({ firebaseUid: callerUid }).select("_id");
      if (!ngo) return res.json([]);

      campaigns = await Campaign.find({
        ngoId: ngo._id,
        status: { $ne: "inactive" },
      })
        .select("_id title imageUrl category goalAmount currentAmount status approvalStatus createdAt volunteers")
        .sort({ createdAt: -1 });

    } else if (role === "admin") {
      campaigns = await Campaign.find({ status: { $ne: "inactive" } })
        .select("_id title imageUrl category goalAmount currentAmount createdAt")
        .sort({ createdAt: -1 })
        .limit(20);

    } else {
      // donor or volunteer — only campaigns they donated to
      const donatedIds = await Donation.find({
        donorId: callerUid,
        status: "completed",
      }).distinct("campaignId");

      campaigns = await Campaign.find({ _id: { $in: donatedIds } })
        .select("_id title imageUrl category goalAmount currentAmount createdAt")
        .sort({ createdAt: -1 });
    }

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/reports/:campaignId  — full report data for one campaign
router.get("/:campaignId", verifyToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const callerUid = req.user.uid;

    // 1. Campaign
    const campaign = await Campaign.findById(campaignId).populate("ngoId", "name organizationName avatar city isVerified firebaseUid");
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // 2. NGO data (from populated ngoId)
    const ngoDoc = campaign.ngoId;

    // 3. All completed donations for this campaign
    const allDonations = await Donation.find({
      campaignId,
      status: "completed",
    }).sort({ createdAt: 1 });

    const totalRaised = allDonations.reduce((s, d) => s + (d.amount || 0), 0);
    const donorCount = new Set(allDonations.map((d) => d.donorId)).size;

    // 4. This caller's donations specifically
    const myDonations = allDonations.filter((d) => d.donorId === callerUid);
    const myTotal = myDonations.reduce((s, d) => s + (d.amount || 0), 0);
    const myFirstDate = myDonations.length
      ? new Date(myDonations[0].createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
      : null;

    // 5. Monthly chart data (last 12 months)
    const monthly = {};
    allDonations.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthly[key] = (monthly[key] || 0) + d.amount;
    });

    const monthlyChart = Object.entries(monthly)
      .map(([key, amount]) => {
        const [year, month] = key.split("-");
        return { year: Number(year), month: Number(month), amount };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-12);

    // 6. Completion rate
    const completionRate = campaign.goalAmount
      ? Math.min(Math.round((totalRaised / campaign.goalAmount) * 100), 100)
      : 0;

    // 7. Volunteer count — actual approved volunteers for this campaign
    const volunteersEngaged = (campaign.volunteers || []).filter(v => v.status === "approved").length;

    // 8. Financial breakdown
    const financials = [
      {
        label: "Direct Program Aid",
        pct: 80,
        color: "#10b981",
        amount: Math.round(totalRaised * 0.8),
        desc: "Direct beneficiary support, materials and on-ground execution.",
      },
      {
        label: "Logistics & Operations",
        pct: 10,
        color: "#3c83f6",
        amount: Math.round(totalRaised * 0.1),
        desc: "Transportation, field visits and technical deployment.",
      },
      {
        label: "Administrative Costs",
        pct: 10,
        color: "#94a3b8",
        amount: Math.round(totalRaised * 0.1),
        desc: "Operational overhead and compliance reporting.",
      },
    ];

    // 9. Estimated lives impacted (₹200 per person — adjust as needed)
    const COST_PER_LIFE = 200;
    const livesImpacted = totalRaised > 0 ? Math.floor(totalRaised / COST_PER_LIFE) : 0;

    res.json({
      reportId: `UI-${new Date(campaign.createdAt).getFullYear()}-${campaign._id.toString().slice(-4).toUpperCase()}`,
      campaign: {
        _id: campaign._id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        imageUrl: campaign.imageUrl,
        gallery: campaign.gallery || [],
        goalAmount: campaign.goalAmount,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        createdAt: campaign.createdAt,
      },
      ngo: {
        name: ngoDoc?.organizationName || ngoDoc?.name || "United Impact NGO",
        directorName: ngoDoc?.name || "NGO Director",
        directorAvatar: ngoDoc?.avatar || "",
        city: ngoDoc?.city || "",
        isVerified: ngoDoc?.isVerified || false,
      },
      metrics: {
        totalRaised,
        goalAmount: campaign.goalAmount,
        completionRate,
        donorCount,
        livesImpacted,
        volunteersEngaged,
      },
      myImpact: {
        totalDonated: myTotal,
        donationCount: myDonations.length,
        donorSince: myFirstDate,
        livesReached: Math.floor(myTotal / COST_PER_LIFE),
      },
      financials,
      monthlyChart,
      period: campaign.startDate && campaign.endDate
        ? `${new Date(campaign.startDate).getFullYear()}–${new Date(campaign.endDate).getFullYear()}`
        : new Date(campaign.createdAt).getFullYear().toString(),
      issuedDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
    });

  } catch (err) {
    console.error("Report fetch error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
