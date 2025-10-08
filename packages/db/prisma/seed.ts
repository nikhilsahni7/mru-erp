// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   const hashedPassword = await bcrypt.hash('8800244926', 10);

//   await prisma.user.create({
//     data: {
//       name: 'Nikhil Sahni',
//       rollNo: '2k22CSUN01074',
//       password: hashedPassword,
//       phone: '8800244926',
//       email: 'nikhil.sahni321@gmail.com',
//       clg: 'MRU', // enum value
//       branch: 'SCHOOL_OF_ENGINEERING', // enum value
//       role: 'STUDENT',
//     },
//   });

//   console.log('✅ Student seeded successfully.');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Error seeding student:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
// prisma/seed.ts

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
  // Clean up existing data to prevent foreign key constraint issues
  console.log("🧹 Cleaning up existing data...");
  try {
    // Delete in the correct order to respect foreign key constraints
    console.log("- Deleting class schedules...");
    await prisma.classSchedule.deleteMany({});

    console.log("- Deleting attendance records...");
    await prisma.attendanceRecord.deleteMany({});

    console.log("- Deleting attendance sessions...");
    await prisma.attendanceSession.deleteMany({});

    console.log("- Deleting course components...");
    await prisma.courseComponent.deleteMany({});

    console.log("- Deleting section courses...");
    await prisma.sectionCourse.deleteMany({});

    console.log("- Deleting sessions...");
    await prisma.session.deleteMany({});

    console.log("- Deleting all users...");
    await prisma.user.deleteMany({});

    console.log("- Deleting groups...");
    await prisma.group.deleteMany({});

    console.log("- Deleting sections...");
    await prisma.section.deleteMany({});

    console.log("- Deleting batches...");
    await prisma.batch.deleteMany({});

    console.log("- Deleting programs...");
    await prisma.program.deleteMany({});

    console.log("- Deleting departments...");
    await prisma.department.deleteMany({});

    console.log("- Deleting courses...");
    await prisma.course.deleteMany({});

    console.log("- Deleting academic terms...");
    await prisma.academicTerm.deleteMany({});

    console.log("✅ Database cleaned successfully.");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    throw error; // Stop execution if we can't clean the database
  }

  // 1. First create all users (teachers and students)
  console.log("👨‍🏫 Creating teachers...");
  // Create teachers
  const teachers = [
    { name: "Gunjan", initials: "GC" },
    { name: "Deepanshi", initials: "DG" },
    { name: "Shivangi", initials: "SS" },
    { name: "Kriti", initials: "KR" },
    { name: "Priya", initials: "PR" },
    { name: "Vipin", initials: "VP" },
    { name: "Yamini", initials: "YA" },
    { name: "Mentor", initials: "MC" },
  ];

  // Create all teachers first
  for (const teacher of teachers) {
    await prisma.user.create({
      data: {
        name: teacher.name,
        rollNo: teacher.initials,
        password: await bcrypt.hash("teacher123", 10),
        phone: "0000000000",
        clg: "MRU" as Clg,
        branch: "SCHOOL_OF_ENGINEERING" as Branch,
        role: "TEACHER" as Role,
      },
    });
  }

  console.log("✅ Teachers seeded successfully.");

  // 2. Create academic structure
  console.log("🏫 Creating academic structure...");
  const csDepartment = await prisma.department.create({
    data: {
      name: "Computer Science and Engineering",
      code: "CSE",
    },
  });

  const btechProgram = await prisma.program.create({
    data: {
      name: "Bachelor of Technology",
      code: "BTECH",
      departmentId: csDepartment.id,
    },
  });

  const batch2022 = await prisma.batch.create({
    data: {
      year: 2022,
      programId: btechProgram.id,
    },
  });

  const section6B = await prisma.section.create({
    data: {
      name: "CSE6B",
      batchId: batch2022.id,
      semester: 6,
    },
  });

  // Create groups
  const group1 = await prisma.group.create({
    data: {
      name: "G1",
      sectionId: section6B.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: "G2",
      sectionId: section6B.id,
    },
  });

  // Create academic term
  const currentTerm = await prisma.academicTerm.create({
    data: {
      id: "2024-spring",
      name: "Spring 2024",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-05-02"),
    },
  });

  console.log("✅ Academic structure seeded successfully.");

  // 3. Create courses
  console.log("📚 Creating courses...");
  const courses = [
    { code: "NPTEL", name: "NPTEL", credits: 0 },
    { code: "PC", name: "Professional Competency", credits: 1 }, // Combines Soft Skills, Aptitude, Technical
    { code: "ADA", name: "Algorithm Design and Analysis", credits: 3 },
    { code: "ADA_LAB", name: "Algorithm Design and Analysis Lab", credits: 1 },
    { code: "CG", name: "Computer Graphics", credits: 3 },
    { code: "CG_LAB", name: "Computer Graphics Lab", credits: 1 },
    { code: "AJAVA", name: "Advanced Java", credits: 1 },
    { code: "DVT", name: "Design Verification Testing", credits: 1 },
    { code: "TE", name: "Technology Entrepreneurship", credits: 1 },
    { code: "UE", name: "User Experience", credits: 1 },
    { code: "EPS", name: "Engineering Product and Services", credits: 1 },
    { code: "IIT", name: "Innovative Information Technology", credits: 1 },
    { code: "IPR", name: "Intellectual Property Rights", credits: 1 },
    { code: "MONGODB", name: "MongoDB Database", credits: 1 },
    { code: "FINTEC", name: "Fintech Fundamentals", credits: 1 },
    { code: "FL", name: "Financial Literacy", credits: 1 },
    { code: "AE", name: "Automation Explorer", credits: 1 },
    { code: "HELM", name: "Heartfulness Leadership Mastery", credits: 1 },
    { code: "SC", name: "Science of Consciousness", credits: 1 },
    { code: "CLAN", name: "CLAN Activities", credits: 0 },
    { code: "OE", name: "Open Elective", credits: 0 },
  ];

  // Create all courses
  const createdCourses = {};
  for (const course of courses) {
    const createdCourse = await prisma.course.create({
      data: {
        code: course.code,
        name: course.name,
        credits: course.credits,
      },
    });
    createdCourses[course.code] = createdCourse;
  }

  console.log("✅ Courses seeded successfully.");

  // Get teacher IDs by their initials
  console.log("🔗 Linking teachers to courses...");
  const teacherIds = {};
  for (const teacher of teachers) {
    const user = await prisma.user.findUnique({
      where: { rollNo: teacher.initials },
    });
    if (user) {
      teacherIds[teacher.initials] = user.id;
    }
  }

  // Create section courses and components
  const createCourseWithComponents = async (
    courseCode,
    teacherInitials,
    components
  ) => {
    const courseId = createdCourses[courseCode]?.id;

    // Set a default teacher for courses that don't have a specific teacher
    const teacherId = teacherInitials
      ? teacherIds[teacherInitials]
      : teacherIds["MC"]; // Use 'Mentor' as default teacher if none specified

    if (!courseId) {
      console.error(`Course with code ${courseCode} not found`);
      return;
    }

    if (!teacherId) {
      console.error(
        `Teacher not found. Please ensure at least one teacher exists`
      );
      return;
    }

    const sectionCourse = await prisma.sectionCourse.create({
      data: {
        sectionId: section6B.id,
        courseId: courseId,
        teacherId: teacherId, // This will never be null now
        academicTermId: currentTerm.id,
      },
    });

    // Create components
    for (const comp of components) {
      const componentTeacherId = comp.teacherInitials
        ? teacherIds[comp.teacherInitials]
        : teacherId;

      // Determine if this component is for a specific group
      if (comp.group === "G1") {
        // Group 1 specific component
        await createComponent(
          sectionCourse.id,
          comp,
          componentTeacherId,
          group1.id
        );
      } else if (comp.group === "G2") {
        // Group 2 specific component
        await createComponent(
          sectionCourse.id,
          comp,
          componentTeacherId,
          group2.id
        );
      } else {
        // Component for all students (no specific group)
        await createComponent(sectionCourse.id, comp, componentTeacherId, null);
      }
    }
  };

  // Helper function to convert IST time to UTC time string
  const convertISTtoUTC = (istTime: string): string => {
    const [hours, minutes] = istTime.split(":").map(Number);
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

    return `${utcHours.toString().padStart(2, "0")}:${utcMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Helper function to create a course component and its schedules
  const createComponent = async (sectionCourseId, comp, teacherId, groupId) => {
    // Create component
    const component = await prisma.courseComponent.create({
      data: {
        sectionCourseId: sectionCourseId,
        componentType: comp.type as CourseType,
        teacherId: teacherId,
        groupId: groupId,
      },
    });

    // Create schedules for this component
    if (comp.schedules) {
      for (const schedule of comp.schedules) {
        // Convert IST times to UTC before storing
        const utcStartTime = convertISTtoUTC(schedule.startTime);
        const utcEndTime = convertISTtoUTC(schedule.endTime);

        await prisma.classSchedule.create({
          data: {
            componentId: component.id,
            dayOfWeek: schedule.day as DayOfWeek,
            startTime: new Date(`2025-01-01T${utcStartTime}:00Z`),
            endTime: new Date(`2025-01-01T${utcEndTime}:00Z`),
            roomNumber: schedule.room,
          },
        });
      }
    }
  };

  // 4. Create all courses with their components and schedules
  console.log("📅 Creating class schedules...");
  // NPTEL
  await createCourseWithComponents("NPTEL", null, [
    {
      type: "LECTURE",
      schedules: [
        { day: "MONDAY", startTime: "08:00", endTime: "08:50", room: "K502" },
      ],
    },
  ]);

  // Professional Competency (Soft Skills, Aptitude, Technical)
  await createCourseWithComponents("PC", "SS", [
    {
      type: "LECTURE",
      teacherInitials: "SS", // Shivangi for Soft Skills
      schedules: [
        { day: "MONDAY", startTime: "08:50", endTime: "09:40", room: "K502" },
        { day: "TUESDAY", startTime: "13:00", endTime: "13:50", room: "K501" },
      ],
    },
    {
      type: "LECTURE",
      teacherInitials: "KR", // Kriti for Technical
      schedules: [
        { day: "MONDAY", startTime: "12:10", endTime: "13:00", room: "K501" },
        { day: "MONDAY", startTime: "13:00", endTime: "13:50", room: "K501" },
      ],
    },
    {
      type: "LECTURE",
      teacherInitials: "VP", // Vipin for Aptitude
      schedules: [
        {
          day: "WEDNESDAY",
          startTime: "09:40",
          endTime: "10:30",
          room: "K509",
        },
        { day: "FRIDAY", startTime: "09:40", endTime: "10:30", room: "LT09" },
      ],
    },
  ]);

  // Algorithm Design and Analysis (Theory)
  await createCourseWithComponents("ADA", "GC", [
    {
      type: "LECTURE",
      schedules: [
        { day: "TUESDAY", startTime: "12:10", endTime: "13:00", room: "LT09" },
        { day: "THURSDAY", startTime: "11:20", endTime: "12:10", room: "LT10" },
        { day: "FRIDAY", startTime: "08:50", endTime: "09:40", room: "LT09" },
      ],
    },
    {
      type: "TUTORIAL",
      group: "G1",
      schedules: [
        { day: "FRIDAY", startTime: "10:30", endTime: "11:20", room: "L508" },
      ],
    },
    {
      type: "TUTORIAL",
      group: "G2",
      schedules: [
        { day: "THURSDAY", startTime: "10:30", endTime: "11:20", room: "L504" },
      ],
    },
  ]);

  // Algorithm Design and Analysis (Lab)
  await createCourseWithComponents("ADA_LAB", "GC", [
    {
      type: "LABORATORY",
      group: "G1",
      schedules: [
        { day: "MONDAY", startTime: "09:40", endTime: "10:30", room: "G4" },
        { day: "MONDAY", startTime: "10:30", endTime: "11:20", room: "G4" },
      ],
    },
    {
      type: "LABORATORY",
      group: "G2",
      schedules: [
        { day: "TUESDAY", startTime: "08:00", endTime: "08:50", room: "G7" },
        { day: "TUESDAY", startTime: "08:50", endTime: "09:40", room: "G7" },
      ],
    },
  ]);

  // Computer Graphics (Theory)
  await createCourseWithComponents("CG", "DG", [
    {
      type: "LECTURE",
      schedules: [
        { day: "TUESDAY", startTime: "09:40", endTime: "10:30", room: "K501" },
        {
          day: "WEDNESDAY",
          startTime: "10:30",
          endTime: "11:20",
          room: "K509",
        },
        { day: "THURSDAY", startTime: "08:50", endTime: "09:40", room: "LT10" },
      ],
    },
    {
      type: "TUTORIAL",
      group: "G1",
      schedules: [
        { day: "THURSDAY", startTime: "09:40", endTime: "10:30", room: "L503" },
      ],
    },
    {
      type: "TUTORIAL",
      group: "G2",
      schedules: [
        { day: "FRIDAY", startTime: "10:30", endTime: "11:20", room: "L504" },
      ],
    },
  ]);

  // Computer Graphics (Lab)
  await createCourseWithComponents("CG_LAB", "DG", [
    {
      type: "LABORATORY",
      group: "G1",
      schedules: [
        { day: "TUESDAY", startTime: "08:00", endTime: "08:50", room: "G4" },
        { day: "TUESDAY", startTime: "08:50", endTime: "09:40", room: "G4" },
      ],
    },
    {
      type: "LABORATORY",
      group: "G2",
      schedules: [
        { day: "MONDAY", startTime: "09:40", endTime: "10:30", room: "G5" },
        { day: "MONDAY", startTime: "10:30", endTime: "11:20", room: "G5" },
      ],
    },
  ]);

  // Mentor-Mentee session
  await createCourseWithComponents("OE", "MC", [
    {
      type: "SEMINAR",
      teacherInitials: "MC",
      schedules: [
        { day: "TUESDAY", startTime: "10:30", endTime: "11:20", room: "L503" },
      ],
    },
  ]);

  // IPR
  await createCourseWithComponents("IPR", "YA", [
    {
      type: "LECTURE",
      group: "G2",
      schedules: [
        { day: "TUESDAY", startTime: "13:50", endTime: "14:40", room: "HF11" },
        { day: "TUESDAY", startTime: "14:40", endTime: "15:30", room: "HF11" },
        {
          day: "WEDNESDAY",
          startTime: "08:50",
          endTime: "09:40",
          room: "HF05",
        },
      ],
    },
  ]);

  // Create Open hour and CLAN sessions
  await createCourseWithComponents("CLAN", null, [
    {
      type: "SEMINAR",
      schedules: [
        { day: "THURSDAY", startTime: "13:50", endTime: "14:40", room: "" },
        { day: "THURSDAY", startTime: "14:40", endTime: "15:30", room: "" },
      ],
    },
  ]);

  console.log("✅ Course schedules seeded successfully.");

  // 5. Finally create students and assign them to groups
  console.log("👨‍🎓 Creating students...");
  // Seed students (already in your code)
  const students = [
    { name: "ABRAR", rollNo: "2K22CSUN01043" },
    { name: "ADITYA PRATAP SINGH", rollNo: "2K22CSUN01044" },
    { name: "AMIT FARSWAN", rollNo: "2K22CSUN01046" },
    { name: "ANANYA CHAWLA", rollNo: "2K22CSUN01047" },
    { name: "ΑΝΙKET JINDAL", rollNo: "2K22CSUN01048" },
    { name: "ΑΝΙΚET NANDI", rollNo: "2K22CSUN01049" },
    { name: "ANMOL", rollNo: "2K22CSUN01050" },
    { name: "ANSH GERA", rollNo: "2K22CSUN01051" },
    { name: "ANSHIKA AGRAWAL", rollNo: "2K22CSUN01052" },
    { name: "ANSHIKA SINGH", rollNo: "2K22CSUN01053" },
    { name: "ANUP ATTRI", rollNo: "2K22CSUN01054" },
    { name: "ANURAG RANA", rollNo: "2K22CSUN01055" },
    { name: "ANUSHKA BHASIN", rollNo: "2K22CSUN01056" },
    { name: "ASHISH SHARMA", rollNo: "2K22CSUN01057" },
    { name: "BHAVYA SHARMA", rollNo: "2K22CSUN01058" },
    { name: "DEVANG RANA", rollNo: "2K22CSUN01059" },
    { name: "DIMPLE GAUR", rollNo: "2K22CSUN01060" },
    { name: "DIVYAM KUMAR THAKUR", rollNo: "2K22CSUN01061" },
    { name: "GAUTAM GOSAIN", rollNo: "2K22CSUN01062" },
    { name: "GORAV RANA", rollNo: "2K22CSUN01063" },
    { name: "HARSH BANKURA", rollNo: "2K22CSUN01064" },
    { name: "HARSH SHARMA", rollNo: "2K22CSUN01065" },
    { name: "HARSH VARDHAN KUMAR MISHRA", rollNo: "2K22CSUN01066" },
    { name: "HRITHIKA SINGH", rollNo: "2K22CSUN01067" },
    { name: "JAI KUMAR MANGLA", rollNo: "2K22CSUN01068" },
    { name: "JIYA SINGH", rollNo: "2K22CSUN01069" },
    { name: "KASHISH BISHT", rollNo: "2K22CSUN01070" },
    { name: "KSHITIJ LAMA", rollNo: "2K22CSUN01071" },
    { name: "MAMILLA SRINADH", rollNo: "2K22CSUN01072" },
    { name: "NAKUL", rollNo: "2K22CSUN01073" },
    { name: "NISHCHAY GUPTA", rollNo: "2K22CSUN01075" },
    { name: "PIYUSH BHUTANI", rollNo: "2K22CSUN01076" },
    { name: "PRAVEEN KUMAR TIWARI", rollNo: "2K22CSUN01077" },
    { name: "SAURAV TIWARY", rollNo: "2K22CSUN01078" },
    { name: "SHIVAM SEHRAWAT", rollNo: "2K22CSUN01079" },
    { name: "SURENDER KUMAR MITTAL", rollNo: "2K22CSUN01080" },
    { name: "UTKARSH MEHRA", rollNo: "2K22CSUN01081" },
    { name: "VIKAS SHARMA", rollNo: "2K22CSUN01082" },
    { name: "VIKASH SHARMA", rollNo: "2K22CSUN01083" },
    { name: "VIPANSHU GUPTA", rollNo: "2K22CSUN01084" },
    { name: "YASH BHARDWAJ", rollNo: "2K22CSUN01085" },
    { name: "ANSH PAHWA", rollNo: "2K23CSUL01001" },
    { name: "MANOJ SHARMA", rollNo: "2K23CSUL01004" },
    { name: "PIYUSH KALRA", rollNo: "2K23CSUL01007" },
  ];

  const hashedPassword = await bcrypt.hash("0123456789", 10);

  // Assign students to appropriate groups based on the rules provided
  for (const student of students) {
    // Determine which group the student belongs to
    const studentGroupId = [
      "2K22CSUN01043",
      "2K22CSUN01044",
      "2K22CSUN01046",
      "2K22CSUN01047",
      "2K22CSUN01048",
      "2K22CSUN01049",
      "2K22CSUN01050",
      "2K22CSUN01051",
      "2K22CSUN01052",
      "2K22CSUN01053",
      "2K22CSUN01054",
      "2K22CSUN01055",
      "2K22CSUN01056",
      "2K22CSUN01057",
      "2K22CSUN01058",
      "2K22CSUN01059",
      "2K22CSUN01060",
      "2K22CSUN01061",
      "2K22CSUN01062",
      "2K22CSUN01063",
      "2K22CSUN01064",
    ].includes(student.rollNo)
      ? group1.id
      : group2.id;

    await prisma.user.create({
      data: {
        name: student.name,
        rollNo: student.rollNo,
        password: hashedPassword,
        phone: "0123456789",
        clg: "MRU" as Clg,
        branch: "SCHOOL_OF_ENGINEERING" as Branch,
        role: "STUDENT" as Role,
        sectionId: section6B.id,
        groupId: studentGroupId,
      },
    });
  }

  console.log("✅ Students seeded successfully.");
  console.log("✅ Database seeded successfully with timetable data.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
