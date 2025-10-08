// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      navigate("/login", { replace: true });
    } else {
      setForm(currentUser);
    }
  }, [navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    setError("");
    setMessage("");

    if (!form.email.includes("@")) {
      setError("❌ Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("❌ Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      let users = JSON.parse(localStorage.getItem("users")) || [];

      // Update or add user
      const userExists = users.some(u => u.username === form.username);
      if (userExists) {
        users = users.map((u) => (u.username === form.username ? { ...form } : u));
      } else {
        users.push(form);
      }

      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(form));

      setMessage("✅ Profile updated successfully!");
      setSaving(false);
    }, 1000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative p-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=1650&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/70 to-amber-900/70"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-yellow-200/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-lg text-white border border-yellow-400/40"
      >
        <h2 className="text-4xl font-bold text-center mb-6 tracking-wide text-yellow-300 drop-shadow-lg">
          ⚙️ Account Settings
        </h2>

        {/* Form Inputs */}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-yellow-50/20 text-white placeholder-yellow-200 border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-yellow-50/20 text-white placeholder-yellow-200 border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-yellow-50/20 text-white placeholder-yellow-200 border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-yellow-50/20 text-white placeholder-yellow-200 border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="relative mb-3">
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-yellow-50/20 text-white placeholder-yellow-200 border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-yellow-300"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? "🙈 Hide" : "👁 Show"}
          </button>
        </div>

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-yellow-50/20 text-white border border-yellow-400/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="" disabled>Select Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 shadow-lg font-semibold text-white disabled:opacity-50"
        >
          {saving ? "💾 Saving..." : "Save Changes"}
        </button>

        {error && <p className="mt-4 text-center font-semibold text-red-400">{error}</p>}
        {message && <p className="mt-4 text-center font-semibold text-yellow-300">{message}</p>}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 shadow-md"
          >
            ⬅ Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 shadow-md"
          >
            🏠 Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
