import express from "express";
import Feedback from "../models/feedback.js"; // <-- Import the Feedback model correctly

const router = express.Router();

// ------------------- GET APPROVED FEEDBACK -------------------
router.get("/", async (req, res) => {
  try {
    const reviews = await Feedback.find({ approved: true }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- POST USER FEEDBACK -------------------
router.post("/", async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message || !rating) return res.status(400).json({ message: "Message and rating required" });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const feedback = new Feedback({ message, rating });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted and awaiting approval", feedback });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
