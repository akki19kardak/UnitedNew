import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid:   { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name:  { type: String, default: "New User" },

  role: {
    type: String,
    enum: ["donor", "ngo", "volunteer", "admin", null],
    default: null, // ✅ null until user selects role
  },

  needsRole: { type: Boolean, default: true }, // ✅ false once role is set

  avatar:   { type: String, default: "" },
  bio:      { type: String, default: "" },
  phone:    { type: String, default: "" },
  city:     { type: String, default: "" },

  darpanId:         { type: String,  default: "" },
  isVerified:       { type: Boolean, default: false },
  verificationDate: { type: Date },
  organizationName: { type: String,  default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
