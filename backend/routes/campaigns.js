import express from "express";
import {
  getCampaigns,
  getCampaignById,
  getMyCampaigns,
  createCampaign,
  updateCampaignStatus,
  updateCampaign,
  updateCampaignLocation,
  deleteCampaign,
  volunteerForCampaign,
} from "../controllers/campaignController.js";
import { verifyToken, optionalVerifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", optionalVerifyToken, getCampaigns); // public (optional admin check inside)
router.get("/ngo/mine", verifyToken, getMyCampaigns); // NGO only
router.get("/:id", getCampaignById); // public
router.post("/:id/volunteer", verifyToken, volunteerForCampaign); // logged in only

// NGO approve/reject a volunteer
router.patch("/:id/volunteer/:uid/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const campaign = await (await import("../models/Campaign.js")).default.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Only the NGO owner can approve/reject
    const { default: NGO } = await import("../models/Ngo.js");
    const ngo = await NGO.findOne({ firebaseUid: req.user.uid }).select("_id");
    if (!ngo || !campaign.ngoId.equals(ngo._id)) {
      return res.status(403).json({ message: "Only the campaign owner can manage volunteers" });
    }

    const vol = campaign.volunteers.find((v) => v.uid === req.params.uid);
    if (!vol) return res.status(404).json({ message: "Volunteer not found in this campaign" });

    vol.status = status;
    await campaign.save();
    res.json({ message: `Volunteer ${status}`, volunteer: vol });
  } catch (error) {
    console.error("Volunteer status update error:", error);
    res.status(500).json({ message: "Failed to update volunteer status" });
  }
});

router.post("/", verifyToken, createCampaign); // NGO only
router.patch("/:id/status", verifyToken, isAdmin, updateCampaignStatus); // admin only
router.patch("/:id", verifyToken, updateCampaign); // NGO only

// NEW: NGO owner OR admin (checked in controller)
router.patch("/:id/location", verifyToken, updateCampaignLocation);

router.delete("/:id", verifyToken, deleteCampaign); // NGO only

export default router;
