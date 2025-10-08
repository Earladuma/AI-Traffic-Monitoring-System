import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(
      (u) => u.email === formData.email && u.password === formData.password
    );

    if (!user) {
      setError("Invalid email or password!");
      return;
    }

    // Save session
    localStorage.setItem("currentUser", JSON.stringify(user));

    navigate("/dashboard"); // Redirect after login
  };

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}></div>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>Welcome Back</h2>
        {error && <p style={errorStyle}>{error}</p>}

        <input
          style={inputStyle}
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          style={inputStyle}
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" style={btnStyle}>
          Login
        </button>
        <p style={switchStyle}>
          Don’t have an account?{" "}
          <span style={linkStyle} onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </form>
    </div>
  );
}

// Styles
const pageStyle = {
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80') no-repeat center/cover",
  fontFamily: "'Inter', sans-serif",
};

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  zIndex: 0,
};

const formStyle = {
  position: "relative",
  zIndex: 1,
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(16px)",
  padding: "40px",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "400px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  color: "#fff",
  boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
};

const titleStyle = { fontSize: "28px", color: "#FF914D", textAlign: "center" };
const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  fontSize: "16px",
  outline: "none",
};
const btnStyle = {
  background: "linear-gradient(90deg,#FF914D,#FFB84D)",
  border: "none",
  padding: "14px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "0.3s",
};
const switchStyle = { textAlign: "center", fontSize: "14px" };
const linkStyle = { color: "#FFB84D", cursor: "pointer", fontWeight: 600 };
const errorStyle = {
  color: "#FF6B6B",
  textAlign: "center",
  fontWeight: 600,
};
