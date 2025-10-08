// src/services/auth.service.ts

import { Request } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { verifyPassword } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export class AuthService {
  static async login(
    rollNo: string,
    password: string,
    req: Request,
    allowedRole?: string
  ) {
    // Ensure inputs are valid
    if (!rollNo || !password) {
      throw new Error("Roll number and password are required");
    }

    // Find the user by roll number
    const user = await prisma.user.findUnique({ where: { rollNo } });
    if (!user) {
      // Use a generic message for security reasons
      throw new Error("Invalid credentials");
    }

    // Check if the role is allowed for this endpoint if a specific role is required
    if (allowedRole && user.role !== allowedRole) {
      throw new Error(
        `Unauthorized: Only ${allowedRole.toLowerCase()} accounts can login through this portal`
      );
    }

    // Verify password
    try {
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Password verification error:", error);
      throw new Error("Invalid credentials");
    }

    // Save session
    try {
      await prisma.session.create({
        data: {
          userId: user.id,
          ip: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });
    } catch (error) {
      console.error("Session creation error:", error);
      // Continue login process even if session creation fails
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    try {
      // Try to verify the refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Log the payload for debugging
      console.log("Refresh token payload:", {
        userId: payload.userId,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat,
      });

      // Check if userId is valid
      if (!payload.userId) {
        throw new Error("Invalid token payload: missing userId");
      }

      // If verification succeeds, find the user
      console.log("Looking for user with ID:", payload.userId);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        console.log("User not found in database with ID:", payload.userId);
        // Check if any users exist at all
        const userCount = await prisma.user.count();
        console.log("Total users in database:", userCount);

        if (userCount === 0) {
          throw new Error(
            "No users found in database - database may have been reset"
          );
        }

        throw new Error("User not found - token may be for a deleted account");
      }

      console.log("User found, generating new tokens for:", user.rollNo);

      // Generate new tokens
      const accessToken = signAccessToken(user);
      const newRefreshToken = signRefreshToken(user);

      return { accessToken, newRefreshToken };
    } catch (error) {
      // Provide more specific error messages based on error type
      console.error("Token refresh error:", error);

      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Session expired, please login again");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token format, please login again");
      } else if (error instanceof Error) {
        throw error; // Rethrow the original error with its message
      } else {
        throw new Error("Session validation failed, please login again");
      }
    }
  }
}
