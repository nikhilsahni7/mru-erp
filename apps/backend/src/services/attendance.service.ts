import { AttendanceStatus, prisma } from "db";
import { AttendanceSessionDTO } from "../types/attendance.types";

// Define a simple interface for record type
interface RecordWithStatus {
  status: AttendanceStatus;
}

export class AttendanceService {
  static async createAttendanceSession(sessionData: {
    componentId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    topic?: string;
  }): Promise<AttendanceSessionDTO> {
    try {
      // Check if a session already exists with the same componentId, date, and startTime
      const existingSession = await prisma.attendanceSession.findFirst({
        where: {
          componentId: sessionData.componentId,
          date: {
            equals: new Date(sessionData.date.toISOString().split('T')[0]),
          },
          startTime: {
            equals: sessionData.startTime,
          }
        },
        include: {
          component: {
            include: {
              sectionCourse: {
                include: {
                  course: true,
                  section: true
                }
              },
              group: true,
              teacher: true
            }
          },
          records: true
        }
      });

      if (existingSession) {
        console.log(`Session already exists for component ${sessionData.componentId} on date ${sessionData.date.toISOString().split('T')[0]} at ${sessionData.startTime.toISOString()}`);
        return this.formatAttendanceSessionDTO(existingSession);
      }

      // Create the attendance session
      const session = await prisma.attendanceSession.create({
        data: {
          componentId: sessionData.componentId,
          date: sessionData.date,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          topic: sessionData.topic || null
        },
        include: {
          component: {
            include: {
              sectionCourse: {
                include: {
                  course: true,
                  section: true
                }
              },
              group: true,
              teacher: true
            }
          }
        }
      });

      // Get all students for this component to pre-populate attendance records
      const students = await this.getStudentsForComponent(sessionData.componentId);

      // Create attendance records for all students (initially marked as ABSENT)
      const recordPromises = students.map(student => {
        return prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: session.id,
            studentId: student.id,
            status: 'ABSENT' as AttendanceStatus,
          }
        });
      });

      await Promise.all(recordPromises);

      return this.formatAttendanceSessionDTO(session);
    } catch (error) {
      console.error("Error creating attendance session:", error);
      throw error;
    }
  }

  static async markAttendance(
    sessionId: string,
    records: { studentId: string; status: AttendanceStatus; remark?: string }[]
  ): Promise<{ success: boolean; updated: number; total: number }> {

    // Process each record in a transaction
    const updateResults = await prisma.$transaction(
      records.map(record =>
        prisma.attendanceRecord.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: sessionId,
              studentId: record.studentId
            }
          },
          create: {
            attendanceSessionId: sessionId,
            studentId: record.studentId,
            status: record.status,
            remark: record.remark || null
          },
          update: {
            status: record.status,
            remark: record.remark
          }
        })
      )
    );

    return {
      success: true,
      updated: updateResults.length,
      total: records.length
    };
  }

  static async getStudentsForComponent(componentId: string): Promise<any[]> {
    // Get the component to determine if it's for a specific group
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        sectionCourse: {
          include: {
            section: true
          }
        },
        group: true
      }
    });

    if (!component) {
      throw new Error("Course component not found");
    }

    console.log(`Getting students for component: ${componentId}`);
    console.log(`Component type: ${component.componentType}`);
    console.log(`Component group: ${component.groupId ? (component.group?.name || 'Unknown group') : 'No specific group'}`);
    console.log(`Section: ${component.sectionCourse.section.name}`);

    // Fetch students based on section and group (if applicable)
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        sectionId: component.sectionCourse.sectionId,
        // If the component is for a specific group, filter by that group
        ...(component.groupId ? { groupId: component.groupId } : {})
      },
      select: {
        id: true,
        name: true,
        rollNo: true,
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        rollNo: 'asc'
      }
    });

    console.log(`Found ${students.length} students`);

    return students;
  }

  static async getAttendanceSessionsByDateRange(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceSessionDTO[]> {
    // Find attendance sessions for courses where the teacher is either the main course teacher
    // or a component-specific teacher
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        component: {
          OR: [
            { teacherId: teacherId },
            {
              teacherId: null,
              sectionCourse: {
                teacherId: teacherId
              }
            }
          ]
        }
      },
      include: {
        component: {
          include: {
            sectionCourse: {
              include: {
                course: true,
                section: true
              }
            },
            group: true,
            teacher: true
          }
        },
        records: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return sessions.map(session => this.formatAttendanceSessionDTO(session));
  }

  static async getAttendanceSessionDetails(sessionId: string): Promise<any> {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        component: {
          include: {
            sectionCourse: {
              include: {
                course: true,
                section: true
              }
            },
            group: true,
            teacher: true
          }
        },
        records: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNo: true,
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            student: {
              rollNo: 'asc'
            }
          }
        }
      }
    });

    if (!session) {
      throw new Error("Attendance session not found");
    }

    // Calculate attendance statistics
    const totalStudents = session.records.length;
    const presentCount = session.records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
    const absentCount = session.records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
    const lateCount = session.records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
    const leaveCount = session.records.filter((r: RecordWithStatus) => r.status === 'LEAVE').length;
    const excusedCount = session.records.filter((r: RecordWithStatus) => r.status === 'EXCUSED').length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

    // Format session data
    const sessionData = {
      id: session.id,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      topic: session.topic,
      course: {
        id: session.component.sectionCourse.courseId,
        code: session.component.sectionCourse.course.code,
        name: session.component.sectionCourse.course.name
      },
      componentType: session.component.componentType,
      section: {
        id: session.component.sectionCourse.sectionId,
        name: session.component.sectionCourse.section.name
      },
      group: session.component.group ? {
        id: session.component.group.id,
        name: session.component.group.name
      } : null,
      teacher: session.component.teacher ? {
        id: session.component.teacher.id,
        name: session.component.teacher.name
      } : {
        id: session.component.sectionCourse.teacherId,
        name: "Main Course Teacher" // This should be replaced with the actual name
      },
      statistics: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        excusedCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      },
      records: session.records.map(record => ({
        id: record.id,
        studentId: record.studentId,
        status: record.status,
        remark: record.remark,
        student: {
          id: record.student.id,
          name: record.student.name,
          rollNo: record.student.rollNo,
          group: record.student.group
        }
      }))
    };

    return sessionData;
  }

  static async getComponentAttendanceSummary(componentId: string): Promise<any> {
    // Get component details
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        sectionCourse: {
          include: {
            course: true,
            section: true
          }
        },
        group: true,
        teacher: true,
        attendanceSessions: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!component) {
      throw new Error("Course component not found");
    }

    // Get all students for this component
    const students = await this.getStudentsForComponent(componentId);

    // Get all attendance sessions for this component
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        componentId: componentId
      },
      include: {
        records: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate overall statistics
    const totalSessions = sessions.length;

    // Calculate per-student statistics
    const studentStats = await Promise.all(students.map(async (student) => {
      const records = await prisma.attendanceRecord.findMany({
        where: {
          studentId: student.id,
          attendanceSession: {
            componentId: componentId
          }
        }
      });

      const presentCount = records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
      const absentCount = records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
      const lateCount = records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
      const leaveCount = records.filter((r: RecordWithStatus) => r.status === 'LEAVE').length;
      const excusedCount = records.filter((r: RecordWithStatus) => r.status === 'EXCUSED').length;
      const attendancePercentage = totalSessions > 0
        ? ((presentCount + lateCount) / totalSessions) * 100
        : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          group: student.group
        },
        statistics: {
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          excusedCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        }
      };
    }));

    // Calculate session-wise statistics
    const sessionStats = await Promise.all(sessions.map(async (session) => {
      const totalStudents = session.records.length;
      const presentCount = session.records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
      const absentCount = session.records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
      const lateCount = session.records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
      const leaveCount = session.records.filter((r: RecordWithStatus) => r.status === 'LEAVE').length;
      const excusedCount = session.records.filter((r: RecordWithStatus) => r.status === 'EXCUSED').length;
      const attendancePercentage = totalStudents > 0
        ? ((presentCount + lateCount) / totalStudents) * 100
        : 0;

      return {
        sessionId: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        topic: session.topic,
        statistics: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          excusedCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        }
      };
    }));

    // Overall class statistics
    const overallStats = {
      totalSessions,
      averageAttendance: studentStats.length > 0
        ? studentStats.reduce((sum, s) => sum + s.statistics.attendancePercentage, 0) / studentStats.length
        : 0
    };

    return {
      component: {
        id: component.id,
        type: component.componentType,
        course: {
          id: component.sectionCourse.courseId,
          code: component.sectionCourse.course.code,
          name: component.sectionCourse.course.name
        },
        section: {
          id: component.sectionCourse.sectionId,
          name: component.sectionCourse.section.name
        },
        group: component.group ? {
          id: component.group.id,
          name: component.group.name
        } : null,
        teacher: component.teacher ? {
          id: component.teacher.id,
          name: component.teacher.name
        } : null
      },
      overallStats,
      sessionStats,
      studentStats
    };
  }

  static async getStudentCourseAttendance(studentId: string, courseId: string): Promise<any> {
    // Get all course components for this course
    const components = await prisma.courseComponent.findMany({
      where: {
        sectionCourse: {
          courseId: courseId
        },
        OR: [
          { groupId: null }, // Common to all students
          {
            group: {
              students: {
                some: {
                  id: studentId
                }
              }
            }
          }
        ]
      },
      include: {
        sectionCourse: {
          include: {
            course: true
          }
        },
        group: true,
        attendanceSessions: {
          include: {
            records: {
              where: {
                studentId: studentId
              }
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (components.length === 0) {
      throw new Error("No components found for this course and student");
    }

    // For each component, calculate attendance statistics
    const componentStats = components.map(component => {
      const sessions = component.attendanceSessions;
      const totalSessions = sessions.length;

      // Flatten all records from all sessions
      const records = sessions.flatMap(s => s.records);

      const presentCount = records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
      const absentCount = records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
      const lateCount = records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
      const leaveCount = records.filter((r: RecordWithStatus) => r.status === 'LEAVE').length;
      const excusedCount = records.filter((r: RecordWithStatus) => r.status === 'EXCUSED').length;

      const attendancePercentage = totalSessions > 0
        ? ((presentCount + lateCount) / totalSessions) * 100
        : 0;

      // Create session-level statistics for this component
      const sessionStats = sessions.map(session => {
        const record = session.records[0]; // There should only be one record per session for this student

        return {
          sessionId: session.id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          topic: session.topic,
          status: record ? record.status : null,
          remark: record ? record.remark : null
        };
      });

      return {
        componentId: component.id,
        componentType: component.componentType,
        group: component.group ? {
          id: component.group.id,
          name: component.group.name
        } : null,
        statistics: {
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          excusedCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        sessions: sessionStats
      };
    });

    // Calculate overall course attendance
    const allSessions = componentStats.reduce((acc, comp) => acc + comp.statistics.totalSessions, 0);
    const allPresent = componentStats.reduce((acc, comp) => acc + comp.statistics.presentCount, 0);
    const allLate = componentStats.reduce((acc, comp) => acc + comp.statistics.lateCount, 0);
    const overallAttendance = allSessions > 0
      ? ((allPresent + allLate) / allSessions) * 100
      : 0;

    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        rollNo: true,
        group: {
          select: {
            id: true,
            name: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      student,
      course: {
        id: courseId,
        code: components[0].sectionCourse.course.code,
        name: components[0].sectionCourse.course.name
      },
      overallAttendance: Math.round(overallAttendance * 100) / 100,
      components: componentStats
    };
  }

  static async updateAttendanceRecord(recordId: string, data: { status: AttendanceStatus; remark?: string }): Promise<any> {
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: data.status,
        remark: data.remark
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true
          }
        },
        attendanceSession: {
          include: {
            component: {
              include: {
                sectionCourse: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return {
      id: updatedRecord.id,
      status: updatedRecord.status,
      remark: updatedRecord.remark,
      student: updatedRecord.student,
      course: {
        code: updatedRecord.attendanceSession.component.sectionCourse.course.code,
        name: updatedRecord.attendanceSession.component.sectionCourse.course.name
      },
      session: {
        id: updatedRecord.attendanceSessionId,
        date: updatedRecord.attendanceSession.date,
        componentType: updatedRecord.attendanceSession.component.componentType
      }
    };
  }

  static async getAttendanceRecord(recordId: string): Promise<any> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        attendanceSession: {
          include: {
            component: {
              include: {
                sectionCourse: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      status: record.status,
      remark: record.remark,
      student: record.student,
      course: {
        id: record.attendanceSession.component.sectionCourse.course.id,
        code: record.attendanceSession.component.sectionCourse.course.code,
        name: record.attendanceSession.component.sectionCourse.course.name
      },
      session: {
        id: record.attendanceSessionId,
        date: record.attendanceSession.date,
        componentType: record.attendanceSession.component.componentType
      }
    };
  }

  static async getAttendanceByDateRange(componentId: string, startDate: Date, endDate: Date): Promise<any> {
    // Get component details
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        sectionCourse: {
          include: {
            course: true,
            section: true
          }
        },
        group: true,
        teacher: true
      }
    });

    if (!component) {
      throw new Error("Course component not found");
    }

    // Get attendance sessions in date range
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        componentId: componentId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        records: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNo: true,
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Get all students for this component
    const students = await this.getStudentsForComponent(componentId);

    // Create a student lookup map for faster access
    const studentMap = new Map(students.map(s => [s.id, s]));

    // Structure the attendance data by session and student
    const formattedSessions = sessions.map(session => {
      // Calculate session statistics
      const totalStudents = session.records.length;
      const presentCount = session.records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
      const absentCount = session.records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
      const lateCount = session.records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
      const attendancePercentage = totalStudents > 0
        ? ((presentCount + lateCount) / totalStudents) * 100
        : 0;

      return {
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        topic: session.topic,
        statistics: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        students: session.records.map(record => ({
          id: record.student.id,
          name: record.student.name,
          rollNo: record.student.rollNo,
          status: record.status,
          remark: record.remark,
          recordId: record.id
        }))
      };
    });

    // Calculate student-wise attendance over the period
    const studentAttendance = students.map(student => {
      // Find all records for this student across all sessions
      const studentRecords = sessions.flatMap(session =>
        session.records.filter(record => record.studentId === student.id)
      );

      const totalSessions = sessions.length;
      const presentCount = studentRecords.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
      const absentCount = studentRecords.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
      const lateCount = studentRecords.filter((r: RecordWithStatus) => r.status === 'LATE').length;
      const leaveCount = studentRecords.filter((r: RecordWithStatus) => r.status === 'LEAVE').length;
      const excusedCount = studentRecords.filter((r: RecordWithStatus) => r.status === 'EXCUSED').length;

      const attendancePercentage = totalSessions > 0
        ? ((presentCount + lateCount) / totalSessions) * 100
        : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          group: student.group
        },
        statistics: {
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          excusedCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        }
      };
    });

    return {
      component: {
        id: component.id,
        type: component.componentType,
        course: {
          id: component.sectionCourse.courseId,
          code: component.sectionCourse.course.code,
          name: component.sectionCourse.course.name
        },
        section: {
          id: component.sectionCourse.sectionId,
          name: component.sectionCourse.section.name
        },
        group: component.group ? {
          id: component.group.id,
          name: component.group.name
        } : null,
        teacher: component.teacher ? {
          id: component.teacher.id,
          name: component.teacher.name
        } : null
      },
      dateRange: {
        startDate,
        endDate
      },
      sessions: formattedSessions,
      studentAttendance
    };
  }

  // Helper methods for permissions and validation

  static async verifyTeacherForComponent(teacherId: string, componentId: string): Promise<boolean> {
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        sectionCourse: true
      }
    });

    if (!component) {
      return false;
    }

    // Check if the teacher is the component-specific teacher or the main course teacher
    return (
      component.teacherId === teacherId ||
      component.sectionCourse.teacherId === teacherId
    );
  }

  static async verifyTeacherForSession(teacherId: string, sessionId: string): Promise<boolean> {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        component: {
          include: {
            sectionCourse: true
          }
        }
      }
    });

    if (!session) {
      return false;
    }

    // Check if the teacher is the component-specific teacher or the main course teacher
    return (
      session.component.teacherId === teacherId ||
      session.component.sectionCourse.teacherId === teacherId
    );
  }

  static async verifyTeacherForCourse(teacherId: string, courseId: string, academicTermId: string): Promise<boolean> {
    // Check if the teacher teaches any section of this course
    const sectionCourses = await prisma.sectionCourse.findMany({
      where: {
        courseId: courseId,
        academicTermId: academicTermId,
        OR: [
          { teacherId: teacherId },
          {
            components: {
              some: {
                teacherId: teacherId
              }
            }
          }
        ]
      }
    });

    return sectionCourses.length > 0;
  }

  static async verifyTeacherForRecord(teacherId: string, recordId: string): Promise<boolean> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        attendanceSession: {
          include: {
            component: {
              include: {
                sectionCourse: true
              }
            }
          }
        }
      }
    });

    if (!record) {
      return false;
    }

    // Check if the teacher is the component-specific teacher or the main course teacher
    return (
      record.attendanceSession.component.teacherId === teacherId ||
      record.attendanceSession.component.sectionCourse.teacherId === teacherId
    );
  }

  // Helper method to format attendance session data
  private static formatAttendanceSessionDTO(session: any): AttendanceSessionDTO {
    // Calculate attendance statistics
    // Handle case where records might be undefined or null
    const records = session.records || [];
    const totalStudents = records.length;

    const presentCount = records.filter((r: RecordWithStatus) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r: RecordWithStatus) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r: RecordWithStatus) => r.status === 'LATE').length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

    return {
      id: session.id,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      topic: session.topic,
      componentId: session.componentId,
      componentType: session.component.componentType,
      course: {
        id: session.component.sectionCourse.courseId,
        code: session.component.sectionCourse.course.code,
        name: session.component.sectionCourse.course.name
      },
      section: {
        id: session.component.sectionCourse.sectionId,
        name: session.component.sectionCourse.section.name
      },
      group: session.component.group ? {
        id: session.component.group.id,
        name: session.component.group.name
      } : null,
      statistics: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    };
  }
}
