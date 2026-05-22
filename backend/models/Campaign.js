import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    // NGO reference — MongoDB ObjectId of the NGO document
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
      index: true,
    },

    // Basic Info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "education",
        "health",
        "environment",
        "women-empowerment",
        "child-welfare",
        "animal-welfare",
        "disaster-relief",
        "other",
      ],
      default: "other",
    },

    // Financials
    goalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Media
    imageUrl: {
      type: String,
      default: "",
    },
    images: [
      {
        url: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    gallery: [{ type: String }],

    // Flags
    isUrgent: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // Timeline
    startDate: { type: Date },
    endDate: { type: Date },

    // Donors count
    donorCount: {
      type: Number,
      default: 0,
    },

    // Location
    location: {
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      coordinates: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
      },
      updatedAt: { type: Date },
    },
    // Volunteers
    volunteers: [
      {
        uid: { type: String, required: true },
        name: { type: String },
        role: { type: String },
        message: { type: String },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        hoursLogged: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
