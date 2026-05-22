// backend/lib/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "https://united-new.vercel.app",
      credentials: true,
    },
  });

  const onlineUsers = new Map(); // Firebase UID → socket.id

  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    // Register user and broadcast their online status
    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User ${userId} online`);
    });

    // ── Normal chat message ──────────────────────────────────────────────────
    socket.on("send_message", async (data) => {
      // data: { senderId, receiverId, text, messageType?, context? }
      try {
        const { default: Message } = await import("../models/Message.js");

        const newMessage = new Message({
          senderId:    data.senderId,
          receiverId:  data.receiverId,
          text:        data.text,
          messageType: data.messageType || "chat",
          context:     data.context     || {},
        });
        await newMessage.save();

        // Deliver message to receiver if online
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", newMessage);

          // Also send a notification event for the bell icon
          io.to(receiverSocketId).emit("notification", {
            type:       "new_message",
            senderId:   data.senderId,
            messageType: newMessage.messageType,
            text:       data.text.slice(0, 60), // preview text
            createdAt:  newMessage.createdAt,
          });
        }

        // Confirm to sender
        socket.emit("message_sent", newMessage);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // ── Mark messages as read (triggers notification clear on sender side) ──
    socket.on("mark_read", async ({ myUid, otherUid }) => {
      try {
        const { default: Message } = await import("../models/Message.js");
        await Message.updateMany(
          { senderId: otherUid, receiverId: myUid, read: false },
          { $set: { read: true } }
        );
        // Notify the sender that their message was read
        const senderSocketId = onlineUsers.get(otherUid);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", { by: myUid });
        }
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (let [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          console.log(`❌ User ${uid} offline`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
