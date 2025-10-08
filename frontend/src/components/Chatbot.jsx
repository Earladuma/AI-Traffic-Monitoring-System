// src/components/Chatbot.jsx
import React, { useState, useRef, useEffect } from "react";

/**
 * Chatbot component for SmartTraffic.
 * @param {boolean} adminOnline - If true, admin is online and responds directly.
 * @param {function} onNewMessage - Callback for new messages (user or bot).
 */
export default function Chatbot({ adminOnline = false, onNewMessage = () => {} }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! I am SmartTraffic — ask me anything about traffic." },
  ]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();

  // Auto-scroll to latest message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Send message
  const send = (text) => {
    if (!text.trim()) return;

    const userMsg = { from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    onNewMessage(userMsg);
    setValue("");
    setLoading(true);

    setTimeout(() => {
      let reply;

      if (adminOnline) {
        reply = { from: "bot", text: "👨‍💼 Admin: Thanks for reaching out! How can I help?" };
      } else {
        if (text.toLowerCase().includes("traffic")) {
          reply = { from: "bot", text: "🤖 AI: Based on current data, traffic is moderate in most areas." };
        } else {
          reply = {
            from: "bot",
            text: "❗ Sorry, I couldn’t process your request. Please call 📞 0708632005 for further assistance.",
          };
        }
      }

      setMessages((prev) => [...prev, reply]);
      onNewMessage(reply);
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          💬
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 350,
            maxHeight: 500,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Arial, sans-serif",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <header
            style={{
              padding: 14,
              background: "#10b981",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            <span>SmartTraffic Chat</span>
            <span style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>
              ✖
            </span>
          </header>

          {/* Messages */}
          <div
            ref={bodyRef}
            style={{
              flex: 1,
              padding: 12,
              overflowY: "auto",
              background: "#f9fafb",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.from === "bot" ? "flex-start" : "flex-end",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: m.from === "bot" ? "#eef2ff" : "#10b981",
                    color: m.from === "bot" ? "#111" : "#fff",
                    padding: "8px 12px",
                    borderRadius: 12,
                    maxWidth: "70%",
                    fontSize: 14,
                    lineHeight: 1.4,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "#666", fontStyle: "italic", fontSize: 13 }}>
                AI is typing...
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: 10,
              borderTop: "1px solid #ddd",
              background: "#fff",
            }}
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                marginRight: 8,
                fontSize: 14,
              }}
            />
            <button
              onClick={() => send(value)}
              disabled={loading}
              style={{
                background: "#10b981",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: "bold",
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
