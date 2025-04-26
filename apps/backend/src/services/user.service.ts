// src/services/user.service.ts

import type { Branch, Clg } from "db";
import { prisma } from "db";
export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sessions: true },
    });
    if (!user) throw new Error("User not found");

    return {
      name: user.name,
      rollNo: user.rollNo,
      branch: user.branch as Branch,
      phone: user.phone,
      clg: user.clg as Clg,
      email: user.email,
      devices: user.sessions.map(s => ({
        ip: s.ip,
        userAgent: s.userAgent,
        loggedInAt: s.createdAt,
      })),
    };
  }
}
