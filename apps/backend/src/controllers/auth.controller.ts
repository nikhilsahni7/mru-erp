// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { rollNo, password } = req.body;

      // Validate required fields
      if (!rollNo || !password) {
        return res.status(400).json({
          message: "Roll number and password are required",
        });
      }

      const { accessToken, refreshToken } = await AuthService.login(
        rollNo,
        password,
        req
      );

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
      // Return a clear error message to the client
      return res.status(401).json({
        message: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  }

  static async studentLogin(req: Request, res: Response) {
    try {
      const { rollNo, password } = req.body;

      // Validate required fields
      if (!rollNo || !password) {
        return res.status(400).json({
          message: "Roll number and password are required",
        });
      }

      // Pass the STUDENT role as the allowed role
      const { accessToken, refreshToken } = await AuthService.login(
        rollNo,
        password,
        req,
        "STUDENT"
      );

      // Set refresh token as an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Accessible from all paths
      });

      // Set access token as an HTTP-only cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/", // Accessible from all paths
      });

      // Also return the token in the response body for clients that need it
      res.json({ accessToken });
    } catch (error) {
      console.error("Student login error:", error);
      // Return a clear error message to the client
      return res.status(401).json({
        message: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  }

  static async teacherLogin(req: Request, res: Response) {
    try {
      const { rollNo, password } = req.body;

      // Validate required fields
      if (!rollNo || !password) {
        return res.status(400).json({
          message: "Roll number and password are required",
        });
      }

      // Pass the TEACHER role as the allowed role
      const { accessToken, refreshToken } = await AuthService.login(
        rollNo,
        password,
        req,
        "TEACHER"
      );

      // Set refresh token as an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/", // Accessible from all paths
      });

      // Set access token as an HTTP-only cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/", // Accessible from all paths
      });

      // Also return the token in the response body for clients that need it
      res.json({ accessToken });
    } catch (error) {
      console.error("Teacher login error:", error);
      // Return a clear error message to the client
      return res.status(401).json({
        message: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        // Clear any existing invalid cookies
        res.clearCookie("accessToken", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        res.clearCookie("refreshToken", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        return res.status(401).json({ message: "Refresh token not found" });
      }

      const { accessToken, newRefreshToken } = await AuthService.refresh(
        refreshToken
      );

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

      // Clear cookies on error - force relogin with proper cookie options
      res.clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Return appropriate status code and error message
      if (error instanceof jwt.TokenExpiredError) {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      } else {
        return res.status(401).json({
          message:
            error instanceof Error ? error.message : "Invalid refresh token",
        });
      }
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      // Clear both cookies with proper options
      res.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.clearCookie("accessToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Error during logout",
      });
    }
  }
}
