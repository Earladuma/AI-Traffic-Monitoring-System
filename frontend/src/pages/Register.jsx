import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const SUPER_CODE = "TRAFFIC123"; // special admin registration code

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    password: "",
    confirmPassword: "",
    supercode: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Assign role based on supercode
    const role =
      formData.supercode.trim() === SUPER_CODE ? "admin" : "user";

    const newUser = { ...formData, role };
    delete newUser.confirmPassword;

    // Save in localStorage (no backend for now)
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === formData.email)) {
      setError("Email already registered!");
      return;
    }
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    setSuccess(`Registered successfully as ${role}! Redirecting...`);
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}></div>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>Create Account</h2>
        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <input
          style={inputStyle}
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <input
          style={inputStyle}
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
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
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          style={inputStyle}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <input
          style={inputStyle}
          type="date"
          name="dob"
          placeholder="Date of Birth"
          value={formData.dob}
          onChange={handleChange}
          required
        />
        <input
          style={inputStyle}
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
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
        <input
          style={inputStyle}
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          type="text"
          name="supercode"
          placeholder="Supercode (Admin only)"
          value={formData.supercode}
          onChange={handleChange}
        />

        <button type="submit" style={btnStyle}>
          Register
        </button>
        <p style={switchStyle}>
          Already have an account?{" "}
          <span style={linkStyle} onClick={() => navigate("/login")}>
            Login
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
    "url('https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1600&q=80') no-repeat center/cover",
  fontFamily: "'Inter', sans-serif",
};

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
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
  maxWidth: "420px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  color: "#fff",
  boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
};

const titleStyle = {
  fontSize: "28px",
  color: "#FFB84D",
  textAlign: "center",
  marginBottom: "12px",
};
const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
  transition: "0.3s",
};
const btnStyle = {
  background: "linear-gradient(90deg,#FFB84D,#FF914D)",
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
const successStyle = {
  color: "#10B981",
  textAlign: "center",
  fontWeight: 600,
};
