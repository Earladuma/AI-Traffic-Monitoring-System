// src/pages/Help.jsx
import React, { useState, useEffect } from "react";

export default function Help({ addPoints: parentAddPoints }) {
  const [search, setSearch] = useState("");
  const [showTip, setShowTip] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // Gamification state
  const [points, setPoints] = useState(Number(localStorage.getItem("points")) || 0);
  const [badges, setBadges] = useState(JSON.parse(localStorage.getItem("badges")) || []);
  const [dailyChallenges, setDailyChallenges] = useState(JSON.parse(localStorage.getItem("dailyChallenges")) || [
    { id: 2, task: "Read 1 help tip", completed: false, points: 1 },
  ]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => {
    localStorage.setItem("points", points);
    localStorage.setItem("badges", JSON.stringify(badges));
    localStorage.setItem("dailyChallenges", JSON.stringify(dailyChallenges));
  }, [points, badges, dailyChallenges]);

  // --- Gamification: add points, badges, notifications ---
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

    // Forward to parent (optional Dashboard integration)
    if (parentAddPoints) parentAddPoints(pts, challengeId, message);
  };

  // --- FAQ & Tips ---
  const faqList = [
    { id: 1, question: "What is the purpose of this app?", answer: "This AI Traffic Monitoring & Gamified Platform helps users track real-time traffic conditions, report incidents, plan the fastest routes, interact with other users, and engage with fun activities. Its goal is to reduce congestion, improve road safety, and make traffic management interactive and rewarding." },
    { id: 2, question: "How does the Live Traffic Dashboard work?", answer: "The dashboard shows real-time traffic flow for each road segment. Green bars indicate inbound traffic, blue bars indicate outbound traffic. The dashboard updates automatically every few seconds to reflect simulated conditions. Users can view traffic volumes, lane distribution, and congestion alerts." },
    { id: 3, question: "How can I report traffic incidents?", answer: "Go to the Social Feed section, type your incident or update, and click 'Post'. Reports contribute to AI traffic analysis and help other users choose better routes. You earn points for every valid report." },
    { id: 4, question: "How does Chat & Messaging work?", answer: "You can chat publicly or privately with other users. Select a user from the dropdown for private messages, or post in the public chat. Every message contributes points toward your leaderboard rank." },
    { id: 5, question: "How do Leaderboards and Badges work?", answer: "Points are accumulated from posting reports, chatting, answering trivia, and completing mini-games. Leaderboards rank users by total points, while badges are earned automatically for reaching milestones or completing specific tasks." },
    { id: 6, question: "What are Trivia & Mini-Games?", answer: "Trivia questions test your traffic knowledge, and mini-games challenge your problem-solving skills. Correct answers reward points. These activities make learning about traffic management interactive and fun." },
    { id: 7, question: "How does the Map & Route Planner work?", answer: "The Map shows simulated traffic congestion in real-time. You can click 'Suggest Route' to get recommendations for low-congestion routes, helping you plan your trip efficiently." },
    { id: 8, question: "What are Daily Challenges?", answer: "Daily Challenges are tasks designed to encourage users to interact with the app every day. Completing them gives points, badges, and helps users climb the leaderboard faster." },
    { id: 9, question: "How do notifications help?", answer: "Notifications alert you whenever you earn points, complete a challenge, receive a badge, or when other users interact with your posts. This keeps you informed and engaged." },
    { id: 10, question: "How can I maximize my points and rewards?", answer: "Engage actively: post accurate traffic reports, chat with users, solve trivia and mini-games, complete daily challenges, and read Help tips. Each action gives points that contribute to badges and leaderboard ranking." },
  ];

  const filteredFaq = faqList.filter(f => f.question.toLowerCase().includes(search.toLowerCase()));

  const handleTipClick = (id) => {
    setShowTip(showTip === id ? null : id);
    addPoints(1, 2, "Read a help tip! +1 pt"); // points for reading tips
  };

  const wrapStyle = {
    minHeight: "100vh",
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: theme === "dark" ? "#0f172a" : "#f8f9fa",
    color: theme === "dark" ? "#f8fafc" : "#111",
    transition: "0.3s ease",
  };

  const cardStyle = {
    backgroundColor: theme === "dark" ? "#1e293b" : "#fff",
    padding: 16,
    borderRadius: 12,
    boxShadow: theme === "dark" ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
    marginBottom: 16,
  };

  return (
    <div style={wrapStyle}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Help & Interactive Guide</h1>
        <p style={{ marginBottom: 16 }}>Learn all features, earn points, and maximize badges!</p>
        <button
          style={{ ...cardStyle, cursor: "pointer", padding: 10, width: 150, margin: "0 auto" }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Points & Badges */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: 8 }}>Your Points & Badges</h2>
        <p><strong>Total Points:</strong> {points}</p>
        <p><strong>Badges:</strong> {badges.length === 0 ? "None yet" : badges.join(", ")}</p>
        <h4>Daily Challenges</h4>
        <ul>
          {dailyChallenges.map(c => <li key={c.id} style={{ textDecoration: c.completed ? "line-through" : "none" }}>{c.task} — {c.completed ? "Completed ✅" : "Pending"}</li>)}
        </ul>
        <div style={{ marginTop: 10 }}>
          {notifications.map((n,i) => <div key={i} style={{ background:"#fde68a", padding:8, borderRadius:6, marginBottom:4 }}>{n}</div>)}
        </div>
      </div>

      {/* Search FAQs */}
      <div style={cardStyle}>
        <input
          type="text"
          placeholder="Search FAQs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 16 }}
        />
        <div>
          {filteredFaq.length === 0 && <p>No FAQs match your search.</p>}
          {filteredFaq.map(faq => (
            <div key={faq.id} style={{ ...cardStyle, cursor: "pointer" }} onClick={() => handleTipClick(faq.id)}>
              <div style={{ fontWeight: 600 }}>{faq.question}</div>
              {showTip === faq.id && <div style={{ marginTop: 8 }}>{faq.answer}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div style={cardStyle}>
        <h2>Quick Tips & Usage Guide</h2>
        <ul>
          <li>📌 Post real-time traffic incidents to help others & earn points.</li>
          <li>💬 Engage in public/private chat to earn points.</li>
          <li>🧩 Solve trivia & mini-games for bonus points.</li>
          <li>📍 Use Map & Route Planner for efficient trips.</li>
          <li>🏆 Complete Daily Challenges to maximize rewards.</li>
          <li>🔔 Pay attention to notifications for points, badges, leaderboard.</li>
          <li>🎖️ Earn badges for milestones & tasks.</li>
          <li>💡 Read guides & tips to gain points and hidden strategies.</li>
        </ul>
      </div>

      {/* App Importance */}
      <div style={cardStyle}>
        <h2>Why This App is Important</h2>
        <ul>
          <li>Reduce congestion by informing users of real-time traffic.</li>
          <li>Improve road safety through reported incidents.</li>
          <li>Encourage civic engagement & observations sharing.</li>
          <li>Educate via trivia & mini-games.</li>
          <li>Motivate consistent interaction with points, badges, challenges.</li>
        </ul>
      </div>

      {/* Gamification Reminder */}
      <div style={cardStyle}>
        <h2>Gamification & Rewards</h2>
        <p>Every action earns points: posts, chats, trivia, mini-games, reading guides. Points unlock badges, improve leaderboard rank, and reflect engagement.</p>
      </div>

      {/* Getting Started Guide */}
      <div style={cardStyle}>
        <h2>Getting Started</h2>
        <ol>
          <li>Check Dashboard for live traffic & alerts.</li>
          <li>Post traffic incidents in Social Feed.</li>
          <li>Chat with other users.</li>
          <li>Play trivia & mini-games for extra points.</li>
          <li>Use Map for route planning & congestion avoidance.</li>
          <li>Complete Daily Challenges regularly.</li>
        </ol>
      </div>
    </div>
  );
}
