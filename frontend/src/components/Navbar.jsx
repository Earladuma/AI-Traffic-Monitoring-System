// src/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logoutUser, isAuthenticated } from "../services/auth";
import { MessageCircle, Bell, User, Menu } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getCurrentUser());

  const [navbarOpen, setNavbarOpen] = useState(false); // Main navbar toggle
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved
      ? JSON.parse(saved)
      : [{ from: "bot", text: "Hi! I am SmartTraffic — ask me anything about traffic." }];
  });
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();

  const links = [
    { to: "/", label: "Landing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/feedback", label: "Feedback" },
    { to: "/social", label: "Social" },
    { to: "/dashboard", label: "Dashboard", protected: true },
    { to: "/admin", label: "Admin", protected: true },
  ];

  // Auto-scroll chat
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, chatOpen]);

  // Persist chat
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // Auto-update user (profile changes, login/logout)
  useEffect(() => {
    const interval = setInterval(() => setUser(getCurrentUser()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Chat send
  const send = (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setValue("");
    setLoading(true);

    setTimeout(() => {
      let reply;
      if (text.toLowerCase().includes("traffic")) {
        reply = { from: "bot", text: "AI: Traffic is moderate in most areas." };
      } else {
        reply = { from: "bot", text: "Please call 0708632005 for assistance." };
      }
      setMessages((prev) => [...prev, reply]);
      setLoading(false);
    }, 1000);
  };

  const clearHistory = () => {
    setMessages([{ from: "bot", text: "Hi! I am SmartTraffic — ask me anything about traffic." }]);
    localStorage.removeItem("chatHistory");
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      {/* Navbar Container */}
      {navbarOpen && (
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "250px",
            height: "100vh",
            backgroundColor: "#16a34a",
            color: "#fff",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 9998,
            boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
            transition: "transform 0.3s",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px" }}>
              AI Traffic
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {links.map((link) => {
                if (link.protected && !isAuthenticated()) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      color: location.pathname === link.to ? "#FFD966" : "#fff",
                      fontWeight: location.pathname === link.to ? "bold" : "normal",
                      textDecoration: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      transition: "background 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setNavbarOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Profile & Logout */}
          {user && (
            <div style={{ marginTop: "auto" }}>
              <div style={{ marginBottom: "10px" }}>{user.name || "Account"}</div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#FFD966",
                  color: "#111",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FFC107")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFD966")}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      )}

      {/* Bottom-left Navbar Toggle Button */}
      <button
        onClick={() => setNavbarOpen(!navbarOpen)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 9999,
          background: "#16a34a",
          color: "#fff",
          border: "none",
          padding: "8px 10px",
          borderRadius: 6,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
      >
        <Menu size={18} />
      </button>

      {/* Chatbot */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: "300px",
            maxHeight: "500px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          <header
            style={{
              backgroundColor: "#16a34a",
              color: "#fff",
              padding: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold" }}>SmartTraffic</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={clearHistory}
                style={{
                  background: "#fff",
                  color: "#16a34a",
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button onClick={() => setChatOpen(false)}>✖</button>
            </div>
          </header>

          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              background: "#f3f4f6",
            }}
            ref={bodyRef}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.from === "bot" ? "flex-start" : "flex-end",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    background: m.from === "bot" ? "#e0e7ff" : "#16a34a",
                    color: m.from === "bot" ? "#000" : "#fff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    maxWidth: "70%",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontStyle: "italic", color: "#6b7280" }}>AI is typing...</div>}
          </div>

          <div style={{ display: "flex", borderTop: "1px solid #ddd", padding: "6px", background: "#fff" }}>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(value)}
              placeholder="Ask about traffic..."
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                outline: "none",
              }}
            />
            <button
              onClick={() => send(value)}
              disabled={loading}
              style={{
                marginLeft: "6px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
                background: "#16a34a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
