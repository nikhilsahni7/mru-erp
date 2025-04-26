// src/middlewares/auth.middleware.ts

import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";


export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
    return; // Return without next() to end middleware chain
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
}
