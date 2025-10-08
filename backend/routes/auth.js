// File: backend/routes/auth.js

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import User from "../models/Users.js"; // Ensure correct capitalization
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ------------------- MULTER CONFIG -------------------
// Store uploaded profile photos in "uploads/" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ------------------- REGISTER ROUTE -------------------
router.post("/register", upload.single("profilePhoto"), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, adminCode } = req.body;

    // 1️⃣ Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    // 2️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // 3️⃣ Determine role
    let role = "user";
    if (adminCode) {
      if (adminCode === process.env.SUPERADMIN_CODE) role = "admin";
      else return res.status(403).json({ message: "Invalid admin code" });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      profilePhoto: req.file ? req.file.filename : null,
    });
    await user.save();

    // 6️⃣ Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // 7️⃣ Return response
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ------------------- LOGIN ROUTE -------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // 3️⃣ Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // 4️⃣ Return user info (without password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
