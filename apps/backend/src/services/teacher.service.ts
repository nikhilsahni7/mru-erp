import type { DayOfWeek } from "../lib/prisma";
import { prisma } from "../lib/prisma";

export class TeacherService {
  static async getTeacherDetails(userId: string): Promise<any> {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "TEACHER") {
      throw new Error("User is not a teacher");
    }

    return {
      id: teacher.id,
      name: teacher.name,
      rollNo: teacher.rollNo, // Acts as teacher ID
      email: teacher.email,
      phone: teacher.phone,
      clg: teacher.clg,
      branch: teacher.branch,
    };
  }

  static async getTeacherTimetableForDay(
    userId: string,
    day: DayOfWeek
  ): Promise<any[]> {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "TEACHER") {
      throw new Error("User is not a teacher");
    }

    // Get current academic term
    const currentTerm = await this.getCurrentAcademicTerm();

    if (!currentTerm) {
      throw new Error("No active academic term found");
    }

    // Classes where the teacher is the main instructor
    const mainCourseSchedules = await prisma.classSchedule.findMany({
      where: {
        component: {
          sectionCourse: {
            teacherId: userId,
            academicTermId: currentTerm.id,
          },
        },
        dayOfWeek: day,
      },
      include: {
        component: {
          include: {
            sectionCourse: {
              include: {
                course: true,
                section: {
                  include: {
                    batch: {
                      include: {
                        program: true,
                      },
                    },
                  },
                },
              },
            },
            group: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Classes where the teacher is a component-specific instructor
    const componentSchedules = await prisma.classSchedule.findMany({
      where: {
        component: {
          teacherId: userId,
          sectionCourse: {
            academicTermId: currentTerm.id,
          },
        },
        dayOfWeek: day,
      },
      include: {
        component: {
          include: {
            sectionCourse: {
              include: {
                course: true,
                section: {
                  include: {
                    batch: {
                      include: {
                        program: true,
                      },
                    },
                  },
                },
              },
            },
            group: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Create a Set of component IDs from main courses to filter out duplicates
    const mainComponentIds = new Set(
      mainCourseSchedules.map((schedule) => schedule.component.id)
    );

    // Filter out component schedules that are already in main course schedules
    const uniqueComponentSchedules = componentSchedules.filter(
      (schedule) => !mainComponentIds.has(schedule.component.id)
    );

    // Format and combine the results
    const formatSchedule = (schedule: any) => {
      // Format time values as HH:MM strings (using UTC to get IST times)
      const formatTimeToString = (dateObj: Date): string => {
        const hours = dateObj.getUTCHours().toString().padStart(2, "0");
        const minutes = dateObj.getUTCMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      return {
        courseCode: schedule.component.sectionCourse.course.code,
        courseName: schedule.component.sectionCourse.course.name,
        componentType: schedule.component.componentType,
        startTime: formatTimeToString(schedule.startTime),
        endTime: formatTimeToString(schedule.endTime),
        roomNumber: schedule.roomNumber,
        section: {
          name: schedule.component.sectionCourse.section.name,
          program: schedule.component.sectionCourse.section.batch.program.code,
          batch: schedule.component.sectionCourse.section.batch.year,
        },
        group: schedule.component.group
          ? {
              name: schedule.component.group.name,
            }
          : null,
      };
    };

    const combinedSchedules = [
      ...mainCourseSchedules.map(formatSchedule),
      ...uniqueComponentSchedules.map(formatSchedule),
    ];

    // Sort by start time using string comparison instead of Date.getTime()
    return combinedSchedules.sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  }

  static async getCurrentAcademicTerm(targetDate?: Date): Promise<any> {
    const checkDate = targetDate || new Date();

    // Get all academic terms
    const terms = await prisma.academicTerm.findMany();

    // Find a term where checkDate's month and day falls within the term's date range
    // Ignoring the year to handle data seeded for future years
    for (const term of terms) {
      const termStart = new Date(term.startDate);
      const termEnd = new Date(term.endDate);

      // For comparison, set all dates to the same year (current year)
      const currentYear = checkDate.getFullYear();

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
      const dateCompare = new Date(
        currentYear,
        checkDate.getMonth(),
        checkDate.getDate()
      );

      // Handle academic terms that span across years (e.g., Fall term from Sep to Jan)
      if (termStart.getMonth() > termEnd.getMonth()) {
        // Academic term spans across years, adjust end date
        endCompare.setFullYear(currentYear + 1);
      }

      // Check if checkDate is within the term date range
      if (dateCompare >= startCompare && dateCompare <= endCompare) {
        return term;
      }
    }

    // Fallback: return the first term if no active term found (for development purposes)
    const fallbackTerm = await prisma.academicTerm.findFirst();
    return fallbackTerm;
  }

  static async getTeacherWeeklyTimetable(
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
      timetable[day] = await TeacherService.getTeacherTimetableForDay(
        userId,
        day
      );
    }

    return timetable;
  }

  static async getCurrentClassAndUpcoming(
    userId: string
  ): Promise<{ currentClass: any | null; upcomingClasses: any[] }> {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "TEACHER") {
      throw new Error("User is not a teacher");
    }

    const today = new Date();
    // Use UTC time to match with stored schedule times (which are IST stored as UTC)
    const currentHour = today.getUTCHours();
    const currentMinute = today.getUTCMinutes();

    // Get day of week
    const dayOfWeek = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][today.getDay()] as DayOfWeek;

    // Get today's classes for the teacher
    const todayClasses = await this.getTeacherTimetableForDay(
      userId,
      dayOfWeek
    );

    // Calculate current time in minutes for comparison (e.g., 9:30 AM = 9*60 + 30 = 570 minutes)
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeString: string) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Find current class (if any)
    let currentClass = null;
    const upcomingClasses = [];

    for (const cls of todayClasses) {
      const startTimeInMinutes = timeToMinutes(cls.startTime);
      const endTimeInMinutes = timeToMinutes(cls.endTime);

      // If class is ongoing
      if (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes < endTimeInMinutes
      ) {
        currentClass = cls;
      }
      // If class is upcoming
      else if (currentTimeInMinutes < startTimeInMinutes) {
        upcomingClasses.push(cls);
      }
    }

    // Sort upcoming classes by start time and limit to next 3
    upcomingClasses.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    return {
      currentClass: currentClass,
      upcomingClasses: upcomingClasses.slice(0, 3), // Limit to next 3 classes
    };
  }

  static async getAllCourses(userId: string): Promise<any[]> {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "TEACHER") {
      throw new Error("User is not a teacher");
    }

    // Get current academic term
    const currentTerm = await this.getCurrentAcademicTerm();

    if (!currentTerm) {
      throw new Error("No active academic term found");
    }

    // Get all courses where the teacher is the main instructor
    const mainCourses = await prisma.sectionCourse.findMany({
      where: {
        teacherId: userId,
        academicTermId: currentTerm.id,
      },
      include: {
        course: true,
        section: {
          include: {
            batch: {
              include: {
                program: true,
              },
            },
          },
        },
        components: true,
      },
    });

    // Get all components where the teacher is a component-specific instructor
    const components = await prisma.courseComponent.findMany({
      where: {
        teacherId: userId,
        sectionCourse: {
          academicTermId: currentTerm.id,
        },
      },
      include: {
        sectionCourse: {
          include: {
            course: true,
            section: {
              include: {
                batch: {
                  include: {
                    program: true,
                  },
                },
              },
            },
          },
        },
        group: true,
      },
    });

    // Format main courses
    const formattedMainCourses = mainCourses.map((sc) => ({
      id: sc.courseId,
      code: sc.course.code,
      name: sc.course.name,
      credits: sc.course.credits,
      role: "Main Instructor",
      section: {
        id: sc.sectionId,
        name: sc.section.name,
        program: sc.section.batch.program.code,
        batch: sc.section.batch.year,
      },
      components: sc.components.map((comp) => ({
        type: comp.componentType,
        groupName: comp.groupId ? "Group specific" : "All section",
      })),
    }));

    // Track courses we've already added
    const addedCourses = new Set(
      mainCourses.map((sc) => `${sc.courseId}-${sc.sectionId}`)
    );

    // Format component-specific courses
    const formattedComponentCourses = components
      .filter((comp) => {
        const key = `${comp.sectionCourse.courseId}-${comp.sectionCourse.sectionId}`;
        return !addedCourses.has(key);
      })
      .map((comp) => ({
        id: comp.sectionCourse.courseId,
        code: comp.sectionCourse.course.code,
        name: comp.sectionCourse.course.name,
        credits: comp.sectionCourse.course.credits,
        role: `${comp.componentType} Instructor`,
        section: {
          id: comp.sectionCourse.sectionId,
          name: comp.sectionCourse.section.name,
          program: comp.sectionCourse.section.batch.program.code,
          batch: comp.sectionCourse.section.batch.year,
        },
        components: [
          {
            type: comp.componentType,
            groupName: comp.groupId
              ? comp.group
                ? comp.group.name
                : "Group specific"
              : "All section",
          },
        ],
      }));

    return [...formattedMainCourses, ...formattedComponentCourses];
  }

  static async getTeacherComponentsByDay(
    userId: string,
    day: DayOfWeek
  ): Promise<any[]> {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "TEACHER") {
      throw new Error("User is not a teacher");
    }

    // Get current academic term
    const currentTerm = await this.getCurrentAcademicTerm();

    if (!currentTerm) {
      throw new Error("No active academic term found");
    }

    // Find components taught by this teacher that have schedules on the specified day
    const components = await prisma.courseComponent.findMany({
      where: {
        OR: [
          // Components where teacher is the component-specific instructor
          {
            teacherId: userId,
            schedules: {
              some: {
                dayOfWeek: day,
              },
            },
          },
          // Components where teacher is the course instructor (for common components with no specific teacher)
          {
            teacherId: null,
            sectionCourse: {
              teacherId: userId,
            },
            schedules: {
              some: {
                dayOfWeek: day,
              },
            },
          },
        ],
      },
      include: {
        sectionCourse: {
          include: {
            course: true,
            section: true,
          },
        },
        group: true,
        schedules: {
          where: {
            dayOfWeek: day,
          },
        },
      },
    });

    // Helper function to format time as string (using UTC to get IST times)
    const formatTimeToString = (dateObj: Date): string => {
      const hours = dateObj.getUTCHours().toString().padStart(2, "0");
      const minutes = dateObj.getUTCMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    // Format the response
    return components.map((component) => {
      return {
        id: component.id,
        componentType: component.componentType,
        course: {
          id: component.sectionCourse.courseId,
          code: component.sectionCourse.course.code,
          name: component.sectionCourse.course.name,
        },
        section: {
          id: component.sectionCourse.sectionId,
          name: component.sectionCourse.section.name,
        },
        group: component.group
          ? {
              id: component.group.id,
              name: component.group.name,
            }
          : null,
        schedules: component.schedules.map((schedule) => ({
          day: schedule.dayOfWeek,
          startTime: formatTimeToString(schedule.startTime),
          endTime: formatTimeToString(schedule.endTime),
          roomNumber: schedule.roomNumber,
        })),
      };
    });
  }
}
