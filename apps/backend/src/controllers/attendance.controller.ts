import { AttendanceStatus, prisma } from "db";
import { Request, Response } from "express";
import { AttendanceService } from "../services/attendance.service";
import { TeacherService } from "../services/teacher.service";

export class AttendanceController {
  // Helper to validate component exists for given day and time
  private static async validateComponentSchedule(componentId: string, date: Date): Promise<boolean> {
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];

    // Get the component with its schedules
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: { schedules: true }
    });

    if (!component || !component.schedules || component.schedules.length === 0) {
      return false;
    }

    // Check if the component has a schedule for this day
    const hasScheduleForDay = component.schedules.some(
      schedule => schedule.dayOfWeek === dayOfWeek
    );

    return hasScheduleForDay;
  }

  static async createAttendanceSession(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { componentId, date, startTime, endTime, topic } = req.body;

      if (!componentId || !date || !startTime || !endTime) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Component ID, date, start time, and end time are required"
        });
      }

      // Verify the teacher can create attendance for this component
      const isAuthorized = await AttendanceService.verifyTeacherForComponent(teacherId, componentId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to create attendance for this course component"
        });
      }

      // Validate component schedule
      const isValidSchedule = await this.validateComponentSchedule(componentId, new Date(date));
      if (!isValidSchedule) {
        return res.status(400).json({
          error: "Invalid schedule",
          message: `This component doesn't have a scheduled class on ${new Date(date).toDateString()}`
        });
      }

      const session = await AttendanceService.createAttendanceSession({
        componentId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        topic
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating attendance session:", error);
      res.status(500).json({
        error: "Failed to create attendance session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async markAttendance(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { sessionId, attendanceRecords } = req.body;

      if (!sessionId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({
          error: "Invalid request body",
          message: "Session ID and attendance records array are required"
        });
      }

      // Validate the data structure
      for (const record of attendanceRecords) {
        if (!record.studentId || !record.status) {
          return res.status(400).json({
            error: "Invalid attendance record",
            message: "Each record must have studentId and status"
          });
        }
      }

      // Verify the teacher can mark attendance for this session
      const isAuthorized = await AttendanceService.verifyTeacherForSession(teacherId, sessionId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to mark attendance for this session"
        });
      }

      const result = await AttendanceService.markAttendance(sessionId, attendanceRecords);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({
        error: "Failed to mark attendance",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getStudentsForAttendance(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { componentId } = req.params;

      if (!componentId) {
        return res.status(400).json({
          error: "Missing component ID",
          message: "Component ID is required"
        });
      }

      // Verify the teacher can access this component
      const isAuthorized = await AttendanceService.verifyTeacherForComponent(teacherId, componentId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access this component"
        });
      }

      const students = await AttendanceService.getStudentsForComponent(componentId);
      res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching students for attendance:", error);
      res.status(500).json({
        error: "Failed to fetch students",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getAttendanceSessions(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing date range",
          message: "Start date and end date are required"
        });
      }

      const sessions = await AttendanceService.getAttendanceSessionsByDateRange(
        teacherId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching attendance sessions:", error);
      res.status(500).json({
        error: "Failed to fetch attendance sessions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getAttendanceSessionDetails(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: "Missing session ID",
          message: "Session ID is required"
        });
      }

      // Verify the teacher can access this session
      const isAuthorized = await AttendanceService.verifyTeacherForSession(teacherId, sessionId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access this session"
        });
      }

      const sessionDetails = await AttendanceService.getAttendanceSessionDetails(sessionId);
      res.status(200).json(sessionDetails);
    } catch (error) {
      console.error("Error fetching session details:", error);
      res.status(500).json({
        error: "Failed to fetch session details",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getComponentAttendanceSummary(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { componentId } = req.params;

      if (!componentId) {
        return res.status(400).json({
          error: "Missing component ID",
          message: "Component ID is required"
        });
      }

      // Verify the teacher can access this component
      const isAuthorized = await AttendanceService.verifyTeacherForComponent(teacherId, componentId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access this component"
        });
      }

      const summary = await AttendanceService.getComponentAttendanceSummary(componentId);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error fetching component attendance summary:", error);
      res.status(500).json({
        error: "Failed to fetch attendance summary",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getStudentCourseAttendance(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { studentId, courseId } = req.params;

      if (!studentId || !courseId) {
        return res.status(400).json({
          error: "Missing parameters",
          message: "Student ID and course ID are required"
        });
      }

      // Verify the teacher teaches this course
      const currentTerm = await TeacherService.getCurrentAcademicTerm();
      const isAuthorized = await AttendanceService.verifyTeacherForCourse(teacherId, courseId, currentTerm.id);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access this student's course attendance"
        });
      }

      const attendance = await AttendanceService.getStudentCourseAttendance(studentId, courseId);
      res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching student course attendance:", error);
      res.status(500).json({
        error: "Failed to fetch student attendance",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getTodayAttendanceSessions(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const today = new Date();
      // Set time to start of day
      today.setHours(0, 0, 0, 0);

      // Create end of day date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await AttendanceService.getAttendanceSessionsByDateRange(
        teacherId,
        today,
        tomorrow
      );

      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching today's attendance sessions:", error);
      res.status(500).json({
        error: "Failed to fetch today's sessions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async updateAttendanceRecord(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { recordId } = req.params;
      const { status, remark } = req.body;

      if (!recordId || !status) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Record ID and status are required"
        });
      }

      // Verify status is valid
      const validStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE", "EXCUSED"];
      if (!validStatuses.includes(status as AttendanceStatus)) {
        return res.status(400).json({
          error: "Invalid status",
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Verify the teacher can update this record
      const isAuthorized = await AttendanceService.verifyTeacherForRecord(teacherId, recordId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to update this attendance record"
        });
      }

      const updatedRecord = await AttendanceService.updateAttendanceRecord(recordId, {
        status: status as AttendanceStatus,
        remark
      });

      res.status(200).json(updatedRecord);
    } catch (error) {
      console.error("Error updating attendance record:", error);
      res.status(500).json({
        error: "Failed to update attendance record",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getAttendanceRecord(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { recordId } = req.params;

      if (!recordId) {
        return res.status(400).json({
          error: "Missing record ID",
          message: "Record ID is required"
        });
      }

      // Verify the teacher can access this record
      const isAuthorized = await AttendanceService.verifyTeacherForRecord(teacherId, recordId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access this attendance record"
        });
      }

      const record = await AttendanceService.getAttendanceRecord(recordId);
      if (!record) {
        return res.status(404).json({
          error: "Record not found",
          message: "The attendance record could not be found"
        });
      }

      res.status(200).json(record);
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      res.status(500).json({
        error: "Failed to fetch attendance record",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  static async getAttendanceByDateRange(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized - invalid user token" });
      }

      const teacherId = req.user.id;
      const { componentId } = req.params;
      const { startDate, endDate } = req.query;

      if (!componentId || !startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "Component ID, start date, and end date are required"
        });
      }

      // Verify the teacher can access this component
      const isAuthorized = await AttendanceService.verifyTeacherForComponent(teacherId, componentId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You are not authorized to access attendance for this component"
        });
      }

      const attendanceData = await AttendanceService.getAttendanceByDateRange(
        componentId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json(attendanceData);
    } catch (error) {
      console.error("Error fetching attendance by date range:", error);
      res.status(500).json({
        error: "Failed to fetch attendance data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
