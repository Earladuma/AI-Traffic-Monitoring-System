// File: backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";

/**
 * Protect routes – ensures the request has a valid JWT token
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info (id + role) to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * Admin-only routes – ensures the authenticated user is an admin
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
