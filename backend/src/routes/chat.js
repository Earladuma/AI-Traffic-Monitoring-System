// File: backend/routes/chat.js

import express from "express";
import { Server } from "socket.io";
import http from "http";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ------------------- IN-MEMORY CHAT HISTORY -------------------
let messages = []; // Could later be replaced with a DB

// REST endpoint to get chat history
router.get("/history", protect, async (req, res) => {
  try {
    res.status(200).json(messages);
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- FUNCTION TO ATTACH SOCKET.IO -------------------
export function attachChatServer(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Send welcome message from AI
    socket.emit("chat-message", {
      from: "bot",
      text: "Hi! I am SmartTraffic — your AI traffic assistant.",
    });

    // Handle incoming messages
    socket.on("chat-message", ({ userId, text, role }) => {
      if (!text) return;

      // Save user message
      messages.push({ from: role || "user", text, timestamp: new Date() });

      // AI response simulation (replace with real AI later)
      if (role !== "admin") { // Only respond automatically if not admin
        const aiResponse = `(Demo AI) Suggested route: Main St — ETA 12 min.`;
        messages.push({ from: "bot", text: aiResponse, timestamp: new Date() });

        // Send AI response to sender only
        socket.emit("chat-message", { from: "bot", text: aiResponse });
      }

      // Broadcast user/admin message to all clients
      io.emit("chat-message", { from: role || "user", text });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

export default router;
