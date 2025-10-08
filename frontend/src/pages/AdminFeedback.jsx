// src/pages/AdminFeedback.jsx
import { useEffect, useState } from "react";

const initialFeedbacks = [
  { _id: "1", message: "Great app, really helpful!", rating: 5, approved: true },
  { _id: "2", message: "Needs more reporting features.", rating: 3, approved: false },
  { _id: "3", message: "UI is clean but performance can improve.", rating: 4, approved: false },
];

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [filter, setFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ msg, time }, ...prev]);
  }

  function approveFeedback(id) {
    setFeedbacks((prev) =>
      prev.map((f) => (f._id === id ? { ...f, approved: true } : f))
    );
    addLog(`Approved feedback #${id}`);
  }

  function deleteFeedback(id) {
    setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    addLog(`Deleted feedback #${id}`);
  }

  function resetFeedbacks() {
    setFeedbacks(initialFeedbacks);
    addLog("Feedback list reset");
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === "approved") return f.approved;
    if (filter === "pending") return !f.approved;
    return true;
  });

  // Styles
  const wrap = {
    padding: "2rem",
    minHeight: "100vh",
    background: theme === "dark" ? "linear-gradient(135deg, #000, #333)" : "#f5f5f5",
    color: theme === "dark" ? "#fff" : "#111",
    transition: "0.3s ease",
  };
  const card = {
    background: theme === "dark" ? "rgba(20,20,20,0.9)" : "#fff",
    padding: 25,
    borderRadius: 12,
    boxShadow: theme === "dark" ? "0 10px 25px rgba(0,0,0,0.5)" : "0 10px 25px rgba(0,0,0,0.1)",
  };
  const table = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  };
  const th = {
    padding: "10px",
    borderBottom: `2px solid ${theme === "dark" ? "#FFD966" : "#333"}`,
    textAlign: "left",
  };
  const td = {
    padding: "10px",
    borderBottom: `1px solid ${theme === "dark" ? "#555" : "#ccc"}`,
  };
  const btn = {
    background: "linear-gradient(90deg,#FFD966,#FFB84D)",
    color: "#111",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 6,
    marginTop: 3,
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{ color: "#FFD966" }}>📝 Admin Feedback Panel</h2>
        <p>Manage, approve, or remove user feedback with full control.</p>

        {/* Theme Toggle */}
        <button
          style={{ ...btn, marginBottom: 10 }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* Filters + Reset */}
        <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
          <button style={btn} onClick={() => setFilter("all")}>
            All
          </button>
          <button style={btn} onClick={() => setFilter("approved")}>
            Approved
          </button>
          <button style={btn} onClick={() => setFilter("pending")}>
            Pending
          </button>
          <button style={btn} onClick={resetFeedbacks}>
            Reset
          </button>
        </div>

        {/* Table */}
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Message</th>
              <th style={th}>Rating</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map((f) => (
              <tr key={f._id}>
                <td style={td}>{f.message}</td>
                <td style={td}>{"⭐".repeat(f.rating)}</td>
                <td style={td}>{f.approved ? "✅ Approved" : "❌ Pending"}</td>
                <td style={td}>
                  {!f.approved && (
                    <button style={btn} onClick={() => approveFeedback(f._id)}>
                      Approve
                    </button>
                  )}
                  <button
                    style={{ ...btn, background: "linear-gradient(90deg,#FF6666,#CC0000)" }}
                    onClick={() => deleteFeedback(f._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredFeedbacks.length === 0 && (
              <tr>
                <td style={td} colSpan="4" align="center">
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Logs */}
        <div style={{ marginTop: "2rem" }}>
          <h3>📜 Action Logs</h3>
          {logs.length === 0 && <p>No actions yet.</p>}
          {logs.map((log, i) => (
            <div
              key={i}
              style={{
                fontSize: "0.9em",
                marginTop: 5,
                borderLeft: "3px solid #FFD966",
                paddingLeft: 8,
              }}
            >
              [{log.time}] {log.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
