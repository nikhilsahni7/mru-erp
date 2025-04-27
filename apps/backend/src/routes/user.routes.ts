// src/routes/user.routes.ts
import { RequestHandler, Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";


const router = Router();


router.get("/profile", authenticate as RequestHandler, async (req, res) => {
  await UserController.profile(req, res);
});

export default router;
