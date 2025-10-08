import type { DayOfWeek } from "../lib/prisma";
import { prisma } from "../lib/prisma";

export class StudentService {
  static async getStudentDetails(userId: string): Promise<any> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: {
          include: {
            batch: {
              include: {
                program: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
        group: true,
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      phone: student.phone,
      clg: student.clg,
      branch: student.branch,
      section: student.section
        ? {
            id: student.section.id,
            name: student.section.name,
            semester: student.section.semester,
            batch: {
              year: student.section.batch.year,
              program: {
                name: student.section.batch.program.name,
                code: student.section.batch.program.code,
                department: {
                  name: student.section.batch.program.department.name,
                  code: student.section.batch.program.department.code,
                },
              },
            },
          }
        : null,
      group: student.group
        ? {
            id: student.group.id,
            name: student.group.name,
          }
        : null,
    };
  }

  static async getStudentTimetableForDay(
    userId: string,
    day: DayOfWeek
  ): Promise<any[]> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: true,
        group: true,
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (!student.section || !student.sectionId) {
      throw new Error("Student is not assigned to a section");
    }

    // Get current academic term, ignoring the year difference
    const currentTerm = await StudentService.getCurrentAcademicTerm();

    if (!currentTerm) {
      throw new Error("No active academic term found");
    }

    // Find all section courses for the student's section
    const sectionCourses = await prisma.sectionCourse.findMany({
      where: {
        sectionId: student.sectionId,
        academicTermId: currentTerm.id,
      },
      include: {
        course: true,
        teacher: true,
        components: {
          include: {
            teacher: true,
            schedules: {
              where: {
                dayOfWeek: day,
              },
              orderBy: {
                startTime: "asc",
              },
            },
          },
          where: {
            OR: [
              { groupId: student.groupId }, // Group-specific component
              { groupId: null }, // Common component for all groups
            ],
          },
        },
      },
    });

    // Format the timetable data
    const timetableEntries = sectionCourses.flatMap((sectionCourse) => {
      return sectionCourse.components.flatMap((component) => {
        return component.schedules.map((schedule) => {
          return {
            courseCode: sectionCourse.course.code,
            courseName: sectionCourse.course.name,
            componentType: component.componentType,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            roomNumber: schedule.roomNumber,
            teacher: component.teacher
              ? {
                  name: component.teacher.name,
                  id: component.teacher.id,
                }
              : {
                  name: sectionCourse.teacher.name,
                  id: sectionCourse.teacher.id,
                },
          };
        });
      });
    });

    // Sort by start time
    return timetableEntries.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }

  // Helper method to get current academic term, ignoring year differences
  static async getCurrentAcademicTerm(): Promise<any> {
    const today = new Date();

    // Get all academic terms
    const terms = await prisma.academicTerm.findMany();

    // Find a term where today's month and day falls within the term's date range
    // Ignoring the year to handle data seeded for future years
    for (const term of terms) {
      const termStart = new Date(term.startDate);
      const termEnd = new Date(term.endDate);

      // For comparison, set all dates to the same year (current year)
      const currentYear = today.getFullYear();

      // Create comparison dates with current year but keeping original month and day
      const startCompare = new Date(
        currentYear,
        termStart.getMonth(),
        termStart.getDate()
      );
      const endCompare = new Date(
        currentYear,
        termEnd.getMonth(),
        termEnd.getDate()
      );
      const todayCompare = new Date(
        currentYear,
        today.getMonth(),
        today.getDate()
      );

      // Handle academic terms that span across years (e.g., Fall term from Sep to Jan)
      if (termStart.getMonth() > termEnd.getMonth()) {
        // Academic term spans across years, adjust end date
        endCompare.setFullYear(currentYear + 1);
      }

      // Check if today is within the term date range
      if (todayCompare >= startCompare && todayCompare <= endCompare) {
        return term;
      }
    }

    // Fallback: return the first term if no active term found (for development purposes)
    const fallbackTerm = await prisma.academicTerm.findFirst();
    return fallbackTerm;
  }

  static async getStudentWeeklyTimetable(
    userId: string
  ): Promise<Record<DayOfWeek, any[]>> {
    const daysOfWeek: DayOfWeek[] = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    const timetable: Record<DayOfWeek, any[]> = {} as any;

    for (const day of daysOfWeek) {
      timetable[day] = await StudentService.getStudentTimetableForDay(
        userId,
        day
      );
    }

    return timetable;
  }

  static async getCurrentClassAndUpcoming(
    userId: string
  ): Promise<{ currentClass: any | null; upcomingClasses: any[] }> {
    const today = new Date();
    const dayOfWeek = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][today.getDay()] as DayOfWeek;

    const todayClasses = await StudentService.getStudentTimetableForDay(
      userId,
      dayOfWeek
    );

    // Current time info (get IST by adding 5:30 to UTC)
    const currentTime = new Date();
    let currentHour = currentTime.getUTCHours() + 5;
    let currentMinute = currentTime.getUTCMinutes() + 30;

    if (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }

    if (currentHour >= 24) {
      currentHour -= 24;
    }

    // Convert current time to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Find current class by comparing just the time portion, ignoring the date
    const currentClass = todayClasses.find((c) => {
      const startTime = new Date(c.startTime);
      const endTime = new Date(c.endTime);

      // Convert UTC to IST by adding 5:30
      let startHour = startTime.getUTCHours() + 5;
      let startMinute = startTime.getUTCMinutes() + 30;

      if (startMinute >= 60) {
        startMinute -= 60;
        startHour += 1;
      }

      if (startHour >= 24) {
        startHour -= 24;
      }

      let endHour = endTime.getUTCHours() + 5;
      let endMinute = endTime.getUTCMinutes() + 30;

      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
      }

      if (endHour >= 24) {
        endHour -= 24;
      }

      // Convert class times to minutes
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      // Class is in progress if current time is between start and end time
      return (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes < endTimeInMinutes
      );
    });

    // Find upcoming classes by comparing just the time portion
    const upcomingClasses = todayClasses.filter((c) => {
      const startTime = new Date(c.startTime);

      // Convert UTC to IST by adding 5:30
      let startHour = startTime.getUTCHours() + 5;
      let startMinute = startTime.getUTCMinutes() + 30;

      if (startMinute >= 60) {
        startMinute -= 60;
        startHour += 1;
      }

      if (startHour >= 24) {
        startHour -= 24;
      }

      // Convert start time to minutes
      const startTimeInMinutes = startHour * 60 + startMinute;

      // Class is upcoming if start time is after current time
      return startTimeInMinutes > currentTimeInMinutes;
    });

    // Sort upcoming classes by start time
    upcomingClasses.sort((a, b) => {
      const startTimeA = new Date(a.startTime);
      const startTimeB = new Date(b.startTime);

      // Convert UTC to IST
      let hoursA = startTimeA.getUTCHours() + 5;
      let minutesA = startTimeA.getUTCMinutes() + 30;

      if (minutesA >= 60) {
        minutesA -= 60;
        hoursA += 1;
      }

      if (hoursA >= 24) {
        hoursA -= 24;
      }

      let hoursB = startTimeB.getUTCHours() + 5;
      let minutesB = startTimeB.getUTCMinutes() + 30;

      if (minutesB >= 60) {
        minutesB -= 60;
        hoursB += 1;
      }

      if (hoursB >= 24) {
        hoursB -= 24;
      }

      const timeInMinutesA = hoursA * 60 + minutesA;
      const timeInMinutesB = hoursB * 60 + minutesB;

      return timeInMinutesA - timeInMinutesB;
    });

    // Add a debug statement to help diagnose issues
    console.log(`Current IST time: ${currentHour}:${currentMinute}`);
    console.log(
      `Current class: ${currentClass ? currentClass.courseName : "None"}`
    );
    console.log(`Upcoming classes: ${upcomingClasses.length}`);
    upcomingClasses.forEach((c) => {
      const startTime = new Date(c.startTime);
      let hour = startTime.getUTCHours() + 5;
      let minute = startTime.getUTCMinutes() + 30;
      if (minute >= 60) {
        minute -= 60;
        hour += 1;
      }
      if (hour >= 24) {
        hour -= 24;
      }
      console.log(`  - ${c.courseName} at ${hour}:${minute}`);
    });

    return {
      currentClass: currentClass || null,
      upcomingClasses,
    };
  }

  static async getAllCourses(userId: string): Promise<any[]> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: true,
        group: true,
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (!student.section || !student.sectionId) {
      throw new Error("Student is not assigned to a section");
    }

    // Get current academic term using new helper function
    const currentTerm = await StudentService.getCurrentAcademicTerm();

    if (!currentTerm) {
      throw new Error("No active academic term found");
    }

    // Find all section courses for the student's section
    const sectionCourses = await prisma.sectionCourse.findMany({
      where: {
        sectionId: student.sectionId,
        academicTermId: currentTerm.id,
        components: {
          some: {
            OR: [{ groupId: student.groupId }, { groupId: null }],
          },
        },
      },
      include: {
        course: true,
        teacher: true,
        components: {
          where: {
            OR: [{ groupId: student.groupId }, { groupId: null }],
          },
          include: {
            teacher: true,
          },
        },
      },
    });

    return sectionCourses.map((sc) => ({
      id: sc.courseId,
      code: sc.course.code,
      name: sc.course.name,
      credits: sc.course.credits,
      mainTeacher: {
        id: sc.teacher.id,
        name: sc.teacher.name,
      },
      componentTypes: sc.components.map((comp) => ({
        type: comp.componentType,
        teacher: comp.teacher
          ? {
              id: comp.teacher.id,
              name: comp.teacher.name,
            }
          : {
              id: sc.teacher.id,
              name: sc.teacher.name,
            },
      })),
    }));
  }

  static async getStudentAttendanceByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { section: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    if (!student.sectionId) {
      throw new Error("Student is not assigned to a section");
    }

    // Fetch all attendance sessions in the date range for the student's section
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        component: {
          sectionCourse: {
            sectionId: student.sectionId,
          },
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        component: {
          include: {
            sectionCourse: {
              include: {
                course: true,
              },
            },
            teacher: true,
          },
        },
        records: {
          where: {
            studentId: userId,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return attendanceSessions.map((session) => {
      const component = session.component;
      const course = component.sectionCourse.course;
      const teacher = component.teacher;

      return {
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        componentType: component.componentType,
        topic: session.topic,
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
        },
        teacher: teacher
          ? {
              id: teacher.id,
              name: teacher.name,
            }
          : null,
        status:
          session.records.length > 0 ? session.records[0].status : "NOT_MARKED",
        markedAt:
          session.records.length > 0 ? session.records[0].createdAt : null,
      };
    });
  }

  static async getStudentAttendanceSummary(userId: string): Promise<any> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { section: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    if (!student.sectionId) {
      throw new Error("Student is not assigned to a section");
    }

    // Get all attendance records for the student
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: userId,
      },
      include: {
        attendanceSession: {
          include: {
            component: {
              include: {
                sectionCourse: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate overall statistics
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "ABSENT"
    ).length;
    const overallPercentage =
      totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    // Calculate course-wise statistics
    const courseStats = new Map<string, any>();

    for (const record of attendanceRecords) {
      const course = record.attendanceSession.component.sectionCourse.course;
      const courseId = course.id;

      if (!courseStats.has(courseId)) {
        courseStats.set(courseId, {
          courseId: courseId,
          courseName: course.name,
          courseCode: course.code,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          percentage: 0,
        });
      }

      const stats = courseStats.get(courseId);
      stats.totalSessions++;
      if (record.status === "PRESENT") {
        stats.presentCount++;
      } else if (record.status === "ABSENT") {
        stats.absentCount++;
      }
    }

    // Calculate percentages for each course
    const courseWiseAttendance = Array.from(courseStats.values()).map(
      (stats) => ({
        ...stats,
        percentage:
          stats.totalSessions > 0
            ? (stats.presentCount / stats.totalSessions) * 100
            : 0,
      })
    );

    return {
      overall: {
        totalSessions,
        presentCount,
        absentCount,
        percentage: Math.round(overallPercentage * 100) / 100,
      },
      courseWise: courseWiseAttendance.map((stats) => ({
        ...stats,
        percentage: Math.round(stats.percentage * 100) / 100,
      })),
    };
  }

  static async getStudentCourseAttendance(
    userId: string,
    courseId: string
  ): Promise<any> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { section: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    if (!student.sectionId) {
      throw new Error("Student is not assigned to a section");
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Get all attendance sessions for this course
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        component: {
          sectionCourse: {
            sectionId: student.sectionId,
            courseId: courseId,
          },
        },
      },
      include: {
        component: {
          include: {
            teacher: true,
          },
        },
        records: {
          where: {
            studentId: userId,
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    const totalSessions = attendanceSessions.length;
    const markedSessions = attendanceSessions.filter(
      (s) => s.records.length > 0
    );
    const presentCount = markedSessions.filter(
      (s) => s.records[0].status === "PRESENT"
    ).length;
    const absentCount = markedSessions.filter(
      (s) => s.records[0].status === "ABSENT"
    ).length;
    const percentage =
      totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    return {
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
      },
      statistics: {
        totalSessions,
        presentCount,
        absentCount,
        percentage: Math.round(percentage * 100) / 100,
      },
      sessions: attendanceSessions.map((session) => {
        const component = session.component;
        const teacher = component.teacher;

        return {
          id: session.id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          componentType: component.componentType,
          topic: session.topic,
          teacher: teacher
            ? {
                id: teacher.id,
                name: teacher.name,
              }
            : null,
          status:
            session.records.length > 0
              ? session.records[0].status
              : "NOT_MARKED",
          markedAt:
            session.records.length > 0 ? session.records[0].createdAt : null,
        };
      }),
    };
  }
}
