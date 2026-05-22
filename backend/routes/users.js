import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";
import User from "../models/User.js";

const router = express.Router();

// ✅✅✅ ADMIN REGISTRATION MUST BE FIRST - NO AUTH REQUIRED ✅✅✅
router.post("/admin-register", async (req, res) => {
  try {
    const { uid, email, name, adminSecret } = req.body;

    // ✅ Works without .env — uses hardcoded default
    const validSecret = process.env.ADMIN_SECRET_KEY || "unitedimpact-admin-secret-2026";
    
    if (adminSecret !== validSecret) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    let user = await User.findOne({ uid });
    
    if (!user) {
      // Create new admin user
      user = new User({
        uid,
        email,
        name,
        role: "admin",
        needsRole: false,
        isVerified: true,
      });
    } else {
      // Promote existing user to admin
      user.role = "admin";
      user.needsRole = false;
      user.isVerified = true;
    }

    await user.save();
    res.status(200).json({ message: "Admin account created successfully", user });
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({ message: "Failed to create admin account" });
  }
});

// ✅ All routes BELOW this line require authentication
router.use(authenticateToken);

// ── Existing ──
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// ── Aliases (AuthContext calls /me) ──
router.get("/me", getUserProfile);
router.put("/me", updateUserProfile);

// ── Public User Info (for messaging/profiles) ──
router.get("/public/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).select("uid name email role organizationName avatar isVerified");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ── Email/Password Registration ──
router.post("/register", async (req, res) => {
  try {
    const { uid, email, firstName, lastName, phone, role, orgName, skills } = req.body;

    const allowedRoles = ["donor", "ngo", "volunteer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const existing = await User.findOne({ uid });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newUser = new User({
      uid,
      email,
      name: `${firstName} ${lastName}`.trim(),
      phone: phone || "",
      role,
      organizationName: orgName || "",
      bio: skills || "",
      needsRole: false,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ── Google Sync (called after popup success) ──
router.post("/google-sync", async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email,
        name: displayName || "New User",
        avatar: photoURL || "",
        role: null,
        needsRole: true,
      });
      await user.save();
    }

    res.status(200).json({ user, needsRole: !user.role });
  } catch (error) {
    console.error("Google sync error:", error);
    res.status(500).json({ message: "Google sync failed" });
  }
});

// ── Admin: Pending NGOs ──
router.get("/admin/pending-ngos", requireRole("admin"), async (req, res) => {
  try {
    const pendingNGOs = await User.find({ role: "ngo", isVerified: false });
    res.json(pendingNGOs);
  } catch (error) {
    console.error("Fetch pending NGOs error:", error);
    res.status(500).json({ message: "Failed to fetch pending NGOs" });
  }
});

// ── Admin: Verify / Reject NGO ──
router.post("/admin/verify-ngo", requireRole("admin"), async (req, res) => {
  try {
    const { ngoId, action } = req.body; // action: "approve" | "reject"

    if (!ngoId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid ngoId or action" });
    }

    const ngo = await User.findById(ngoId);
    if (!ngo || ngo.role !== "ngo") {
      return res.status(404).json({ message: "NGO not found" });
    }

    if (action === "approve") {
      ngo.isVerified = true;
      ngo.verificationDate = new Date();
    } else {
      ngo.isVerified = false;
      ngo.verificationDate = undefined;
    }

    await ngo.save();

    // Also update NGO model (campaign ownership relies on this)
    const NGOModel = (await import("../models/Ngo.js")).default;
    await NGOModel.findOneAndUpdate(
      { firebaseUid: ngo.uid },
      {
        isVerified: action === "approve",
        status: action === "approve" ? "approved" : "rejected",
        ...(action === "approve" ? { verifiedAt: new Date(), verifiedBy: req.user.uid } : {}),
      }
    );

    res.json({ message: `NGO ${action}d successfully`, ngo });
  } catch (error) {
    console.error("Verify NGO error:", error);
    res.status(500).json({ message: "Failed to verify NGO" });
  }
});

// ── Admin: All Users + Stats ──
router.get("/admin/all-users", requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const stats = {
      total: users.length,
      donors: users.filter((u) => u.role === "donor").length,
      ngos: users.filter((u) => u.role === "ngo").length,
      volunteers: users.filter((u) => u.role === "volunteer").length,
      admins: users.filter((u) => u.role === "admin").length,
      verifiedNGOs: users.filter((u) => u.role === "ngo" && u.isVerified).length,
    };
    res.json({ users, stats });
  } catch (error) {
    console.error("Fetch all users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ── Set Role (Google users pick role once via RoleSelectionModal) ──
router.post("/set-role", async (req, res) => {
  try {
    const { role, orgName, phone } = req.body;

    const allowedRoles = ["donor", "ngo", "volunteer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Block only if role was intentionally set (needsRole = false)
    // Allow if user is still in onboarding OR was auto-created with old code
    if (user.role && user.needsRole === false) {
      return res.status(400).json({ message: "Role already set — cannot change" });
    }

    user.role = role;
    user.needsRole = false;
    user.organizationName = orgName || "";
    user.phone = phone || "";
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Set role error:", error);
    res.status(500).json({ message: "Failed to set role" });
  }
});

export default router;
