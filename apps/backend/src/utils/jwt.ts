// src/utils/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export const signAccessToken = (user: any) => jwt.sign({ userId: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: "15m" });
export const signRefreshToken = (user: any) => jwt.sign({ userId: user.id, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) => jwt.verify(token, ACCESS_SECRET) as any;
export const verifyRefreshToken = (token: string) => jwt.verify(token, REFRESH_SECRET) as any;
