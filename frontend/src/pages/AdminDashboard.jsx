// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import Papa from "papaparse";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiUser,
  FiShield,
  FiDownload,
  FiUpload,
  FiRepeat,
  FiShoppingCart,
  FiMap,
  FiActivity,
  FiLogOut,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
);

/**
 * AdminDashboard.jsx (Platinum Extended)
 *
 * - Paste to src/pages/AdminDashboard.jsx
 * - Requires: chart.js, react-chartjs-2, papaparse, react-icons, framer-motion
 * - Persists to localStorage keys:
 *     admin_users, admin_reports, admin_rows, admin_market, admin_orders, admin_audit
 *
 * This file is intentionally verbose -- it provides many simulated/prototyping features.
 */

/* -------------------- Utilities -------------------- */
const uid = (p = "") => `${p}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowISO = () => new Date().toISOString();

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

/* -------------------- Seed default data -------------------- */
if (!LS.get("admin_users")) {
  LS.set("admin_users", [
    { id: "u_admin", name: "Super Admin", email: "admin@plat.com", role: "admin", createdAt: nowISO() },
    { id: "u_jane", name: "Jane Doe", email: "jane@example.com", role: "user", createdAt: nowISO() },
    { id: "u_bob", name: "Bob Smith", email: "bob@mech.com", role: "mechanic", createdAt: nowISO() },
  ]);
}
if (!LS.get("admin_reports")) {
  LS.set("admin_reports", [
    {
      id: uid("r_"),
      title: "Minor collision",
      location: "Riverside Ave",
      severity: "medium",
      message: "Two vehicles, partial blocking of lane",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      confirmed: false,
      assignedTo: null,
    },
  ]);
}
if (!LS.get("admin_rows")) {
  LS.set("admin_rows", [
    { route: "R1", timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(), value: 45, lat: 0.3476, lng: 32.5825 },
    { route: "R2", timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(), value: 75, lat: 0.348, lng: 32.58 },
    { route: "R3", timestamp: new Date().toISOString(), value: 30, lat: 0.350, lng: 32.585 },
  ]);
}
if (!LS.get("admin_market")) {
  LS.set("admin_market", [
    { id: "m1", title: "High-visibility Vest", price: 19.99, stock: 24, seller: "FleetStore" },
    { id: "m2", title: "Portable Tire Inflator", price: 49.99, stock: 12, seller: "AutoKit" },
  ]);
}
if (!LS.get("admin_orders")) {
  LS.set("admin_orders", []);
}
if (!LS.get("admin_audit")) {
  LS.set("admin_audit", [
    { id: uid("a_"), at: nowISO(), actor: "system", action: "Initialized demo data" },
  ]);
}

/* -------------------- Safe helpers -------------------- */
const safeStr = (v) => (v == null ? "" : String(v));
const safeIncludes = (hay, needle) => safeStr(hay).toLowerCase().includes(safeStr(needle).toLowerCase());

/* -------------------- Small Presentational Helpers -------------------- */
function Badge({ children, color = "#ef4444" }) {
  return (
    <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 8, background: color, color: "#fff", fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
}

/* -------------------- Main Component -------------------- */
export default function AdminDashboard() {
  // Load persisted data
  const [users, setUsers] = useState(() => LS.get("admin_users", []));
  const [reports, setReports] = useState(() => LS.get("admin_reports", []));
  const [rows, setRows] = useState(() => LS.get("admin_rows", []));
  const [market, setMarket] = useState(() => LS.get("admin_market", []));
  const [orders, setOrders] = useState(() => LS.get("admin_orders", []));
  const [audit, setAudit] = useState(() => LS.get("admin_audit", []));

  // UI state
  const [tab, setTab] = useState("overview"); // overview, users, reports, dataset, marketplace, settings
  const [query, setQuery] = useState("");
  const [notif, setNotif] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvParsing, setCsvParsing] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiChat, setAiChat] = useState([{ id: uid("ai_"), who: "system", text: "AI Assistant online. Ask for routing advice, dataset help, or admin commands." }]);
  const [cart, setCart] = useState([]);
  const fileRef = useRef(null);
  const jsonPasteRef = useRef(null);

  // persist changes to localStorage
  useEffect(() => LS.set("admin_users", users), [users]);
  useEffect(() => LS.set("admin_reports", reports), [reports]);
  useEffect(() => LS.set("admin_rows", rows), [rows]);
  useEffect(() => LS.set("admin_market", market), [market]);
  useEffect(() => LS.set("admin_orders", orders), [orders]);
  useEffect(() => LS.set("admin_audit", audit), [audit]);

  // auto pop notification removal
  useEffect(() => {
    if (notif.length === 0) return;
    const t = setTimeout(() => setNotif((n) => n.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [notif]);

  /* -------------------- Audit helper -------------------- */
  function pushAudit(actor, action) {
    const entry = { id: uid("a_"), at: nowISO(), actor: actor || "admin", action };
    setAudit((a) => [entry, ...a].slice(0, 1000));
  }

  /* -------------------- User management -------------------- */
  function createUser(data) {
    const u = { id: uid("u_"), name: data.name || "Unnamed", email: data.email || "", role: data.role || "user", createdAt: nowISO() };
    setUsers((prev) => [u, ...prev]);
    setNotif((n) => [`Created user ${u.name}`, ...n]);
    pushAudit("admin", `Created user ${u.name}`);
  }
  function updateUser(id, patch) {
    setUsers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setNotif((n) => [`Updated user`, ...n]);
    pushAudit("admin", `Updated user ${id}`);
    setEditingUser(null);
  }
  function deleteUser(id) {
    const u = users.find((x) => x.id === id);
    setUsers((prev) => prev.filter((p) => p.id !== id));
    setNotif((n) => [`Deleted ${u?.name || id}`, ...n]);
    pushAudit("admin", `Deleted user ${u?.name || id}`);
  }
  function bulkAssignRole(ids, role) {
    setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, role } : u)));
    setNotif((n) => [`Assigned role ${role} to ${ids.length} users`, ...n]);
    pushAudit("admin", `Bulk role assign ${role} to ${ids.length} users`);
  }

  /* -------------------- Reports management -------------------- */
  function addReport(payload) {
    const r = { ...payload, id: uid("r_"), timestamp: nowISO(), confirmed: false, assignedTo: null };
    setReports((p) => [r, ...p]);
    setNotif((n) => [`Report added: ${r.title}`, ...n]);
    pushAudit("admin", `Added report ${r.title}`);
  }
  function confirmReport(id) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, confirmed: true } : r)));
    setNotif((n) => [`Report confirmed`, ...n]);
    pushAudit("admin", `Confirmed report ${id}`);
  }
  function removeReport(id) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    setNotif((n) => [`Report removed`, ...n]);
    pushAudit("admin", `Removed report ${id}`);
  }
  function assignReport(id, userId) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, assignedTo: userId } : r)));
    setNotif((n) => [`Assigned report to user`, ...n]);
    pushAudit("admin", `Assigned report ${id} to ${userId}`);
  }

  /* -------------------- Dataset handling -------------------- */
  function importCSV(file) {
    if (!file) return;
    setCsvParsing(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data;
        // normalize: ensure keys route, timestamp, value, lat, lng if possible
        const normalized = parsed.map((r) => {
          // try common header names
          const o = { ...r };
          return {
            route: o.route || o.Road || o.link || o.segment || o.road || "Unknown",
            timestamp: o.timestamp || o.time || o.date || o.datetime || nowISO(),
            value: Number(o.value ?? o.congestion ?? o.count ?? o.flow ?? o.vehicles) || null,
            lat: Number(o.lat || o.latitude || o.start_lat) || null,
            lng: Number(o.lng || o.longitude || o.start_lng) || null,
            raw: o,
          };
        });
        setRows((prev) => [...normalized, ...prev].slice(0, 200000));
        setCsvParsing(false);
        setNotif((n) => [`Imported ${normalized.length} rows`, ...n]);
        pushAudit("admin", `Imported CSV ${file.name} (${normalized.length} rows)`);
      },
      error: (err) => {
        setCsvParsing(false);
        setNotif((n) => [`CSV parse error: ${err.message}`, ...n]);
      },
    });
  }
  function importJSONRows(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setNotif((n) => ["JSON must be an array of objects", ...n]);
        return;
      }
      setRows((prev) => [...parsed, ...prev].slice(0, 200000));
      setNotif((n) => [`Imported ${parsed.length} rows`, ...n]);
      pushAudit("admin", `Imported JSON rows (${parsed.length})`);
    } catch (e) {
      setNotif((n) => ["Invalid JSON", ...n]);
    }
  }
  function clearDataset() {
    setRows([]);
    setNotif((n) => ["Dataset cleared", ...n]);
    pushAudit("admin", "Cleared dataset");
  }
  function exportProcessedJSON() {
    const payload = { meta: { generatedAt: nowISO(), rows: rows.length }, rows };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin_processed_data.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotif((n) => ["Export started", ...n]);
  }

  /* -------------------- Market / Shopping stub -------------------- */
  function addToCart(itemId) {
    const it = market.find((m) => m.id === itemId);
    if (!it || it.stock <= 0) {
      setNotif((n) => ["Item out of stock", ...n]);
      return;
    }
    setCart((c) => [...c, it]);
    setNotif((n) => [`Added ${it.title} to cart`, ...n]);
  }
  function checkoutCart(buyer = "admin") {
    if (cart.length === 0) {
      setNotif((n) => ["Cart empty", ...n]);
      return;
    }
    const order = { id: uid("o_"), at: nowISO(), buyer, items: cart, total: cart.reduce((s, it) => s + (it.price || 0), 0) };
    setOrders((o) => [order, ...o]);
    // decrement stock
    setMarket((m) => m.map((it) => {
      const count = cart.filter((c) => c.id === it.id).length;
      return it.id === it.id ? { ...it, stock: Math.max(0, it.stock - count) } : it;
    }));
    setCart([]);
    setNotif((n) => [`Order placed (${order.id})`, ...n]);
    pushAudit("admin", `Order ${order.id} placed`);
  }

  /* -------------------- Simple rule-based route recommender -------------------- */
  function recommendRoute(from, to) {
    // uses aggregated rows: compute average value per route and suggest lowest avg
    const byRoute = {};
    rows.forEach((r) => {
      const route = r.route || "Unknown";
      if (!byRoute[route]) byRoute[route] = { sum: 0, count: 0 };
      const v = Number(r.value);
      if (!Number.isNaN(v)) {
        byRoute[route].sum += v;
        byRoute[route].count += 1;
      }
    });
    const routeAvgs = Object.keys(byRoute).map((route) => ({ route, avg: byRoute[route].count ? byRoute[route].sum / byRoute[route].count : Infinity }));
    routeAvgs.sort((a, b) => a.avg - b.avg);
    // pick top 3 suggestions
    const suggestions = routeAvgs.slice(0, 3).map((r) => `${r.route} (est. ${Math.round(r.avg || 0)}%)`);
    const advice = suggestions.length ? suggestions.join(" — ") : "No route data available";
    // append to AI chat
    const entry = { id: uid("ai_"), who: "assistant", text: `Recommended routes from ${from} to ${to}: ${advice}` };
    setAiChat((c) => [...c, entry]);
    pushAudit("ai", `Route recommended for ${from}->${to}`);
    return advice;
  }

  /* -------------------- AI Assistant (simple rule-based) -------------------- */
  function aiAsk(text) {
    const q = text.toLowerCase();
    let resp = "I didn't understand. Try: 'recommend route', 'show stats', 'export data', or 'list users'";
    if (q.includes("recommend") || q.includes("route")) {
      // try to extract from/to
      const parts = q.split(" ");
      // naive: if contains 'to' word, take tokens around it
      const toIndex = parts.indexOf("to");
      const from = "your location";
      const to = toIndex !== -1 ? parts.slice(toIndex + 1, toIndex + 3).join(" ") || "destination" : "destination";
      resp = `Simulated recommendation: ${recommendRoute(from, to)}`;
    } else if (q.includes("show") && q.includes("stats")) {
      resp = `Dataset rows: ${rows.length}, Reports: ${reports.length}, Users: ${users.length}`;
    } else if (q.includes("export")) {
      exportProcessedJSON();
      resp = "Export started. Check downloads.";
    } else if (q.includes("list") && q.includes("users")) {
      resp = `Users: ${users.map((u) => u.name).slice(0, 5).join(", ")}${users.length > 5 ? "..." : ""}`;
    } else if (q.includes("market")) {
      resp = `Marketplace items: ${market.map((m) => `${m.title} ($${m.price})`).slice(0, 5).join(" | ")}`;
    }
    const e = { id: uid("ai_"), who: "user", text };
    const r = { id: uid("ai_"), who: "assistant", text: resp };
    setAiChat((c) => [...c, e, r]);
    pushAudit("ai", `Asked: ${text}`);
    return resp;
  }

  /* -------------------- Derived analytics for charts -------------------- */
  const stats = useMemo(() => {
    const totalRows = rows.length;
    const byRoute = {};
    const byDate = {};
    rows.forEach((r) => {
      const route = r.route || "Unknown";
      const v = Number(r.value || 0);
      if (!byRoute[route]) byRoute[route] = { sum: 0, count: 0 };
      if (!Number.isNaN(v)) {
        byRoute[route].sum += v;
        byRoute[route].count += 1;
      }
      const d = r.timestamp ? String(r.timestamp).slice(0, 10) : null;
      if (d) {
        if (!byDate[d]) byDate[d] = { sum: 0, count: 0 };
        byDate[d].sum += v;
        byDate[d].count += 1;
      }
    });
    const routeStats = Object.keys(byRoute).map((k) => ({ route: k, avg: byRoute[k].count ? +(byRoute[k].sum / byRoute[k].count).toFixed(2) : 0 }));
    const dateSeries = Object.keys(byDate).sort().map((d) => ({ date: d, avg: +(byDate[d].sum / byDate[d].count).toFixed(2) }));
    return { totalRows, routeStats, dateSeries, totalReports: reports.length };
  }, [rows, reports]);

  const lineData = useMemo(() => {
    return {
      labels: stats.dateSeries.map((s) => s.date),
      datasets: [{ label: "Avg value", data: stats.dateSeries.map((s) => s.avg), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.12)", tension: 0.3 }],
    };
  }, [stats]);

  const barData = useMemo(() => {
    const top = stats.routeStats.slice().sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, 8);
    return { labels: top.map((t) => t.route), datasets: [{ label: "Avg", data: top.map((t) => t.avg), backgroundColor: "#10b981" }] };
  }, [stats]);

  const pieData = useMemo(() => {
    const sev = { high: 0, medium: 0, low: 0, unknown: 0 };
    reports.forEach((r) => { const s = (r.severity || "unknown").toLowerCase(); sev[s] = (sev[s] || 0) + 1; });
    return { labels: Object.keys(sev), datasets: [{ data: Object.values(sev), backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#94a3b8"] }] };
  }, [reports]);

  /* -------------------- Searching & pagination helpers -------------------- */
  const usersFiltered = useMemo(() => {
    if (!query) return users;
    return users.filter((u) => safeIncludes(u.name, query) || safeIncludes(u.email, query) || safeIncludes(u.role, query));
  }, [users, query]);

  /* -------------------- Reset demo -------------------- */
  function resetDemo() {
    LS.remove("admin_users");
    LS.remove("admin_reports");
    LS.remove("admin_rows");
    LS.remove("admin_market");
    LS.remove("admin_orders");
    LS.remove("admin_audit");
    window.location.reload();
  }

  /* -------------------- UI subcomponents -------------------- */

  function UserForm({ initial = {}, onCancel, onSave }) {
    const [form, setForm] = useState({ name: initial.name || "", email: initial.email || "", role: initial.role || "user" });
    return (
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={styles.input} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <label style={{ color: "#475569" }}>Role:</label>
          <select style={styles.select} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="mechanic">Mechanic</option>
            <option value="operator">Operator</option>
          </select>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => onSave(form)} style={{ ...styles.btn, ...styles.btnPrimary }}>{initial.id ? "Save" : "Create"}</button>
            <button onClick={onCancel} style={{ ...styles.btn, ...styles.btnGhost }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- Render -------------------- */
  return (
    <div style={pageWrap}>
      <header style={headerStyle}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>AI Traffic System</div>
          <Badge color="#111827">Admin — Platinum</Badge>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={styles.searchWrap}>
            <FiSearch />
            <input placeholder="Search users, reports, items..." value={query} onChange={(e) => setQuery(e.target.value)} style={styles.search} />
          </div>

          <button onClick={() => setTab("overview")} style={tabBtn(tab === "overview")}>Overview</button>
          <button onClick={() => setTab("users")} style={tabBtn(tab === "users")}>Users</button>
          <button onClick={() => setTab("reports")} style={tabBtn(tab === "reports")}>Reports</button>
          <button onClick={() => setTab("dataset")} style={tabBtn(tab === "dataset")}>Dataset</button>
          <button onClick={() => setTab("marketplace")} style={tabBtn(tab === "marketplace")}>Marketplace</button>
          <button onClick={() => setTab("settings")} style={tabBtn(tab === "settings")}>Settings</button>

          <button onClick={() => { pushAudit("admin", "Manual sync triggered"); setNotif((n) => ["Manual sync triggered", ...n]); }} style={styles.actionBtn}><FiRepeat /> Sync</button>
          <button onClick={() => { setAiOpen((s) => !s); setNotif((n) => [aiOpen ? "AI closed" : "AI opened", ...n]); }} style={styles.actionBtn}><FiActivity /> AI</button>
        </div>
      </header>

      <main style={mainGrid}>
        <section style={{ gridColumn: "1 / span 2" }}>
          {/* Overview */}
          {tab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>System Overview</h2>
                  <div style={{ color: "#475569", marginTop: 6 }}>Quick analytics, live feed, and controls.</div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={kpiCard}><div style={{ fontSize: 20, fontWeight: 800 }}>{users.length}</div><div style={{ color: "#64748b" }}>Users</div></div>
                  <div style={kpiCard}><div style={{ fontSize: 20, fontWeight: 800 }}>{rows.length}</div><div style={{ color: "#64748b" }}>Dataset rows</div></div>
                  <div style={kpiCard}><div style={{ fontSize: 20, fontWeight: 800 }}>{reports.length}</div><div style={{ color: "#64748b" }}>Reports</div></div>
                  <div style={kpiCard}><div style={{ fontSize: 20, fontWeight: 800 }}>{orders.length}</div><div style={{ color: "#64748b" }}>Orders</div></div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 360px", gap: 16, marginTop: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={card}>
                    <h4 style={{ marginTop: 0 }}>Traffic (time series)</h4>
                    {stats.dateSeries.length === 0 ? <div style={{ color: "#64748b" }}>No time-series data</div> : <div style={{ height: 220 }}><Line data={lineData} options={{ maintainAspectRatio: false }} /></div>}
                    <div style={{ marginTop: 8, color: "#475569" }}>Simulated trend aggregated from datasets.</div>
                  </div>

                  <div style={card}>
                    <h4 style={{ marginTop: 0 }}>Top Routes</h4>
                    {stats.routeStats.length === 0 ? <div style={{ color: "#64748b" }}>No route data</div> : <div style={{ height: 220 }}><Bar data={barData} options={{ maintainAspectRatio: false }} /></div>}
                    <div style={{ marginTop: 8, color: "#475569" }}>Routes sorted by average metric (lower is better).</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}>
                    <h4 style={{ marginTop: 0 }}>Reports Severity</h4>
                    <div style={{ height: 180 }}><Pie data={pieData} options={{ maintainAspectRatio: false }} /></div>
                    <div style={{ marginTop: 8, color: "#475569" }}>Distribution of reported incidents by severity.</div>
                  </div>

                  <div style={card}>
                    <h4 style={{ marginTop: 0 }}>Activity / Audit</h4>
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                      {audit.slice(0, 8).map((a) => (
                        <div key={a.id} style={{ padding: 8, borderBottom: "1px solid #eef2f7" }}>
                          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{a.action}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(a.at).toLocaleString()} • {a.actor}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Left column: users / reports / dataset / marketplace */}
        <section style={{ gridColumn: "1 / span 1" }}>
          {/* Users */}
          {tab === "users" && (
            <motion.div style={card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Users ({usersFiltered.length})</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditingUser(null); setShowCreateUser(true); }} style={{ ...styles.btn, ...styles.btnPrimary }}><FiPlus /> New user</button>
                  <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(users).slice(0, 2000)); setNotif((n) => ["Users copied to clipboard", ...n]); }} style={styles.btnGhost}><FiDownload /> Export</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {usersFiltered.length === 0 ? <div style={{ color: "#64748b" }}>No users</div> : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {usersFiltered.map((u) => (
                      <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8, border: "1px solid #eef2f7" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "#eef2f7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                            {u.name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{u.name} {u.role === "admin" && <Badge color="#111827">ADMIN</Badge>}</div>
                            <div style={{ color: "#64748b", fontSize: 13 }}>{u.email}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })} style={styles.selectSmall}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="mechanic">Mechanic</option>
                            <option value="operator">Operator</option>
                          </select>
                          <button onClick={() => { setEditingUser(u); setShowCreateUser(true); }} style={smallBtn}><FiEdit2 /></button>
                          <button onClick={() => deleteUser(u.id)} style={smallDanger}><FiTrash2 /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Reports */}
          {tab === "reports" && (
            <motion.div style={card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Reports ({reports.length})</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { addReport({ title: "Demo report", location: "Test Rd", severity: "low", message: "Demo" }); }} style={styles.btnGhost}><FiPlus /> Quick</button>
                  <button onClick={() => { setReports([]); setNotif((n) => ["Cleared reports", ...n]); pushAudit("admin", "Cleared all reports"); }} style={styles.ghostBtn}>Clear</button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {reports.length === 0 && <div style={{ color: "#64748b" }}>No reports</div>}
                {reports.map((r) => (
                  <div key={r.id} style={{ padding: 10, borderRadius: 8, border: "1px solid #eef2f7", background: r.confirmed ? "#f0fdf4" : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{r.title} <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{r.severity}</span></div>
                        <div style={{ color: "#475569", marginTop: 6 }}>{r.message}</div>
                        <div style={{ color: "#9ca3af", marginTop: 6, fontSize: 12 }}>{r.location || "Location unknown"} • {new Date(r.timestamp).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {!r.confirmed && <button onClick={() => confirmReport(r.id)} style={{ ...smallBtn, background: "#10b981", color: "#fff" }}>Mark Resolved</button>}
                        <select value={r.assignedTo || ""} onChange={(e) => assignReport(r.id, e.target.value)} style={styles.selectSmall}>
                          <option value="">Assign</option>
                          {users.filter(u => u.role === "mechanic" || u.role === "admin").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button onClick={() => removeReport(r.id)} style={smallDanger}><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dataset */}
          {tab === "dataset" && (
            <motion.div style={card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Datasets</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={fileRef} type="file" accept=".csv" onChange={(e) => importCSV(e.target.files?.[0])} style={{ display: "none" }} />
                  <button onClick={() => fileRef.current && fileRef.current.click()} style={{ ...styles.btn, ...styles.btnPrimary }}><FiUpload /> Upload CSV</button>
                  <button onClick={() => setShowImportModal(true)} style={styles.btnGhost}><FiUpload /> Paste JSON</button>
                  <button onClick={() => { exportProcessedJSON(); }} style={{ ...styles.btn, ...styles.btnPrimary }}><FiDownload /> Export JSON</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ color: "#64748b", marginBottom: 8 }}>Rows: {rows.length}</div>
                {csvParsing && <div style={{ color: "#64748b" }}>Parsing CSV...</div>}
                <div style={{ maxHeight: 300, overflow: "auto", borderRadius: 8, border: "1px solid #eef2f7" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={tableTh}>route</th>
                        <th style={tableTh}>timestamp</th>
                        <th style={tableTh}>value</th>
                        <th style={tableTh}>lat</th>
                        <th style={tableTh}>lng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tableTd}>{r.route ?? ""}</td>
                          <td style={tableTd}>{r.timestamp ? String(r.timestamp).slice(0, 19) : ""}</td>
                          <td style={tableTd}>{r.value ?? ""}</td>
                          <td style={tableTd}>{r.lat ?? ""}</td>
                          <td style={tableTd}>{r.lng ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && <div style={{ padding: 12, color: "#64748b" }}>No dataset rows — upload CSV or paste JSON.</div>}
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button onClick={() => clearDataset()} style={styles.ghostBtn}>Clear Dataset</button>
                  <button onClick={() => { setRows([]); setNotif((n) => ["Sample injected", ...n]); setRows([
                    { route: "R1", timestamp: nowISO(), value: 44, lat: 0.3476, lng: 32.5825 },
                    { route: "R2", timestamp: nowISO(), value: 58, lat: 0.348, lng: 32.58 },
                    { route: "R3", timestamp: nowISO(), value: 30, lat: 0.350, lng: 32.585 },
                  ]); }} style={styles.btn}>Inject Sample</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Marketplace */}
          {tab === "marketplace" && (
            <motion.div style={card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Marketplace</h3>
                <div style={{ color: "#64748b" }}>Cart: {cart.length} items</div>
              </div>

              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {market.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, border: "1px solid #eef2f7", borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{m.title}</div>
                      <div style={{ color: "#64748b" }}>{m.seller} • Stock: {m.stock}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ fontWeight: 800 }}>${m.price}</div>
                      <button onClick={() => addToCart(m.id)} style={styles.btnPrimarySmall}><FiShoppingCart /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => checkoutCart()} style={{ ...styles.btn, ...styles.btnPrimary }}>Checkout</button>
                <button onClick={() => { setCart([]); setNotif((n) => ["Cart cleared", ...n]); }} style={styles.ghostBtn}>Clear Cart</button>
              </div>
            </motion.div>
          )}

          {/* Settings */}
          {tab === "settings" && (
            <motion.div style={card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3>Settings & Administration</h3>
              <div style={{ color: "#64748b", marginTop: 8 }}>
                This admin console is a client-side prototype. For production, wire these actions to your backend.
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => resetDemo()} style={{ ...styles.btn, ...styles.btnDanger }}>Reset Demo</button>
                <button onClick={() => { pushAudit("admin", "Manual backup snapshot"); navigator.clipboard?.writeText(JSON.stringify({ users, reports, rows, market, orders }).slice(0, 4000)); setNotif((n) => ["Snapshot copied to clipboard", ...n]); }} style={styles.btnGhost}>Snapshot</button>
                <button onClick={() => { LS.remove("admin_users"); LS.remove("admin_reports"); LS.remove("admin_rows"); LS.remove("admin_market"); LS.remove("admin_orders"); LS.remove("admin_audit"); setNotif((n) => ["Cleared all admin storage", ...n]); }} style={styles.ghostBtn}>Wipe Storage</button>
              </div>
            </motion.div>
          )}
        </section>

        {/* Right column: small cards */}
        <aside style={{ gridColumn: "2 / span 1" }}>
          {/* Notifications */}
          <div style={card}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => { pushAudit("admin", "Force sync performed"); setNotif((n) => ["Force sync", ...n]); }} style={styles.actionBtn}><FiRepeat /></button>
              <button onClick={() => { pushAudit("admin", "Broadcast sent"); setNotif((n) => ["Broadcast: scheduled maintenance", ...n]); }} style={styles.ghostBtn}><FiActivity /></button>
              <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ users, reports, rows }).slice(0, 1000)); setNotif((n) => ["Copied preview to clipboard", ...n]); }} style={styles.actionBtn}><FiDownload /></button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={card}>
            <h4 style={{ marginTop: 0 }}>Recent Audit</h4>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {audit.slice(0, 8).map((a) => (
                <div key={a.id} style={{ padding: 8, borderBottom: "1px solid #eef2f7" }}>
                  <div style={{ fontWeight: 700 }}>{a.action}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{new Date(a.at).toLocaleString()} • {a.actor}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={card}>
            <h4 style={{ marginTop: 0 }}>Orders</h4>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {orders.length === 0 && <div style={{ color: "#64748b" }}>No orders</div>}
              {orders.map((o) => (
                <div key={o.id} style={{ padding: 8, borderBottom: "1px solid #eef2f7" }}>
                  <div style={{ fontWeight: 800 }}>{o.id}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{o.buyer} • {new Date(o.at).toLocaleString()}</div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>Total: ${o.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={card}>
            <h4 style={{ marginTop: 0 }}>AI Assistant</h4>
            <div style={{ color: "#64748b" }}>Quick ask: recommend routes, export, list users, show stats.</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <input placeholder="Ask AI..." style={styles.input} onKeyDown={(e) => { if (e.key === "Enter") { aiAsk(e.target.value); e.target.value = ""; } }} />
              <button onClick={() => { const q = prompt("Ask the admin AI:"); if (q) aiAsk(q); }} style={styles.btnGhost}>Ask</button>
            </div>
          </div>
        </aside>
      </main>

      {/* Floating AI panel */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} style={aiPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Assistant</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.ghostBtn} onClick={() => { setAiChat([{ id: uid("ai_"), who: "system", text: "Reset conversation." }]); setNotif((n) => ["AI chat reset", ...n]); }}>Reset</button>
                <button style={styles.ghostBtn} onClick={() => setAiOpen(false)}>Close</button>
              </div>
            </div>

            <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8, paddingRight: 6 }}>
              {aiChat.map((c) => (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.who}</div>
                  <div style={{ color: "#374151" }}>{c.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <input placeholder="Type..." style={styles.input} onKeyDown={(e) => { if (e.key === "Enter") { const v = e.target.value; aiAsk(v); e.target.value = ""; } }} />
              <button onClick={() => { const q = prompt("Ask AI:"); if (q) aiAsk(q); }} style={styles.btn}>Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals: create/edit user, import JSON */}
      <AnimatePresence>
        {showCreateUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalBackdrop} onClick={() => { setShowCreateUser(false); setEditingUser(null); }}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{editingUser ? "Edit user" : "Create user"}</h3>
                <button onClick={() => { setShowCreateUser(false); setEditingUser(null); }} style={modalCloseBtn}>✕</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <UserForm
                  initial={editingUser || {}}
                  onCancel={() => { setShowCreateUser(false); setEditingUser(null); }}
                  onSave={(form) => {
                    if (editingUser) updateUser(editingUser.id, form);
                    else createUser(form);
                    setShowCreateUser(false);
                    setEditingUser(null);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalBackdrop} onClick={() => setShowImportModal(false)}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Import JSON rows</h3>
                <button onClick={() => setShowImportModal(false)} style={modalCloseBtn}>✕</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <textarea ref={jsonPasteRef} placeholder='Paste JSON array here (e.g. [{"route":"R1","timestamp":"...","value":45}, ...])' style={{ width: "100%", height: 160, padding: 12, borderRadius: 8, border: "1px solid #eef2f7" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => { importJSONRows(jsonPasteRef.current.value); jsonPasteRef.current.value = ""; setShowImportModal(false); }} style={{ ...styles.btn, ...styles.btnPrimary }}>Import</button>
                  <button onClick={() => { jsonPasteRef.current.value = ""; }} style={styles.ghostBtn}>Clear</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <div style={toastWrap}>
        {notif.slice(0, 4).map((t, i) => <div key={i} style={toast}>{t}</div>)}
      </div>
    </div>
  );
}

/* -------------------- Styling -------------------- */
const pageWrap = {
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  padding: 18,
  background: "linear-gradient(180deg,#f7fafc 0%, #fff 100%)",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: 16,
};

const card = {
  background: "#fff",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
};

const kpiCard = {
  background: "#fff",
  padding: 12,
  borderRadius: 10,
  minWidth: 110,
  textAlign: "center",
  boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
};

const styles = {
  searchWrap: { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 8, border: "1px solid #eef2f7", background: "#fff" },
  search: { border: "none", outline: "none", width: 240, background: "transparent" },
  actionBtn: { padding: "8px 12px", borderRadius: 8, background: "#111827", color: "#fff", border: "none", cursor: "pointer" },
  ghostBtn: { padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #eef2f7", cursor: "pointer" },
  btn: { padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" },
  btnPrimary: { background: "#10b981", color: "#fff" },
  btnPrimarySmall: { background: "#10b981", color: "#fff", padding: "6px 8px", borderRadius: 6 },
  btnDanger: { background: "#ef4444", color: "#fff" },
  input: { padding: 8, borderRadius: 8, border: "1px solid #eef2f7", outline: "none", width: "100%" },
  select: { padding: 8, borderRadius: 8, border: "1px solid #eef2f7" },
  selectSmall: { padding: 8, borderRadius: 8, border: "1px solid #eef2f7", minWidth: 120 },
};

const tabBtn = (active) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: active ? "#111827" : "#fff",
  color: active ? "#fff" : "#0f172a",
});

const smallBtn = { padding: 8, borderRadius: 8, border: "none", background: "#f3f4f6", cursor: "pointer" };
const smallDanger = { padding: 8, borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer" };

const tableTh = { textAlign: "left", padding: 8, fontSize: 13, color: "#0f172a", borderBottom: "1px solid #eef2f7" };
const tableTd = { padding: 8, fontSize: 13, color: "#0f172a", borderBottom: "1px solid #f8fafc" };

const aiPanel = {
  position: "fixed",
  right: 24,
  bottom: 24,
  width: 360,
  background: "#fff",
  boxShadow: "0 20px 60px rgba(2,6,23,0.15)",
  padding: 12,
  borderRadius: 12,
  zIndex: 2200,
};

const modalBackdrop = { position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const modalCard = { width: 720, maxWidth: "95%", background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 30px 60px rgba(2,6,23,0.25)" };
const modalCloseBtn = { border: "none", background: "transparent", cursor: "pointer", fontSize: 18 };

const toastWrap = { position: "fixed", right: 20, bottom: 20, display: "flex", flexDirection: "column", gap: 8, zIndex: 4000 };
const toast = { background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8, boxShadow: "0 6px 14px rgba(0,0,0,0.25)" };
