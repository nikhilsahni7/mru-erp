// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { rollNo, password } = req.body;
      const { accessToken, refreshToken } = await AuthService.login(rollNo, password, req);

      // Set refresh token as an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from strict to lax for better cross-site functioning
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Accessible from all paths
      });

      // Set access token as an HTTP-only cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from strict to lax
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/", // Accessible from all paths
      });

      // Also return the token in the response body for clients that need it
      res.json({ accessToken });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        message: error instanceof Error ? error.message : "Invalid credentials"
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
      }

      const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken);

      // Set new refresh token as an HTTP-only cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Set new access token as an HTTP-only cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });

      res.json({ accessToken });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({
        message: error instanceof Error ? error.message : "Invalid refresh token"
      });
    }
  }

  static async logout(req: Request, res: Response) {
    // Clear both cookies
    res.clearCookie("refreshToken", { path: "/" });
    res.clearCookie("accessToken", { path: "/" });
    res.json({ message: "Logged out" });
  }
}
