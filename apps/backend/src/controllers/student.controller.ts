// src/controllers/student.controller.ts

import type { DayOfWeek } from "db";
import { Request, Response } from "express";
import { StudentService } from "../services/student.service";

export class StudentController {
  static async getDetails(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const userId = req.user.id;
      const studentDetails = await StudentService.getStudentDetails(userId);
      res.json(studentDetails);
    } catch (error) {
      console.error("Error fetching student details:", error);
      res.status(500).json({
        error: "Failed to retrieve student details",
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

      const classes = await StudentService.getStudentTimetableForDay(userId, dayOfWeek);
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
      const classInfo = await StudentService.getCurrentClassAndUpcoming(userId);
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

      const timetable = await StudentService.getStudentTimetableForDay(userId, day);
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
      console.log(`[Performance] Starting weekly timetable fetch for user ${userId}`);

      // TODO: In the future, implement Redis caching here
      // Check if we have the timetable in cache
      // const cachedTimetable = await redisClient.get(`timetable:${userId}`);
      // if (cachedTimetable) {
      //   console.log(`[Cache] Using cached timetable for user ${userId}`);
      //   console.log(`[Performance] Timetable fetch from cache: ${Date.now() - startTime}ms`);
      //   return res.json(JSON.parse(cachedTimetable));
      // }

      // If not in cache, fetch from database
      const timetable = await StudentService.getStudentWeeklyTimetable(userId);

      // Log performance metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[Performance] Weekly timetable fetch completed in ${duration}ms for user ${userId}`);

      // TODO: In the future, save result to Redis cache
      // await redisClient.set(`timetable:${userId}`, JSON.stringify(timetable), 'EX', 3600); // Cache for 1 hour

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
      const courses = await StudentService.getAllCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({
        error: "Failed to retrieve courses",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
