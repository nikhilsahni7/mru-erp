import { RequestHandler, Router } from "express";
import { TeacherController } from "../controllers/teacher.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as RequestHandler);

// Get teacher profile details
router.get("/details", async (req, res) => {
  await TeacherController.getDetails(req, res);
});

// Get today's classes to teach
router.get("/today", async (req, res) => {
  await TeacherController.getTodayClasses(req, res);
});

// Get current and upcoming classes for today
router.get("/current", async (req, res) => {
  await TeacherController.getCurrentAndUpcomingClasses(req, res);
});

// Get timetable for a specific day
router.get("/timetable/:day", async (req, res) => {
  await TeacherController.getDayTimetable(req, res);
});

// Get the weekly timetable
router.get("/timetable", async (req, res) => {
  await TeacherController.getWeeklyTimetable(req, res);
});

// Get all courses taught by the teacher
router.get("/courses", async (req, res) => {
  await TeacherController.getAllCourses(req, res);
});

// Get components for a specific day (for attendance marking)
router.get("/components/:day", async (req, res) => {
  await TeacherController.getComponentsByDay(req, res);
});

// Get all sections with students that the teacher teaches
router.get("/sections/students", async (req, res) => {
  await TeacherController.getSectionsWithStudents(req, res);
});

// Update student group assignments
router.put("/students/groups", async (req, res) => {
  await TeacherController.updateStudentGroups(req, res);
});

export default router;
