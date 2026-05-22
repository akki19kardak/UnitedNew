import { adminAuth } from "../lib/firebaseAdmin.js";
import User from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    let mongoUser = await User.findOne({ uid: decodedToken.uid });

    if (!mongoUser) {
      // ✅ No hardcoded role — user must choose via RoleSelectionModal
      mongoUser = new User({
        uid:      decodedToken.uid,
        email:    decodedToken.email || "no-email@provided.com",
        name:     decodedToken.name  || "New User",
        role:     null,
        needsRole: true,
      });
      await mongoUser.save();
    }

    req.user = {
      uid:      decodedToken.uid,
      email:    decodedToken.email,
      role:     mongoUser.role,
      needsRole: !mongoUser.role,
      _id:      mongoUser._id,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ message: "Forbidden - Invalid token" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: `Forbidden - Requires one of: ${roles.join(", ")}` });
    }
  };
};
