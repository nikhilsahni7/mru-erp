// src/middlewares/auth.middleware.ts

import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // First, check for token in HTTP-only cookie (preferred)
  const cookieToken = req.cookies.accessToken;

  // Then, check for token in Authorization header as fallback
  const authHeader = req.headers.authorization;
  const headerToken = authHeader ? authHeader.split(" ")[1] : null;

  // Use the cookie token if available, otherwise try the header token
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({
      message: "Unauthorized - Invalid token",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
