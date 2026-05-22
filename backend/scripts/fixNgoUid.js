// backend/scripts/fixNgoUid.js
// ─────────────────────────────────────────────────────────────────
// ONE-TIME MIGRATION SCRIPT
//
// What it does:
//  1. Finds all real User docs with role = "ngo" and links/creates
//     their NGO doc (so they can create campaigns → no more 403)
//  2. Ensures ALL seeded NGO docs have isVerified = true and
//     status = "approved" (so their campaigns show in the map/list)
//  3. Ensures ALL seeded campaigns have approvalStatus = "approved"
//     and status = "active" (so they appear for donors & volunteers)
//
// Run: node scripts/fixNgoUid.js
// ─────────────────────────────────────────────────────────────────

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import NGO from "../models/Ngo.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ No MONGO_URI found in .env — aborting");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
  console.log("✅ Connected to MongoDB\n");

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Fix all seeded NGOs → mark as verified + approved
  //         so their campaigns appear in map + list for everyone
  // ─────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════");
  console.log("STEP 1: Verify & approve all seeded NGOs");
  console.log("═══════════════════════════════════════════");

  const seededUids = [
    "ngo_pratham_123",
    "ngo_goonj_234",
    "ngo_akshaya_345",
    "ngo_sewa_456",
    "ngo_pfa_567",
    "ngo_smile_678",
    "ngo_helpage_789",
    "ngo_cry_890",
    "ngo_nanhi_kali_901",
    "ngo_teach_india_012",
  ];

  const seededNgos = await NGO.find({ firebaseUid: { $in: seededUids } });
  console.log(`Found ${seededNgos.length} seeded NGO(s)`);

  for (const ngo of seededNgos) {
    const wasVerified = ngo.isVerified;
    const wasStatus   = ngo.status;

    ngo.isVerified = true;
    ngo.status     = "approved";
    ngo.verifiedAt = ngo.verifiedAt || new Date();
    await ngo.save();

    console.log(
      `  ✅ ${ngo.name.padEnd(30)} | isVerified: ${String(wasVerified).padEnd(5)} → true | status: ${wasStatus} → approved`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Fix all seeded campaigns → mark approved + active
  //         so they show up in /campaigns for donors & volunteers
  // ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("STEP 2: Approve & activate all seeded campaigns");
  console.log("═══════════════════════════════════════════");

  // Only fix campaigns tied to seeded NGO _ids
  const seededNgoIds = seededNgos.map((n) => n._id);

  const campaignResult = await Campaign.updateMany(
    {
      ngoId: { $in: seededNgoIds },
      $or: [
        { approvalStatus: { $ne: "approved" } },
        { status: { $nin: ["active", "completed"] } },
      ],
    },
    {
      $set: {
        approvalStatus: "approved",
        status: "active",
      },
    }
  );

  // Also make sure ALL existing approved campaigns are active (not inactive)
  const activateResult = await Campaign.updateMany(
    {
      ngoId: { $in: seededNgoIds },
      approvalStatus: "approved",
      status: "inactive",
    },
    { $set: { status: "active" } }
  );

  console.log(`  ✅ Fixed approvalStatus/status on ${campaignResult.modifiedCount} campaign(s)`);
  console.log(`  ✅ Reactivated ${activateResult.modifiedCount} inactive-but-approved campaign(s)`);

  // Show all seeded campaigns now
  const seededCampaigns = await Campaign.find({ ngoId: { $in: seededNgoIds } })
    .select("title status approvalStatus");
  seededCampaigns.forEach((c) => {
    console.log(`     📌 ${c.title.substring(0, 55).padEnd(55)} | ${c.approvalStatus} | ${c.status}`);
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Link real Firebase users (role=ngo) to NGO documents
  //         so they can create campaigns without 403
  // ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("STEP 3: Link real NGO users → NGO collection");
  console.log("═══════════════════════════════════════════");

  const realNgoUsers = await User.find({ role: "ngo" });
  console.log(`Found ${realNgoUsers.length} real NGO user(s) in User collection`);

  for (const user of realNgoUsers) {
    // Already has NGO doc?
    const existingByUid = await NGO.findOne({ firebaseUid: user.uid });
    if (existingByUid) {
      console.log(`  ✅ ${user.email.padEnd(40)} already has NGO doc → skipping`);
      continue;
    }

    // Try match by email to a seeded NGO
    const byEmail = await NGO.findOne({ email: user.email });
    if (byEmail) {
      byEmail.firebaseUid    = user.uid;
      byEmail.isVerified     = true;
      byEmail.status         = "approved";
      byEmail.organizationName = byEmail.organizationName || user.organizationName || byEmail.name;
      await byEmail.save();
      console.log(`  🔗 ${user.email.padEnd(40)} linked to seeded NGO "${byEmail.name}"`);
      continue;
    }

    // No match at all — create a fresh NGO doc
    const newNgo = await NGO.create({
      firebaseUid:      user.uid,
      name:             user.organizationName || user.name || "My NGO",
      organizationName: user.organizationName || user.name || "My NGO",
      email:            user.email,
      phone:            user.phone || "",
      isVerified:       false,
      status:           "pending",
    });
    console.log(`  🆕 ${user.email.padEnd(40)} → created new NGO doc (pending verification)`);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Fix any campaigns by real NGO users that are stuck
  //         in "pending" / "inactive" (approve them too)
  // ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("STEP 4: Approve pending campaigns by real NGO users");
  console.log("═══════════════════════════════════════════");

  const realNgoDocs = await NGO.find({
    firebaseUid: { $nin: seededUids },
    status: "approved",
  });

  if (realNgoDocs.length > 0) {
    const realNgoDocIds = realNgoDocs.map((n) => n._id);
    const realCampaignFix = await Campaign.updateMany(
      {
        ngoId: { $in: realNgoDocIds },
        $or: [
          { approvalStatus: { $ne: "approved" } },
          { status: "inactive" },
        ],
      },
      { $set: { approvalStatus: "approved", status: "active" } }
    );
    console.log(`  ✅ Fixed ${realCampaignFix.modifiedCount} pending campaign(s) by real NGOs`);
  } else {
    console.log("  ℹ️  No verified real NGO campaigns to fix yet");
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════════");

  const totalNgos      = await NGO.countDocuments();
  const verifiedNgos   = await NGO.countDocuments({ isVerified: true, status: "approved" });
  const totalCampaigns = await Campaign.countDocuments();
  const activeCampaigns = await Campaign.countDocuments({ approvalStatus: "approved", status: "active" });

  console.log(`  NGOs total:          ${totalNgos}`);
  console.log(`  NGOs verified:       ${verifiedNgos}`);
  console.log(`  Campaigns total:     ${totalCampaigns}`);
  console.log(`  Campaigns active:    ${activeCampaigns}`);
  console.log("\n✅ Migration complete — restart your backend server now\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
