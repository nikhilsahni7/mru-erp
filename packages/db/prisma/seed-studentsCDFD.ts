// prisma/seed-students.ts
// Generic seed file for adding students to different programs, sections, and semesters

import { Branch, Clg, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Student data structure
interface StudentData {
  serialNo: number;
  alternateId?: string;
  rollNo: string;
  firstName: string;
  lastName?: string;
  email?: string;
  section: string;
  phone?: string;
}

// Section configuration
interface SectionConfig {
  programCode: string; // e.g., "CDFD", "CSE", "AI-ML"
  programName: string; // e.g., "Computer Science and Fashion Design"
  sectionName: string; // e.g., "A", "B", "C"
  semester: number; // e.g., 7
  batchYear: number; // e.g., 2022
  departmentCode?: string; // e.g., "CSE" (defaults to "CSE")
  departmentName?: string; // e.g., "Computer Science and Engineering"
}

// Default values
const DEFAULT_PASSWORD = "0123456789";
const DEFAULT_COLLEGE: Clg = "MRU";
const DEFAULT_BRANCH: Branch = "SCHOOL_OF_ENGINEERING";

async function seedStudents(
  sectionConfig: SectionConfig,
  studentsData: StudentData[]
) {
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
      data: {
        name: departmentName,
        code: departmentCode,
      },
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
    where: {
      year: sectionConfig.batchYear,
      programId: program.id,
    },
  });

  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        year: sectionConfig.batchYear,
        programId: program.id,
      },
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
    // Check if student already exists
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

    // Combine first and last name
    const fullName = studentData.lastName
      ? `${studentData.firstName} ${studentData.lastName}`.trim()
      : studentData.firstName;

    // Generate random phone if not provided
    const phone =
      studentData.phone ||
      `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Create student
    await prisma.user.create({
      data: {
        name: fullName,
        rollNo: studentData.rollNo,
        password: hashedPassword,
        phone: phone,
        email: studentData.email || undefined,
        clg: DEFAULT_COLLEGE,
        branch: DEFAULT_BRANCH,
        role: "STUDENT" as Role,
        sectionId: section.id,
        groupId: group.id,
      },
    });

    console.log(`   ✅ Created: ${studentData.rollNo} - ${fullName}`);
    createdCount++;
  }

  // Summary
  console.log("\n📊 SEEDING SUMMARY");
  console.log("=".repeat(60));
  console.log(
    `Section: ${sectionConfig.programCode} - ${sectionConfig.sectionName} (Semester ${sectionConfig.semester})`
  );
  console.log(`Total Students in Data: ${studentsData.length}`);
  console.log(`Successfully Created: ${createdCount}`);
  console.log(`Skipped (Already Exists): ${skippedCount}`);
  console.log("=".repeat(60));

  console.log("\n✅ Student seeding completed successfully!\n");
}

// Main function to run the seeding
async function main() {
  // Example: CDFD Section A, 7th Semester, Batch 2022
  const sectionConfig: SectionConfig = {
    programCode: "CDFD",
    programName: "Computer Science and Fashion Design",
    sectionName: "A",
    semester: 7,
    batchYear: 2022,
    departmentCode: "CSE",
    departmentName: "Computer Science and Engineering",
  };

  // Student data - CDFD Section A
  const studentsData: StudentData[] = [
    {
      serialNo: 1,
      alternateId: "22201010N019",
      rollNo: "2K22CSUN01189",
      firstName: "AYUSH MISHRA",
      lastName: "PRAFULLA KUMAR MISHRA",
      email: "prafullamishra07@gmail.com",
      section: "A",
    },
    {
      serialNo: 2,
      alternateId: "22201010N013",
      rollNo: "2K22CSUN01190",
      firstName: "BHARAT BHUSHAN NATH SHARMA",
      lastName: "SURENDRA NATH SHARMA",
      email: "sonubharath635@gmail.com",
      section: "A",
    },
    {
      serialNo: 3,
      alternateId: "22201010N023",
      rollNo: "2K22CSUN01191",
      firstName: "BHAVYA SINGH",
      lastName: "MOHAR PAL SINGH",
      email: "m.p.singh.4473@gmail.com",
      section: "A",
    },
    {
      serialNo: 4,
      alternateId: "22201010N014",
      rollNo: "2K22CSUN01192",
      firstName: "DEEKSHA PANDEY",
      lastName: "KAILASH CHANDRA PANDEY",
      email: "deeksha222pandey@gmail.com",
      section: "A",
    },
    {
      serialNo: 5,
      alternateId: "22201018NN264449",
      rollNo: "2K22CSUN01193",
      firstName: "EKTA",
      lastName: "PAWAN KUMAR",
      email: "ektagoyal6904@gmail.com",
      section: "A",
    },
    {
      serialNo: 6,
      alternateId: "22201010N010",
      rollNo: "2K22CSUN01195",
      firstName: "HARSHIT PURI",
      lastName: "PANKAJ PURI",
      email: "harshitpuri2552004@gmail.com",
      section: "A",
    },
    {
      serialNo: 7,
      alternateId: "22201010N011",
      rollNo: "2K22CSUN01196",
      firstName: "HARSHITA AERY",
      lastName: "MANMOHAN AERY",
      email: "aeryharshita61@gmail.com",
      section: "A",
    },
    {
      serialNo: 8,
      alternateId: "22201010N007",
      rollNo: "2K22CSUN01197",
      firstName: "JASHANK",
      lastName: "ARUN KUMAR",
      email: "jaykumar0305@gmail.com",
      section: "A",
    },
    {
      serialNo: 9,
      alternateId: "22201010N018",
      rollNo: "2K22CSUN01198",
      firstName: "JATIN DIXIT",
      lastName: "MANOJ KUMAR",
      email: "jatindixit304@gmail.com",
      section: "A",
    },
    {
      serialNo: 10,
      alternateId: "22201010N006",
      rollNo: "2K22CSUN01199",
      firstName: "KUNDAN KUMAR JAISWAL",
      lastName: "LALAN PRASAD JAISWAL",
      email: "kundankumarjaiswal05@gmail.com",
      section: "A",
    },
    {
      serialNo: 11,
      alternateId: "22201010N021",
      rollNo: "2K22CSUN01200",
      firstName: "LALIT KUMAR",
      lastName: "AVDHESH KUMAR JHA",
      email: "klalit0859@gmail.com",
      section: "A",
    },
    {
      serialNo: 12,
      alternateId: "22201010N016",
      rollNo: "2K22CSUN01201",
      firstName: "MANAS SINGH",
      lastName: "KUNWAR VIKRAM SINGH",
      email: "manassingh0044@gmail.com",
      section: "A",
    },
    {
      serialNo: 13,
      alternateId: "22201001N151",
      rollNo: "2K22CSUN01202",
      firstName: "NANDANI KIRTANI",
      lastName: "ASHOK KUMAR KIRTANI",
      email: "studymarathon99@gmail.com",
      section: "A",
    },
    {
      serialNo: 14,
      alternateId: "22201010N017",
      rollNo: "2K22CSUN01203",
      firstName: "NIDHI",
      lastName: "SURENDER KUMAR VERMA",
      email: "soninidhi630@gmail.com",
      section: "A",
    },
    {
      serialNo: 15,
      alternateId: "22201010N024",
      rollNo: "2K22CSUN01204",
      firstName: "NISHTHA",
      lastName: "SURENDER CHHABRA",
      email: "chhabra2384@gmail.com",
      section: "A",
    },
    {
      serialNo: 16,
      alternateId: "22201010N020",
      rollNo: "2K22CSUN01205",
      firstName: "NISHTHA AGGARWAL",
      lastName: "NEERAJ AGGARWAL",
      email: "nishuagg150@gmail.com",
      section: "A",
    },
    {
      serialNo: 17,
      alternateId: "22201010N012",
      rollNo: "2K22CSUN01206",
      firstName: "POTTI SIMHACHALAM",
      lastName: "POTTI LAKSHMAYYA",
      email: "simhachalampotti38@gmail.com",
      section: "A",
    },
    {
      serialNo: 18,
      alternateId: "22201001N9170",
      rollNo: "2K22CSUN01207",
      firstName: "PRANAV GUPTA",
      lastName: "RAVI SHANKAR GUPTA",
      email: "pranavravigupta@gmail.com",
      section: "A",
    },
    {
      serialNo: 19,
      alternateId: "22201010N027",
      rollNo: "2K22CSUN01208",
      firstName: "RIYA SHRIVASTAVA",
      lastName: "OM PARKASH SHRIVASTAV",
      email: "deepashriwastav99@gmail.com",
      section: "A",
    },
    {
      serialNo: 20,
      alternateId: "22201010N025",
      rollNo: "2K22CSUN01209",
      firstName: "RIYA VERMA",
      lastName: "INDER SAIN VERMA",
      email: "vermariya1425@gmail.com",
      section: "A",
    },
    {
      serialNo: 21,
      alternateId: "22201010N91920",
      rollNo: "2K22CSUN01210",
      firstName: "SALONI",
      lastName: "RAVINDER GARG",
      email: "salonii3108@gmail.com",
      section: "A",
    },
    {
      serialNo: 22,
      alternateId: "22201010N022",
      rollNo: "2K22CSUN01211",
      firstName: "SAMAY MANGAL",
      lastName: "KAUSHAL KISHORE",
      email: "samaymangal4949@gmail.com",
      section: "A",
    },
    {
      serialNo: 23,
      alternateId: "22201010N008",
      rollNo: "2K22CSUN01212",
      firstName: "SANA KHAN",
      lastName: "MAKSUD KHAN",
      email: "ssanakhansk1919@gmail.com",
      section: "A",
    },
    {
      serialNo: 24,
      alternateId: "22201010N029",
      rollNo: "2K22CSUN01213",
      firstName: "SHIVAM KHANDURI",
      lastName: "PRAMOD KUMAR KHANDURI",
      email: "khandurishivam2004@gmail.com",
      section: "A",
    },
    {
      serialNo: 25,
      alternateId: "22201010N015",
      rollNo: "2K22CSUN01214",
      firstName: "SHUBHAM PAL",
      lastName: "AMAR SINGH",
      email: "shubhampal965470@gmail.com",
      section: "A",
    },
    {
      serialNo: 26,
      alternateId: "22201010N004",
      rollNo: "2K22CSUN01215",
      firstName: "SURYANSH GOEL",
      lastName: "AMIT GOEL",
      email: "suryanshgoel0316@gmail.com",
      section: "A",
    },
    {
      serialNo: 27,
      alternateId: "22201010N003",
      rollNo: "2K22CSUN01216",
      firstName: "TUSHAR",
      lastName: "MADAN GOPAL",
      email: "tushrsingh16@gmail.com",
      section: "A",
    },
    {
      serialNo: 28,
      alternateId: "22201010N005",
      rollNo: "2K22CSUN01217",
      firstName: "VAIBHAV GUSAIN",
      lastName: "P M SINGH",
      email: "meghab.05@gmail.com",
      section: "A",
    },
    {
      serialNo: 29,
      alternateId: "22201010N265351",
      rollNo: "2K22CSUN01218",
      firstName: "VIPIN KUMAR",
      lastName: "ASHOK KUMAR",
      email: "vishalkardam4111@gmail.com",
      section: "A",
    },
    {
      serialNo: 30,
      alternateId: "22301010N001",
      rollNo: "2K23CSUL01011",
      firstName: "KHUSHI",
      lastName: "CHANDER SAIN",
      email: "khushirajpal2004@gmail.com",
      section: "A",
    },
  ];

  await seedStudents(sectionConfig, studentsData);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding students:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { SectionConfig, seedStudents, StudentData };
