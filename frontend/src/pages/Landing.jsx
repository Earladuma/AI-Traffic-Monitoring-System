// src/pages/Landing.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

/**
 * Premium Landing page: Gold edition
 * - Futuristic neon theme (font & styling)
 * - Lane simulation (animated)
 * - Time vs traffic linechart (smooth flowing)
 * - Trivia with levels and scoring
 * - Mini-games (lightweight interactive)
 * - News ticker & feed
 * - Report incident form (localStorage)
 * - Marketplace mock & emergency services mock
 * - AI assistant bubble that expands to a panel
 *
 * Keep other pages unchanged. This file is self-contained.
 */

/* ----------------- Helpers ----------------- */
const uid = (p = "") => `${p}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const nowISO = () => new Date().toISOString();
const isLoggedIn = () => !!localStorage.getItem("currentUser");

/* ----------------- Lane Simulation ----------------- */
function LaneSimulation({ onClickBar }) {
  const [lanes, setLanes] = useState([
    { id: "R1", inbound: 55, outbound: 35 },
    { id: "R2", inbound: 42, outbound: 58 },
    { id: "R3", inbound: 70, outbound: 32 },
    { id: "R4", inbound: 22, outbound: 75 },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setLanes((prev) =>
        prev.map((r) => ({
          ...r,
          inbound: Math.max(5, Math.min(98, Math.round(r.inbound + (Math.random() * 14 - 7)))),
          outbound: Math.max(5, Math.min(98, Math.round(r.outbound + (Math.random() * 14 - 7)))),
        }))
      );
    }, 1100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gap: 10 }}>
        {lanes.map((r) => {
          const inW = `${r.inbound}%`;
          const outW = `${r.outbound}%`;
          return (
            <div key={r.id} style={styles.laneRow}>
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 800, color: "#cffafe" }}>{r.id}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.inbound}% ↗ / {r.outbound}% ↘</div>
              </div>
              <div style={{ flex: 1, position: "relative", cursor: "pointer" }} onClick={() => onClickBar && onClickBar(r)}>
                <div style={styles.track}>
                  <div style={{ ...styles.inboundBar, width: inW }} />
                  <div style={{ ...styles.outboundBar, width: outW, left: "auto", right: 0 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: "#94a3b8", fontSize: 12 }}>
                  <div>Inbound: {r.inbound}%</div>
                  <div>Outbound: {r.outbound}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------- Time vs Traffic Chart (auto-updating) ----------------- */
function TrafficLineChart() {
  // create simulated times-of-day samples and update smoothly
  const initial = useMemo(() => {
    // hours labels (e.g., 00:00 to 23:00 compressed to 8 samples: early morning, morning, noon, afternoon, evening, night)
    const hours = ["4AM", "7AM", "10AM", "1PM", "4PM", "7PM", "10PM", "1AM"];
    return hours.map((h, idx) => ({ time: h, inbound: 20 + idx * 8 + Math.random() * 10, outbound: 25 + Math.random() * 20 }));
  }, []);

  const [data, setData] = useState(initial);

  useEffect(() => {
    // animate by shifting and morphing values
    const iv = setInterval(() => {
      setData((prev) => {
        const next = prev.map((p, i) => {
          // gently move values toward a new random target for smooth animation
          const shift = (Math.random() * 6 - 3);
          return {
            ...p,
            inbound: Math.max(5, Math.min(120, Math.round(p.inbound + shift))),
            outbound: Math.max(5, Math.min(120, Math.round(p.outbound + (Math.random() * 6 - 3)))),
          };
        });
        return next;
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#0f172a10" />
          <XAxis dataKey="time" tick={{ fill: "#cbd5e1" }} />
          <YAxis tick={{ fill: "#cbd5e1" }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="inbound" stroke="#06b6d4" strokeWidth={3} dot={false} animationDuration={800} />
          <Line type="monotone" dataKey="outbound" stroke="#f97316" strokeWidth={3} dot={false} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----------------- Trivia (progressive questions) ----------------- */
const TRIVIA_SETS = [
  {
    level: 1,
    title: "Basics",
    questions: [
      { q: "Which color on the traffic light allows vehicles to go?", a: "green" },
      { q: "What should you do at a red light?", a: "stop" },
      { q: "Which side of the road do you keep to? (answer: left/right)", a: "right" },
    ],
  },
  {
    level: 2,
    title: "Intermediate",
    questions: [
      { q: "What is one key benefit of lane discipline? (short)", a: "reduce congestion" },
      { q: "When do you use hazard lights? (short)", a: "breakdown" },
      { q: "What should you check before overtaking? (short)", a: "clear" },
    ],
  },
  {
    level: 3,
    title: "Advanced",
    questions: [
      { q: "What is 'queue jumping' bad for? (short)", a: "safety" },
      { q: "Name a factor that increases congestion (short)", a: "accident" },
      { q: "What is V2V in traffic tech? (short)", a: "vehicle communication" },
    ],
  },
];

function Trivia({ onFinish }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [locked, setLocked] = useState(false);
  const currSet = TRIVIA_SETS[levelIdx];
  const currQ = currSet.questions[qIdx];

  useEffect(() => {
    // reset answer per question
    setAnswer("");
  }, [qIdx, levelIdx]);

  const submit = (e) => {
    e.preventDefault();
    if (locked) return;
    setLocked(true);
    const correct = (answer || "").trim().toLowerCase();
    const expected = (currQ.a || "").toLowerCase();
    let gained = 0;
    // scoring: exact match or contains -> points scaled by level
    if (correct.length > 0 && (correct === expected || expected.includes(correct) || correct.includes(expected))) {
      gained = 10 * (levelIdx + 1);
      setScore((s) => s + gained);
    }
    // short delay to move to next
    setTimeout(() => {
      setLocked(false);
      if (qIdx + 1 < currSet.questions.length) setQIdx((i) => i + 1);
      else if (levelIdx + 1 < TRIVIA_SETS.length) {
        setLevelIdx((l) => l + 1);
        setQIdx(0);
      } else {
        // finished all
        onFinish && onFinish(score + gained);
      }
    }, 700);
  };

  return (
    <div style={{ ...styles.card, padding: 12 }}>
      <h4 style={{ marginTop: 0 }}>Trivia — {currSet.title} (Level {levelIdx + 1})</h4>
      <div style={{ marginBottom: 8, color: "#94a3b8" }}>{qIdx + 1}/{currSet.questions.length} • Score: {score}</div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{currQ.q}</div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer..." style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #e6eef8" }} />
        <button type="submit" style={styles.smallBtn} disabled={locked}>Submit</button>
      </form>
    </div>
  );
}

/* ----------------- Games (simple interactive) ----------------- */
function Games({ onEarn }) {
  // Game 1: Reaction tap (click button quickly N times)
  const [tapCount, setTapCount] = useState(0);
  const [game1TimeLeft, setGame1TimeLeft] = useState(5);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setGame1TimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            const earned = Math.max(0, Math.floor(tapCount / 3));
            onEarn && onEarn(earned); // small points
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const startGame1 = () => {
    setTapCount(0);
    setGame1TimeLeft(5);
    setRunning(true);
  };

  // Game 2: Simple guess number
  const [secret] = useState(() => Math.floor(Math.random() * 10) + 1);
  const [guess, setGuess] = useState("");
  const [hint, setHint] = useState("");

  const tryGuess = () => {
    const g = Number(guess);
    if (!g) return;
    if (g === secret) {
      setHint("Correct! +5 points");
      onEarn && onEarn(5);
    } else if (g < secret) setHint("Too low");
    else setHint("Too high");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Reaction game */}
      <div style={styles.card}>
        <h4 style={{ marginTop: 0 }}>Tap Frenzy (5s)</h4>
        <div style={{ marginBottom: 8 }}>Tap as many times as you can in the time limit.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setTapCount((c) => c + 1)} disabled={!running} style={{ ...styles.button, padding: "14px 20px", fontSize: 18 }}>
            TAP
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{tapCount}</div>
            <div style={{ color: "#94a3b8" }}>{game1TimeLeft}s left</div>
          </div>
          {!running && <button onClick={startGame1} style={styles.smallBtn}>Start</button>}
        </div>
      </div>

      {/* Guess game */}
      <div style={styles.card}>
        <h4 style={{ marginTop: 0 }}>Guess the Number</h4>
        <div style={{ marginBottom: 8 }}>Pick 1-10. Correct guess yields points.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="1-10" style={{ padding: 8, borderRadius: 8 }} />
          <button onClick={tryGuess} style={styles.smallBtn}>Try</button>
        </div>
        {hint && <div style={{ marginTop: 8, color: "#10b981" }}>{hint}</div>}
      </div>
    </div>
  );
}

/* ----------------- AI Assistant (bubble + panel) ----------------- */
function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([{ from: "bot", text: "Hi — I can explain features, report flow, or provide help." }]);
  const [val, setVal] = useState("");
  const send = () => {
    if (!val.trim()) return;
    const userMsg = { from: "user", text: val.trim(), ts: nowISO() };
    setHistory((h) => [...h, userMsg]);
    setVal("");
    // Simulated reply
    setTimeout(() => {
      const lower = userMsg.text.toLowerCase();
      let reply = "Sorry, I don't know that yet. Try 'help', 'report', or 'routes'.";
      if (lower.includes("help")) reply = "You can report incidents, view dashboard, or use the social feed. Login for saved progress.";
      if (lower.includes("report")) reply = "To report, fill the 'Report an Incident' form on the landing page or use Dashboard.";
      if (lower.includes("routes")) reply = "Best route suggestions are visible on the Dashboard. Login for personalized routes.";
      setHistory((h) => [...h, { from: "bot", text: reply }]);
    }, 700);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        {open && (
          <div style={styles.assistantPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>AI Assistant</div>
              <div>
                <button onClick={() => { setHistory([{ from: "bot", text: "Hi — I can explain features." }]); }} style={styles.altSmall}>Reset</button>
                <button onClick={() => setOpen(false)} style={styles.altSmall}>Close</button>
              </div>
            </div>

            <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8, paddingRight: 6 }}>
              {history.map((m, i) => (
                <div key={i} style={{ marginBottom: 8, textAlign: m.from === "bot" ? "left" : "right" }}>
                  <div style={{ display: "inline-block", background: m.from === "bot" ? "#0ea5a4" : "#111827", color: "#fff", padding: "8px 12px", borderRadius: 12 }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Ask the assistant..." style={{ flex: 1, padding: 8, borderRadius: 8 }} />
              <button onClick={send} style={styles.smallBtn}>Send</button>
            </div>
          </div>
        )}

        <button
          title="Assistant"
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: "linear-gradient(135deg,#06b6d4,#8b5cf6)",
            border: "none",
            color: "#fff",
            fontWeight: 800,
            boxShadow: "0 8px 26px rgba(8,145,178,0.24)",
            cursor: "pointer",
          }}
        >
          💬
        </button>
      </div>
    </>
  );
}

/* ----------------- Marketplace mock ----------------- */
function Marketplace() {
  const [items, setItems] = useState(() => [
    { id: "m1", title: "Emergency Toolkit", price: 29.99 },
    { id: "m2", title: "Road Safety Vest", price: 12.5 },
    { id: "m3", title: "Car Jack Kit", price: 45.0 },
  ]);

  const buy = (it) => {
    alert(`Purchased ${it.title} for $${it.price}. (Simulated)`);
  };

  return (
    <div style={styles.card}>
      <h4 style={{ marginTop: 0 }}>Marketplace</h4>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8, background: "#f8fafc" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{it.title}</div>
              <div style={{ color: "#64748b" }}>${it.price.toFixed(2)}</div>
            </div>
            <button onClick={() => buy(it)} style={styles.smallBtn}>Buy</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------- Emergency services mock ----------------- */
function EmergencyServices() {
  const [services] = useState([
    { id: "e1", name: "QuickTow Mechanics (1.2km)", phone: "0700-111-222", type: "mechanic" },
    { id: "e2", name: "City Ambulance (2.1km)", phone: "0700-333-444", type: "ambulance" },
    { id: "e3", name: "Metro Police (0.9km)", phone: "0700-555-666", type: "police" },
  ]);
  return (
    <div style={styles.card}>
      <h4 style={{ marginTop: 0 }}>Emergency & Nearby Help</h4>
      {services.map((s) => (
        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 800 }}>{s.name}</div>
            <div style={{ color: "#64748b" }}>{s.type} • {s.phone}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`tel:${s.phone}`} style={styles.smallBtn}>Call</a>
            <button onClick={() => alert(`Directions to ${s.name} (simulated)`)} style={styles.altSmall}>Navigate</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------- Main Landing ----------------- */
export default function Landing() {
  const navigate = useNavigate();
  const [logged, setLogged] = useState(isLoggedIn());
  const [news, setNews] = useState([
    "Traffic on Main St. is heavier than usual.",
    "Lane discipline pilot decreased congestion by 22% in trials.",
    "City adds new sensors for smarter light timing.",
  ]);
  const [facts] = useState([
    "Smart traffic lights can reduce waiting times by up to 40%.",
    "Average driver spends ~38 hours/year in traffic.",
    "Lane discipline can reduce congestion by ~30%.",
    "Real-time routing reduces emissions and travel time.",
    "Public reporting increases incident response speed.",
  ]);
  const [reports, setReports] = useState(() => JSON.parse(localStorage.getItem("reports") || "[]"));
  const [showWalk, setShowWalk] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastTriviaScore, setLastTriviaScore] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setNews((n) => [`Simulated: Alert ${Math.floor(Math.random() * 1000)} — check your route.`, ...n].slice(0, 6));
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLogged(isLoggedIn()), 700);
    return () => clearInterval(id);
  }, []);

  const onNewReport = (r) => {
    setReports((p) => [r, ...p]);
  };

  const onTriviaFinish = (score) => {
    setLastTriviaScore(score);
    setShowCongrats(true);
    // reward logged users only
    if (isLoggedIn()) {
      const profile = JSON.parse(localStorage.getItem("currentUser") || "{}");
      profile.points = (profile.points || 0) + score;
      localStorage.setItem("currentUser", JSON.stringify(profile));
    } else {
      // show notice
      alert("Score not saved — log in to keep progress.");
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated stars/strips background */}
      <div style={styles.bgStrips} />

      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.brand}>AI Traffic <span style={{ color: "#06b6d4" }}>Gold</span></div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Premium demo</div>
        </div>

        <nav style={styles.headerNav}>
          <Link to="/" style={styles.hLink}>Home</Link>
          <Link to="/about" style={styles.hLink}>About</Link>
          <Link to="/social" style={styles.hLink}>Social</Link>
          <Link to="/dashboard" style={{ ...styles.hLink, opacity: logged ? 1 : 0.7 }}>Dashboard</Link>
        </nav>

        <div style={styles.headerActions}>
          {!logged ? (
            <>
              <button style={styles.headerBtn} onClick={() => navigate("/login")}>Login</button>
              <button style={{ ...styles.headerBtn, background: "#111827", color: "#fff" }} onClick={() => navigate("/register")}>Register</button>
            </>
          ) : (
            <>
              <button style={styles.headerBtn} onClick={() => { localStorage.removeItem("currentUser"); setLogged(false); }}>Logout</button>
            </>
          )}
          <button style={{ ...styles.smallBtn, marginLeft: 10 }} onClick={() => { setShowWalk(true); }}>Quick Tour</button>
        </div>
      </header>

      {/* Hero */}
      <main style={styles.hero}>
        <div style={styles.heroLeft}>
          <h1 style={styles.title}>Smarter traffic, safer cities — experience the Gold edition.</h1>
          <p style={styles.lead}>
            See live simulations, get suggested routes, report incidents, play learning games, and help your community.
            <strong style={{ color: "#06b6d4" }}> Login</strong> to persist progress and get personalized predictions.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button style={styles.ctaPrimary} onClick={() => navigate("/dashboard")}>Open Dashboard</button>
            <button style={styles.ctaOutline} onClick={() => setShowWalk(true)}>Tour</button>
            <button style={styles.ctaGhost} onClick={() => document.getElementById("report-anchor")?.scrollIntoView({ behavior: "smooth" })}>Report Incident</button>
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={styles.factsWrap}>
              <div style={{ fontSize: 13, color: "#c7f9ff", marginBottom: 6 }}>🚦 Quick Fact</div>
              <div style={{ fontWeight: 800 }}>{facts[Math.floor(Math.random() * facts.length)]}</div>
            </div>

            <div style={{ ...styles.card, padding: 12, minWidth: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>Live Time vs Traffic</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Auto-updating demo</div>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{logged ? "Saved for you" : "Preview only"}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <TrafficLineChart />
              </div>
            </div>
          </div>

        </div>

        <div style={styles.heroRight}>
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ marginTop: 0 }}>Live Lane Simulation</h4>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{logged ? "Full features" : "Preview"}</div>
            </div>
            <LaneSimulation onClickBar={(r) => alert(`${r.id} clicked • inbound ${r.inbound}% • outbound ${r.outbound}%`)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <Games onEarn={(pts) => {
              if (isLoggedIn()) {
                const user = JSON.parse(localStorage.getItem("currentUser"));
                user.points = (user.points || 0) + pts;
                localStorage.setItem("currentUser", JSON.stringify(user));
                alert(`You earned ${pts} points (saved).`);
              } else {
                alert(`You earned ${pts} points (log in to save progress).`);
              }
            }} />
          </div>

          <div style={{ marginTop: 12 }}>
            <Marketplace />
          </div>

        </div>
      </main>

      {/* News Ticker */}
      <div style={{ padding: "10px 22px", zIndex: 5 }}>
        <div style={styles.ticker}>
          <div style={{ ...styles.tickerInner, animationDuration: `${Math.max(12, news.length * 6)}s` }}>
            <span style={{ marginRight: 40 }}>{news.join(" • ")}</span>
            <span style={{ marginRight: 40 }}>{news.join(" • ")}</span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <section style={styles.section}>
        <div style={styles.grid}>
          <div style={styles.col}>
            {/* Report incident */}
            <div id="report-anchor">
              <ReportIncident onNew={(r) => {
                onNewReport(r);
                alert("Incident reported (saved).");
              }} />
            </div>

            {/* Recent reports */}
            <div style={{ marginTop: 14, ...styles.card }}>
              <h4 style={{ marginTop: 0 }}>Recent Reports</h4>
              {reports.length === 0 && <div style={{ color: "#94a3b8" }}>No reports yet.</div>}
              {reports.slice(0, 8).map((r) => (
                <div key={r.id} style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 800 }}>{r.title} <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>{r.severity}</span></div>
                  <div style={{ color: "#475569" }}>{r.description}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{r.location || "Location not provided"} • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.col}>
            <div style={{ ...styles.card }}>
              <h4 style={{ marginTop: 0 }}>Traffic Facts & Learning</h4>
              <ul style={{ paddingLeft: 18 }}>
                {facts.map((f, i) => <li key={i} style={{ marginBottom: 8 }}>{f}</li>)}
              </ul>
              <div style={{ marginTop: 8 }}>
                <Link to="/about" style={{ color: "#06b6d4", fontWeight: 800 }}>More resources →</Link>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <EmergencyServices />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={styles.card}>
                <h4 style={{ marginTop: 0 }}>Trivia & Challenges</h4>
                <Trivia onFinish={onTriviaFinish} />
                {showCongrats && (
                  <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "#ecfccb", color: "#166534" }}>
                    Congrats! Last score: {lastTriviaScore ?? "—"} points. {isLoggedIn() ? "Saved to your profile." : "Log in to save progress."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & details */}
      <footer style={styles.footer}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Why this matters</div>
            <p style={{ color: "#475569" }}>
              Smart traffic systems reduce travel time, save fuel, and lower emissions. By combining real-time sensing, user reporting and predictive models,
              cities can optimize flows and react faster to incidents. This demo shows how the components fit together — login to access personalized suggestions,
              saved progress, and higher accuracy.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
              <Link to="/terms" style={styles.footerLink}>Terms</Link>
              <Link to="/contact" style={styles.footerLink}>Contact</Link>
            </div>
          </div>

          <div style={{ width: 320 }}>
            <div style={{ fontWeight: 800 }}>Get started</div>
            <div style={{ color: "#475569", marginTop: 8 }}>Login to keep progress, see better predictions, and connect with services near you.</div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button style={styles.smallBtn} onClick={() => navigate("/register")}>Register</button>
              <button style={styles.altSmall} onClick={() => navigate("/login")}>Login</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18, color: "#94a3b8", fontSize: 13 }}>© {new Date().getFullYear()} AI Traffic Gold — prototype. Not a production system.</div>
      </footer>

      {/* AI Assistant */}
      <AIAssistant />

      {/* Walkthrough modal */}
      {showWalk && (
        <div style={styles.modalBackdrop} onClick={() => setShowWalk(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Quick Walkthrough</h3>
            <ol>
              <li>Explore the Lane Simulation and Traffic Chart for realistic trends.</li>
              <li>Report incidents — they appear in the feed and help emergency response.</li>
              <li>Try Trivia & Games — login to save progress and earn rewards.</li>
              <li>Use the AI Assistant bubble (bottom-right) for quick guidance.</li>
            </ol>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={styles.smallBtn} onClick={() => { setShowWalk(false); navigate("/dashboard"); }}>Open Dashboard</button>
              <button style={styles.altSmall} onClick={() => setShowWalk(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- ReportIncident component (kept here for completeness) ----------------- */
function ReportIncident({ onNew }) {
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", location: "" });
  const [msg, setMsg] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setMsg("Please complete title and description");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    const reports = JSON.parse(localStorage.getItem("reports") || "[]");
    const r = { id: uid("r_"), ...form, createdAt: nowISO() };
    reports.unshift(r);
    localStorage.setItem("reports", JSON.stringify(reports));
    setForm({ title: "", description: "", severity: "medium", location: "" });
    setMsg("Reported ✓");
    onNew && onNew(r);
    setTimeout(() => setMsg(""), 2400);
  };

  return (
    <div style={styles.reportCard}>
      <h4 style={{ marginTop: 0 }}>Report an Incident</h4>
      <form onSubmit={submit}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short title" style={styles.input} />
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location (optional)" style={styles.input} />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ ...styles.input, minHeight: 100 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} style={{ padding: 10, borderRadius: 8 }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit" style={styles.button}>Report</button>
        </div>
        {msg && <div style={{ marginTop: 8, color: "#10b981" }}>{msg}</div>}
      </form>
    </div>
  );
}

/* ----------------- Styles ----------------- */
const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    fontFamily: "'Orbitron', 'Rajdhani', system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
    color: "#0f172a",
    background: "linear-gradient(180deg,#020617 0%, #071023 35%, #071023 100%)",
  },
  bgStrips: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient( circle at 10% 10%, rgba(14,165,164,0.06), transparent 10% ), radial-gradient( circle at 90% 90%, rgba(139,92,246,0.04), transparent 10% )",
    zIndex: 0,
    pointerEvents: "none",
  },

  header: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 28px",
    gap: 12,
    background: "transparent",
  },
  brand: { fontWeight: 900, fontSize: 20, color: "#fff" },
  headerNav: { display: "flex", gap: 14 },
  hLink: { color: "#cbd5e1", textDecoration: "none", padding: "6px 8px", borderRadius: 8 },
  headerActions: { display: "flex", gap: 8, alignItems: "center" },
  headerBtn: { padding: "8px 12px", borderRadius: 8, background: "#0f172a", color: "#fff", border: "1px solid #0ea5a4", cursor: "pointer" },
  smallBtn: { padding: "8px 10px", borderRadius: 8, background: "#06b6d4", color: "#041018", border: "none", cursor: "pointer", fontWeight: 700 },
  altSmall: { padding: "6px 8px", borderRadius: 8, background: "#111827", color: "#fff", border: "1px solid #e6eef8", cursor: "pointer" },

  hero: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    gap: 20,
    alignItems: "stretch",
    padding: "36px 28px",
    maxWidth: 1260,
    margin: "0 auto",
  },
  heroLeft: { flex: 1, padding: "8px" },
  heroRight: { width: 520, display: "flex", flexDirection: "column", gap: 12 },

  title: { fontSize: 34, margin: 0, color: "#f8fafc", textShadow: "0 4px 30px rgba(8,145,178,0.12)" },
  lead: { color: "#94a3b8", marginTop: 12, lineHeight: 1.6 },

  ctaPrimary: {
    background: "linear-gradient(90deg,#06b6d4,#8b5cf6)",
    color: "#041018",
    border: "none",
    padding: "12px 18px",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 40px rgba(8,145,178,0.18)",
  },
  ctaOutline: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#e6eef8",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
  },
  ctaGhost: { background: "transparent", border: "none", color: "#cbd5e1", padding: "12px 18px", cursor: "pointer" },

  card: {
    background: "linear-gradient(180deg,#071023, #041018)",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 10px 40px rgba(2,6,23,0.6)",
    color: "#e6eef8",
    border: "1px solid rgba(255,255,255,0.03)",
  },

  factsWrap: { background: "linear-gradient(90deg,#001219,#021826)", padding: 12, borderRadius: 10, display: "inline-block", textAlign: "left", color: "#cde" },

  ticker: {
    width: "100%",
    overflow: "hidden",
    background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02))",
    borderTop: "1px solid rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  },
  tickerInner: {
    display: "inline-block",
    whiteSpace: "nowrap",
    padding: "12px 0",
    animationName: "marquee",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    color: "#9ca3af",
  },

  section: { padding: "28px 20px", maxWidth: 1260, margin: "0 auto", zIndex: 5 },
  grid: { display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 },
  col: { display: "flex", flexDirection: "column", gap: 12 },

  reportCard: {
    background: "linear-gradient(180deg,#061221,#041018)",
    padding: 14,
    borderRadius: 12,
    boxShadow: "0 12px 40px rgba(2,6,23,0.6)",
    color: "#e6eef8",
  },

  input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 8, background: "transparent", color: "#e6eef8" },

  gamesGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 },
  gameCard: { background: "#041018", padding: 12, borderRadius: 8, textAlign: "center", color: "#cfe" },

  footer: { marginTop: 36, padding: 24, textAlign: "center", color: "#94a3b8" },
  footerLink: { color: "#9fe", textDecoration: "none" },

  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modalCard: { width: 640, background: "#071023", padding: 18, borderRadius: 12, boxShadow: "0 30px 60px rgba(2,6,23,0.6)", color: "#e6eef8" },

  laneRow: { display: "flex", gap: 12, alignItems: "center", padding: "8px 0" },
  track: { position: "relative", height: 36, background: "#020617", borderRadius: 8, overflow: "hidden", border: "1px solid #071022" },
  inboundBar: { position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg,#06b6d4,#0ea5a4)" },
  outboundBar: { position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg,#f97316,#f59e0b)" },

  reportCardText: { color: "#9ca3af" },

  assistantPanel: { width: 360, background: "#021025", color: "#e6eef8", padding: 12, borderRadius: 12, boxShadow: "0 30px 70px rgba(2,6,23,0.6)" },
};

/* ----------------- Inject keyframes if browser ----------------- */
(function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("premium-landing-keyframes")) return;
  const css = `
    @keyframes marquee {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    @media (max-width: 900px) {
      .hide-mobile { display: none !important; }
    }
  `;
  const s = document.createElement("style");
  s.id = "premium-landing-keyframes";
  s.innerHTML = css;
  document.head.appendChild(s);
})();
