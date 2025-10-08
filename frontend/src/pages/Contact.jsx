import { useState, useEffect } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    setLogs((prev) => [
      { msg: `Message submitted by ${form.name}`, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  };

  const wrap = {
    minHeight: "100vh",
    padding: "3rem",
    background: theme === "dark" ? "linear-gradient(135deg, #0f172a, #1e293b)" : "#f5f5f5",
    color: theme === "dark" ? "#f8fafc" : "#111",
    fontFamily: "Arial, sans-serif",
    transition: "0.3s ease",
  };

  const card = {
    background: theme === "dark" ? "#1e293b" : "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: theme === "dark" ? "0 8px 16px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.1)",
  };

  const btn = {
    padding: "0.75rem 1.5rem",
    background: "#38bdf8",
    color: theme === "dark" ? "#0f172a" : "#111",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
    marginTop: 5,
  };

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Contact Us</h1>
        <p style={{ fontSize: "1.1rem" }}>
          Have questions or need help? We’re here to support you.
        </p>
        <button
          style={{ ...btn, marginTop: 10 }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* Contact Info */}
        <div style={card}>
          <h2 style={{ marginBottom: "1rem" }}>Get in Touch</h2>
          <p>Email: <a href="mailto:support@smarttraffic.local" style={{ color: "#38bdf8" }}>support@smarttraffic.local</a></p>
          <p>Phone: <a href="tel:0708632005" style={{ color: "#38bdf8" }}>0708632005</a></p>
          <p>Location: 123 Main Street, Nairobi, Kenya</p>
          <p>Office Hours: Mon-Fri, 9:00 AM - 5:00 PM</p>
          <p style={{ marginTop: "1rem" }}>
            <strong>Help Topics:</strong>
            <ul style={{ marginTop: "0.5rem" }}>
              <li>🔹 How to report a traffic issue</li>
              <li>🔹 Troubleshooting the dashboard</li>
              <li>🔹 Submitting feedback & suggestions</li>
              <li>🔹 Emergency contact for road safety</li>
            </ul>
          </p>
          <div style={{ marginTop: "1rem" }}>
            <iframe
              src="https://maps.google.com/maps?q=Nairobi%20Kenya&t=&z=13&ie=UTF8&iwloc=&output=embed"
              style={{ width: "100%", height: "200px", border: "0", borderRadius: 8 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div style={card}>
          <h2 style={{ marginBottom: "1rem" }}>Send Us a Message</h2>
          {submitted && (
            <p style={{ color: "#4ade80", fontWeight: "bold" }}>
              ✅ Thank you! Your message has been sent.
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "8px",
                border: `1px solid ${theme === "dark" ? "#334155" : "#ccc"}`,
                background: theme === "dark" ? "#0f172a" : "#fff",
                color: theme === "dark" ? "#f8fafc" : "#111",
              }}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "8px",
                border: `1px solid ${theme === "dark" ? "#334155" : "#ccc"}`,
                background: theme === "dark" ? "#0f172a" : "#fff",
                color: theme === "dark" ? "#f8fafc" : "#111",
              }}
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              required
              rows="5"
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "8px",
                border: `1px solid ${theme === "dark" ? "#334155" : "#ccc"}`,
                background: theme === "dark" ? "#0f172a" : "#fff",
                color: theme === "dark" ? "#f8fafc" : "#111",
              }}
            />
            <button
              type="submit"
              style={btn}
              onMouseOver={(e) => (e.target.style.background = "#0ea5e9")}
              onMouseOut={(e) => (e.target.style.background = "#38bdf8")}
            >
              Send Message
            </button>
          </form>

          {/* Logs */}
          <div style={{ marginTop: "2rem" }}>
            <h3>📜 Submission Logs</h3>
            {logs.length === 0 && <p>No messages submitted yet.</p>}
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
    </div>
  );
}
