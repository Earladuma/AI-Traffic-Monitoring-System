// File: backend/models/feedback.js

import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    approved: {
      type: Boolean,
      default: false, // Admin needs to approve before public display
    },
  },
  {
    timestamps: true, // auto-manage createdAt and updatedAt
  }
);

// Optional: index by approval for faster queries
feedbackSchema.index({ approved: 1 });

export default mongoose.model("Feedback", feedbackSchema);
