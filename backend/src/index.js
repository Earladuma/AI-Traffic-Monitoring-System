// File: backend/src/index.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Routes
import chatRoutes from "./routes/chat.js";
import feedbackRoutes from "./routes/feedback.js";
import adminFeedbackRoutes from "./routes/adminFeedback.js";

// Load environment variables
dotenv.config();

// ------------------- APP & MIDDLEWARE -------------------
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------- ROUTES -------------------
app.use("/api/chat", chatRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin/feedback", adminFeedbackRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ------------------- SIMULATED TRAFFIC DATA -------------------
let reports = [];
let posts = [];
let idCounter = 1;

app.get("/api/traffic/state", (req, res) => {
  const roads = [
    { id: "R1", inbound: Math.round(20 + Math.random() * 80), outbound: Math.round(10 + Math.random() * 60), lanesInbound: 2, lanesOutbound: 2 },
    { id: "R2", inbound: Math.round(10 + Math.random() * 50), outbound: Math.round(20 + Math.random() * 80), lanesInbound: 2, lanesOutbound: 2 },
    { id: "R3", inbound: Math.round(5 + Math.random() * 40), outbound: Math.round(5 + Math.random() * 40), lanesInbound: 2, lanesOutbound: 2 },
  ];
  res.json(roads);
});

// Reports CRUD
app.get("/api/reports", (req, res) => res.json(reports));

app.post("/api/reports", (req, res) => {
  const { message } = req.body;
  const report = { id: idCounter++, message, confirmed: false };
  reports.push(report);
  res.json(report);
});

app.post("/api/reports/:id/confirm", (req, res) => {
  const id = parseInt(req.params.id);
  const report = reports.find((x) => x.id === id);
  if (report) {
    report.confirmed = true;
    res.json(report);
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

// Posts CRUD
app.get("/api/posts", (req, res) => res.json(posts));

app.post("/api/posts", (req, res) => {
  const { text } = req.body;
  const post = { id: Date.now(), text };
  posts.unshift(post); // newest posts first
  res.json(post);
});

// ------------------- SOCKET.IO -------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let chatMessages = []; // in-memory chat history

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Send welcome message
  socket.emit("chat-message", { from: "bot", text: "Hi! I am SmartTraffic — your AI traffic assistant." });

  // Send chat history
  chatMessages.forEach((msg) => socket.emit("chat-message", msg));

  // Receive messages
  socket.on("chat-message", (msg) => {
    const userMsg = { from: "user", text: msg };
    chatMessages.push(userMsg);

    // Simulate AI/admin response
    const response = { from: "bot", text: `(Demo) Recommended route: Main St — ETA 12 min.` };
    chatMessages.push(response);

    // Broadcast to the sender
    socket.emit("chat-message", response);

    // Broadcast to all other sockets (optional)
    socket.broadcast.emit("chat-message", userMsg);
    socket.broadcast.emit("chat-message", response);
  });

  // Admin can send messages (for demo, you could authenticate later)
  socket.on("admin-message", (msg) => {
    const adminMsg = { from: "admin", text: msg };
    chatMessages.push(adminMsg);
    io.emit("chat-message", adminMsg);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 AI Traffic backend listening on ${PORT}`));
