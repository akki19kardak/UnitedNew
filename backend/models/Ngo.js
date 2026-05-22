import mongoose from "mongoose";

const ngoSchema = new mongoose.Schema({
  firebaseUid:     { type: String, required: true, unique: true },
  name:            { type: String, required: true },
  organizationName:{ type: String },      // ← ADD: optional alias used on frontend
  email:           { type: String, required: true, unique: true },
  phone:           { type: String },
  description:     { type: String },
  logoUrl:         { type: String },
  bannerUrl:       { type: String },
  website:         { type: String },

  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  pincode:         { type: String },

  darpanId:        { type: String, unique: true, sparse: true },
  isVerified:      { type: Boolean, default: false },
  verifiedAt:      { type: Date },
  verifiedBy:      { type: String },

  cause: {
    type: String,
    enum: [
      "education", "health", "environment",
      "women-empowerment", "child-welfare",
      "animal-welfare", "disaster-relief", "other"
    ],
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
  },
  rejectionReason: { type: String },

  totalDonations:  { type: Number, default: 0 },
  totalDonors:     { type: Number, default: 0 },
  totalCampaigns:  { type: Number, default: 0 },

}, { timestamps: true });

const NGO = mongoose.model("NGO", ngoSchema);
export default NGO;
