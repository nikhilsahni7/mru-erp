import type { DayOfWeek } from "db";
import { Request, Response } from "express";
import { TeacherService } from "../services/teacher.service";

export class TeacherController {
  static async getDetails(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const teacherDetails = await TeacherService.getTeacherDetails(userId);
      res.json(teacherDetails);
    } catch (error) {
      console.error("Error fetching teacher details:", error);
      res.status(500).json({
        error: "Failed to retrieve teacher details",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getTodayClasses(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const today = new Date();
      const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][today.getDay()] as DayOfWeek;

      const classes = await TeacherService.getTeacherTimetableForDay(userId, dayOfWeek);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({
        error: "Failed to retrieve today's classes",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getCurrentAndUpcomingClasses(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const classInfo = await TeacherService.getCurrentClassAndUpcoming(userId);
      res.json(classInfo);
    } catch (error) {
      console.error("Error fetching current classes:", error);
      res.status(500).json({
        error: "Failed to retrieve current and upcoming classes",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getDayTimetable(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const day = req.params.day as DayOfWeek;

      // Validate the day parameter
      const validDays: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      if (!validDays.includes(day)) {
        return res.status(400).json({
          error: "Invalid day parameter",
          message: `Day must be one of: ${validDays.join(', ')}`
        });
      }

      const timetable = await TeacherService.getTeacherTimetableForDay(userId, day);
      res.json(timetable);
    } catch (error) {
      console.error(`Error fetching timetable for day:`, error);
      res.status(500).json({
        error: "Failed to retrieve timetable",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getWeeklyTimetable(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;

      // Set a longer timeout for this complex query
      res.setTimeout(60000); // 60 seconds

      // Performance tracking
      const startTime = Date.now();
      console.log(`[Performance] Starting weekly timetable fetch for teacher ${userId}`);

      // TODO: In the future, implement Redis caching here

      // Fetch from database
      const timetable = await TeacherService.getTeacherWeeklyTimetable(userId);

      // Log performance metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[Performance] Weekly timetable fetch completed in ${duration}ms for teacher ${userId}`);

      res.json(timetable);
    } catch (error) {
      console.error("Error fetching weekly timetable:", error);
      res.status(500).json({
        error: "Failed to retrieve weekly timetable",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getAllCourses(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const courses = await TeacherService.getAllCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({
        error: "Failed to retrieve courses",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getComponentsByDay(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const day = req.params.day as DayOfWeek;

      // Validate the day parameter
      const validDays: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      if (!validDays.includes(day)) {
        return res.status(400).json({
          error: "Invalid day parameter",
          message: `Day must be one of: ${validDays.join(', ')}`
        });
      }

      const components = await TeacherService.getTeacherComponentsByDay(userId, day);
      res.json(components);
    } catch (error) {
      console.error(`Error fetching components for day:`, error);
      res.status(500).json({
        error: "Failed to retrieve components",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
