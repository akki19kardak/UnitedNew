// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId:   { type: String, required: true },   // Firebase UID
  receiverId: { type: String, required: true },   // Firebase UID (admin UID or direct)

  text: { type: String, required: true },
  read: { type: Boolean, default: false },

  // "chat" = normal message
  // "donate_intent"     = donor wants to donate to a specific NGO
  // "ngo_contact_volunteer" = NGO wants contact info of a volunteer
  // "support"           = general help query to admin
  messageType: {
    type: String,
    enum: ["chat", "donate_intent", "ngo_contact_volunteer", "support"],
    default: "chat",
  },

  // optional metadata attached to coordination messages
  context: {
    campaignId:   { type: String, default: "" },
    campaignName: { type: String, default: "" },
    ngoId:        { type: String, default: "" },
    ngoName:      { type: String, default: "" },
    volunteerId:  { type: String, default: "" },
    volunteerName:{ type: String, default: "" },
    amount:       { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
});

// index for fast conversation queries
messageSchema.index({ senderId: 1, receiverId: 1 });

export default mongoose.model("Message", messageSchema);
