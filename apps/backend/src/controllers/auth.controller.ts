// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    const { rollNo, password } = req.body;
    const { accessToken, refreshToken } = await AuthService.login(rollNo, password, req);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken });
  }

  static async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  }
}
