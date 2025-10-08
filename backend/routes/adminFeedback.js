// File: backend/routes/adminFeedback.js

import express from "express";
import Feedback from "../models/Feedback.js"; // note capital F
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ------------------- GET ALL FEEDBACKS (ADMIN) -------------------
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const allFeedback = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(allFeedback);
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- APPROVE FEEDBACK -------------------
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    feedback.approved = true;
    await feedback.save();

    res.status(200).json({ message: "Feedback approved", feedback });
  } catch (err) {
    console.error("Failed to approve feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
