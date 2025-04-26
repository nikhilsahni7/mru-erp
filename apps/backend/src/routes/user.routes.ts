// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authenticate, async (req, res) => {
  await UserController.profile(req, res);
});

export default router;
