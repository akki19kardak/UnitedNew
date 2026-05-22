import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  // User reference
  donorId:            { type: String, required: true },  // Firebase UID
  donorName:          { type: String },
  donorEmail:         { type: String },
  isAnonymous:        { type: Boolean, default: false },
  donorMessage:       { type: String, default: "" },

  // Campaign & NGO reference
  campaignId:         { type: String, required: true },  // Firestore campaign doc ID
  ngoId:              { type: String },                  // Firebase UID of NGO

  // Payment details
  amount:             { type: Number, required: true },
  currency:           { type: String, default: "INR" },
  paymentMethod:      { type: String, default: "razorpay" },

  // Razorpay tracking
  razorpayOrderId:    { type: String, unique: true },
  razorpayPaymentId:  { type: String },
  razorpaySignature:  { type: String },
  transactionId:      { type: String },

  // Status
  status:             { type: String, enum: ["pending", "completed", "failed"], default: "pending" },

}, { timestamps: true });

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;
