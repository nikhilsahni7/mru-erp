// src/services/auth.service.ts

import { prisma } from "db";
import { Request } from "express";
import { verifyPassword } from "../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

export class AuthService {
  static async login(rollNo: string, password: string, req: Request) {
    const user = await prisma.user.findUnique({ where: { rollNo } });
    if (!user) throw new Error("Invalid credentials");

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    // Save session
    await prisma.session.create({
      data: {
        userId: user.id,
        ip: req.ip!,
        userAgent: req.headers['user-agent'] || "unknown",
      },
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) throw new Error("Invalid refresh token");

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    return { accessToken, newRefreshToken };
  }
}
