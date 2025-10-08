// File: backend/routes/feedback.js

import express from "express";
import Feedback from "../models/feedback.js";

const router = express.Router();

// ------------------- SUBMIT FEEDBACK -------------------
// Users submit feedback, initially pending approval
router.post("/", async (req, res) => {
  try {
    const { message, rating } = req.body;

    if (!message || !rating) {
      return res.status(400).json({ message: "Message and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const fb = new Feedback({ message, rating });
    await fb.save();

    res.status(201).json({
      message: "Feedback submitted successfully and is pending approval",
      feedback: fb,
    });
  } catch (err) {
    console.error("Feedback submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- GET APPROVED FEEDBACK -------------------
// Only approved feedbacks are sent to the frontend
router.get("/approved", async (req, res) => {
  try {
    const approved = await Feedback.find({ approved: true }).sort({ createdAt: -1 });
    res.status(200).json(approved);
  } catch (err) {
    console.error("Fetching approved feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
