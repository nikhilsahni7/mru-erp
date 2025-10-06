// prisma/seed-attendance.ts
// Seed attendance data for September and October 2025 for testing

import { AttendanceStatus, DayOfWeek, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get day of week from date
function getDayOfWeek(date: Date): DayOfWeek {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[date.getDay()] as DayOfWeek;
}

// Helper function to check if date is weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Helper function to create attendance for a specific date
async function createAttendanceForDate(date: Date, studentId: string) {
  const dayOfWeek = getDayOfWeek(date);

  // Skip weekends
  if (isWeekend(date)) {
    console.log(`⏭️  Skipping weekend: ${date.toDateString()}`);
    return;
  }

  console.log(
    `📅 Creating attendance for ${date.toDateString()} (${dayOfWeek})`
  );

  // Find all class schedules for this day of week
  const schedules = await prisma.classSchedule.findMany({
    where: {
      dayOfWeek: dayOfWeek,
    },
    include: {
      component: {
        include: {
          sectionCourse: {
            include: {
              section: true,
              course: true,
            },
          },
          group: true,
        },
      },
    },
  });

  // Get student details to check their section and group
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      section: true,
      group: true,
    },
  });

  if (!student) {
    console.error("Student not found");
    return;
  }

  let sessionsCreated = 0;

  for (const schedule of schedules) {
    const component = schedule.component;
    const sectionCourse = component.sectionCourse;

    // Check if this class is for the student's section
    if (sectionCourse.sectionId !== student.sectionId) {
      continue;
    }

    // Check if this component is group-specific
    if (component.groupId && component.groupId !== student.groupId) {
      continue; // Skip if not the student's group
    }

    // Create attendance session
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const startTime = new Date(date);
    const scheduleStart = new Date(schedule.startTime);
    startTime.setHours(
      scheduleStart.getHours(),
      scheduleStart.getMinutes(),
      0,
      0
    );

    const endTime = new Date(date);
    const scheduleEnd = new Date(schedule.endTime);
    endTime.setHours(scheduleEnd.getHours(), scheduleEnd.getMinutes(), 0, 0);

    // Check if session already exists
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        componentId: component.id,
        date: sessionDate,
        startTime: startTime,
      },
    });

    if (existingSession) {
      console.log(
        `  ⚠️  Session already exists for ${
          sectionCourse.course.code
        } at ${scheduleStart.getHours()}:${scheduleStart
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
      continue;
    }

    // Randomly determine attendance status (80% present, 15% absent, 5% late)
    const rand = Math.random();
    let status: AttendanceStatus;
    if (rand < 0.8) {
      status = "PRESENT";
    } else if (rand < 0.95) {
      status = "ABSENT";
    } else {
      status = "LATE";
    }

    // Create the attendance session
    const session = await prisma.attendanceSession.create({
      data: {
        componentId: component.id,
        date: sessionDate,
        startTime: startTime,
        endTime: endTime,
        topic: `${sectionCourse.course.name} - Week ${Math.ceil(
          date.getDate() / 7
        )} Content`,
      },
    });

    // Create attendance record for the student
    await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session.id,
        studentId: studentId,
        status: status,
        remark: status === "LATE" ? "Arrived 10 minutes late" : null,
      },
    });

    sessionsCreated++;
    const timeStr = `${scheduleStart.getHours()}:${scheduleStart
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    console.log(
      `  ✅ ${sectionCourse.course.code} (${component.componentType}) at ${timeStr} - Status: ${status}`
    );
  }

  console.log(`  📊 Total sessions created: ${sessionsCreated}\n`);
}

async function main() {
  console.log("🎯 Starting attendance seeding for student 2k22csun01076...\n");

  // Find the student
  const student = await prisma.user.findUnique({
    where: { rollNo: "2K22CSUN01076" }, // Piyush Bhutani
    include: {
      section: true,
      group: true,
    },
  });

  if (!student) {
    console.error(
      "❌ Student 2K22CSUN01076 not found! Please run the main seed file first."
    );
    return;
  }

  console.log(`👨‍🎓 Found student: ${student.name}`);
  console.log(`📚 Section: ${student.section?.name}`);
  console.log(`👥 Group: ${student.group?.name}\n`);

  // Generate attendance for September 2025 (Sept 1-30)
  console.log("📆 SEPTEMBER 2025\n");
  for (let day = 1; day <= 30; day++) {
    const date = new Date(2025, 8, day); // Month is 0-indexed (8 = September)
    await createAttendanceForDate(date, student.id);
  }

  // Generate attendance for October 2025 (Oct 1-6)
  console.log("📆 OCTOBER 2025\n");
  for (let day = 1; day <= 6; day++) {
    const date = new Date(2025, 9, day); // Month is 0-indexed (9 = October)
    await createAttendanceForDate(date, student.id);
  }

  // Calculate and display summary
  const totalRecords = await prisma.attendanceRecord.count({
    where: { studentId: student.id },
  });

  const presentCount = await prisma.attendanceRecord.count({
    where: {
      studentId: student.id,
      status: "PRESENT",
    },
  });

  const absentCount = await prisma.attendanceRecord.count({
    where: {
      studentId: student.id,
      status: "ABSENT",
    },
  });

  const lateCount = await prisma.attendanceRecord.count({
    where: {
      studentId: student.id,
      status: "LATE",
    },
  });

  const percentage =
    totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

  console.log("\n📊 ATTENDANCE SUMMARY FOR PIYUSH BHUTANI (2K22CSUN01076)");
  console.log("=".repeat(60));
  console.log(`Total Sessions:    ${totalRecords}`);
  console.log(
    `Present:           ${presentCount} (${(
      (presentCount / totalRecords) *
      100
    ).toFixed(2)}%)`
  );
  console.log(
    `Absent:            ${absentCount} (${(
      (absentCount / totalRecords) *
      100
    ).toFixed(2)}%)`
  );
  console.log(
    `Late:              ${lateCount} (${(
      (lateCount / totalRecords) *
      100
    ).toFixed(2)}%)`
  );
  console.log(`Overall Percentage: ${percentage.toFixed(2)}%`);
  console.log("=".repeat(60));

  console.log("\n✅ Attendance seeding completed successfully!");
  console.log("\n💡 You can now test the student attendance feature at:");
  console.log("   http://localhost:3000/dashboard/attendance");
  console.log("\n🔑 Login credentials:");
  console.log("   Roll No: 2K22CSUN01076");
  console.log("   Password: 0123456789\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding attendance:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
