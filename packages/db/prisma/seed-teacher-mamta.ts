// prisma/seed-teacher-mamta.ts
// Seed file for Mamta Arora - Teacher with all her courses and schedules

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
  console.log("\n🎓 Starting Mamta Arora Teacher Seeding...\n");

  // 0. CLEANUP - Delete old/duplicate course components for Mamta
  console.log("🧹 Cleaning up old course components for Mamta Arora...");

  const oldMamta = await prisma.user.findUnique({
    where: { rollNo: "MAMTA" },
  });

  if (oldMamta) {
    // Delete old data in correct order to avoid foreign key constraints
    const oldComponents = await prisma.courseComponent.findMany({
      where: { teacherId: oldMamta.id },
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
        where: { teacherId: oldMamta.id },
      });

      // Delete old section courses
      await prisma.sectionCourse.deleteMany({
        where: { teacherId: oldMamta.id },
      });
    }

    console.log("   ✅ Cleaned up old data");
  }

  // 1. Create or get Mamta Arora teacher
  console.log("\n👩‍🏫 Setting up teacher: Mamta Arora...");

  let mamtaArora = await prisma.user.findUnique({
    where: { rollNo: "MAMTA" },
  });

  if (!mamtaArora) {
    mamtaArora = await prisma.user.create({
      data: {
        name: "Mamta Arora",
        rollNo: "MAMTA",
        password: await bcrypt.hash("teacher123", 10),
        phone: "9876543210",
        email: "mamta.arora@mru.edu.in",
        clg: "MRU" as Clg,
        branch: "SCHOOL_OF_ENGINEERING" as Branch,
        role: "TEACHER" as Role,
      },
    });
    console.log("   ✅ Created teacher: Mamta Arora");
  } else {
    console.log("   ✅ Using existing teacher: Mamta Arora");
  }

  // 2. Get or create department and program
  console.log("\n🏢 Setting up academic structure...");

  let department = await prisma.department.findUnique({
    where: { code: "CSE" },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: "Computer Science and Engineering",
        code: "CSE",
      },
    });
    console.log("   ✅ Created department: CSE");
  } else {
    console.log("   ✅ Using existing department: CSE");
  }

  let program = await prisma.program.findFirst({
    where: {
      code: "BTECH",
      departmentId: department.id,
    },
  });

  if (!program) {
    program = await prisma.program.create({
      data: {
        name: "Bachelor of Technology",
        code: "BTECH",
        departmentId: department.id,
      },
    });
    console.log("   ✅ Created program: B.Tech");
  } else {
    console.log("   ✅ Using existing program: B.Tech");
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
    { code: "CST1_WD", name: "Web Development I", credits: 2 },
    { code: "OOPS", name: "Object Oriented Programming", credits: 3 },
    { code: "OOPS_LAB", name: "Object Oriented Programming Lab", credits: 1 },
    { code: "ITR_II", name: "Industrial Training Research II", credits: 2 },
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
  async function getOrCreateBatch(year: number, programCode: string) {
    // Get the program first
    let targetProgram = program;

    // If it's CSTI or CSE, we need different programs
    if (programCode === "CSTI") {
      targetProgram = await prisma.program.findFirst({
        where: {
          code: "CSTI",
          departmentId: department!.id,
        },
      });

      if (!targetProgram) {
        targetProgram = await prisma.program.create({
          data: {
            name: "Computer Science and Technology (Innovation)",
            code: "CSTI",
            departmentId: department!.id,
          },
        });
        console.log("   ✅ Created program: CSTI");
      }
    } else if (programCode === "CSE") {
      targetProgram = await prisma.program.findFirst({
        where: {
          code: "CSE",
          departmentId: department!.id,
        },
      });

      if (!targetProgram) {
        targetProgram = await prisma.program.create({
          data: {
            name: "Computer Science and Engineering",
            code: "CSE",
            departmentId: department!.id,
          },
        });
        console.log("   ✅ Created program: CSE");
      }
    }

    let batch = await prisma.batch.findFirst({
      where: {
        year: year,
        programId: targetProgram!.id,
      },
    });

    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          year: year,
          programId: targetProgram!.id,
        },
      });
      console.log(`   ✅ Created batch: ${year} for ${programCode}`);
    }
    return batch;
  } // 6. Helper function to get or create section
  async function getOrCreateSection(
    sectionName: string,
    semester: number,
    batchYear: number,
    programCode: string = "BTECH"
  ) {
    const batch = await getOrCreateBatch(batchYear, programCode);

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

  // CSE1B - Semester 1, Batch 2024 - Program: CSE (not BTECH!)
  const cse1b = await getOrCreateSection("B", 1, 2024, "CSE");

  // CSTI A - Semester 1, Batch 2025 (Computer Science and Technology Innovation)
  const cstiA = await getOrCreateSection("A", 1, 2025, "CSTI");

  // CSE Section A - Semester 3, Batch 2024 (for students seeded from cse3-seed.ts)
  const cse3a = await getOrCreateSection("A", 3, 2024, "CSE");

  // CSE Section A - Semester 5, Batch 2023 (for students seeded from cse5-seed.ts - majority are 2023 batch)
  const cse5a = await getOrCreateSection("A", 5, 2023, "CSE");
  console.log("\n📅 Creating course schedules...");

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
        teacherId: mamtaArora!.id,
        academicTermId: academicTerm!.id,
      },
    });

    if (!sectionCourse) {
      sectionCourse = await prisma.sectionCourse.create({
        data: {
          sectionId: sectionId,
          courseId: course.id,
          teacherId: mamtaArora!.id,
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
          teacherId: mamtaArora!.id,
          groupId: group?.id,
        },
      });
    }

    // Create schedules
    for (const schedule of schedules) {
      const existing = await prisma.classSchedule.findFirst({
        where: {
          componentId: component.id,
          dayOfWeek: schedule.day,
          startTime: new Date(`2024-01-01T${schedule.startTime}:00`),
        },
      });

      if (!existing) {
        await prisma.classSchedule.create({
          data: {
            componentId: component.id,
            dayOfWeek: schedule.day,
            startTime: new Date(`2024-01-01T${schedule.startTime}:00`),
            endTime: new Date(`2024-01-01T${schedule.endTime}:00`),
            roomNumber: schedule.room,
          },
        });
      }
    }

    return component;
  }

  // MONDAY SCHEDULE
  console.log("\n   📆 Monday Classes:");

  // Web Development I for CSE1B - First 2 lab sessions (Group 2 in timetable)
  console.log(
    "      - Web Development I (CSE1B) - Lab: 8:10-9:50 AM (2 sessions)"
  );
  await createCourseComponent(cse1b.id, "CST1_WD", "LABORATORY", [
    { day: "MONDAY", startTime: "08:10", endTime: "09:00", room: "LAB08" },
    { day: "MONDAY", startTime: "09:00", endTime: "09:50", room: "LAB08" },
  ]);

  // Web Development I for CSTI-A - Last 2 lab sessions
  console.log(
    "      - Web Development I (CSTI-A) - Lab: 9:50-11:30 AM (2 sessions)"
  );
  await createCourseComponent(cstiA.id, "CST1_WD", "LABORATORY", [
    { day: "MONDAY", startTime: "09:50", endTime: "10:40", room: "LAB07" },
    { day: "MONDAY", startTime: "10:40", endTime: "11:30", room: "LAB07" },
  ]);

  // TUESDAY SCHEDULE
  console.log("\n   📆 Tuesday Classes:");

  // OOPS LAB for CSE3A Group 1 - Both sessions in one component
  console.log("      - OOPS Lab (CSE3A G1) - Lab: 8:10-9:50 AM (2 sessions)");
  await createCourseComponent(cse3a.id, "OOPS_LAB", "LABORATORY", [
    { day: "TUESDAY", startTime: "08:10", endTime: "09:00", room: "LAB09" },
    { day: "TUESDAY", startTime: "09:00", endTime: "09:50", room: "LAB09" },
  ]);

  // OOPS Lecture for CSE3A - All lectures in one component
  console.log("      - OOPS (CSE3A) - Lecture: 2:00-2:50 PM");
  await createCourseComponent(cse3a.id, "OOPS", "LECTURE", [
    { day: "TUESDAY", startTime: "14:00", endTime: "14:50", room: "KS02" },
    { day: "WEDNESDAY", startTime: "12:20", endTime: "13:10", room: "LS03" },
    { day: "THURSDAY", startTime: "13:10", endTime: "14:00", room: "KS09" },
  ]);

  // WEDNESDAY SCHEDULE
  console.log("\n   📆 Wednesday Classes:");

  // Industrial Training Research II for CSE5A
  console.log("      - ITR II (CSE5A) - Lecture: 8:10-9:00 AM");
  await createCourseComponent(cse5a.id, "ITR_II", "LECTURE", [
    { day: "WEDNESDAY", startTime: "08:10", endTime: "09:00", room: "HF09" },
  ]);

  console.log(
    "      ✅ Wednesday: OOPS lecture already added in Tuesday section"
  );

  // THURSDAY SCHEDULE
  console.log("\n   📆 Thursday Classes:");
  console.log(
    "      ✅ Thursday: OOPS lecture already added in Tuesday section"
  );

  console.log("\n📊 SEEDING SUMMARY FOR MAMTA ARORA");
  console.log("=".repeat(60));
  console.log("Teacher: Mamta Arora (Roll No: MAMTA)");
  console.log("Password: teacher123");
  console.log("\nCourses Teaching:");
  console.log("\nMONDAY:");
  console.log("  • Web Development I (CSE1B) - 8:10-9:50 AM (2 lab sessions)");
  console.log(
    "  • Web Development I (CSTI-A) - 9:50-11:30 AM (2 lab sessions)"
  );
  console.log("\nTUESDAY:");
  console.log("  • OOPS Lab (CSE3A G1) - 8:10-9:50 AM (2 lab sessions)");
  console.log("  • OOPS Lecture (CSE3A) - 2:00-2:50 PM");
  console.log("\nWEDNESDAY:");
  console.log("  • Industrial Training Research II (CSE5A) - 8:10-9:00 AM");
  console.log("  • OOPS Lecture (CSE3A) - 12:20-1:10 PM");
  console.log("\nTHURSDAY:");
  console.log("  • OOPS Lecture (CSE3A) - 1:10-2:00 PM");
  console.log("=".repeat(60));

  console.log("\n✅ Mamta Arora teacher seeding completed successfully!");
  console.log("\n🔑 Login credentials:");
  console.log("   Roll No: MAMTA");
  console.log("   Password: teacher123\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Mamta Arora teacher:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
