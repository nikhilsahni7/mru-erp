// src/controllers/user.controller.ts

import { Request, Response } from "express";
import { UserService } from "../services/user.service";



export class UserController {
  static async profile(req: Request, res: Response) {
    try {

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const profile = await UserService.getProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({
        error: "Failed to retrieve profile",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
