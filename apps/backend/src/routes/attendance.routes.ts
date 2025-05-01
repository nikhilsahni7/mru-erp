import { RequestHandler, Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as RequestHandler);

// Create a new attendance session for a course component
router.post("/session", async (req, res) => {
  await AttendanceController.createAttendanceSession(req, res);
});

// Mark attendance for students in a session
router.post("/mark", async (req, res) => {
  await AttendanceController.markAttendance(req, res);
});

// Get students list for marking attendance
router.get("/students/:componentId", async (req, res) => {
  await AttendanceController.getStudentsForAttendance(req, res);
});

// Get attendance sessions for a teacher by date range
router.get("/sessions", async (req, res) => {
  await AttendanceController.getAttendanceSessions(req, res);
});

// Get attendance details for a specific session
router.get("/session/:sessionId", async (req, res) => {
  await AttendanceController.getAttendanceSessionDetails(req, res);
});

// Get attendance summary for a course component
router.get("/summary/component/:componentId", async (req, res) => {
  await AttendanceController.getComponentAttendanceSummary(req, res);
});

// Get attendance summary for a student in a course
router.get("/summary/student/:studentId/course/:courseId", async (req, res) => {
  await AttendanceController.getStudentCourseAttendance(req, res);
});

// Get today's attendance sessions for a teacher
router.get("/today", async (req, res) => {
  await AttendanceController.getTodayAttendanceSessions(req, res);
});

// Update an attendance record
router.put("/record/:recordId", async (req, res) => {
  await AttendanceController.updateAttendanceRecord(req, res);
});

// Get a single attendance record
router.get("/record/:recordId", async (req, res) => {
  await AttendanceController.getAttendanceRecord(req, res);
});

// Get attendance by date range for a component
router.get("/range/:componentId", async (req, res) => {
  await AttendanceController.getAttendanceByDateRange(req, res);
});

export default router;
