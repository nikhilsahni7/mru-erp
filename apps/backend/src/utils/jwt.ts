// src/utils/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

// Validate that secrets are set
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT secrets are not configured. Please set ACCESS_SECRET and REFRESH_SECRET in environment variables."
  );
}

export const signAccessToken = (user: any) => {
  if (!user || !user.id || !user.role) {
    throw new Error("Invalid user data for token generation");
  }
  return jwt.sign({ userId: user.id, role: user.role }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const signRefreshToken = (user: any) => {
  if (!user || !user.id || !user.role) {
    throw new Error("Invalid user data for token generation");
  }
  return jwt.sign({ userId: user.id, role: user.role }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
};
