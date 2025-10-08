// prisma/seed-teacher-gunjan.ts
// Seed file for Gunjan Chandwani - Teacher with all her courses and schedules

import {
  Branch,
  Clg,
  CourseType,
  DayOfWeek,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🎓 Starting Gunjan Chandwani Teacher Seeding...\n");

  // 0. CLEANUP - Delete old/duplicate course components for Gunjan
  console.log("🧹 Cleaning up old course components for Gunjan Chandwani...");

  const oldGunjan = await prisma.user.findUnique({
    where: { rollNo: "GC" },
  });

  if (oldGunjan) {
    // Delete old data in correct order to avoid foreign key constraints
    const oldComponents = await prisma.courseComponent.findMany({
      where: { teacherId: oldGunjan.id },
      select: { id: true },
    });

    const componentIds = oldComponents.map((c) => c.id);

    if (componentIds.length > 0) {
      // Delete attendance records first
      await prisma.attendanceRecord.deleteMany({
        where: {
          attendanceSession: {
            componentId: { in: componentIds },
          },
        },
      });

      // Delete attendance sessions
      await prisma.attendanceSession.deleteMany({
        where: { componentId: { in: componentIds } },
      });

      // Delete class schedules
      await prisma.classSchedule.deleteMany({
        where: { componentId: { in: componentIds } },
      });

      // Delete old components
      await prisma.courseComponent.deleteMany({
        where: { teacherId: oldGunjan.id },
      });

      // Delete old section courses
      await prisma.sectionCourse.deleteMany({
        where: { teacherId: oldGunjan.id },
      });
    }

    console.log("   ✅ Cleaned up old data");
  }

  // 1. Get or Create Gunjan Chandwani teacher
  console.log("\n👩‍🏫 Setting up teacher: Gunjan Chandwani...");

  let gunjanTeacher = await prisma.user.findUnique({
    where: { rollNo: "GC" },
  });

  if (!gunjanTeacher) {
    gunjanTeacher = await prisma.user.create({
      data: {
        name: "Gunjan Chandwani",
        rollNo: "GC",
        password: await bcrypt.hash("teacher123", 10),
        phone: "9876543210",
        email: "gunjan.chandwani@mru.edu.in",
        clg: "MRU" as Clg,
        branch: "SCHOOL_OF_ENGINEERING" as Branch,
        role: "TEACHER" as Role,
      },
    });
    console.log("   ✅ Created teacher: Gunjan Chandwani");
  } else {
    console.log("   ✅ Using existing teacher: Gunjan Chandwani");
  }

  // 2. Get or create department and programs
  console.log("\n🏢 Setting up academic structure...");

  let cseDepartment = await prisma.department.findUnique({
    where: { code: "CSE" },
  });

  if (!cseDepartment) {
    cseDepartment = await prisma.department.create({
      data: {
        name: "Computer Science and Engineering",
        code: "CSE",
      },
    });
    console.log("   ✅ Created department: CSE");
  } else {
    console.log("   ✅ Using existing department: CSE");
  }

  // Get or create programs
  let cseProgram = await prisma.program.findFirst({
    where: { code: "CSE", departmentId: cseDepartment.id },
  });

  if (!cseProgram) {
    cseProgram = await prisma.program.create({
      data: {
        name: "Computer Science and Engineering",
        code: "CSE",
        departmentId: cseDepartment.id,
      },
    });
    console.log("   ✅ Created program: CSE");
  } else {
    console.log("   ✅ Using existing program: CSE");
  }

  let cdfdProgram = await prisma.program.findFirst({
    where: { code: "CDFD", departmentId: cseDepartment.id },
  });

  if (!cdfdProgram) {
    cdfdProgram = await prisma.program.create({
      data: {
        name: "Computer Science and Fashion Design",
        code: "CDFD",
        departmentId: cseDepartment.id,
      },
    });
    console.log("   ✅ Created program: CDFD");
  } else {
    console.log("   ✅ Using existing program: CDFD");
  }

  let aimlProgram = await prisma.program.findFirst({
    where: { code: "AI-ML", departmentId: cseDepartment.id },
  });

  if (!aimlProgram) {
    aimlProgram = await prisma.program.create({
      data: {
        name: "Artificial Intelligence and Machine Learning",
        code: "AI-ML",
        departmentId: cseDepartment.id,
      },
    });
    console.log("   ✅ Created program: AI-ML");
  } else {
    console.log("   ✅ Using existing program: AI-ML");
  }

  // 3. Get or create academic term
  let academicTerm = await prisma.academicTerm.findFirst({
    where: { id: "2024-odd" },
  });

  if (!academicTerm) {
    academicTerm = await prisma.academicTerm.create({
      data: {
        id: "2024-odd",
        name: "Odd Semester 2024-25",
        startDate: new Date("2024-08-01"),
        endDate: new Date("2024-12-31"),
      },
    });
    console.log("   ✅ Created academic term: Odd Semester 2024-25");
  } else {
    console.log("   ✅ Using existing academic term");
  }

  // 4. Create courses
  console.log("\n📚 Creating courses...");

  const coursesData = [
    { code: "CDFD7_CICD", name: "CI/CD Development", credits: 4 },
    { code: "ADA", name: "Algorithm Design and Analysis", credits: 4 },
    {
      code: "CST5_ITR_II",
      name: "Industrial Training Research II",
      credits: 2,
    },
  ];

  const courses: any = {};
  for (const courseData of coursesData) {
    let course = await prisma.course.findUnique({
      where: { code: courseData.code },
    });

    if (!course) {
      course = await prisma.course.create({
        data: courseData,
      });
      console.log(`   ✅ Created course: ${courseData.name}`);
    } else {
      console.log(`   ✅ Using existing course: ${courseData.name}`);
    }
    courses[courseData.code] = course;
  }

  // 5. Helper function to get or create batch
  async function getOrCreateBatch(year: number, programId: string) {
    let batch = await prisma.batch.findFirst({
      where: {
        year: year,
        programId: programId,
      },
    });

    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          year: year,
          programId: programId,
        },
      });
      console.log(`   ✅ Created batch: ${year}`);
    }
    return batch;
  }

  // 6. Helper function to get or create section
  async function getOrCreateSection(
    sectionName: string,
    semester: number,
    batchYear: number,
    programId: string
  ) {
    const batch = await getOrCreateBatch(batchYear, programId);

    let section = await prisma.section.findFirst({
      where: {
        name: sectionName,
        batchId: batch.id,
        semester: semester,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          name: sectionName,
          batchId: batch.id,
          semester: semester,
        },
      });
      console.log(
        `   ✅ Created section: ${sectionName} (Semester ${semester})`
      );
    }

    // Ensure Group G1 exists for this section
    let group = await prisma.group.findFirst({
      where: {
        name: "G1",
        sectionId: section.id,
      },
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: "G1",
          sectionId: section.id,
        },
      });
      console.log(`   ✅ Created group G1 for section ${sectionName}`);
    }

    return section;
  }

  // 7. Create sections for all classes
  console.log("\n🏫 Setting up sections...");

  // CDFD 7A - Semester 7, Batch 2022
  const cdfd7a = await getOrCreateSection("A", 7, 2022, cdfdProgram!.id);

  // CSE 3B - Semester 3, Batch 2024
  const cse3b = await getOrCreateSection("B", 3, 2024, cseProgram!.id);

  // AIML 5A - Semester 5, Batch 2023
  const aiml5a = await getOrCreateSection("A", 5, 2023, aimlProgram!.id);

  console.log("\n📅 Creating course schedules...");

  // Helper function to convert IST time to UTC time string
  function convertISTtoUTC(istTime: string): string {
    const [hours, minutes] = istTime.split(':').map(Number);
    // IST is UTC+5:30, so subtract 5 hours 30 minutes
    let utcHours = hours - 5;
    let utcMinutes = minutes - 30;
    
    if (utcMinutes < 0) {
      utcMinutes += 60;
      utcHours -= 1;
    }
    
    if (utcHours < 0) {
      utcHours += 24;
    }
    
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  }

  // Helper function to create course component with schedules
  async function createCourseComponent(
    sectionId: string,
    courseCode: string,
    componentType: CourseType,
    schedules: Array<{
      day: DayOfWeek;
      startTime: string;
      endTime: string;
      room: string;
    }>
  ) {
    const course = courses[courseCode];

    // Create or get section course
    let sectionCourse = await prisma.sectionCourse.findFirst({
      where: {
        sectionId: sectionId,
        courseId: course.id,
        teacherId: gunjanTeacher!.id,
        academicTermId: academicTerm!.id,
      },
    });

    if (!sectionCourse) {
      sectionCourse = await prisma.sectionCourse.create({
        data: {
          sectionId: sectionId,
          courseId: course.id,
          teacherId: gunjanTeacher!.id,
          academicTermId: academicTerm!.id,
        },
      });
    }

    // Get G1 group for this section
    const group = await prisma.group.findFirst({
      where: {
        name: "G1",
        sectionId: sectionId,
      },
    });

    // Create component
    let component = await prisma.courseComponent.findFirst({
      where: {
        sectionCourseId: sectionCourse.id,
        componentType: componentType,
        groupId: group?.id,
      },
    });

    if (!component) {
      component = await prisma.courseComponent.create({
        data: {
          sectionCourseId: sectionCourse.id,
          componentType: componentType,
          teacherId: gunjanTeacher!.id,
          groupId: group?.id,
        },
      });
    }

    // Create schedules
    for (const schedule of schedules) {
      // Convert IST times to UTC before storing
      const utcStartTime = convertISTtoUTC(schedule.startTime);
      const utcEndTime = convertISTtoUTC(schedule.endTime);
      
      const existing = await prisma.classSchedule.findFirst({
        where: {
          componentId: component.id,
          dayOfWeek: schedule.day,
          startTime: new Date(`2024-01-01T${utcStartTime}:00Z`),
        },
      });

      if (!existing) {
        await prisma.classSchedule.create({
          data: {
            componentId: component.id,
            dayOfWeek: schedule.day,
            startTime: new Date(`2024-01-01T${utcStartTime}:00Z`),
            endTime: new Date(`2024-01-01T${utcEndTime}:00Z`),
            roomNumber: schedule.room,
          },
        });
      }
    }

    return component;
  }

  // MONDAY SCHEDULE
  console.log("\n   📆 Monday Classes:");

  // CDFD7_CICD(T) - Lecture
  console.log("      - CDFD7_CICD (CDFD 7A) - Lecture: 12:20-13:10 PM");
  await createCourseComponent(cdfd7a.id, "CDFD7_CICD", "LECTURE", [
    { day: "MONDAY", startTime: "12:20", endTime: "13:10", room: "LT04" },
  ]);

  // ADA(L) - Lecture
  console.log("      - ADA (CSE 3B) - Lecture: 13:10-14:00 PM");
  await createCourseComponent(cse3b.id, "ADA", "LECTURE", [
    { day: "MONDAY", startTime: "13:10", endTime: "14:00", room: "CSE 3B" },
  ]);

  // TUESDAY SCHEDULE
  console.log("\n   📆 Tuesday Classes:");

  // ADA(L) - Lecture
  console.log("      - ADA (CSE 3B) - Lecture: 08:10-09:00 AM");
  await createCourseComponent(cse3b.id, "ADA", "LECTURE", [
    { day: "TUESDAY", startTime: "08:10", endTime: "09:00", room: "LT03" },
  ]);

  // ADA Lab - 2 periods
  console.log("      - ADA Lab (CSE 3B) - Lab: 13:10-14:50 PM (2 periods)");
  await createCourseComponent(cse3b.id, "ADA", "LABORATORY", [
    { day: "TUESDAY", startTime: "13:10", endTime: "14:00", room: "*199" },
    { day: "TUESDAY", startTime: "14:00", endTime: "14:50", room: "*199" },
  ]);

  // WEDNESDAY SCHEDULE
  console.log("\n   📆 Wednesday Classes:");

  // ADA(L) - Lecture
  console.log("      - ADA (CSE 3B) - Lecture: 09:00-09:50 AM");
  await createCourseComponent(cse3b.id, "ADA", "LECTURE", [
    { day: "WEDNESDAY", startTime: "09:00", endTime: "09:50", room: "LT00" },
  ]);

  // CICD(L) - Lecture
  console.log("      - CICD (CDFD 7A) - Lecture: 09:50-10:40 AM");
  await createCourseComponent(cdfd7a.id, "CDFD7_CICD", "LECTURE", [
    { day: "WEDNESDAY", startTime: "09:50", endTime: "10:40", room: "LS03" },
  ]);

  // ADA Lab - 2 periods
  console.log("      - ADA Lab (CSE 3B) - Lab: 13:10-14:50 PM (2 periods)");
  await createCourseComponent(cse3b.id, "ADA", "LABORATORY", [
    { day: "WEDNESDAY", startTime: "13:10", endTime: "14:00", room: "LAB04" },
    { day: "WEDNESDAY", startTime: "14:00", endTime: "14:50", room: "LAB04" },
  ]);

  // THURSDAY SCHEDULE
  console.log("\n   📆 Thursday Classes:");

  // CICD(L) - Lecture
  console.log("      - CICD (CDFD 7A) - Lecture: 10:40-11:30 AM");
  await createCourseComponent(cdfd7a.id, "CDFD7_CICD", "LECTURE", [
    { day: "THURSDAY", startTime: "10:40", endTime: "11:30", room: "LT04" },
  ]);

  // FRIDAY SCHEDULE
  console.log("\n   📆 Friday Classes:");

  // CDFD7_CICD(LAB) - 2 periods
  console.log(
    "      - CDFD7_CICD Lab (CDFD 7A) - Lab: 08:10-09:50 AM (2 periods)"
  );
  await createCourseComponent(cdfd7a.id, "CDFD7_CICD", "LABORATORY", [
    { day: "FRIDAY", startTime: "08:10", endTime: "09:00", room: "LR05" },
    { day: "FRIDAY", startTime: "09:00", endTime: "09:50", room: "LR05" },
  ]);

  // CST5_ITR_II - Lecture
  console.log("      - ITR-II (AIML 5A) - Lecture: 09:50-10:40 AM");
  await createCourseComponent(aiml5a.id, "CST5_ITR_II", "LECTURE", [
    { day: "FRIDAY", startTime: "09:50", endTime: "10:40", room: "AIML 5A" },
  ]);

  // CICD(L) - Lecture
  console.log("      - CICD (CDFD 7A) - Lecture: 12:20-13:10 PM");
  await createCourseComponent(cdfd7a.id, "CDFD7_CICD", "LECTURE", [
    { day: "FRIDAY", startTime: "12:20", endTime: "13:10", room: "LF06" },
  ]);

  console.log("\n📊 SEEDING SUMMARY FOR GUNJAN CHANDWANI");
  console.log("=".repeat(60));
  console.log("Teacher: Gunjan Chandwani (Roll No: GC)");
  console.log("Password: teacher123");
  console.log("\nCourses Teaching:");
  console.log("\nMONDAY:");
  console.log("  • CDFD7_CICD (CDFD 7A) - 12:20-13:10 PM (Lecture)");
  console.log("  • ADA (CSE 3B) - 13:10-14:00 PM (Lecture)");
  console.log("\nTUESDAY:");
  console.log("  • ADA (CSE 3B) - 08:10-09:00 AM (Lecture)");
  console.log("  • ADA Lab (CSE 3B) - 13:10-14:50 PM (2 periods)");
  console.log("\nWEDNESDAY:");
  console.log("  • ADA (CSE 3B) - 09:00-09:50 AM (Lecture)");
  console.log("  • CICD (CDFD 7A) - 09:50-10:40 AM (Lecture)");
  console.log("  • ADA Lab (CSE 3B) - 13:10-14:50 PM (2 periods)");
  console.log("\nTHURSDAY:");
  console.log("  • CICD (CDFD 7A) - 10:40-11:30 AM (Lecture)");
  console.log("\nFRIDAY:");
  console.log("  • CDFD7_CICD Lab (CDFD 7A) - 08:10-09:50 AM (2 periods)");
  console.log("  • ITR-II (AIML 5A) - 09:50-10:40 AM (Lecture)");
  console.log("  • CICD (CDFD 7A) - 12:20-13:10 PM (Lecture)");
  console.log("=".repeat(60));

  console.log("\n✅ Gunjan Chandwani teacher seeding completed successfully!");
  console.log("\n🔑 Login credentials:");
  console.log("   Roll No: GC");
  console.log("   Password: teacher123\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Gunjan Chandwani teacher:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
