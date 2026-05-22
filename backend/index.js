import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import reportsRouter from "./routes/reports.js";
import adminRouter   from "./routes/admin.js";

import http from "http";
import { initSocket } from "./lib/socket.js";

// --- MODEL IMPORTS FOR STATS ---
import Campaign from "./models/Campaign.js";
import User from "./models/User.js";
import Donation from "./models/Donation.js";

// Routes
import razorpayRoutes from "./routes/razorpay.js";
import campaignRoutes from "./routes/campaigns.js";
import userRoutes from "./routes/users.js";
import ngoRoutes from "./routes/ngos.js";
import donationRoutes from "./routes/donations.js";
import messageRoutes from "./routes/messages.js";


dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();
const server = http.createServer(app);

// Socket.IO init (CORS handled inside)
initSocket(server);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://unitedimpact-app.netlify.app",
    credentials: true,
  })
);
app.use("/api/razorpay/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ngos", ngoRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportsRouter);
app.use("/api/admin",   adminRouter);

// Landing page stats
app.get("/api/stats", async (req, res) => {
  try {
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });
    const totalUsers = await User.countDocuments();

    const donationStats = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const totalRaised =
      donationStats.length > 0 ? donationStats[0].totalAmount : 0;

    res.status(200).json({
      activeCampaigns,
      totalUsers,
      totalRaised,
      success: true,
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to load stats" });
  }
});

// Landing page stats (detailed)
app.get("/api/stats/landing", async (req, res) => {
  try {
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });
    const totalNgos = await User.countDocuments({ role: "ngo" });
    const totalVolunteers = await User.countDocuments({ role: "volunteer" });

    const donationAgg = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);
    const totalDonations = donationAgg.length > 0 ? donationAgg[0].totalAmount : 0;

    res.json({ totalDonations, totalNgos, totalVolunteers, activeCampaigns });
  } catch (error) {
    console.error("Landing stats error:", error);
    res.status(500).json({ message: "Failed to load landing stats" });
  }
});

app.get("/api/health", (req, res) => res.status(200).json({ status: "OK" }));

// Handle missing routes
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
