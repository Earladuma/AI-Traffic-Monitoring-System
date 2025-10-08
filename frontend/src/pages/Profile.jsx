import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load user and data
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      navigate("/login", { replace: true });
    } else {
      setUser(currentUser);
      setPoints(Number(localStorage.getItem("points")) || 0);
      setBadges(JSON.parse(localStorage.getItem("badges")) || []);
      setPosts(JSON.parse(localStorage.getItem("posts")) || []);
      setChats(JSON.parse(localStorage.getItem("chats")) || []);
    }
  }, []);

  if (!user) return null;

  function logout() {
    localStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  }

  function recentActivity() {
    const recentPosts = posts
      .filter((p) => p.user === user.firstName)
      .slice(-3)
      .reverse();
    const recentChats = chats
      .filter((c) => c.from === user.firstName || c.to === user.firstName)
      .slice(-3)
      .reverse();
    return { recentPosts, recentChats };
  }

  const { recentPosts, recentChats } = recentActivity();

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={title}>👤 {user.firstName} {user.lastName}</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Total Points:</strong> {points}</p>
        <p><strong>Badges Earned:</strong> {badges.length === 0 ? "None yet" : badges.join(", ")}</p>

        {/* Quick Navigation */}
        <div style={quickNav}>
          <button style={btnNav} onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button style={btnNav} onClick={() => navigate("/social")}>Social Feed</button>
          <button style={btnNav} onClick={() => navigate("/reports")}>Reports</button>
        </div>

        {/* Recent Activity */}
        <div style={activity}>
          <h3 style={activityTitle}>Recent Activity</h3>
          <ul>
            {recentPosts.length === 0 && recentChats.length === 0 && <li>No recent activity</li>}
            {recentPosts.map(p => (
              <li key={`post-${p.id}`}>Posted: "{p.content}" (+{p.points} pts)</li>
            ))}
            {recentChats.map((c, i) => (
              <li key={`chat-${i}`}>
                Chat with {c.to === user.firstName ? c.from : c.to}: "{c.message}"
              </li>
            ))}
          </ul>
        </div>

        {/* Logout / Home */}
        <div style={{ marginTop: 20 }}>
          <button onClick={() => navigate("/landing")} style={btnAlt}>Home</button>
          <button onClick={() => setShowLogoutConfirm(true)} style={btn}>Logout</button>
        </div>

        {showLogoutConfirm && (
          <div style={logoutOverlay}>
            <div style={logoutBox}>
              <p>Are you sure you want to logout?</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <button style={btn} onClick={logout}>Yes</button>
                <button style={btnAlt} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 Styles
const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#1e1e1e,#3b3b3b,#111)",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  padding: 20,
};

const card = {
  background: "rgba(255,255,255,0.08)",
  padding: 40,
  borderRadius: 16,
  color: "#fff",
  boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
  textAlign: "center",
  width: "400px",
  backdropFilter: "blur(15px)",
  position: "relative",
};

const title = { marginBottom: 20, color: "#FFD966", fontSize: 26, fontWeight: 700 };
const btn = {
  marginTop: 12,
  marginLeft: 10,
  background: "linear-gradient(90deg,#FFD966,#FFB84D)",
  color: "#111",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.3s",
};
const btnAlt = {
  ...btn,
  background: "linear-gradient(90deg,#444,#777)",
  color: "#fff",
};

const quickNav = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
  marginBottom: 20,
  flexWrap: "wrap",
  gap: 10,
};

const btnNav = {
  ...btnAlt,
  flex: "1 1 30%",
  marginBottom: 8,
};

const activity = {
  textAlign: "left",
  background: "rgba(255,255,255,0.05)",
  padding: 12,
  borderRadius: 10,
  marginBottom: 20,
};

const activityTitle = { color: "#FFD966", marginBottom: 8 };

const logoutOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const logoutBox = {
  background: "rgba(255,255,255,0.08)",
  padding: 30,
  borderRadius: 16,
  backdropFilter: "blur(15px)",
  textAlign: "center",
};
