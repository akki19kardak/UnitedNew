// backend/scripts/migrateCampaignNgoId.js
import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import NGO from "../models/Ngo.js";
import dotenv from "dotenv";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const campaigns = await Campaign.find({});
let fixed = 0;

for (const c of campaigns) {
  // If ngoId is already an ObjectId, skip
  if (mongoose.Types.ObjectId.isValid(c.ngoId) && String(c.ngoId).length === 24) continue;

  const ngo = await NGO.findOne({ firebaseUid: c.ngoId }).select("_id");
  if (ngo) {
    await Campaign.findByIdAndUpdate(c._id, { ngoId: ngo._id });
    fixed++;
    console.log(`✅ Fixed campaign: ${c.title}`);
  } else {
    console.log(`⚠️  No NGO found for campaign: ${c.title} (uid: ${c.ngoId})`);
  }
}

console.log(`\nDone. Fixed ${fixed} campaigns.`);
mongoose.disconnect();
