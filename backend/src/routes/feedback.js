import express from "express";
import Feedback from "../models/feedback.js"; // lowercase 'f'
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all approved feedbacks
router.get("/", async (req, res) => {
  try {
    const reviews = await Feedback.find({ approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit feedback
router.post("/", async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message || !rating) return res.status(400).json({ message: "All fields are required" });

    const feedback = new Feedback({ message, rating, approved: false });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted, awaiting approval" });
  } catch (err) {
    console.error("Failed to submit feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
