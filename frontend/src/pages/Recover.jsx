// src/pages/Recover.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Recover() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleRecover = () => {
    if (!email) {
      setMessage("⚠️ Please enter your email.");
      setStatus("error");
      return;
    }
    if (!validateEmail(email)) {
      setMessage("❌ Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("");

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find((u) => u.email === email);

      if (user) {
        setMessage(`📩 A recovery link has been sent to ${email}`);
        setStatus("success");

        // Simulate user clicking recovery link
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setMessage("❌ No account found with that email.");
        setStatus("error");
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=1650&q=80')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-yellow-900/80"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md text-white"
      >
        <h2 className="text-3xl font-bold text-center mb-6 tracking-wide">
          Recover Account
        </h2>

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <button
          onClick={handleRecover}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 shadow-lg transition disabled:opacity-50 mt-2 font-semibold"
        >
          {loading ? "⏳ Sending..." : "Send Recovery Link"}
        </button>

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 text-center font-semibold ${
              status === "success" ? "text-green-300" : "text-red-300"
            }`}
          >
            {message}
          </motion.p>
        )}

        <div className="mt-6 text-center space-y-2 text-sm">
          <p>
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-yellow-300 hover:underline font-semibold"
            >
              Go back to Login
            </button>
          </p>
          <p>
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-orange-300 hover:underline font-semibold"
            >
              Create one
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
