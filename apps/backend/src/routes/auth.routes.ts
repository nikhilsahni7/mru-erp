// src/routes/auth.routes.ts
import { RequestHandler, Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

// Type assertions to fix the type errors
const loginHandler = AuthController.login as RequestHandler;
const studentLoginHandler = AuthController.studentLogin as RequestHandler;
const teacherLoginHandler = AuthController.teacherLogin as RequestHandler;
const refreshHandler = AuthController.refreshToken as RequestHandler;
const logoutHandler = AuthController.logout as RequestHandler;

// General login (existing endpoint, maintained for compatibility)
router.post("/login", loginHandler);

// Role-specific login endpoints
router.post("/student/login", studentLoginHandler);
router.post("/teacher/login", teacherLoginHandler);

// Other auth routes
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

export default router;
