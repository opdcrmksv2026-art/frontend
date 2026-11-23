// Centralized API configuration supporting both local development and Render production
export const API_URL =
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
    ? "http://localhost:5000"
    : (process.env.NEXT_PUBLIC_API_URL || "https://backend-c494.onrender.com");

