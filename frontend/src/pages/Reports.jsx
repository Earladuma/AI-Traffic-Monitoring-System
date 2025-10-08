// src/pages/Reports.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ message: "", location: "", urgent: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) navigate("/login", { replace: true });

    fetchReports();
    const interval = setInterval(fetchReports, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchReports() {
    try {
      const res = await axios.get("/api/reports");
      setReports(res.data);
    } catch {
      // fallback: use localStorage if API fails
      const storedReports = JSON.parse(localStorage.getItem("reports")) || [];
      setReports(storedReports);
    } finally {
      setLoading(false);
    }
  }

  async function sendReport(e) {
    e.preventDefault();
    if (!form.message.trim()) {
      setError("⚠️ Please describe the issue.");
      return;
    }

    const newReport = {
      id: Date.now(),
      message: form.message,
      location: form.location,
      urgent: form.urgent,
      confirmed: false,
      timestamp: new Date().toISOString(),
      reportedBy: currentUser?.firstName || "Guest",
    };

    try {
      await axios.post("/api/reports", newReport);
    } catch {
      // fallback: save to localStorage
      const storedReports = JSON.parse(localStorage.getItem("reports")) || [];
      localStorage.setItem("reports", JSON.stringify([newReport, ...storedReports]));
    }

    setForm({ message: "", location: "", urgent: false });
    setError("");
    fetchReports();
  }

  async function confirmReport(id) {
    if (!currentUser || currentUser.role !== "admin") return;
    try {
      await axios.put(`/api/reports/${id}`, { confirmed: true });
    } catch {
      // fallback: update localStorage
      const updated = reports.map(r => r.id === id ? { ...r, confirmed: true } : r);
      localStorage.setItem("reports", JSON.stringify(updated));
    }
    fetchReports();
  }

  function statusBadge(confirmed, urgent) {
    const bg = confirmed ? "#10b981" : urgent ? "#ef4444" : "#f59e0b";
    const text = confirmed ? "Resolved" : urgent ? "Urgent" : "Pending";
    return (
      <span
        style={{
          background: bg,
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "0.8rem",
          marginLeft: 8,
        }}
      >
        {text}
      </span>
    );
  }

  function hotlineCard() {
    return (
      <div style={hotlineBox}>
        <h3>🚨 Emergency Hotlines</h3>
        <p>Police: <b>999</b></p>
        <p>Ambulance: <b>911</b></p>
        <p>Fire Brigade: <b>112</b></p>
        <p>Traffic Control: <b>0800-TRAFFIC</b></p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ color: "#FFD966", marginBottom: 16 }}>Incident Reports</h1>

        <form onSubmit={sendReport} style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Describe an issue..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={input}
            required
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            style={input}
          />
          <label style={{ color: "#fff", margin: "8px 0", display: "block" }}>
            <input
              type="checkbox"
              checked={form.urgent}
              onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
            />{" "}
            Mark as Urgent
          </label>
          <button type="submit" style={btn}>
            Submit Report
          </button>
          {error && <p style={{ color: "#ff6b6b", marginTop: 4 }}>{error}</p>}
        </form>

        {loading ? (
          <p style={{ color: "#bbb" }}>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p style={{ color: "#bbb" }}>No reports yet.</p>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              style={{
                ...reportCard,
                borderLeft: r.urgent ? "6px solid #ef4444" : "6px solid #FFD966",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>{r.message}</p>
              {r.location && (
                <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#ccc" }}>
                  📍 {r.location}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                <small style={{ color: "#aaa" }}>
                  {new Date(r.timestamp || Date.now()).toLocaleString()}
                </small>
                {statusBadge(r.confirmed, r.urgent)}
                {!r.confirmed && currentUser?.role === "admin" && (
                  <button
                    onClick={() => confirmReport(r.id)}
                    style={confirmBtn}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
              {r.urgent && hotlineCard()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* 🎨 Styles */
const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
  padding: 20,
};

const card = {
  background: "rgba(255,255,255,0.08)",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
  color: "#fff",
  width: "100%",
  maxWidth: 600,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  margin: "6px 0",
};

const btn = {
  background: "linear-gradient(90deg,#FFD966,#FFB84D)",
  color: "#111",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
};

const reportCard = {
  background: "rgba(255,255,255,0.15)",
  padding: 12,
  borderRadius: 12,
  marginTop: 12,
};

const confirmBtn = {
  marginLeft: "auto",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
};

const hotlineBox = {
  background: "rgba(239,68,68,0.15)",
  border: "1px solid #ef4444",
  padding: 10,
  marginTop: 8,
  borderRadius: 8,
};
