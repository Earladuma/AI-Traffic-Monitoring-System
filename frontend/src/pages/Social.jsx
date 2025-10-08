// src/pages/Social.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

/**
 * Social.jsx
 * Feature-rich social module for the AI Traffic System frontend.
 * - Feed with posts (text + optional image)
 * - Reactions (emoji), likes, comments
 * - Stories (24h expiry) + create story
 * - Direct Messages (DMs) with ephemeral option
 * - Explore / search posts & users
 * - Follow / unfollow, suggestions
 * - Bookmarks (save posts)
 * - Notifications (badge + dropdown + clear)
 * - LocalStorage-backed persistence (works standalone without backend)
 * - SnapMap placeholder (coming soon)
 *
 * Notes:
 * - This file uses `getCurrentUser()` from `src/services/auth` to tie actions to the logged-in user.
 * - If an auth user exists but not in the prototype social user list, we create a matching entry.
 */

/* ---------------------------
   Utilities & LocalStorage Wrappers
   --------------------------- */
const uid = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const timeAgo = (iso) => {
  if (!iso) return "Just now";
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const LS = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

/* ---------------------------
   Seed demo data (if empty)
   --------------------------- */
if (!LS.get("sf_users")) {
  LS.set("sf_users", [
    { id: "u_you", name: "You", username: "you", avatarColor: "#0ea5a4", email: "you@example.com" },
    { id: "u_alice", name: "Alice Johnson", username: "alice", avatarColor: "#fb7185", email: "alice@example.com" },
    { id: "u_bob", name: "Bob Kamau", username: "bob", avatarColor: "#60a5fa", email: "bob@example.com" },
    { id: "u_carol", name: "Carol Ngo", username: "carol", avatarColor: "#f59e0b", email: "carol@example.com" },
  ]);
}
if (!LS.get("sf_posts")) {
  LS.set("sf_posts", [
    {
      id: uid("p_"),
      userId: "u_alice",
      text: "Morning commute — watch out for delays near R1. #traffic",
      image: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      likes: 12,
      reactions: { "👍": 5, "❤️": 2 },
      comments: [
        {
          id: uid("c_"),
          userId: "u_bob",
          text: "Thanks for heads up!",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ],
      location: "Main St",
      bookmarkedBy: [],
    },
    {
      id: uid("p_"),
      userId: "u_bob",
      text: "Beautiful sunset after the rush 🌇",
      image: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      likes: 5,
      reactions: {},
      comments: [],
      location: "",
      bookmarkedBy: [],
    },
  ]);
}
if (!LS.get("sf_stories")) {
  LS.set("sf_stories", [
    {
      id: uid("s_"),
      userId: "u_alice",
      image: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    },
  ]);
}
if (!LS.get("sf_follows")) {
  LS.set("sf_follows", { u_you: ["u_alice", "u_bob"] });
}
if (!LS.get("sf_dms")) {
  LS.set("sf_dms", {
    "u_you:u_alice": [
      {
        id: uid("m_"),
        from: "u_alice",
        to: "u_you",
        text: "Roads look clear now.",
        createdAt: new Date().toISOString(),
        ephemeral: false,
      },
    ],
  });
}
if (!LS.get("sf_notifications")) {
  LS.set("sf_notifications", []);
}
if (!LS.get("sf_bookmarks")) {
  LS.set("sf_bookmarks", {});
}

/* ---------------------------
   Small presentational pieces
   --------------------------- */
function Avatar({ userId, size = 40, nameOverride }) {
  const users = LS.get("sf_users", []);
  const u = users.find((x) => x.id === userId) || users[0] || { name: "U", avatarColor: "#10b981" };
  const initials = (nameOverride || u.name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    background: u.avatarColor || "#10b981",
    flexShrink: 0,
  };
  return <div style={style}>{initials}</div>;
}

/* ---------------------------
   Main Social Component
   --------------------------- */
export default function Social() {
  // tie prototype social to real auth user if available
  const authUser = getCurrentUser(); // may be null
  // Determine meId. If authUser has id we use it, else create id from email or username.
  const canonicalIdFromAuth = (() => {
    if (!authUser) return null;
    if (authUser.id) return authUser.id;
    // derive id from email/username
    const base = (authUser.username || authUser.email || `${authUser.firstName || "user"}`).toString().toLowerCase();
    const cleaned = base.replace(/[^a-z0-9]/g, "_").slice(0, 20);
    return `u_${cleaned}`;
  })();

  // Ensure current auth user is present in sf_users (so everything ties)
  useEffect(() => {
    if (!authUser) return;
    const users = LS.get("sf_users", []);
    const meId = canonicalIdFromAuth;
    if (!users.find((u) => u.id === meId)) {
      // Add to social users list
      const newUser = {
        id: meId,
        name: `${authUser.firstName || authUser.name || "User"}${authUser.lastName ? " " + authUser.lastName : ""}`,
        username: authUser.username || (authUser.email ? authUser.email.split("@")[0] : `user${Date.now()}`),
        avatarColor: "#8b5cf6",
        email: authUser.email || "",
      };
      users.unshift(newUser);
      LS.set("sf_users", users);
    }
    // also set current user pointer for prototype usage
    LS.set("sf_currentUser", canonicalIdFromAuth);
  }, []); // run once on mount

  // fallback me from sf_currentUser or canonicalIdFromAuth or demo default
  const loggedInUserFromAuth = canonicalIdFromAuth || LS.get("sf_currentUser") || "u_you";

  // state
  const [me, setMe] = useState(loggedInUserFromAuth);
  const [users, setUsers] = useState(LS.get("sf_users", []));
  const [posts, setPosts] = useState(LS.get("sf_posts", []));
  const [stories, setStories] = useState(LS.get("sf_stories", []));
  const [follows, setFollows] = useState(LS.get("sf_follows", {}));
  const [dms, setDms] = useState(LS.get("sf_dms", {}));
  const [notifications, setNotifications] = useState(LS.get("sf_notifications", []));
  const [bookmarks, setBookmarks] = useState(LS.get("sf_bookmarks", {}));

  // UI states
  const [view, setView] = useState("feed"); // feed / explore / dm / profile / map
  const [creating, setCreating] = useState(false);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postLocation, setPostLocation] = useState("");
  const fileInputRef = useRef(null);
  const storyFileRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [dmPeer, setDmPeer] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // emoji set
  const defaultEmojiSet = ["👍", "❤️", "😂", "😮", "😢", "🚦"];

  // keep local copies in sync
  useEffect(() => LS.set("sf_users", users), [users]);
  useEffect(() => LS.set("sf_posts", posts), [posts]);
  useEffect(() => LS.set("sf_stories", stories), [stories]);
  useEffect(() => LS.set("sf_follows", follows), [follows]);
  useEffect(() => LS.set("sf_dms", dms), [dms]);
  useEffect(() => LS.set("sf_notifications", notifications), [notifications]);
  useEffect(() => LS.set("sf_bookmarks", bookmarks), [bookmarks]);

  // Auto-expire stories older than expiry
  useEffect(() => {
    const tick = () => {
      setStories((prev) => prev.filter((s) => !s.expiresAt || new Date(s.expiresAt) > new Date()));
    };
    const interval = setInterval(tick, 60 * 1000);
    tick();
    return () => clearInterval(interval);
  }, []);

  // Try to fetch posts optionally
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/posts");
        if (mounted && Array.isArray(res.data)) setPosts(res.data);
      } catch {
        /* ignore - offline/proto mode */
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ---------------------------
     Helpers & small utils
     --------------------------- */
  const getUser = (id) => users.find((u) => u.id === id) || users[0] || { id: "u_unknown", name: "Unknown", username: "unknown", avatarColor: "#999" };
  const explorePosts = posts.filter(
    (p) =>
      (p.text || "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (getUser(p.userId).name || "").toLowerCase().includes(searchQ.toLowerCase())
  );
  const setStatus = (s) => {
    setStatusMsg(s);
    if (s) setTimeout(() => setStatusMsg(""), 3000);
  };

  /* ---------------------------
     Notifications
     --------------------------- */
  function pushNotification(text) {
    const n = { id: uid("n_"), text, time: new Date().toISOString(), read: false };
    setNotifications((prev) => [n, ...prev].slice(0, 200));
  }
  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  function clearNotifications() {
    setNotifications([]);
  }

  /* ---------------------------
     Post actions
     --------------------------- */
  const createPost = async () => {
    if (!postText.trim() && !postImage) {
      setStatus("Please provide text or an image.");
      return;
    }
    const newPost = {
      id: uid("p_"),
      userId: me,
      text: postText.trim(),
      image: postImage,
      createdAt: new Date().toISOString(),
      likes: 0,
      reactions: {},
      comments: [],
      location: postLocation,
      bookmarkedBy: [],
    };
    setPosts((p) => [newPost, ...p]);
    setPostText("");
    setPostImage(null);
    setPostLocation("");
    setCreating(false);
    pushNotification(`You created a post: "${newPost.text.slice(0, 60)}"`);
    try {
      await axios.post("/api/posts", newPost);
    } catch {}
  };

  const addReaction = (postId, emoji) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const next = { ...p, reactions: { ...(p.reactions || {}) } };
        next.reactions[emoji] = (next.reactions[emoji] || 0) + 1;
        return next;
      })
    );
    pushNotification(`Reacted ${emoji}`);
  };

  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likedKey = `liked_by_${me}`;
        const liked = p[likedKey];
        const copy = { ...p };
        copy.likes = liked ? Math.max(0, (copy.likes || 0) - 1) : (copy.likes || 0) + 1;
        copy[likedKey] = !liked;
        return copy;
      })
    );
  };

  const addComment = (postId, text) => {
    if (!text.trim()) return;
    const comment = { id: uid("c_"), userId: me, text: text.trim(), createdAt: new Date().toISOString() };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [comment, ...(p.comments || [])] } : p)));
    pushNotification("Comment added");
  };

  const toggleBookmark = (postId) => {
    setBookmarks((prev) => {
      const n = { ...prev };
      n[postId] = !n[postId];
      return n;
    });
  };

  /* ---------------------------
     Story actions
     --------------------------- */
  const createStory = (fileData) => {
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const s = { id: uid("s_"), userId: me, image: fileData, createdAt: new Date().toISOString(), expiresAt: expires };
    setStories((prev) => [s, ...prev]);
    pushNotification("Story posted");
  };

  /* ---------------------------
     Follow toggle
     --------------------------- */
  const followToggle = (userId) => {
    setFollows((prev) => {
      const copy = { ...prev };
      copy[me] = copy[me] || [];
      if (copy[me].includes(userId)) copy[me] = copy[me].filter((x) => x !== userId);
      else copy[me].push(userId);
      return copy;
    });
  };

  /* ---------------------------
     DM actions
     --------------------------- */
  const sendDM = (peerId, text, ephemeral = false) => {
    if (!text.trim()) return;
    const key = [me, peerId].sort().join(":");
    const thread = dms[key] ? [...dms[key]] : [];
    const msg = { id: uid("m_"), from: me, to: peerId, text: text.trim(), createdAt: new Date().toISOString(), ephemeral };
    setDms({ ...dms, [key]: [...thread, msg] });
    pushNotification(`DM to ${getUser(peerId).name}`);
  };

  /* ---------------------------
     File handlers for image upload
     --------------------------- */
  const handlePostFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPostImage(r.result);
    r.readAsDataURL(f);
  };

  const handleStoryFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => createStory(r.result);
    r.readAsDataURL(f);
  };

  /* ---------------------------
     Small UI subcomponents
     --------------------------- */
  function PostCard({ p }) {
    const totalReactions = Object.values(p.reactions || {}).reduce((a, b) => a + b, 0);
    const liked = p[`liked_by_${me}`];
    return (
      <div style={styles.postCard}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar userId={p.userId} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{getUser(p.userId).name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{p.location ? `${p.location} • ` : ""}{timeAgo(p.createdAt)}</div>
              </div>
              <div>
                <button onClick={() => toggleBookmark(p.id)} style={styles.iconBtn}>{bookmarks[p.id] ? "🔖" : "📑"}</button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>{p.text}</div>
            {p.image && <img src={p.image} alt="post" style={{ marginTop: 8, maxWidth: "100%", borderRadius: 12 }} />}

            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              {defaultEmojiSet.map((e) => (
                <button key={e} onClick={() => addReaction(p.id, e)} style={styles.reactBtn}>
                  {e} {(p.reactions && p.reactions[e]) ? p.reactions[e] : ""}
                </button>
              ))}
              <button onClick={() => setSelectedPost(p)} style={styles.commentBtn}>💬 {p.comments?.length || 0}</button>
              <button onClick={() => toggleLike(p.id)} style={{ marginLeft: "auto", ...styles.likeBtn }}>
                {liked ? "Unlike" : "Like"} ({p.likes || 0})
              </button>
            </div>

            {p.comments && p.comments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {p.comments.slice(0, 2).map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6 }}>
                    <div style={{ width: 32 }}><Avatar userId={c.userId} size={32} /></div>
                    <div style={{ background: "#f2f2f2", padding: 8, borderRadius: 8, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{getUser(c.userId).name} <span style={{ fontWeight: 400, color: "#666", fontSize: 12 }}>• {timeAgo(c.createdAt)}</span></div>
                      <div style={{ marginTop: 4 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
                {p.comments.length > 2 && <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>View more comments...</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function StoryBar() {
    const visible = stories.filter((s) => !s.expiresAt || new Date(s.expiresAt) > new Date());
    return (
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "8px 0" }}>
        {visible.map((s) => (
          <div key={s.id} style={{ textAlign: "center", cursor: "pointer" }}>
            <div onClick={() => setSelectedStory(s)} style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden", border: "3px solid #f59e0b" }}>
              {s.image ? <img src={s.image} alt="story" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Avatar userId={s.userId} size={72} />}
            </div>
            <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>{getUser(s.userId).name.split(" ")[0]}</div>
          </div>
        ))}
        <div style={{ textAlign: "center", width: 72 }}>
          <div onClick={() => storyFileRef.current.click()} style={{ width: 72, height: 72, borderRadius: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#111", color: "#fff", cursor: "pointer" }}>+</div>
          <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Your Story</div>
        </div>
      </div>
    );
  }

  function DMThread({ meId, peerId, thread }) {
    const [text, setText] = useState("");
    const [ephemeral, setEphemeral] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        const key = [meId, peerId].sort().join(":");
        const th = (dms[key] || []).filter((m) => !(m.ephemeral && Date.now() - new Date(m.createdAt).getTime() > 1000 * 60 * 5));
        if (JSON.stringify(th) !== JSON.stringify(dms[key] || [])) setDms((prev) => ({ ...prev, [key]: th }));
      }, 60 * 1000);
      return () => clearInterval(interval);
    }, [dms, meId, peerId]);

    return (
      <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <h4>{peerId ? getUser(peerId).name : "Chat"}</h4>
        <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {thread.map((m) => (
            <div key={m.id} style={{ alignSelf: m.from === meId ? "flex-end" : "flex-start", background: m.from === meId ? "#dbeafe" : "#f3f4f6", padding: 8, borderRadius: 8, maxWidth: "80%" }}>
              <div style={{ fontSize: 13 }}>{m.text}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{timeAgo(m.createdAt)} {m.ephemeral && "• (ephemeral)"}</div>
            </div>
          ))}
          {thread.length === 0 && <div style={{ color: "#666" }}>No messages</div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
          <button onClick={() => { sendDM(peerId, text, ephemeral); setText(""); }} style={{ padding: "8px 12px", borderRadius: 6, background: "#3b82f6", color: "#fff" }}>Send</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={ephemeral} onChange={(e) => setEphemeral(e.target.checked)} /> Ephemeral (disappears)
        </label>
      </div>
    );
  }

  function CommentComposer({ onSend }) {
    const [v, setV] = useState("");
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
        <button onClick={() => { onSend(v); setV(""); }} style={{ padding: "8px 10px", borderRadius: 8, background: "#3b82f6", color: "#fff" }}>Post</button>
      </div>
    );
  }

  /* ---------------------------
     Render
     --------------------------- */
  return (
    <div style={styles.page}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>TrafficSocial</h2>
          <input placeholder="Search people & posts..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={styles.search} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => { setView("feed"); setCreating(false); }} style={styles.topBtn}>Feed</button>
          <button onClick={() => setView("explore")} style={styles.topBtn}>Explore</button>
          <button onClick={() => setView("dm")} style={styles.topBtn}>DMs</button>
          <button onClick={() => setView("profile")} style={styles.topBtn}>Profile</button>
          <button onClick={() => setView("map")} style={styles.topBtn}>SnapMap</button>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotifications((s) => !s)} style={{ ...styles.topBtn, position: "relative" }}>
              🔔
              {notifications.filter((n) => !n.read).length > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 12 }}>
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: "absolute", right: 0, top: 40, width: 320, zIndex: 30 }}>
                  <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                    <div style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>Notifications</strong>
                      <div>
                        <button onClick={markAllNotificationsRead} style={{ marginRight: 8 }}>Mark read</button>
                        <button onClick={clearNotifications}>Clear</button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      {notifications.length === 0 && <div style={{ padding: 12, color: "#666" }}>No notifications</div>}
                      {notifications.map((n) => (
                        <div key={n.id} style={{ padding: 8, borderTop: "1px solid #eee", background: n.read ? "#fff" : "#f8fafc" }}>
                          <div style={{ fontSize: 13 }}>{n.text}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{timeAgo(n.time)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => { setCreating(true); setView("feed"); }} style={styles.cta}>Create</button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          {/* Stories */}
          <StoryBar />

          {/* Create area */}
          {creating && (
            <div style={styles.createCard}>
              <h3>New Post</h3>
              <textarea placeholder="Say something..." value={postText} onChange={(e) => setPostText(e.target.value)} style={styles.textarea} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePostFile} />
                <input placeholder="Location (optional)" value={postLocation} onChange={(e) => setPostLocation(e.target.value)} style={styles.input} />
                <button onClick={() => fileInputRef.current.click()} style={styles.buttonAlt}>Upload</button>
                <button onClick={createPost} style={styles.button}>Post</button>
                <button onClick={() => { setCreating(false); setPostImage(null); setPostText(""); }} style={styles.buttonCancel}>Cancel</button>
              </div>
              {postImage && <img src={postImage} alt="preview" style={{ marginTop: 8, maxWidth: 280, borderRadius: 8 }} />}
            </div>
          )}

          {/* Views */}
          {view === "feed" && (
            <>
              {posts.map((p) => <PostCard key={p.id} p={p} />)}
              {posts.length === 0 && <div style={{ padding: 20, textAlign: "center" }}>No posts yet.</div>}
            </>
          )}

          {view === "explore" && (
            <div>
              <h3>Explore</h3>
              <div style={styles.exploreGrid}>
                {explorePosts.map((p) => (
                  <div key={p.id} style={styles.exploreCard}>
                    {p.image ? <img src={p.image} alt="explore" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ padding: 12 }}>{p.text.slice(0, 80)}</div>}
                    <div style={{ position: "absolute", bottom: 8, left: 8, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>{getUser(p.userId).username}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "dm" && (
            <div>
              <h3>Direct Messages</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 220, background: "#fff", padding: 8, borderRadius: 8 }}>
                  <h4>Conversations</h4>
                  {Object.keys(dms).length === 0 && <div>No conversations</div>}
                  {Object.keys(dms).map((k) => {
                    const parts = k.split(":");
                    const peer = parts.find((x) => x !== me);
                    const thread = dms[k] || [];
                    const last = thread[thread.length - 1];
                    return (
                      <div key={k} onClick={() => setDmPeer(peer)} style={{ padding: 8, borderRadius: 6, cursor: "pointer", background: peer === dmPeer ? "#eef" : "transparent" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Avatar userId={peer} size={36} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{getUser(peer).name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{last ? last.text.slice(0, 30) : "No messages"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ flex: 1 }}>
                  {!dmPeer ? <div>Select a conversation</div> : <DMThread meId={me} peerId={dmPeer} thread={dms[[me, dmPeer].sort().join(":")] || []} />}
                </div>
              </div>
            </div>
          )}

          {view === "profile" && (
            <div>
              <h3>Your Profile</h3>
              <div style={styles.profileCard}>
                <Avatar userId={me} size={80} />
                <div style={{ marginLeft: 16 }}>
                  <h3>{getUser(me).name}</h3>
                  <div style={{ color: "#666" }}>@{getUser(me).username}</div>
                  <div style={{ marginTop: 8 }}><strong>Following:</strong> {(follows[me] || []).length}</div>
                </div>
              </div>
            </div>
          )}

          {view === "map" && (
            <div>
              <h3>SnapMap (coming soon)</h3>
              <div style={{ padding: 16, background: "#fff", borderRadius: 12 }}>
                <p>This feature (SnapMap) will display live traffic layers, recommended routes and emergency overlays.</p>
                <p style={{ fontStyle: "italic" }}>Placeholder map & small simulation below:</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {["R1", "R2", "R3", "R4"].map((r, i) => (
                    <div key={r} style={{ padding: 12, borderRadius: 8, background: ["#d1fae5", "#fef3c7", "#fee2e2", "#e0f2fe"][i % 4] }}>
                      <strong>{r}</strong>
                      <div style={{ marginTop: 8 }}>Congestion: {Math.floor(20 + Math.random() * 80)}%</div>
                      <div style={{ marginTop: 6 }}>Suggested: {Math.random() > 0.6 ? "Alternate route" : "Clear"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ width: 320 }}>
          <div style={styles.sideCard}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
            <div style={{ marginTop: 8 }}>
              {notifications.map((n) => <div key={n.id} style={{ padding: 8, borderBottom: "1px solid #eee", background: n.read ? "#fff" : "#f8fafc" }}><div style={{ fontSize: 13 }}>{n.text}</div><div style={{ fontSize: 11, color: "#888" }}>{timeAgo(n.time)}</div></div>)}
              {notifications.length === 0 && <div style={{ color: "#666", padding: 8 }}>No notifications</div>}
            </div>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ margin: 0 }}>People you may know</h4>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {users.filter((u) => u.id !== me).map((u) => (
                <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Avatar userId={u.id} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>@{u.username}</div>
                  </div>
                  <button onClick={() => followToggle(u.id)} style={styles.btnSmall}>{(follows[me] || []).includes(u.id) ? "Unfollow" : "Follow"}</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ margin: 0 }}>Bookmarks</h4>
            <div style={{ marginTop: 8 }}>
              {Object.keys(bookmarks).filter((k) => bookmarks[k]).length === 0 && <div style={{ color: "#666" }}>No saved posts</div>}
              {Object.keys(bookmarks).filter((k) => bookmarks[k]).slice(0, 4).map((k) => {
                const p = posts.find((x) => x.id === k);
                if (!p) return null;
                return (
                  <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <Avatar userId={p.userId} size={36} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{getUser(p.userId).name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{p.text.slice(0, 40)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Post modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalBackdrop} onClick={() => setSelectedPost(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h4>Comments</h4>
              <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 8 }}>
                {selectedPost.comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <Avatar userId={c.userId} size={36} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{getUser(c.userId).name} <span style={{ fontWeight: 400, color: "#666", fontSize: 12 }}>• {timeAgo(c.createdAt)}</span></div>
                      <div style={{ marginTop: 4 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
                {selectedPost.comments.length === 0 && <div style={{ color: "#666" }}>No comments yet</div>}
              </div>
              <CommentComposer onSend={(text) => { addComment(selectedPost.id, text); setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, comments: [{ id: uid("c_"), userId: me, text, createdAt: new Date().toISOString() }, ...p.comments] } : p)); }} />
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button onClick={() => setSelectedPost(null)} style={styles.buttonAlt}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected story viewer */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalBackdrop} onClick={() => setSelectedStory(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ ...styles.modal, width: 600 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar userId={selectedStory.userId} size={56} />
                <div>
                  <div style={{ fontWeight: 700 }}>{getUser(selectedStory.userId).name}</div>
                  <div style={{ color: "#666", fontSize: 12 }}>{timeAgo(selectedStory.createdAt)}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                {selectedStory.image ? <img src={selectedStory.image} alt="story" style={{ width: "100%", borderRadius: 12 }} /> : <div style={{ padding: 40, background: "#fafafa", borderRadius: 8 }}>Empty story</div>}
              </div>
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button onClick={() => setSelectedStory(null)} style={styles.buttonAlt}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden inputs */}
      <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handlePostFile} />
      <input type="file" accept="image/*" style={{ display: "none" }} ref={storyFileRef} onChange={handleStoryFile} />

      {/* Small inline status */}
      {statusMsg && <div style={styles.inlineStatus}>{statusMsg}</div>}
    </div>
  );
}

/* ---------------------------
   Styles
   --------------------------- */
const styles = {
  page: { padding: 16, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", background: "#f7fafc", minHeight: "100vh" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" },
  search: { padding: 8, borderRadius: 8, border: "1px solid #ddd", minWidth: 240 },
  topBtn: { padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #eee", cursor: "pointer" },
  cta: { padding: "8px 14px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 },
  body: { display: "flex", gap: 16, alignItems: "flex-start" },
  postCard: { background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.06)", marginBottom: 12 },
  reactBtn: { border: "none", background: "#f3f4f6", padding: "6px 8px", borderRadius: 8, cursor: "pointer" },
  commentBtn: { border: "none", background: "#eef2ff", padding: "6px 8px", borderRadius: 8, cursor: "pointer" },
  likeBtn: { padding: "6px 8px", borderRadius: 8, border: "none", background: "#f87171", color: "#fff", cursor: "pointer" },
  createCard: { background: "#fff", padding: 12, borderRadius: 12, marginBottom: 12 },
  textarea: { width: "100%", minHeight: 80, padding: 8, borderRadius: 8, border: "1px solid #eee" },
  input: { padding: 8, borderRadius: 8, border: "1px solid #eee", flex: 1 },
  button: { padding: "8px 12px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", cursor: "pointer" },
  buttonAlt: { padding: "8px 12px", borderRadius: 8, background: "#e2e8f0", border: "none", cursor: "pointer" },
  buttonCancel: { padding: "8px 12px", borderRadius: 8, background: "#f87171", color: "#fff", border: "none" },
  exploreGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  exploreCard: { position: "relative", width: "100%", height: 160, borderRadius: 12, overflow: "hidden", background: "#e6eef8" },
  sideCard: { background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)", marginBottom: 12 },
  btnSmall: { padding: "6px 8px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer" },
  profileCard: { display: "flex", alignItems: "center", gap: 12, background: "#fff", padding: 12, borderRadius: 12 },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: 16, borderRadius: 12, width: 520, maxWidth: "95%" },
  iconBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 18 },
  inlineStatus: { position: "fixed", right: 20, bottom: 20, background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8, boxShadow: "0 6px 14px rgba(0,0,0,0.3)" },
};
