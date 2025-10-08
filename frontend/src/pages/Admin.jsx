// File: src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaClipboardList, FaUsersCog, FaTools } from "react-icons/fa";

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("reports"); // reports | users | system

  // Fetch reports (fallback included)
  useEffect(() => {
    axios
      .get("/api/reports")
      .then((r) => setReports(r.data))
      .catch(() =>
        setReports([
          { id: 1, message: "Accident on Highway 5 🚗💥", confirmed: false },
          { id: 2, message: "Heavy traffic at Junction 7 🚦", confirmed: true },
        ])
      );
  }, []);

  // Fetch users (fallback included)
  useEffect(() => {
    axios
      .get("/api/users")
      .then((r) => setUsers(r.data))
      .catch(() =>
        setUsers([
          { id: 1, name: "John Doe", role: "user", active: true },
          { id: 2, name: "Jane Admin", role: "admin", active: true },
        ])
      );
  }, []);

  // Confirm report
  function confirmReport(id) {
    axios
      .post(`/api/reports/${id}/confirm`)
      .then(() =>
        setReports((prev) =>
          prev.map((p) => (p.id === id ? { ...p, confirmed: true } : p))
        )
      )
      .catch(() =>
        setReports((prev) =>
          prev.map((p) => (p.id === id ? { ...p, confirmed: true } : p))
        )
      );
  }

  // Delete report
  function deleteReport(id) {
    axios
      .delete(`/api/reports/${id}`)
      .then(() => setReports((prev) => prev.filter((p) => p.id !== id)))
      .catch(() =>
        setReports((prev) => prev.filter((p) => p.id !== id))
      );
  }

  // Change user role
  function changeRole(id, newRole) {
    axios
      .post(`/api/users/${id}/role`, { role: newRole })
      .then(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
        )
      )
      .catch(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
        )
      );
  }

  // Toggle user active status
  function toggleActive(id) {
    axios
      .post(`/api/users/${id}/toggle`)
      .then(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
        )
      )
      .catch(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
        )
      );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(to bottom right, #1e3a8a, #6b21a8, #000000)",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 p-6 flex flex-col shadow-lg"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h2
          className="text-2xl font-extrabold mb-8"
          style={{ color: "#FFD700" }}
        >
          Admin Panel
        </h2>
        <nav className="space-y-4">
          <button
            onClick={() => setTab("reports")}
            className={`flex items-center px-4 py-2 rounded-lg w-full transition ${
              tab === "reports" ? "bg-yellow-500 text-black" : "hover:bg-gray-700"
            }`}
          >
            <FaClipboardList className="mr-3" /> Reports
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center px-4 py-2 rounded-lg w-full transition ${
              tab === "users" ? "bg-yellow-500 text-black" : "hover:bg-gray-700"
            }`}
          >
            <FaUsersCog className="mr-3" /> Users
          </button>
          <button
            onClick={() => setTab("system")}
            className={`flex items-center px-4 py-2 rounded-lg w-full transition ${
              tab === "system" ? "bg-yellow-500 text-black" : "hover:bg-gray-700"
            }`}
          >
            <FaTools className="mr-3" /> System
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 p-10 overflow-y-auto"
        style={{ minHeight: "100vh" }}
      >
        <h1 className="text-3xl font-bold mb-8">
          {tab === "reports" && "🚦 Manage Reports"}
          {tab === "users" && "👥 Manage Users"}
          {tab === "system" && "⚙️ System Overview"}
        </h1>

        {/* Reports Section */}
        {tab === "reports" && (
          <div className="max-w-3xl">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-white text-black p-5 rounded-xl shadow-lg mb-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{r.message}</p>
                  <p
                    className={`text-sm ${
                      r.confirmed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {r.confirmed ? "Confirmed ✅" : "Pending ⏳"}
                  </p>
                </div>
                <div className="space-x-2">
                  {!r.confirmed && (
                    <button
                      onClick={() => confirmReport(r.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg"
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => deleteReport(r.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Section */}
        {tab === "users" && (
          <div className="max-w-4xl">
            <table className="w-full bg-white text-black rounded-lg shadow-lg overflow-hidden">
              <thead className="bg-indigo-700 text-white">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">
                      {u.active ? (
                        <span className="text-green-600 font-semibold">Active</span>
                      ) : (
                        <span className="text-red-600 font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() =>
                          changeRole(u.id, u.role === "user" ? "admin" : "user")
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                      >
                        Make {u.role === "user" ? "Admin" : "User"}
                      </button>
                      <button
                        onClick={() => toggleActive(u.id)}
                        className={`px-3 py-1 ${
                          u.active ? "bg-yellow-600" : "bg-green-600"
                        } text-white rounded-lg`}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* System Section */}
        {tab === "system" && (
          <div className="max-w-2xl">
            <div className="bg-white text-black p-6 rounded-xl shadow-lg">
              <p className="mb-2">🚦 Total Reports: {reports.length}</p>
              <p className="mb-2">👥 Total Users: {users.length}</p>
              <p className="mb-2">
                ✅ Confirmed Reports: {reports.filter((r) => r.confirmed).length}
              </p>
              <p className="mb-2 text-green-600 font-semibold">
                ⚙️ System running normally
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
