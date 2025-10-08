// File: src/pages/About.jsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function About() {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([
    { id: 1, message: "This system is revolutionary! Traffic finally feels under control.", rating: 5 },
    { id: 2, message: "Very accurate predictions. Helped me save time on my daily commute.", rating: 4 },
  ]);
  const [expandedReview, setExpandedReview] = useState(null);

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    const newReview = {
      id: Date.now(),
      message: feedback,
      rating,
    };
    setReviews([newReview, ...reviews]);
    setSubmitted(true);
    setFeedback("");
    setRating(5);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div
      className="about-page"
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?auto=format&fit=crop&w=1950&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        overflow: "auto",
      }}
    >
      {/* Overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 0,
        }}
      ></div>

      <div
        className="about-container"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "3rem 1rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center font-bold mb-4"
          style={{
            fontSize: "2.8rem",
            background: "linear-gradient(90deg, #FFD700, #FFA500, #FF4500)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          About AI Traffic Monitoring System
        </motion.h1>

        {/* Intro */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: "center",
            fontSize: "1.2rem",
            color: "#ddd",
            marginBottom: "2.5rem",
          }}
        >
          Our AI-powered Traffic Monitoring and Management System analyzes traffic patterns in real time,
          predicts congestion, and optimizes lane usage to improve city-wide traffic flow.
        </motion.p>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {[{ title: "🌍 Our Mission", text: "To revolutionize urban mobility by using AI to reduce congestion and save commuting time." },
            { title: "🚦 Our Vision", text: "A future where smart cities run on intelligent systems that ensure smooth, safe, and eco-friendly traffic." }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * (idx + 1) }}
              style={{
                backdropFilter: "blur(12px)",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "15px",
                padding: "1.5rem",
                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              <h2 style={{ marginBottom: "0.8rem", color: "#FFD700" }}>{item.title}</h2>
              <p style={{ color: "#ddd" }}>{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "15px",
            padding: "1.5rem",
            marginBottom: "2.5rem",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#FFD700" }}>✨ Key Features</h2>
          <ul style={{ lineHeight: "1.8" }}>
            <li>Real-time traffic monitoring</li>
            <li>AI-powered congestion prediction</li>
            <li>Dynamic lane allocation</li>
            <li>Emergency vehicle prioritization</li>
            <li>Interactive dashboard with city grid</li>
            <li>Daily traffic pattern simulation</li>
            <li>History panels of congestion and reports</li>
          </ul>
        </motion.div>

        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "15px",
            padding: "1.5rem",
            marginBottom: "2.5rem",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          <h3 style={{ marginBottom: "1rem", color: "#FFD700" }}>💡 We value your feedback</h3>
          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <textarea
                placeholder="Share your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  resize: "vertical",
                  fontSize: "1rem",
                }}
              />
              <div>
                <label>Rating: </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  style={{ padding: "0.4rem", borderRadius: "5px" }}
                >
                  <option value={5}>⭐⭐⭐⭐⭐</option>
                  <option value={4}>⭐⭐⭐⭐</option>
                  <option value={3}>⭐⭐⭐</option>
                  <option value={2}>⭐⭐</option>
                  <option value={1}>⭐</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  padding: "0.6rem",
                  border: "none",
                  borderRadius: "8px",
                  background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                  color: "black",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Submit Feedback
              </button>
            </form>
          ) : (
            <p style={{ color: "lightgreen" }}>✅ Thank you! Your feedback was added.</p>
          )}
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "15px",
            padding: "1.5rem",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          <h3 style={{ marginBottom: "1rem", color: "#FFD700" }}>🌟 What people are saying</h3>
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              onClick={() => setExpandedReview(expandedReview === r.id ? null : r.id)}
              style={{
                cursor: "pointer",
                marginBottom: "1rem",
                padding: "0.8rem",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.05)",
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ color: "#FFD700" }}>{"⭐".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p style={{ margin: "0.5rem 0", color: "#eee" }}>
                {expandedReview === r.id ? r.message : r.message.slice(0, 60) + (r.message.length > 60 ? "..." : "")}
              </p>
              <AnimatePresence>
                {expandedReview === r.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ color: "#bbb", fontSize: "0.9rem" }}
                  >
                    <p>(Full review) {r.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* History Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          style={{
            marginTop: "2.5rem",
            padding: "1.5rem",
            borderRadius: "15px",
            background: "rgba(255,255,255,0.08)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          <h3 style={{ marginBottom: "1rem", color: "#FFD700" }}>📜 System History</h3>
          <ul style={{ lineHeight: "1.8", color: "#ddd" }}>
            <li>2023 - Conceptualization of the project</li>
            <li>2024 - Simulation and testing with synthetic data</li>
            <li>2025 - Launch of AI Traffic Monitoring System 🚀</li>
          </ul>
        </motion.div>

        {/* CTA */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          {!user ? (
            <>
              <p style={{ marginBottom: "1rem", color: "#ccc" }}>
                Ready to experience smarter traffic management?
              </p>
              <Link
                to="/register"
                style={{
                  padding: "0.8rem 1.5rem",
                  borderRadius: "8px",
                  background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                  color: "black",
                  fontWeight: "bold",
                  textDecoration: "none",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                }}
              >
                Join Now
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "8px",
                background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                color: "black",
                fontWeight: "bold",
                textDecoration: "none",
                boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
              }}
            >
              Go to Dashboard →
            </Link>
          )}
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#aaa" }}>
            If the system hasn’t helped, contact us at <strong>0708632005</strong> for further assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
