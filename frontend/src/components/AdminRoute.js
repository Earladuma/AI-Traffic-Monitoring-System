// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../services/auth";

/**
 * AdminRoute protects routes that require admin access.
 * If the user is not logged in or not an admin, they are redirected to login.
 */
export default function AdminRoute({ children }) {
  const user = getCurrentUser();

  // If user is not logged in or doesn't have admin role
  if (!isAuthenticated() || !user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and is admin
  return children;
}
