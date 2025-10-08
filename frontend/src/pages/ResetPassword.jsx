// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setMessage("⚠️ Invalid recovery link.");
      setStatus("error");
    }
  }, [email]);

  const handleReset = () => {
    if (!newPassword || !confirmPassword) {
      setMessage("⚠️ Please fill in all fields.");
      setStatus("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("⚠️ Password must be at least 6 characters.");
      setStatus("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const updatedUsers = users.map((u) =>
        u.email === email ? { ...u, password: newPassword } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // auto-login after reset
      const currentUser = updatedUsers.find(u => u.email === email);
      if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));

      setMessage("✅ Password reset successfully!");
      setStatus("success");

      setTimeout(() => {
        if (currentUser.role === "admin") navigate("/admin", { replace: true });
        else navigate("/profile", { replace: true });
      }, 2000);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md text-white"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="New password (min 6 chars)"
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 shadow-lg transition disabled:opacity-50"
        >
          {loading ? "⏳ Resetting..." : "Reset Password"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center font-semibold ${
              status === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-center text-sm space-y-2">
          <p>
            Remembered your password?{" "}
            <a href="/login" className="text-yellow-300 hover:underline">
              Login
            </a>
          </p>
          <p>
            Don’t have an account?{" "}
            <a href="/register" className="text-orange-300 hover:underline">
              Register
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
