import { Branch, Clg, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Student data structure
interface StudentData {
  serialNo: number;
  alternateId?: string;
  rollNo: string;
  firstName: string;
  lastName?: string; // Father's Name
  email?: string;
  section: string;
  phone?: string;
}

// Section configuration
interface SectionConfig {
  programCode: string;
  programName: string;
  sectionName: string;
  semester: number;
  batchYear: number;
  departmentCode?: string;
  departmentName?: string;
}

// Default values
const DEFAULT_PASSWORD = "0123456789";
const DEFAULT_COLLEGE: Clg = "MRU";
const DEFAULT_BRANCH: Branch = "SCHOOL_OF_ENGINEERING";

async function seedStudents(
  sectionConfig: SectionConfig,
  studentsData: StudentData[]
) {
  if (studentsData.length === 0) {
    console.log(
      `\n⏩ Skipping section ${sectionConfig.sectionName} for batch ${sectionConfig.batchYear} as there are no students.\n`
    );
    return;
  }

  console.log("\n🎓 Starting student seeding process...\n");
  console.log("📋 Configuration:");
  console.log(
    `   Program: ${sectionConfig.programName} (${sectionConfig.programCode})`
  );
  console.log(`   Section: ${sectionConfig.sectionName}`);
  console.log(`   Semester: ${sectionConfig.semester}`);
  console.log(`   Batch Year: ${sectionConfig.batchYear}`);
  console.log(`   Total Students: ${studentsData.length}\n`);

  // 1. Get or create Department
  console.log("🏢 Setting up department...");
  const departmentCode = sectionConfig.departmentCode || "CSE";
  const departmentName =
    sectionConfig.departmentName || "Computer Science and Engineering";

  let department = await prisma.department.findUnique({
    where: { code: departmentCode },
  });

  if (!department) {
    department = await prisma.department.create({
      data: { name: departmentName, code: departmentCode },
    });
    console.log(`   ✅ Created department: ${departmentName}`);
  } else {
    console.log(`   ✅ Using existing department: ${departmentName}`);
  }

  // 2. Get or create Program
  console.log("📚 Setting up program...");
  let program = await prisma.program.findFirst({
    where: {
      code: sectionConfig.programCode,
      departmentId: department.id,
    },
  });

  if (!program) {
    program = await prisma.program.create({
      data: {
        name: sectionConfig.programName,
        code: sectionConfig.programCode,
        departmentId: department.id,
      },
    });
    console.log(`   ✅ Created program: ${sectionConfig.programName}`);
  } else {
    console.log(`   ✅ Using existing program: ${sectionConfig.programName}`);
  }

  // 3. Get or create Batch
  console.log("📅 Setting up batch...");
  let batch = await prisma.batch.findFirst({
    where: { year: sectionConfig.batchYear, programId: program.id },
  });

  if (!batch) {
    batch = await prisma.batch.create({
      data: { year: sectionConfig.batchYear, programId: program.id },
    });
    console.log(`   ✅ Created batch: ${sectionConfig.batchYear}`);
  } else {
    console.log(`   ✅ Using existing batch: ${sectionConfig.batchYear}`);
  }

  // 4. Get or create Section
  console.log("🏫 Setting up section...");
  let section = await prisma.section.findFirst({
    where: {
      name: sectionConfig.sectionName,
      batchId: batch.id,
      semester: sectionConfig.semester,
    },
  });

  if (!section) {
    section = await prisma.section.create({
      data: {
        name: sectionConfig.sectionName,
        batchId: batch.id,
        semester: sectionConfig.semester,
      },
    });
    console.log(`   ✅ Created section: ${sectionConfig.sectionName}`);
  } else {
    console.log(`   ✅ Using existing section: ${sectionConfig.sectionName}`);
  }

  // 5. Get or create Group G1
  console.log("👥 Setting up group...");
  let group = await prisma.group.findFirst({
    where: { name: "G1", sectionId: section.id },
  });

  if (!group) {
    group = await prisma.group.create({
      data: { name: "G1", sectionId: section.id },
    });
    console.log(`   ✅ Created group: G1`);
  } else {
    console.log(`   ✅ Using existing group: G1`);
  }

  // 6. Create students
  console.log("\n👨‍🎓 Creating students...\n");
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let createdCount = 0;
  let skippedCount = 0;

  for (const studentData of studentsData) {
    const existingStudent = await prisma.user.findUnique({
      where: { rollNo: studentData.rollNo },
    });

    if (existingStudent) {
      console.log(
        `   ⚠️  Skipped: ${studentData.rollNo} - ${studentData.firstName} (already exists)`
      );
      skippedCount++;
      continue;
    }

    const studentName = studentData.firstName.trim();
    const phone =
      studentData.phone ||
      `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    await prisma.user.create({
      data: {
        name: studentName,
        rollNo: studentData.rollNo,
        password: hashedPassword,
        phone,
        email: studentData.email || undefined,
        clg: DEFAULT_COLLEGE,
        branch: DEFAULT_BRANCH,
        role: "STUDENT" as Role,
        sectionId: section.id,
        groupId: group.id,
      },
    });

    console.log(`   ✅ Created: ${studentData.rollNo} - ${studentName}`);
    createdCount++;
  }

  // Summary
  console.log(
    "\n📊 SEEDING SUMMARY FOR SECTION",
    sectionConfig.sectionName,
    "BATCH",
    sectionConfig.batchYear
  );
  console.log("=".repeat(60));
  console.log(
    `Section: ${sectionConfig.programCode} - ${sectionConfig.sectionName} (Semester ${sectionConfig.semester})`
  );
  console.log(`Batch: ${sectionConfig.batchYear}`);
  console.log(`Total Students in Data: ${studentsData.length}`);
  console.log(`Successfully Created: ${createdCount}`);
  console.log(`Skipped (Already Exists): ${skippedCount}`);
  console.log("=".repeat(60));
}

async function main() {
  const allStudents: StudentData[] = [
    {
      serialNo: 1,
      alternateId: "225101013002",
      rollNo: "2K25CSUN01401",
      firstName: "ARYA KACKER",
      lastName: "RAJNISH KACKER",
      email: "kackerarya94@gmail.com",
      section: "A",
    },
    {
      serialNo: 2,
      alternateId: "225101013009",
      rollNo: "2K25CSUN01402",
      firstName: "ISHMEET SINGH BAJWA",
      lastName: "GURVINDER SINGH BAJWA",
      email: "ishmeetbajwa8@gmail.com",
      section: "A",
    },
    {
      serialNo: 3,
      alternateId: "225101013004",
      rollNo: "2K25CSUN01403",
      firstName: "MANKIRAT KAUR",
      lastName: "GURDEEP SINGH PARHAR PARHAR",
      email: "gparhar155@gmail.com",
      section: "A",
    },
    {
      serialNo: 4,
      alternateId: "225101013007",
      rollNo: "2K25CSUN01406",
      firstName: "ROHIT CHAUHAN",
      lastName: "GAJENDRA SINGH CHAUHAN",
      email: "gajendrachauhan80@gmail.com",
      section: "A",
    },
    {
      serialNo: 5,
      alternateId: "225101013008",
      rollNo: "2K25CSUN01407",
      firstName: "SURAJ CHAUHAN",
      lastName: "RAJESH CHAUHAN",
      email: "muktarchauhan00@gmail.com",
      section: "A",
    },
    {
      serialNo: 6,
      alternateId: "225101013011",
      rollNo: "2K25CSUN01408",
      firstName: "KESHAV .",
      lastName: "NIRANJAN KR",
      email: "keshavvashisht2711@gmail.com",
      section: "A",
    },
    {
      serialNo: 7,
      alternateId: "225101013012",
      rollNo: "2K25CSUN01409",
      firstName: "NIKHIL SHARMA",
      lastName: "SHIV KUMAR SHARMA",
      email: "sharmanikhil2829@gmail.com",
      section: "A",
    },
    {
      serialNo: 8,
      alternateId: "225101013013",
      rollNo: "2K25CSUN01410",
      firstName: "VAIBHAV",
      lastName: "MANOJ",
      email: "vaibhavsharma8d@gmail.com",
      section: "A",
    },
    {
      serialNo: 9,
      alternateId: "225101013014",
      rollNo: "2K25CSUN01411",
      firstName: "NIKHIL .",
      lastName: "SURENDER",
      email: "nikhilgurjar44@gmail.com",
      section: "A",
    },
    {
      serialNo: 10,
      alternateId: "22501013N001",
      rollNo: "2K25CSUN01412",
      firstName: "PADAM ABHINAV",
      lastName: "PADAM J P ANIL KUMAR",
      email: "padamabhinav4@gmail.com",
      section: "A",
    },
    {
      serialNo: 11,
      alternateId: "225101013005",
      rollNo: "2K25CSUN01413",
      firstName: "ADITYA BHARDWAJ",
      lastName: "DINESH CHANDER",
      email: "Aadityabhardwaj9th@gmail.com",
      section: "A",
    },
    {
      serialNo: 12,
      alternateId: "225101013006",
      rollNo: "2K25CSUN01414",
      firstName: "ABHISHEK TANWAR",
      lastName: "JITENDER KUMAR",
      email: "abhishektanwar721@gmail.com",
      section: "A",
    },
    {
      serialNo: 13,
      alternateId: "22501013N079",
      rollNo: "2K25CSUN01415",
      firstName: "CHANASYA NAYAK",
      lastName: "ANUP KUMAR NAYAK",
      email: "nchanasya7821@gmail.com",
      section: "A",
    },
    {
      serialNo: 14,
      alternateId: "22501013N080",
      rollNo: "2K25CSUN01416",
      firstName: "KOKILA .",
      lastName: "SANJAY MAGGU",
      email: "kokila3130@gmail.com",
      section: "A",
    },
    {
      serialNo: 15,
      alternateId: "81",
      rollNo: "2K25CSUN01417",
      firstName: "LASHWEDI DRINKA",
      lastName: "ELIAH DRINKA",
      email: "drinkalashwedi@gmail.com",
      section: "A",
    },
    {
      serialNo: 16,
      alternateId: "22501013N083",
      rollNo: "2K25CSUN01418",
      firstName: "LAKSHAY HOODA",
      lastName: "MINU HOODA",
      email: "luckyhooda3579@gmail.com",
      section: "A",
    },
    {
      serialNo: 17,
      alternateId: "22501013N082",
      rollNo: "2K25CSUN01419",
      firstName: "HIMANSHU YADAV",
      lastName: "GANGADHAR YADAV",
      email: "himanshuyadav2261@gmail.co",
      section: "A",
    },
  ];

  // Group students by batch year and section
  const studentsByBatchAndSection: {
    [key: number]: { [key: string]: StudentData[] };
  } = {};

  for (const student of allStudents) {
    if (student.section.toLowerCase() === "none") {
      console.log(
        `⏩ Skipping student ${student.rollNo} - ${student.firstName} as section is 'none'.`
      );
      continue;
    }

    const match = student.rollNo.match(/2K(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1], 10);
      if (!studentsByBatchAndSection[year]) {
        studentsByBatchAndSection[year] = { A: [], B: [], C: [], D: [] };
      }
      if (studentsByBatchAndSection[year][student.section]) {
        studentsByBatchAndSection[year][student.section].push(student);
      } else {
        console.warn(
          `⚠️  Student ${student.rollNo} has an unknown section '${student.section}'. Skipping.`
        );
      }
    }
  }

  // Seed students for each group
  for (const yearStr in studentsByBatchAndSection) {
    const year = parseInt(yearStr, 10);
    for (const sectionName in studentsByBatchAndSection[year]) {
      const sectionConfig: SectionConfig = {
        programCode: "CSTI",
        programName: "Computer Science and Technology (Innovation)",
        sectionName,
        semester: 1,
        batchYear: year,
      };
      await seedStudents(
        sectionConfig,
        studentsByBatchAndSection[year][sectionName]
      );
    }
  }

  console.log(
    "\n✅ All CSTI 1st Semester student seeding tasks completed successfully!\n"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
