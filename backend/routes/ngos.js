import express from "express";
import {
  registerNGO,
  getAllNGOs,
  getNGOById,
  verifyNGO,
  getMyNGO,
} from "../controllers/ngoController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/",          getAllNGOs);           // public
router.get("/me",        verifyToken, getMyNGO); // NGO's own profile
router.get("/:id",       getNGOById);           // public
router.post("/register", verifyToken, registerNGO);
router.patch("/:id/verify", verifyToken, isAdmin, verifyNGO); // admin only

export default router;
