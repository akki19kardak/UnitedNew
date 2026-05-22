import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import NGO from "../models/Ngo.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

await mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4,
});
console.log("✅ Connected to MongoDB");

const result = await NGO.findOneAndUpdate(
  { email: "akki19kardak@gmail.com" },
  { isVerified: true, status: "approved", verifiedAt: new Date() },
  { new: true }
);

if (!result) {
  console.log("❌ NGO not found with that email");
} else {
  console.log("✅ Updated:", result.name);
  console.log("   isVerified:", result.isVerified);
  console.log("   status:", result.status);
}

await mongoose.disconnect();
console.log("✅ Done — restart your backend server now");
process.exit(0);
