// src/pages/Feedback.jsx
import { useState, useEffect } from "react";

export default function Feedback() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // Gamification states (shared logic compatible with Dashboard)
  const [points, setPoints] = useState(Number(localStorage.getItem("points")) || 0);
  const [badges, setBadges] = useState(JSON.parse(localStorage.getItem("badges")) || []);
  const [dailyChallenges, setDailyChallenges] = useState(JSON.parse(localStorage.getItem("dailyChallenges")) || [
    { id: 1, task: "Submit 1 feedback", completed: false, points: 2 },
  ]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedFeedbacks = JSON.parse(localStorage.getItem("feedbacks") || "[]");
    setFeedbacks(savedFeedbacks);
  }, []);

  useEffect(() => {
    localStorage.setItem("points", points);
    localStorage.setItem("badges", JSON.stringify(badges));
    localStorage.setItem("dailyChallenges", JSON.stringify(dailyChallenges));
  }, [points, badges, dailyChallenges]);

  // --- Points, badges, notifications ---
  const addPoints = (pts, challengeId = null, message = "") => {
    const total = points + pts;
    setPoints(total);

    // Badge thresholds
    const badgeRules = [
      { name: "Reporter", threshold: 5 },
      { name: "Chat Star", threshold: 10 },
      { name: "Puzzle Master", threshold: 20 },
    ];
    const earned = badgeRules.filter(b => total >= b.threshold).map(b => b.name);
    setBadges([...new Set(earned)]);

    // Daily challenge completion
    if (challengeId) {
      setDailyChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, completed: true } : c));
    }

    // Notification
    if (pts > 0) {
      const notifMsg = message || `+${pts} points earned!`;
      setNotifications(prev => [...prev, notifMsg]);
      setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newFeedback = { text: message, date: new Date().toISOString() };
    const updatedFeedbacks = [newFeedback, ...feedbacks];

    localStorage.setItem("feedbacks", JSON.stringify(updatedFeedbacks));
    setFeedbacks(updatedFeedbacks);
    setMessage("");
    setSubmitted(true);

    // Add points for feedback submission
    addPoints(2, 1, "Feedback submitted! +2 pts");

    // Hide submission confirmation after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  const wrapStyle = {
    minHeight: "100vh",
    padding: "3rem",
    background: theme === "dark" ? "#0f172a" : "#f5f5f5",
    color: theme === "dark" ? "#f8fafc" : "#111",
    fontFamily: "Arial, sans-serif",
    transition: "0.3s ease",
  };

  const cardStyle = {
    background: theme === "dark" ? "#1e293b" : "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: theme === "dark" ? "0 8px 16px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: `1px solid ${theme === "dark" ? "#334155" : "#ccc"}`,
    background: theme === "dark" ? "#0f172a" : "#fff",
    color: theme === "dark" ? "#f8fafc" : "#111",
    marginBottom: "1rem",
    resize: "vertical",
  };

  const btnStyle = {
    padding: "0.75rem 1.5rem",
    background: "#38bdf8",
    color: theme === "dark" ? "#0f172a" : "#111",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  };

  return (
    <div style={wrapStyle}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Feedback</h1>
        <p style={{ fontSize: "1.1rem" }}>We value your thoughts! Share your feedback to help improve SmartTraffic.</p>
        <button
          style={{ ...btnStyle, marginTop: 10 }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Points & Badges */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Your Points & Badges</h2>
        <p><strong>Total Points:</strong> {points}</p>
        <p><strong>Badges:</strong> {badges.length === 0 ? "None yet" : badges.join(", ")}</p>
        <h4>Daily Challenges</h4>
        <ul>
          {dailyChallenges.map(c => (
            <li key={c.id} style={{ textDecoration: c.completed ? "line-through":"none" }}>
              {c.task} — {c.completed ? "Completed ✅" : "Pending"}
            </li>
          ))}
        </ul>
        {/* Notifications */}
        <div style={{ marginTop: 10 }}>
          {notifications.map((n,i) => (
            <div key={i} style={{ background:"#fde68a", padding:8, borderRadius:6, marginBottom:4 }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div style={cardStyle}>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts about SmartTraffic..."
              rows={6}
              required
              style={inputStyle}
            />
            <button type="submit" style={btnStyle}>Submit Feedback</button>
          </form>
        ) : (
          <div style={{ padding: "1rem", background: "#4ade80", color: "#0f172a", borderRadius: "8px", fontWeight: "bold" }}>
            ✅ Thank you for your feedback! Your response has been recorded.
          </div>
        )}
      </div>

      {/* Feedback Logs */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Previous Feedback</h2>
        {feedbacks.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {feedbacks.map((fb, index) => (
              <li key={index} style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "8px", background: theme === "dark" ? "#0f172a" : "#f1f5f9" }}>
                <p>{fb.text}</p>
                <small style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
                  {new Date(fb.date).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
