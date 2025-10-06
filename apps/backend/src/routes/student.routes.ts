import { RequestHandler, Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as RequestHandler);

// Get student profile details including section, group, etc.
router.get("/details", async (req, res) => {
  await StudentController.getDetails(req, res);
});

// Get today's classes
router.get("/today", async (req, res) => {
  await StudentController.getTodayClasses(req, res);
});

// Get current and upcoming classes for today
router.get("/current", async (req, res) => {
  await StudentController.getCurrentAndUpcomingClasses(req, res);
});

// Get timetable for a specific day
router.get("/timetable/:day", async (req, res) => {
  await StudentController.getDayTimetable(req, res);
});

// Get the weekly timetable
router.get("/timetable", async (req, res) => {
  await StudentController.getWeeklyTimetable(req, res);
});

// Get all courses for the student
router.get("/courses", async (req, res) => {
  await StudentController.getAllCourses(req, res);
});

// Get student's attendance for today
router.get("/attendance/today", async (req, res) => {
  await StudentController.getTodayAttendance(req, res);
});

// Get student's attendance by date range
router.get("/attendance/range", async (req, res) => {
  await StudentController.getAttendanceByDateRange(req, res);
});

// Get student's attendance summary (all courses)
router.get("/attendance/summary", async (req, res) => {
  await StudentController.getAttendanceSummary(req, res);
});

// Get student's attendance for a specific course
router.get("/attendance/course/:courseId", async (req, res) => {
  await StudentController.getCourseAttendance(req, res);
});

export default router;
