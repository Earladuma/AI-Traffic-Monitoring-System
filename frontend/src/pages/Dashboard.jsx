// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/**
 * Platinum Dashboard.jsx
 * - All-in-one upgraded data dashboard built to match the Landing theme.
 * - Many subsystems: parsing, visualizations, map, predictions, social, games, marketplace, assistant.
 *
 * NOTE: This file is intentionally large and feature-rich. It's designed to run client-only,
 * use localStorage for persistence (only saved when user logged in).
 */

/* ----------------- Utilities ----------------- */
const uid = (p = "") => `${p}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const isNumeric = (v) => typeof v === "number" || (!isNaN(Number(v)) && v !== "" && v !== null);
const tryParseDate = (v) => {
  if (!v && v !== 0) return null;
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  const n = Number(v);
  if (!isNaN(n) && n > 1e9) return new Date(n);
  return null;
};

/* ----------------- Persistent helpers (only save when logged in) ----------------- */
const getLS = (k, fallback = null) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const setLS = (k, v, loggedIn) => {
  if (!loggedIn) return; // do not persist if not logged in
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

/* ----------------- Simple Predictor ----------------- heuristic */
function simplePredictor(groups, numericKey) {
  const avgs = groups.map((g) => g.avg).filter((v) => typeof v === "number");
  if (avgs.length === 0) return groups.map((g) => ({ ...g, prediction: "Unknown" }));
  const sorted = [...avgs].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return groups.map((g) => {
    let pred = "Moderate";
    if (typeof g.avg !== "number") pred = "NoData";
    else if (g.avg >= q3) pred = "Heavy";
    else if (g.avg <= q1) pred = "Light";
    return { ...g, prediction: pred };
  });
}

/* ----------------- Subcomponents ----------------- */

/* Header with user profile and quick actions */
function Header({ user, loggedIn, onLogout, onOpenAssistant }) {
  return (
    <header style={styles.header}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={styles.brand}>AI Traffic — Platinum Dashboard</div>
        <div style={styles.badgeArea}>
          <span style={styles.smallBadge}>Theme A</span>
          <span style={{ ...styles.smallBadge, background: "#06b6d4" }}>BG A</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {loggedIn ? (
          <>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800 }}>{user.firstName || user.name || "User"}</div>
              <div style={{ fontSize: 12, color: "#dbeafe" }}>{user.role === "admin" ? "Administrator" : "Member"}</div>
            </div>
            <div style={styles.profileCircle}>
              {user.role === "admin" ? "👑" : "🙂"}
            </div>
            <button onClick={onOpenAssistant} style={styles.btnLight}>Assistant</button>
            <button onClick={onLogout} style={styles.btnPrimary}>Logout</button>
          </>
        ) : (
          <>
            <div style={{ color: "#fff", fontSize: 13 }}>Guest Mode — limited persistence</div>
            <button onClick={() => (location.href = "/login")} style={styles.btnPrimary}>Login</button>
            <button onClick={() => (location.href = "/register")} style={styles.btnGhost}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}

/* File uploader + auto-detection */
function FileUploader({ onParsed, setNotifications, loggedIn }) {
  const inputRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [lastFileName, setLastFileName] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    setLastFileName(file.name);
    setParsing(true);
    setNotifications((n) => [`Parsing ${file.name}...`, ...n].slice(0, 6));
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      complete: (res) => {
        setParsing(false);
        setNotifications((n) => [`Parsed ${res.data.length} rows`, ...n].slice(0, 6));
        onParsed(res.data, res.meta.fields || []);
        // optionally store file info if logged in
        setLS("lastParsedFileName", file.name, loggedIn);
      },
      error: (err) => {
        setParsing(false);
        setNotifications((n) => [`Parse error: ${err.message}`, ...n].slice(0, 6));
      },
    });
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Upload dataset (CSV)</h3>
      <p style={styles.muted}>Drop or choose a CSV/TSV file. We auto-detect time, route, numeric and geo columns.</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files[0])} />
        <button onClick={() => inputRef.current && inputRef.current.click()} style={{ ...styles.btn, ...styles.btnPrimary }}>
          Choose file
        </button>
        <button onClick={() => { setLastFileName(""); setNotifications((n) => ["Cleared file", ...n].slice(0, 6)); onParsed([], []); }} style={{ ...styles.btn, ...styles.btnGhost }}>
          Clear
        </button>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#475569" }}>{parsing ? "Parsing..." : lastFileName}</div>
      </div>
    </div>
  );
}

/* Data summary & column selectors */
function DataInspector({
  rows,
  columns,
  onSelect,
  selected,
  numericCols,
  timeCols,
  geoCols,
  loggedIn,
}) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Data Inspector</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={styles.selector}>
          <label style={styles.label}>Route / Group</label>
          <select value={selected.routeCol || ""} onChange={(e) => onSelect("routeCol", e.target.value)} style={styles.select}>
            <option value="">-- none --</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.selector}>
          <label style={styles.label}>Time / Date</label>
          <select value={selected.timeCol || ""} onChange={(e) => onSelect("timeCol", e.target.value)} style={styles.select}>
            <option value="">-- none --</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.selector}>
          <label style={styles.label}>Value (numeric)</label>
          <select value={selected.valueCol || ""} onChange={(e) => onSelect("valueCol", e.target.value)} style={styles.select}>
            <option value="">-- none --</option>
            {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.selector}>
          <label style={styles.label}>Latitude</label>
          <select value={selected.latCol || ""} onChange={(e) => onSelect("latCol", e.target.value)} style={styles.select}>
            <option value="">-- none --</option>
            {geoCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.selector}>
          <label style={styles.label}>Longitude</label>
          <select value={selected.lngCol || ""} onChange={(e) => onSelect("lngCol", e.target.value)} style={styles.select}>
            <option value="">-- none --</option>
            {geoCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Rows:</strong> {rows.length} • <strong>Columns:</strong> {columns.length} • <strong>Mode:</strong> {loggedIn ? "Saved" : "Transient (login required to persist)"}
      </div>
    </div>
  );
}

/* Charts area (line, bar, pie) */
function ChartsArea({ series, topRoutes, predictionGroups }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Time vs Value (line)</h3>
        {(!series || series.length === 0) ? <div style={styles.muted}>No time-series data available.</div> :
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={series}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        }
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Top Routes (bar)</h3>
          {(!topRoutes || topRoutes.length === 0) ? <div style={styles.muted}>No route aggregates.</div> :
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topRoutes}>
                  <XAxis dataKey="route" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Prediction Distribution</h3>
          {(!predictionGroups || predictionGroups.length === 0) ? <div style={styles.muted}>No predictions.</div> :
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={predictionGroups} dataKey="count" nameKey="name" innerRadius={40} outerRadius={80} label>
                    {predictionGroups.map((entry, idx) => <Cell key={idx} fill={["#10b981", "#f59e0b", "#ef4444", "#60a5fa"][idx % 4]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

/* Map viewer showing dataset markers and simulated routes */
function MapView({ rows, latCol, lngCol, routeCol, valueCol }) {
  const hasGeo = latCol && lngCol && rows.some((r) => isNumeric(r[latCol]) && isNumeric(r[lngCol]));
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Map & Route Planner</h3>
      <div style={{ height: 360, borderRadius: 12, overflow: "hidden" }}>
        <MapContainer center={[0.3476, 32.5825]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {hasGeo ? rows.slice(0, 300).map((r, i) => {
            const lat = Number(r[latCol]);
            const lng = Number(r[lngCol]);
            if (!isFinite(lat) || !isFinite(lng)) return null;
            return (
              <Marker key={i} position={[lat, lng]}>
                <Popup>
                  <div style={{ maxWidth: 220 }}>
                    <div><strong>{routeCol ? r[routeCol] : "Point"}</strong></div>
                    {valueCol && <div>{valueCol}: {String(r[valueCol]).slice(0, 80)}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          }) : (
            // fallback demo markers
            <>
              <Marker position={[0.3476, 32.5825]}><Popup>Central Hub</Popup></Marker>
              <Marker position={[0.3526, 32.585]}><Popup>Example node A</Popup></Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

/* Predictions panel explaining results and recommending best routes */
function PredictionsPanel({ predictions, topRoutes, loggedIn }) {
  // summarize counts
  const counts = predictions.reduce((acc, p) => { acc[p.prediction] = (acc[p.prediction] || 0) + 1; return acc; }, {});
  // recommended routes: pick routes predicted Light or moderate and with low avg
  const recommended = (topRoutes || []).slice(-3).map(r => r.route).slice(0,3);
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Predictions & Recommendations</h3>
      {predictions.length === 0 ? (
        <div style={styles.muted}>No predictions yet. Upload and choose columns to run model.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <div style={styles.predictBadge}><div style={{ fontSize: 18, fontWeight: 800 }}>{counts["Heavy"] || 0}</div><div style={{ fontSize: 12 }}>Heavy</div></div>
            <div style={styles.predictBadge}><div style={{ fontSize: 18, fontWeight: 800 }}>{counts["Moderate"] || 0}</div><div style={{ fontSize: 12 }}>Moderate</div></div>
            <div style={styles.predictBadge}><div style={{ fontSize: 18, fontWeight: 800 }}>{counts["Light"] || 0}</div><div style={{ fontSize: 12 }}>Light</div></div>
          </div>

          <div>
            <strong>Recommended (simulated)</strong>
            <ol>
              {recommended.map((r, i) => <li key={i}>{r} — low congestion candidate</li>)}
              {recommended.length === 0 && <li>No recommendation yet.</li>}
            </ol>
            <div style={{ fontStyle: "italic", color: "#475569" }}>Note: Predictions are heuristic and more accurate when logged in and dataset is richer.</div>
          </div>

          {!loggedIn && <div style={{ marginTop: 8, color: "#ef4444", fontWeight: 700 }}>Log in to save predictions & get premium model explanations.</div>}
        </>
      )}
    </div>
  );
}

/* Social feed (simple localStorage-backed) */
function SocialFeed({ loggedIn, onInjectReport }) {
  const [posts, setPosts] = useState(() => getLS("sf_posts", [
    { id: uid("p_"), user: "System", text: "Welcome to TrafficSocial integrated feed!", createdAt: now(), likes: 2, comments: [] },
  ]) || []);
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // persist only if loggedIn
    setLS("sf_posts", posts, loggedIn);
  }, [posts, loggedIn]);

  // auto-add incident posts when an incident is reported in the app
  useEffect(() => {
    const handler = (e) => {
      try {
        const r = JSON.parse(e.detail);
        if (r && r.title) {
          const p = { id: uid("p_"), user: "Reporter", text: `${r.title} — ${r.location || "Unknown"} — ${r.description || r.message}`, createdAt: now(), likes: 0, comments: [] };
          setPosts((pS) => [p, ...pS]);
        }
      } catch {}
    };
    window.addEventListener("app:newReport", handler);
    return () => window.removeEventListener("app:newReport", handler);
  }, []);

  const createPost = () => {
    if (!text.trim()) return;
    const p = { id: uid("p_"), user: "You", text: text.trim(), createdAt: now(), likes: 0, comments: [] };
    setPosts((prev) => [p, ...prev]);
    setText("");
    setCreating(false);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Social Feed</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share an update..." style={{ flex: 1, padding: 8, borderRadius: 8 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={createPost} style={{ ...styles.btn, ...styles.btnPrimary }}>Post</button>
          <button onClick={() => setCreating((c) => !c)} style={{ ...styles.btn, ...styles.btnGhost }}>{creating ? "Cancel" : "New"}</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {posts.map((p) => (
          <div key={p.id} style={{ padding: 10, borderRadius: 8, marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{p.user}</strong>
              <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ marginTop: 8 }}>{p.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Marketplace mock with cart */
function Marketplace({ loggedIn }) {
  const [items] = useState([
    { id: "m1", title: "Reflective Safety Vest", price: 12.99 },
    { id: "m2", title: "Portable Tire Inflator", price: 29.99 },
    { id: "m3", title: "Emergency Triangle Kit", price: 9.99 },
  ]);
  const [cart, setCart] = useState([]);
  useEffect(() => setLS("market_cart", cart, loggedIn), [cart, loggedIn]);
  const add = (it) => setCart((c) => [...c, it]);
  const remove = (i) => setCart((c) => c.filter((_, idx) => idx !== i));
  const total = cart.reduce((s, it) => s + it.price, 0).toFixed(2);
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Marketplace</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
        <div>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8 }}>
              <div><strong>{it.title}</strong><div style={{ fontSize: 12, color: "#64748b" }}>${it.price}</div></div>
              <div><button onClick={() => add(it)} style={styles.btnSmall}>Add</button></div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>Cart</div>
          {cart.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div>{c.title}</div>
              <div><button onClick={() => remove(i)} style={styles.btnTiny}>✕</button></div>
            </div>
          ))}
          <div style={{ marginTop: 10, fontWeight: 800 }}>Total: ${total}</div>
          <button onClick={() => alert("Mock checkout — integrate payment provider for production")} style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 8 }}>Checkout</button>
        </div>
      </div>
    </div>
  );
}

/* Simple Assistant (rule-based) */
function Assistant({ open, onClose, onQuery }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState([]);
  useEffect(() => { if (!open) { setLog([]); setQ(""); } }, [open]);
  const ask = () => {
    if (!q.trim()) return;
    // very small rule-based responses
    let ans = "I did not understand. Try: 'predict', 'routes', 'help', 'trivia score'.";
    const txt = q.toLowerCase();
    if (txt.includes("predict")) ans = "Upload data and choose route & value columns to run predictions. Click 'Run Predict'.";
    else if (txt.includes("routes")) ans = "Recommended routes appear in Predictions panel — light routes have green labels.";
    else if (txt.includes("help")) ans = "Start with Upload → Inspect → Visualize. Use Social to post incidents.";
    else if (txt.includes("trivia")) ans = "Open the Trivia game on this page and complete levels. Scores saved when logged in.";
    setLog((l) => [...l, { q, a: ans }]);
    onQuery && onQuery(q);
    setQ("");
  };
  if (!open) return null;
  return (
    <div style={styles.assistantBackdrop} onClick={onClose}>
      <div style={styles.assistantCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>AI Assistant</h4>
          <div style={{ fontSize: 12, color: "#64748b" }}>Rule-based helper</div>
        </div>
        <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8 }}>
          {log.length === 0 ? <div style={{ color: "#64748b" }}>Ask me about predictions, routes or how to use the dashboard.</div> : log.map((it, idx) => <div key={idx} style={{ marginBottom: 8 }}><div style={{ fontWeight: 700 }}>{it.q}</div><div style={{ color: "#374151" }}>{it.a}</div></div>)}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question..." style={{ flex: 1, padding: 8, borderRadius: 8 }} />
          <button onClick={ask} style={{ ...styles.btn, ...styles.btnPrimary }}>Ask</button>
        </div>
      </div>
    </div>
  );
}

/* Trivia game with persistent score only when logged in */
function Trivia({ loggedIn }) {
  const baseQuestions = [
    { q: "What color indicates 'go' on a typical traffic light?", a: "green", difficulty: 1 },
    { q: "Approx. what percentage can lane discipline reduce congestion (number only)?", a: "30", difficulty: 1 },
    { q: "Which is typically prioritized during morning peak? (inbound/outbound)", a: "inbound", difficulty: 2 },
    { q: "True or False: Roundabouts always reduce congestion compared to signals", a: "false", difficulty: 3 },
    { q: "What unit measures traffic flow (vehicles per ...)? (answer 'hour' or 'minute')", a: "hour", difficulty: 2 },
    { q: "If average speed decreases and volume increases, congestion usually __ (increase/decrease).", a: "increase", difficulty: 2 },
    { q: "Which is a short-term traffic management tactic? (signal timing / building bridge)", a: "signal timing", difficulty: 3 },
    { q: "Best immediate response for a tire burst on highway: pull to ___ and call for help (one word)", a: "shoulder", difficulty: 2 },
    { q: "What does CCTV monitoring primarily help with? (detection/maintenance)", a: "detection", difficulty: 2 },
    { q: "What is the main benefit of real-time routing? (save time / aesthetics)", a: "save time", difficulty: 2 },
  ];

  const [questions, setQuestions] = useState(baseQuestions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(() => (loggedIn ? getLS("trivia_score", 0) : 0));
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // scale difficulty: when user finishes, increase set with harder variations
    if (completed) {
      // add more "hard" questions synthesized (simulate)
      const hard = [
        { q: "If flow (q) = k * v (density * speed) what happens when density doubles and speed halves? q __ (same/less/more)", a: "same", difficulty: 4 },
        { q: "Predictive model uses which of these for short-term forecasting? (moving-average / architecture)", a: "moving-average", difficulty: 4 },
      ];
      setQuestions((prev) => [...prev, ...hard]);
    }
  }, [completed]);

  useEffect(() => {
    if (loggedIn) setLS("trivia_score", score, true);
  }, [score, loggedIn]);

  const submit = () => {
    if (!answer) return;
    const correct = String(answer).trim().toLowerCase() === String(questions[index].a).trim().toLowerCase();
    if (correct) setScore((s) => s + (questions[index].difficulty || 1) * 2);
    setIndex((i) => {
      const next = i + 1;
      if (next >= questions.length) setCompleted(true);
      return next;
    });
    setAnswer("");
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setCompleted(false);
    setQuestions(baseQuestions);
    if (loggedIn) setLS("trivia_score", 0, true);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Trivia Challenge</h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>Score: <strong>{score}</strong></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{loggedIn ? "Progress saved" : "Login to save progress"}</div>
      </div>

      {!completed ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>{questions[index] ? questions[index].q : "No question"}</div>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer..." style={{ marginTop: 8, padding: 8, width: "100%", borderRadius: 8 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={submit} style={{ ...styles.btn, ...styles.btnPrimary }}>Submit</button>
            <button onClick={restart} style={{ ...styles.btn, ...styles.btnGhost }}>Restart</button>
          </div>
          <div style={{ marginTop: 8, color: "#64748b" }}>Question {index + 1} / {questions.length}</div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800 }}>Completed!</div>
          <div style={{ marginTop: 8 }}>Final Score: {score}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={restart} style={{ ...styles.btn, ...styles.btnPrimary }}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Simple games grid with a mini stoplight puzzle (interactive) */
function Games({ loggedIn }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Mini-Games</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12 }}>
        <div style={styles.gameCard}>
          <strong>Stoplight Puzzle</strong>
          <div style={{ marginTop: 8 }}>Switch lights to maximize flow. (interactive)</div>
          <StoplightGame />
        </div>
        <div style={styles.gameCard}>
          <strong>Route Runner</strong>
          <div style={{ marginTop: 8 }}>Choose fastest route to score points.</div>
          <button onClick={() => alert("Route Runner simulated — coming online with dataset integration")} style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 8 }}>Play</button>
        </div>
        <div style={styles.gameCard}>
          <strong>Traffic Quiz</strong>
          <div style={{ marginTop: 8 }}>Open Trivia for full challenge.</div>
          <button onClick={() => document.querySelector("#trivia-anchor")?.scrollIntoView({ behavior: "smooth" })} style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 8 }}>Open Trivia</button>
        </div>
      </div>
    </div>
  );
}

function StoplightGame() {
  const [state, setState] = useState({ north: "red", south: "green", east: "red", west: "green", score: 0 });
  const toggle = (dir) => {
    setState((s) => {
      const next = s[dir] === "green" ? "red" : "green";
      const newState = { ...s, [dir]: next };
      // scoring: every time you make opposing directions green it's bad (decrement), else increment
      const opposite = dir === "north" ? "south" : dir === "south" ? "north" : dir === "east" ? "west" : "east";
      const penalty = newState[opposite] === "green" && next === "green" ? -2 : 1;
      newState.score = Math.max(0, newState.score + penalty);
      return newState;
    });
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["north","south","east","west"].map((d) => (
          <div key={d} style={{ flex: 1, textAlign: "center", padding: 8, borderRadius: 8, background: state[d] === "green" ? "#d1fae5" : "#fee2e2", cursor: "pointer" }} onClick={() => toggle(d)}>
            <div style={{ fontWeight: 800, textTransform: "capitalize" }}>{d}</div>
            <div style={{ marginTop: 6 }}>{state[d].toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>Score: <strong>{state.score}</strong></div>
    </div>
  );
}

/* Leaderboard */
function Leaderboard({ loggedIn }) {
  const [leaders, setLeaders] = useState(() => getLS("leaders", [
    { id: "u1", name: "Alice", points: 120 },
    { id: "u2", name: "Bob", points: 100 },
    { id: "u3", name: "You", points: getLS("trivia_score", 0) || 0 },
  ], loggedIn) || []);
  useEffect(() => setLS("leaders", leaders, loggedIn), [leaders, loggedIn]);
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Leaderboard (Weekly)</h3>
      {leaders.map((l, i) => <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, background: i === 0 ? "#fefce8" : "#fff", borderRadius: 6, marginTop: 8 }}><div>{i+1}. {l.name}</div><div>{l.points} pts</div></div>)}
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Weekly winners get simulated deals & badges.</div>
    </div>
  );
}

/* Mechanic directory & nearest mechanic finder (mock) */
function Mechanics({ loggedIn }) {
  const [mechanics, setMechanics] = useState(() => getLS("mechanics", [
    { id: "m_1", name: "Joe's Auto", phone: "+1234567", location: "Central" },
    { id: "m_2", name: "QuickFix Garage", phone: "+1987654", location: "Riverside" },
    { id: "m_3", name: "Mobile Mechanics", phone: "+1029384", location: "Uptown" },
  ], loggedIn) || []);
  const [query, setQuery] = useState("");
  const find = (q) => {
    const ql = q.toLowerCase();
    return mechanics.filter((m) => (m.name + " " + m.location + " " + m.phone).toLowerCase().includes(ql));
  };
  const results = find(query);
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Mechanic Finder</h3>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter location or issue" style={styles.input} />
      <div style={{ marginTop: 8 }}>
        {results.length === 0 && <div style={styles.muted}>No mechanics found. Mechanics can register to appear here.</div>}
        {results.map((m) => <div key={m.id} style={{ padding: 8, borderRadius: 8, marginTop: 8, background: "#f8fafc" }}><div style={{ fontWeight: 800 }}>{m.name}</div><div style={{ fontSize: 12 }}>{m.location} • {m.phone}</div><div style={{ marginTop: 8 }}><button onClick={() => alert(`Calling ${m.phone} (mock)`)} style={{ ...styles.btn, ...styles.btnPrimarySmall }}>Contact</button></div></div>)}
      </div>
    </div>
  );
}

/* Walkthrough modal (short guide) */
function Walkthrough({ open, onClose }) {
  const steps = [
    "Welcome to the Platinum Dashboard! Use Upload to bring your dataset.",
    "Select route/time/value columns in Data Inspector to visualize & predict.",
    "Open Map to inspect geo-coded points and plan routes.",
    "Use Social to publish reports. Marketplace provides safety/fleet items.",
    "Play Trivia & Games to earn points and climb the leaderboard!"
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (open) setIdx(0); }, [open]);
  if (!open) return null;
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Quick Walkthrough</h3>
        <div style={{ minHeight: 80 }}>{steps[idx]}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} style={styles.smallBtn} disabled={idx === 0}>Previous</button>
          <div>
            <button onClick={() => { setIdx(i => Math.min(steps.length - 1, i + 1)); }} style={styles.smallBtn}>{idx === steps.length - 1 ? "Done" : "Next"}</button>
            <button onClick={onClose} style={{ ...styles.smallBtn, marginLeft: 8 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Main Dashboard component ----------------- */
export default function Dashboard() {
  // user & login state (no backend — localStorage.currentUser)
  const current = getLS("currentUser", null);
  // if no current, allow a "super admin code" login (for now) — we won't auto-login here.
  const [user, setUser] = useState(current || { firstName: "Guest", role: "guest" });
  const loggedIn = !!current;

  // dataset state
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [notifications, setNotifications] = useState(() => getLS("dashboard_notifications", [], loggedIn) || []);
  const [selectedCols, setSelectedCols] = useState({
    routeCol: "", timeCol: "", valueCol: "", latCol: "", lngCol: ""
  });

  // analytics
  const [statsByRoute, setStatsByRoute] = useState([]);
  const [series, setSeries] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predGroups, setPredGroups] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);

  // UI
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [walkOpen, setWalkOpen] = useState(false);
  const [reports, setReports] = useState(() => getLS("reports", [], loggedIn) || []);
  const [incForm, setIncForm] = useState({ message: "", location: "", urgent: false, title: "" });

  // read persisted leaderboard/trivia if logged in
  const [leaderboard, setLeaderboard] = useState(() => getLS("leaders", [], loggedIn) || []);

  /* --- persistence of reports & notifications when logged in --- */
  useEffect(() => { setLS("dashboard_notifications", notifications, loggedIn); }, [notifications, loggedIn]);
  useEffect(() => { setLS("reports", reports, loggedIn); }, [reports, loggedIn]);

  /* ---------- parsing callback ---------- */
  const onParsed = (data, metaFields) => {
    setRows(data || []);
    setColumns(metaFields || (data && data[0] ? Object.keys(data[0]) : []) || []);
    // try auto-detect columns heuristically
    const lower = (metaFields || []).map((c) => c.toLowerCase());
    const find = (keys) => {
      const idx = lower.findIndex((c) => keys.some((k) => c.includes(k)));
      return idx >= 0 ? metaFields[idx] : "";
    };
    setSelectedCols({
      routeCol: find(["route", "road", "segment", "link"]) || "",
      timeCol: find(["timestamp", "time", "date", "datetime"]) || "",
      valueCol: find(["congestion", "count", "flow", "speed", "vehicles"]) || "",
      latCol: find(["lat", "latitude"]) || "",
      lngCol: find(["lon", "lng", "longitude"]) || "",
    });
    setNotifications((n) => [`Loaded ${data.length} rows`, ...n].slice(0, 6));
  };

  /* ---------- data computations ---------- */
  useEffect(() => {
    // compute stats by route if route & value selected
    const { routeCol, valueCol, timeCol } = selectedCols;
    if (!rows || rows.length === 0 || !routeCol || !valueCol) {
      setStatsByRoute([]);
      setPredictions([]);
      setTopRoutes([]);
    } else {
      const byRoute = {};
      rows.forEach((r) => {
        const route = r[routeCol] ?? "Unknown";
        const v = isNumeric(r[valueCol]) ? Number(r[valueCol]) : null;
        if (!byRoute[route]) byRoute[route] = { sum: 0, count: 0 };
        if (v !== null && !Number.isNaN(v)) {
          byRoute[route].sum += v;
          byRoute[route].count += 1;
        }
      });
      const stats = Object.keys(byRoute).map((route) => {
        const { sum, count } = byRoute[route];
        return { route, avg: count > 0 ? +(sum / count).toFixed(2) : null, count };
      });
      setStatsByRoute(stats);
      // predictions heuristic
      const preds = simplePredictor(stats, valueCol);
      setPredictions(preds);
      // top routes
      const top = stats.filter(s => typeof s.avg === "number").sort((a,b)=>b.avg-a.avg).slice(0,10);
      setTopRoutes(top);
      // pred groups
      const counts = ["Heavy","Moderate","Light"].map(k => ({ name: k, count: preds.filter(p => p.prediction === k).length }));
      setPredGroups(counts);
    }

    // time series
    if (!rows || rows.length === 0 || !selectedCols.timeCol || !selectedCols.valueCol) {
      setSeries([]);
    } else {
      const byDate = {};
      rows.forEach((r) => {
        const d = tryParseDate(r[selectedCols.timeCol]);
        if (!d) return;
        const key = d.toISOString().slice(0, 16); // up to minute
        const v = isNumeric(r[selectedCols.valueCol]) ? Number(r[selectedCols.valueCol]) : null;
        if (!byDate[key]) byDate[key] = { sum: 0, count: 0 };
        if (v !== null && !Number.isNaN(v)) {
          byDate[key].sum += v;
          byDate[key].count += 1;
        }
      });
      const seriesData = Object.keys(byDate).sort().map(k => ({ date: k, value: +(byDate[k].sum / Math.max(1, byDate[k].count)).toFixed(2) }));
      setSeries(seriesData);
    }
  }, [rows, selectedCols]);

  /* ---------- report submit ---------- */
  const submitReport = (e) => {
    e && e.preventDefault();
    const r = { id: uid("r_"), title: incForm.title || "Incident", message: incForm.message, location: incForm.location, urgent: incForm.urgent, timestamp: now() };
    setReports((prev) => [r, ...prev]);
    setIncForm({ message: "", location: "", urgent: false, title: "" });
    setNotifications((n) => ["Report created", ...n].slice(0, 6));
    // also broadcast to social feed
    try {
      const ev = new CustomEvent("app:newReport", { detail: JSON.stringify(r) });
      window.dispatchEvent(ev);
    } catch {}
  };

  /* ---------- minor helpers ---------- */
  const clearData = () => { setRows([]); setColumns([]); setSelectedCols({ routeCol: "", timeCol: "", valueCol: "", latCol: "", lngCol: "" }); setNotifications((n) => ["Cleared dataset", ...n].slice(0,6)); };
  const exportJSON = () => {
    const payload = { meta: { generatedAt: now(), rows: rows.length }, statsByRoute, predictions, series };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dashboard_export.json"; a.click(); URL.revokeObjectURL(url);
  };

  /* ---------- derived lists for column detection ---------- */
  const numericCols = useMemo(() => columns.filter(c => rows.some(r => isNumeric(r[c]))), [columns, rows]);
  const timeCols = useMemo(() => columns.filter(c => rows.some(r => tryParseDate(r[c]) !== null)), [columns, rows]);
  const geoCols = useMemo(() => columns.filter(c => c.toLowerCase().includes("lat") || c.toLowerCase().includes("lon") || c.toLowerCase().includes("lng")), [columns]);

  /* ---------- effect: persist notifications & leaderboard when logged in ---------- */
  useEffect(() => { setLS("dashboard_notifications", notifications, loggedIn); }, [notifications, loggedIn]);
  useEffect(() => { setLS("leaders", leaderboard, loggedIn); }, [leaderboard, loggedIn]);

  /* ---------- admin quick login (supercode) ---------- */
  const adminSupercodeLogin = () => {
    const admin = { id: "admin_super", firstName: "Super", lastName: "Admin", role: "admin" };
    localStorage.setItem("currentUser", JSON.stringify(admin));
    setUser(admin);
    setNotifications((n) => ["Logged in as Admin", ...n].slice(0,6));
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser({ firstName: "Guest", role: "guest" });
    setNotifications((n) => ["Logged out", ...n].slice(0,6));
    // do not reload to allow navigation
  };

  /* ---------- UI state for walkthrough/assistant ---------- */
  const [assistantQueries, setAssistantQueries] = useState([]);

  return (
    <div style={styles.page}>
      <div style={styles.bg} />

      <div style={styles.container}>
        <Header user={user} loggedIn={loggedIn} onLogout={logout} onOpenAssistant={() => setAssistantOpen(true)} />

        {/* top quick actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={() => setWalkOpen(true)} style={{ ...styles.btn, ...styles.btnPrimary }}>Take Tour</button>
          <button onClick={() => exportJSON()} style={{ ...styles.btn, ...styles.btnGhost }}>Export JSON</button>
          <button onClick={() => adminSupercodeLogin()} style={{ ...styles.btn, ...styles.btnGhost }}>Admin supercode</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "#0ea5a4", color: "#fff", fontWeight: 800 }}>PLATINUM</div>
            <div style={{ alignSelf: "center", color: "#94a3b8" }}>Role: {user.role}</div>
          </div>
        </div>

        {/* main grid */}
        <main style={styles.grid}>
          <section style={styles.leftCol}>
            <FileUploader onParsed={onParsed} setNotifications={setNotifications} loggedIn={loggedIn} />

            <DataInspector
              rows={rows}
              columns={columns}
              onSelect={(k, v) => setSelectedCols((s) => ({ ...s, [k]: v }))}
              selected={selectedCols}
              numericCols={numericCols}
              timeCols={timeCols}
              geoCols={geoCols}
              loggedIn={loggedIn}
            />

            <ChartsArea series={series} topRoutes={topRoutes} predictionGroups={predGroups} />

            <MapView rows={rows} latCol={selectedCols.latCol} lngCol={selectedCols.lngCol} routeCol={selectedCols.routeCol} valueCol={selectedCols.valueCol} />

            <PredictionsPanel predictions={predictions} topRoutes={topRoutes} loggedIn={loggedIn} />

            <div id="trivia-anchor" style={{ marginTop: 12 }} />
            <Trivia loggedIn={loggedIn} />

            <Games loggedIn={loggedIn} />

            <SocialFeed loggedIn={loggedIn} onInjectReport={(r) => setReports((prev) => [r, ...prev])} />

          </section>

          <aside style={styles.rightCol}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Incident Report</h4>
                <form onSubmit={submitReport} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input value={incForm.title} onChange={(e) => setIncForm((s) => ({ ...s, title: e.target.value }))} placeholder="Short title" style={styles.input} />
                  <textarea value={incForm.message} onChange={(e) => setIncForm((s) => ({ ...s, message: e.target.value }))} placeholder="Describe the incident" style={styles.textarea} />
                  <input value={incForm.location} onChange={(e) => setIncForm((s) => ({ ...s, location: e.target.value }))} placeholder="Location (address/area)" style={styles.input} />
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={incForm.urgent} onChange={(e) => setIncForm((s) => ({ ...s, urgent: e.target.checked }))} /> Mark as urgent
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Submit</button>
                    <button type="button" onClick={() => setIncForm({ message: "", location: "", urgent: false, title: "" })} style={{ ...styles.btn, ...styles.btnGhost }}>Reset</button>
                  </div>
                </form>
              </div>

              <Marketplace loggedIn={loggedIn} />

              <Mechanics loggedIn={loggedIn} />

              <Leaderboard loggedIn={loggedIn} />

              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Notifications</h4>
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {notifications.length === 0 ? <div style={styles.muted}>No notifications</div> : notifications.map((n, i) => <div key={i} style={{ padding: 8, borderBottom: "1px solid #eef2f6" }}>{n}</div>)}
                </div>
              </div>

              <Mechanics loggedIn={loggedIn} />

            </div>
          </aside>
        </main>

        <footer style={styles.footer}>
          <div>© {new Date().getFullYear()} AI Traffic System — Platinum dashboard (demo). Login recommended for full experience.</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, justifyContent: "center" }}>
            <a href="/terms" style={styles.footerLink}>Terms</a>
            <a href="/privacy" style={styles.footerLink}>Privacy</a>
            <a href="/about" style={styles.footerLink}>About</a>
          </div>
        </footer>

      </div>

      {/* Assistant modal */}
      <Assistant open={assistantOpen} onClose={() => setAssistantOpen(false)} onQuery={(q) => setAssistantQueries((s) => [...s, q])} />

      {/* Walkthrough */}
      <Walkthrough open={walkOpen} onClose={() => setWalkOpen(false)} />
    </div>
  );
}

/* ----------------- Styles ----------------- */
const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0f172a",
    position: "relative",
  },
  bg: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, rgba(3,7,18,0.75), rgba(6,30,45,0.9)), url('https://images.unsplash.com/photo-1508051123996-69f8caf4891e?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
    filter: "saturate(0.95) contrast(1.02)",
    zIndex: -1,
  },

  container: { maxWidth: 1280, margin: "28px auto", padding: 20 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  brand: { color: "#fff", fontWeight: 900, fontSize: 20 },
  badgeArea: { display: "flex", gap: 8 },
  smallBadge: { padding: "6px 8px", background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: 8, fontSize: 12 },

  profileCircle: { width: 44, height: 44, borderRadius: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#0f172a", fontWeight: 900 },

  btn: { padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 },
  btnPrimary: { background: "#06b6d4", color: "#fff" },
  btnGhost: { background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.06)" },
  btnLight: { background: "#f8fafc", border: "none", padding: "8px 10px", borderRadius: 8 },

  grid: { display: "grid", gridTemplateColumns: "2fr 420px", gap: 20, marginTop: 18 },
  leftCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol: {},

  card: { background: "rgba(255,255,255,0.95)", padding: 16, borderRadius: 12, boxShadow: "0 12px 32px rgba(2,6,23,0.08)" },
  cardTitle: { marginTop: 0, marginBottom: 8 },

  muted: { color: "#475569", fontSize: 13 },

  selector: { minWidth: 160 },
  label: { fontSize: 12, color: "#475569", display: "block", marginBottom: 6 },
  select: { padding: 8, borderRadius: 8, border: "1px solid #e6e6e6", width: "100%" },

  input: { padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", width: "100%" },
  textarea: { padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", minHeight: 80 },

  mutedSmall: { fontSize: 12, color: "#64748b" },

  footer: { color: "#e6f1f7", marginTop: 20, textAlign: "center" },
  footerLink: { color: "#e6f1f7", textDecoration: "none", borderBottom: "1px dashed rgba(255,255,255,0.08)", paddingBottom: 2 },

  // assistant
  assistantBackdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.5)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" },
  assistantCard: { width: 520, background: "#fff", padding: 16, borderRadius: 12 },

  // modal
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center" },
  modalCard: { width: 640, background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 30px 60px rgba(2,6,23,0.3)", color: "#0f172a" },

  // small UI elements
  predictBadge: { padding: 8, borderRadius: 8, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 },

  gameCard: { background: "#f8fafc", padding: 12, borderRadius: 8, textAlign: "center" },

  btnSmall: { padding: "6px 8px", borderRadius: 8, background: "#fff", border: "1px solid #e6eef8", cursor: "pointer" },
  btnTiny: { padding: "4px 6px", borderRadius: 6, background: "#f87171", color: "#fff", border: "none" },

  // misc
  labelTiny: { fontSize: 12, color: "#64748b" },
};
