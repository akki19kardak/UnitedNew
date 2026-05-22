// backend/routes/messages.js
import express from "express";
import Message from "../models/Message.js";
import User    from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// ─── GET /api/messages/contacts ─────────────────────────────────────────────
// Returns the contact list. Any user can message any other user.
router.get("/contacts", async (req, res) => {
  try {
    const { uid } = req.user;

    let query = { uid: { $ne: uid } };

    const users = await User.find(query).select("uid name email role organizationName avatar isVerified");

    // For each contact, attach unread count (messages sent TO me FROM them that are unread)
    const contactsWithUnread = await Promise.all(
      users.map(async (u) => {
        const unread = await Message.countDocuments({
          senderId:   u.uid,
          receiverId: uid,
          read: false,
        });
        return {
          _id:              u._id,
          uid:              u.uid,
          name:             u.organizationName || u.name || "User",
          email:            u.email,
          role:             u.role,
          avatar:           u.avatar || "",
          isVerified:       u.isVerified || false,
          unreadCount:      unread,
        };
      })
    );

    res.json(contactsWithUnread);
  } catch (err) {
    console.error("Contacts error:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// ─── GET /api/messages/unread-count ─────────────────────────────────────────
// Returns total unread messages for the logged-in user (for navbar badge)
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.uid,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// ─── GET /api/messages/:otherUserId ─────────────────────────────────────────
// Fetch full conversation with a specific user, sorted oldest → newest
router.get("/:otherUserId", async (req, res) => {
  try {
    const me    = req.user.uid;
    const other = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { senderId: me,    receiverId: other },
        { senderId: other, receiverId: me    },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/messages/mark-read/:otherUserId ─────────────────────────────
// Mark all messages from a specific sender as read
router.patch("/mark-read/:otherUserId", async (req, res) => {
  try {
    await Message.updateMany(
      { senderId: req.params.otherUserId, receiverId: req.user.uid, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ─── POST /api/messages/coordination ────────────────────────────────────────
// Donor → Admin: "I want to donate to NGO X for Campaign Y"
// NGO   → Admin: "I want to contact Volunteer Z"
// Both create a special typed message that shows context card in the admin UI
router.post("/coordination", async (req, res) => {
  try {
    const { receiverId, text, messageType, context } = req.body;
    const { uid, role } = req.user;

    // Validate messageType is used by correct role
    if (messageType === "donate_intent" && role !== "donor") {
      return res.status(403).json({ error: "Only donors can send donate_intent messages" });
    }
    if (messageType === "ngo_contact_volunteer" && role !== "ngo") {
      return res.status(403).json({ error: "Only NGOs can send ngo_contact_volunteer messages" });
    }

    // Ensure receiver is an admin
    const receiver = await User.findOne({ uid: receiverId });
    if (!receiver || receiver.role !== "admin") {
      return res.status(400).json({ error: "Coordination messages must be sent to an admin" });
    }

    const msg = new Message({
      senderId: uid,
      receiverId,
      text,
      messageType,
      context: context || {},
    });
    await msg.save();

    res.status(201).json(msg);
  } catch (err) {
    console.error("Coordination message error:", err);
    res.status(500).json({ error: "Failed to send coordination message" });
  }
});

export default router;
