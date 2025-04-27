import type { DayOfWeek } from "db";
import { prisma } from "db";

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
                    department: true
                  }
                }
              }
            }
          }
        },
        group: true
      }
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
      section: student.section ? {
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
              code: student.section.batch.program.department.code
            }
          }
        }
      } : null,
      group: student.group ? {
        id: student.group.id,
        name: student.group.name
      } : null
    };
  }

  static async getStudentTimetableForDay(userId: string, day: DayOfWeek): Promise<any[]> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: true,
        group: true
      }
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
        academicTermId: currentTerm.id
      },
      include: {
        course: true,
        teacher: true,
        components: {
          include: {
            teacher: true,
            schedules: {
              where: {
                dayOfWeek: day
              },
              orderBy: {
                startTime: 'asc'
              }
            }
          },
          where: {
            OR: [
              { groupId: student.groupId }, // Group-specific component
              { groupId: null }             // Common component for all groups
            ]
          }
        }
      }
    });

    // Format the timetable data
    const timetableEntries = sectionCourses.flatMap(sectionCourse => {
      return sectionCourse.components.flatMap(component => {
        return component.schedules.map(schedule => {
          return {
            courseCode: sectionCourse.course.code,
            courseName: sectionCourse.course.name,
            componentType: component.componentType,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            roomNumber: schedule.roomNumber,
            teacher: component.teacher ? {
              name: component.teacher.name,
              id: component.teacher.id
            } : {
              name: sectionCourse.teacher.name,
              id: sectionCourse.teacher.id
            }
          };
        });
      });
    });

    // Sort by start time
    return timetableEntries.sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
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
      const startCompare = new Date(currentYear, termStart.getMonth(), termStart.getDate());
      const endCompare = new Date(currentYear, termEnd.getMonth(), termEnd.getDate());
      const todayCompare = new Date(currentYear, today.getMonth(), today.getDate());

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

  static async getStudentWeeklyTimetable(userId: string): Promise<Record<DayOfWeek, any[]>> {
    const daysOfWeek: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

    const timetable: Record<DayOfWeek, any[]> = {} as any;

    for (const day of daysOfWeek) {
      timetable[day] = await StudentService.getStudentTimetableForDay(userId, day);
    }

    return timetable;
  }

  static async getCurrentClassAndUpcoming(userId: string): Promise<{ currentClass: any | null; upcomingClasses: any[] }> {
    const today = new Date();
    const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][today.getDay()] as DayOfWeek;

    const todayClasses = await StudentService.getStudentTimetableForDay(userId, dayOfWeek);

    // Current time info
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Convert current time to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Find current class by comparing just the time portion, ignoring the date
    const currentClass = todayClasses.find(c => {
      const startTime = new Date(c.startTime);
      const endTime = new Date(c.endTime);

      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      // Convert class times to minutes
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      // Class is in progress if current time is between start and end time
      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    });

    // Find upcoming classes by comparing just the time portion
    const upcomingClasses = todayClasses.filter(c => {
      const startTime = new Date(c.startTime);
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();

      // Convert start time to minutes
      const startTimeInMinutes = startHour * 60 + startMinute;

      // Class is upcoming if start time is after current time
      return startTimeInMinutes > currentTimeInMinutes;
    });

    // Sort upcoming classes by start time
    upcomingClasses.sort((a, b) => {
      const startTimeA = new Date(a.startTime);
      const startTimeB = new Date(b.startTime);

      const hoursA = startTimeA.getHours();
      const minutesA = startTimeA.getMinutes();
      const hoursB = startTimeB.getHours();
      const minutesB = startTimeB.getMinutes();

      const timeInMinutesA = hoursA * 60 + minutesA;
      const timeInMinutesB = hoursB * 60 + minutesB;

      return timeInMinutesA - timeInMinutesB;
    });

    // Add a debug statement to help diagnose issues
    console.log(`Current time: ${currentHour}:${currentMinute}`);
    console.log(`Current class: ${currentClass ? currentClass.courseName : 'None'}`);
    console.log(`Upcoming classes: ${upcomingClasses.length}`);
    upcomingClasses.forEach(c => {
      const startTime = new Date(c.startTime);
      console.log(`  - ${c.courseName} at ${startTime.getHours()}:${startTime.getMinutes()}`);
    });

    return {
      currentClass: currentClass || null,
      upcomingClasses
    };
  }

  static async getAllCourses(userId: string): Promise<any[]> {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        section: true,
        group: true
      }
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
            OR: [
              { groupId: student.groupId },
              { groupId: null }
            ]
          }
        }
      },
      include: {
        course: true,
        teacher: true,
        components: {
          where: {
            OR: [
              { groupId: student.groupId },
              { groupId: null }
            ]
          },
          include: {
            teacher: true
          }
        }
      }
    });

    return sectionCourses.map(sc => ({
      id: sc.courseId,
      code: sc.course.code,
      name: sc.course.name,
      credits: sc.course.credits,
      mainTeacher: {
        id: sc.teacher.id,
        name: sc.teacher.name
      },
      componentTypes: sc.components.map(comp => ({
        type: comp.componentType,
        teacher: comp.teacher ? {
          id: comp.teacher.id,
          name: comp.teacher.name
        } : {
          id: sc.teacher.id,
          name: sc.teacher.name
        }
      }))
    }));
  }
}
