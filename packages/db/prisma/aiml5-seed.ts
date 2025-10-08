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
  console.log(
    "🔥 Cleaning up previous AI-ML 3rd semester students and related data (incorrect old data)..."
  );

  const program = await prisma.program.findFirst({
    where: { code: "AI-ML" },
  });

  if (program) {
    const sections = await prisma.section.findMany({
      where: {
        batch: { programId: program.id },
        semester: 3,
      },
      include: {
        students: { select: { id: true } },
        groups: { select: { id: true } },
      },
    });

    if (sections.length > 0) {
      const userIdsToDelete = sections.flatMap((s) =>
        s.students.map((stu) => stu.id)
      );
      const sectionIdsToDelete = sections.map((s) => s.id);
      const groupIdsToDelete = sections.flatMap((s) =>
        s.groups.map((g) => g.id)
      );

      if (userIdsToDelete.length > 0) {
        console.log(`- Found ${userIdsToDelete.length} students to delete.`);
        await prisma.session.deleteMany({
          where: { userId: { in: userIdsToDelete } },
        });
        await prisma.attendanceRecord.deleteMany({
          where: { studentId: { in: userIdsToDelete } },
        });

        const { count: deletedUsersCount } = await prisma.user.deleteMany({
          where: { id: { in: userIdsToDelete } },
        });
        console.log(`🗑️  Deleted ${deletedUsersCount} previous students.`);
      }

      // Delete groups before sections to avoid foreign key constraint
      if (groupIdsToDelete.length > 0) {
        const { count: deletedGroupsCount } = await prisma.group.deleteMany({
          where: { id: { in: groupIdsToDelete } },
        });
        console.log(`🗑️  Deleted ${deletedGroupsCount} previous groups.`);
      }

      const { count: deletedSectionsCount } = await prisma.section.deleteMany({
        where: { id: { in: sectionIdsToDelete } },
      });
      console.log(`🗑️  Deleted ${deletedSectionsCount} previous sections.`);
    } else {
      console.log(
        "⏩ No previous AI-ML 3rd semester sections found. Nothing to delete."
      );
    }
  } else {
    console.log("⏩ AI-ML program not found. Nothing to delete.");
  }
  console.log("✅ Cleanup complete.");

  const allStudents: StudentData[] = [
    {
      serialNo: 1,
      alternateId: "22301009N029",
      rollNo: "2K23CSUN01193",
      firstName: "ABHISHEK KAPRAWAN",
      lastName: "DINESH KAPRAWAN",
      email: "aditikaprawan25@gmail.com",
      section: "A",
    },
    {
      serialNo: 2,
      alternateId: "22301009NN124",
      rollNo: "2K23CSUN01194",
      firstName: "ADARSH TIWARI",
      lastName: "RAMESHWAR TIWARI",
      email: "adarsh.tiwari2004@gmail.com",
      section: "A",
    },
    {
      serialNo: 3,
      alternateId: "22301009N918111",
      rollNo: "2K23CSUN01195",
      firstName: "ADWAITH SUNIL",
      lastName: "DIVAKARAN SUNIL",
      email: "jalajasunil@rediffmail.com",
      section: "A",
    },
    {
      serialNo: 4,
      alternateId: "22301009N014",
      rollNo: "2K23CSUN01196",
      firstName: "AKSHAR KUMAR TALLA",
      lastName: "VENKATA AJAY KUMAR TALLA",
      email: "ajaytalla@gmail.com",
      section: "A",
    },
    {
      serialNo: 5,
      alternateId: "22301009N010",
      rollNo: "2K23CSUN01197",
      firstName: "AKSHAT GUPTA",
      lastName: "DEEPAK GUPTA",
      email: "akshatgarg876@gmail.com",
      section: "A",
    },
    {
      serialNo: 6,
      alternateId: "22301009N007",
      rollNo: "2K23CSUN01198",
      firstName: "ANIKET HANS",
      lastName: "MANOJ KUMAR HANS",
      email: "hansaniket06@gmail.com",
      section: "A",
    },
    {
      serialNo: 7,
      alternateId: "22301009N049",
      rollNo: "2K23CSUN01199",
      firstName: "ANMOL BANSAL",
      lastName: "SANJAY BANSAL",
      email: "sanjaybansal776@gmail.com",
      section: "A",
    },
    {
      serialNo: 8,
      alternateId: "22301009N081",
      rollNo: "2K23CSUN01200",
      firstName: "ASHWIN SINGH TANWAR",
      lastName: "RAVINDER SINGH",
      email: "ashwinsingh.tanwar@gmail.com",
      section: "A",
    },
    {
      serialNo: 9,
      alternateId: "22301009N068",
      rollNo: "2K23CSUN01201",
      firstName: "DAKSH DEDHA",
      lastName: "JITENDER DEDHA",
      email: "dakshdedha123@gmail.com",
      section: "A",
    },
    {
      serialNo: 10,
      alternateId: "22301009N061",
      rollNo: "2K23CSUN01202",
      firstName: "DEEPANSHU RATHI",
      lastName: "YOGENDRA RATHI",
      email: "deepanshurathi2005@gmail.com",
      section: "A",
    },
    {
      serialNo: 11,
      alternateId: "22301009N045",
      rollNo: "2K23CSUN01204",
      firstName: "DHRUV UPMANYU",
      lastName: "UMASHANKAR SHARMA",
      email: "Dhruv0901005@gmail.com",
      section: "A",
    },
    {
      serialNo: 12,
      alternateId: "22301009N065",
      rollNo: "2K23CSUN01205",
      firstName: "DIVYANSHU CHOUDHARY",
      lastName: "SATISH KUMAR",
      email: "divyanshu926@gmail.com",
      section: "A",
    },
    {
      serialNo: 13,
      alternateId: "22301009N003",
      rollNo: "2K23CSUN01206",
      firstName: "GAURAV NEGI",
      lastName: "RAKESH SINGH NEGI",
      email: "negig329@gmail.com",
      section: "A",
    },
    {
      serialNo: 14,
      alternateId: "22301009N046",
      rollNo: "2K23CSUN01207",
      firstName: "GUMMADI BHAVYA SRI",
      lastName: "GUMMADI SUDHAKAR REDDY",
      email: "gummadisudhakarreddy909@gmail.com",
      section: "A",
    },
    {
      serialNo: 15,
      alternateId: "22301009N004",
      rollNo: "2K23CSUN01208",
      firstName: "GUNTHALA RAMYA",
      lastName: "G RAM REDDY",
      email: "g25ramya@gmail.com",
      section: "A",
    },
    {
      serialNo: 16,
      alternateId: "22301001N008",
      rollNo: "2K23CSUN01209",
      firstName: "HARSH GILL",
      lastName: "DEVENDER GILL",
      email: "harshgill076@gmail.com",
      section: "A",
    },
    {
      serialNo: 17,
      alternateId: "22301009N918112",
      rollNo: "2K23CSUN01210",
      firstName: "HARSH VARDHAN SINGH",
      lastName: "VIKRAM SINGH",
      email: "harshbanirot@gmail.com",
      section: "A",
    },
    {
      serialNo: 18,
      alternateId: "22301009N008",
      rollNo: "2K23CSUN01211",
      firstName: "ISHIKA GUPTA",
      lastName: "NITIN GUPTA",
      email: "nitingupta31@gmail.com",
      section: "A",
    },
    {
      serialNo: 19,
      alternateId: "22301001N988",
      rollNo: "2K23CSUN01212",
      firstName: "JIGYASA DIWAKAR",
      lastName: "RAJENDRA KUMAR DIWAKAR",
      email: "jigyasadiwakar@gmail.com",
      section: "A",
    },
    {
      serialNo: 20,
      alternateId: "22301009N021",
      rollNo: "2K23CSUN01213",
      firstName: "KARAN",
      lastName: "BED PARKASH",
      email: "karanvaisnav7674@gmail.com",
      section: "A",
    },
    {
      serialNo: 21,
      alternateId: "22301009N064",
      rollNo: "2K23CSUN01214",
      firstName: "KESA VEERA VENKATA YASWANTH",
      lastName: "KESA SURESH",
      email: "yaswanthkesa@gmail.com",
      section: "A",
    },
    {
      serialNo: 22,
      alternateId: "22301013N027",
      rollNo: "2K23CSUN01215",
      firstName: "KESANAKURTHI LIKHITHA DEVI",
      lastName: "KESANAKURTHI VEERA BHADRA RAO",
      email: "likkivmsl@gmail.com",
      section: "A",
    },
    {
      serialNo: 23,
      alternateId: "22301009N030",
      rollNo: "2K23CSUN01216",
      firstName: "KHUSHI YADAV",
      lastName: "RAVINDER YADAV",
      email: "luv2ravi120@gmail.com",
      section: "A",
    },
    {
      serialNo: 24,
      alternateId: "22301009N080",
      rollNo: "2K23CSUN01218",
      firstName: "KRISH SAINI",
      lastName: "SURENDRA KUMAR SAINI",
      email: "khushu.s.16sep@gmail.com",
      section: "A",
    },
    {
      serialNo: 25,
      alternateId: "22301009N076",
      rollNo: "2K23CSUN01219",
      firstName: "LOKAIAHGARI SAI BHARGAV",
      lastName: "LOKAIAHGARI ANJANEYULU",
      email: "lraju7395@gmail.com",
      section: "A",
    },
    {
      serialNo: 26,
      alternateId: "22301009N075",
      rollNo: "2K23CSUN01220",
      firstName: "MOLUGU VISHRUTH",
      lastName: "MOLUGU VENU",
      email: "vishruthmolugu22@gmail.com",
      section: "A",
    },
    {
      serialNo: 27,
      alternateId: "22301009N125",
      rollNo: "2K23CSUN01221",
      firstName: "MRIDUL KATHAIT",
      lastName: "MANMOHAN SINGH",
      email: "kathaitmridul@gmail.com",
      section: "A",
    },
    {
      serialNo: 28,
      alternateId: "22301017NN214328",
      rollNo: "2K23CSUN01222",
      firstName: "NISHANT DHILLON",
      lastName: "MANJEET SINGH",
      email: "nishantdhillon3026@gmail.com",
      section: "A",
    },
    {
      serialNo: 29,
      alternateId: "22301009N044",
      rollNo: "2K23CSUN01223",
      firstName: "NISHANT KUMAR CHAUHAN",
      lastName: "ASHOK KUMAR",
      email: "nishantkumarchauhan074@gmail.com",
      section: "A",
    },
    {
      serialNo: 30,
      alternateId: "22301009N027",
      rollNo: "2K23CSUN01224",
      firstName: "PARTH SHARMA",
      lastName: "AJAY SHARMA",
      email: "parthshar15@gmail.com",
      section: "A",
    },
    {
      serialNo: 31,
      alternateId: "22301009N086",
      rollNo: "2K23CSUN01226",
      firstName: "RANVEER CHAUHAN",
      lastName: "YASHVEER CHAUHAN",
      email: "ranveersc2005@gmail.com",
      section: "A",
    },
    {
      serialNo: 32,
      alternateId: "22301001N040",
      rollNo: "2K23CSUN01227",
      firstName: "SAMARTH THAKUR",
      lastName: "SUNIL KUMAR",
      email: "samarth.thakur227@gmail.com",
      section: "A",
    },
    {
      serialNo: 33,
      alternateId: "22301010NN71588029",
      rollNo: "2K23CSUN01228",
      firstName: "SARAGADAM KUNDANA CHINNI",
      lastName: "SARAGADAM RAMBABU",
      email: "r.saragadam1111@gmail.com",
      section: "A",
    },
    {
      serialNo: 34,
      alternateId: "22301001N041",
      rollNo: "2K23CSUN01230",
      firstName: "SHIVAM AGGARWAL",
      lastName: "RAM GOPAL",
      email: "shivam.crlover@gmail.com",
      section: "A",
    },
    {
      serialNo: 35,
      alternateId: "22301009N084",
      rollNo: "2K23CSUN01231",
      firstName: "SURAJ GUSAIN",
      lastName: "HAR SINGH GUSAIN",
      email: "surajgusain12082004@gmail.com",
      section: "A",
    },
    {
      serialNo: 36,
      alternateId: "22301009N026",
      rollNo: "2K23CSUN01233",
      firstName: "TARANDEEP SINGH",
      lastName: "AVTAR SINGH",
      email: "js9685997@gmail.com",
      section: "A",
    },
    {
      serialNo: 37,
      alternateId: "22301009N093",
      rollNo: "2K23CSUN01234",
      firstName: "THALLURU LAKSHMI PRASANNA",
      lastName: "THALLURU HARI",
      email: "lakshmiprasannathalluru6@gmail.com",
      section: "A",
    },
    {
      serialNo: 38,
      alternateId: "22301009N042",
      rollNo: "2K23CSUN01235",
      firstName: "UDITA KALRA",
      lastName: "AJIT KALRA",
      email: "mamtakalra47@gmail.com",
      section: "A",
    },
    {
      serialNo: 39,
      alternateId: "22301009N077",
      rollNo: "2K23CSUN01237",
      firstName: "YASH THAKRAN",
      lastName: "HARISH THAKRAN",
      email: "thakranyash8@gmail.com",
      section: "A",
    },
    {
      serialNo: 108,
      alternateId: "22501009M001",
      rollNo: "2K25CSUM01011",
      firstName: "AYUSHMAAN KHURANA",
      lastName: "UPENDRA KHURANA",
      email: "ayushmaan03khurana@gmail.com",
      section: "A",
    },
    {
      serialNo: 40,
      alternateId: "22301009N106",
      rollNo: "2K23CSUN01238",
      firstName: "AAHANA",
      lastName: "ANISH KUMAR",
      email: "aahana090405@gmail.com",
      section: "B",
    },
    {
      serialNo: 41,
      alternateId: "22301009N017",
      rollNo: "2K23CSUN01239",
      firstName: "AAYUSH",
      lastName: "JAI PRAKASH",
      email: "jaiprakashlg@gmail.com",
      section: "B",
    },
    {
      serialNo: 42,
      alternateId: "22301009N091",
      rollNo: "2K23CSUN01240",
      firstName: "ABHIJEET KUMAR SONI",
      lastName: "ANIL KUMAR SONI",
      email: "ABHIJEETSONI006@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 43,
      alternateId: "22301009N038",
      rollNo: "2K23CSUN01241",
      firstName: "ARYAN YADAV",
      lastName: "NARENDRA KUMAR YADAV",
      email: "nkyadav2013@gmail.com",
      section: "B",
    },
    {
      serialNo: 44,
      alternateId: "22301009N050",
      rollNo: "2K23CSUN01242",
      firstName: "AYUSH PANDEY",
      lastName: "GAYA PRASAD PANDEY",
      email: "ayushpandey310305@gmail.com",
      section: "B",
    },
    {
      serialNo: 45,
      alternateId: "22301009N91859",
      rollNo: "2K23CSUN01244",
      firstName: "BHUMIKA KHATRI",
      lastName: "PARVEEN KHATRI",
      email: "khatribhumi1990@gmail.com",
      section: "B",
    },
    {
      serialNo: 46,
      alternateId: "22301009N918113",
      rollNo: "2K23CSUN01245",
      firstName: "CHERUKURI GUNNA LAKSHMI",
      lastName: "CH V APPA RAO",
      email: "gunalakshmi215@gmail.com",
      section: "B",
    },
    {
      serialNo: 47,
      alternateId: "22301009N124",
      rollNo: "2K23CSUN01246",
      firstName: "CHERUKURI HARSHA LUKE CHOWDARY",
      lastName: "CHERUKURI LAKSHMANA RAO",
      email: "lakshmanaraocherukuri661@gmail.com",
      section: "B",
    },
    {
      serialNo: 48,
      alternateId: "22301009N078",
      rollNo: "2K23CSUN01247",
      firstName: "DEVANABOINA THARUN",
      lastName: "DEVANABOINA SRINIVAS",
      email: "tharundevanaboina7@gmail.com",
      section: "B",
    },
    {
      serialNo: 49,
      alternateId: "22301009N037",
      rollNo: "2K23CSUN01248",
      firstName: "DIPIKA CHAUHAN",
      lastName: "TEJENDER",
      email: "chauhandipika686@gmail.com",
      section: "B",
    },
    {
      serialNo: 50,
      alternateId: "22301009N095",
      rollNo: "2K23CSUN01249",
      firstName: "DIVYANSHU JOSHI",
      lastName: "RAKESH KUMAR JOSHI",
      email: "lic.rakeshjoshi@gmail.com",
      section: "B",
    },
    {
      serialNo: 51,
      alternateId: "22301009N918105",
      rollNo: "2K23CSUN01250",
      firstName: "DUDEKULA MOHAMMED FAIZ ALI",
      lastName: "DUDEKULA MOHAMMED RAFEEQ",
      email: "faizuemperor@gmail.com",
      section: "B",
    },
    {
      serialNo: 52,
      alternateId: "22301009N022",
      rollNo: "2K23CSUN01251",
      firstName: "DUSHYANT",
      lastName: "LOKESH KUMAR",
      email: "lokesh.kumar12000@gmail.com",
      section: "B",
    },
    {
      serialNo: 53,
      alternateId: "22301009N019",
      rollNo: "2K23CSUN01252",
      firstName: "HARSH ARORA",
      lastName: "JEEVAN ARORA",
      email: "hrshact@gmail.com",
      section: "B",
    },
    {
      serialNo: 54,
      alternateId: "22301009N058",
      rollNo: "2K23CSUN01254",
      firstName: "HARSHITA SINGH",
      lastName: "UPENDER SINGH",
      email: "loveharshi005@gmail.com",
      section: "B",
    },
    {
      serialNo: 55,
      alternateId: "22301009N059",
      rollNo: "2K23CSUN01255",
      firstName: "HEMANT KUMAR",
      lastName: "CHANDERKANT",
      email: "rituy4088@gmail.com",
      section: "B",
    },
    {
      serialNo: 56,
      alternateId: "22301009N079",
      rollNo: "2K23CSUN01256",
      firstName: "HIMANSHU BANGAR",
      lastName: "SATYA PAL SINGH",
      email: "himanshubangar234@gmail.com",
      section: "B",
    },
    {
      serialNo: 57,
      alternateId: "22301009N018",
      rollNo: "2K23CSUN01257",
      firstName: "KHUSHALI GUPTA",
      lastName: "LATE SH ASHISH GUPTA",
      email: "GUPTAAKANSHA2809@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 58,
      alternateId: "22301009N055",
      rollNo: "2K23CSUN01258",
      firstName: "KOTHURU NAVADEEP",
      lastName: "KOTHURU RANGA SWAMY",
      email: "kothurunavadeep@gmail.com",
      section: "B",
    },
    {
      serialNo: 59,
      alternateId: "22301001N9136",
      rollNo: "2K23CSUN01259",
      firstName: "KOYYADA SHREESHANTH",
      lastName: "KOYYADA NARESH",
      email: "shreeshanthgoud@gmail.com",
      section: "B",
    },
    {
      serialNo: 60,
      alternateId: "22301009N918152",
      rollNo: "2K23CSUN01260",
      firstName: "PALAK BAISLA",
      lastName: "HEMRAJ BAISLA",
      email: "palakbaisla77@gmail.com",
      section: "B",
    },
    {
      serialNo: 61,
      alternateId: "22301009N041",
      rollNo: "2K23CSUN01261",
      firstName: "PARV GUPTA",
      lastName: "GAURAV GUPTA",
      email: "gauravg1973@gmail.com",
      section: "B",
    },
    {
      serialNo: 62,
      alternateId: "22301009N91896",
      rollNo: "2K23CSUN01262",
      firstName: "PORALA POORNA CHANDRA",
      lastName: "POORALA LOKESH",
      email: "poornaporala@gmail.com",
      section: "B",
    },
    {
      serialNo: 63,
      alternateId: "22301009N016",
      rollNo: "2K23CSUN01263",
      firstName: "PRATEEK RAJ",
      lastName: "SAROJ KUMAR GUPTA",
      email: "prateekraj9507@gmail.com",
      section: "B",
    },
    {
      serialNo: 64,
      alternateId: "22301009N073",
      rollNo: "2K23CSUN01264",
      firstName: "PRATHAM",
      lastName: "ARVIND KUMAR",
      email: "prathamchaudhary9711@gmail.com",
      section: "B",
    },
    {
      serialNo: 65,
      alternateId: "22301009N023",
      rollNo: "2K23CSUN01265",
      firstName: "PRIYAKANT TOMAR",
      lastName: "RAVI KARAN",
      email: "priyakanttomar8595@gmail.com",
      section: "B",
    },
    {
      serialNo: 66,
      alternateId: "22301009N094",
      rollNo: "2K23CSUN01266",
      firstName: "PRIYANSHU SINGH",
      lastName: "PREM PRAKASH SINGH",
      email: "PRIYANSHUCOCXBOW@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 67,
      alternateId: "22301010N005",
      rollNo: "2K23CSUN01267",
      firstName: "PURAB BHATIA",
      lastName: "PAWAN BHATIA",
      email: "bhatiapurab27@gmail.com",
      section: "B",
    },
    {
      serialNo: 68,
      alternateId: "22301009N072",
      rollNo: "2K23CSUN01268",
      firstName: "PUSHP NAVEEN MANGLA",
      lastName: "NAVEEN MANGLA",
      email: "pushpmangla123@gmail.com",
      section: "B",
    },
    {
      serialNo: 69,
      alternateId: "22301009N91858",
      rollNo: "2K23CSUN01269",
      firstName: "RAGHAV SHARMA",
      lastName: "PANKAJ SHARMA",
      email: "drpankaj1975@rediffmail.com",
      section: "B",
    },
    {
      serialNo: 70,
      alternateId: "22301009N025",
      rollNo: "2K23CSUN01270",
      firstName: "RASHI BHATI",
      lastName: "KALLU SINGH",
      email: "bhatirashi06@gmail.com",
      section: "B",
    },
    {
      serialNo: 71,
      alternateId: "22301009N054",
      rollNo: "2K23CSUN01272",
      firstName: "RUPIN TEWATIA",
      lastName: "RAJEEV KUMAR TEWATIA",
      email: "rupin.tewatia@gmail.com",
      section: "B",
    },
    {
      serialNo: 72,
      alternateId: "22301009N096",
      rollNo: "2K23CSUN01273",
      firstName: "SAKSHAM SHARMA",
      lastName: "DINESH KUMAR",
      email: "sakshamsharma861@gmail.com",
      section: "B",
    },
    {
      serialNo: 73,
      alternateId: "22301009N120",
      rollNo: "2K23CSUN01274",
      firstName: "SANJANNAGARI SHIVA KUMAR REDDY",
      lastName: "SANJANNAGARI KRISHNA REDDY",
      email: "shivakumarreddy748@gmail.com",
      section: "B",
    },
    {
      serialNo: 74,
      alternateId: "22301009N060",
      rollNo: "2K23CSUN01275",
      firstName: "SHUBHAM RATHORE",
      lastName: "SUTI PARKASH SINGH",
      email: "shubham222651@gmail.com",
      section: "B",
    },
    {
      serialNo: 75,
      alternateId: "22301009N918167",
      rollNo: "2K23CSUN01276",
      firstName: "SIDDHARTH VASHIST",
      lastName: "JITENDER KUMAR",
      email: "JITENDER.VASHISTH@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 76,
      alternateId: "22301009N039",
      rollNo: "2K23CSUN01277",
      firstName: "TANAZZA MUSKAN MIRZA",
      lastName: "MIRZA RASHEED BAIG",
      email: "nikhat@losungautomation.com",
      section: "B",
    },
    {
      serialNo: 77,
      alternateId: "22301001N9184",
      rollNo: "2K23CSUN01278",
      firstName: "TOOM ASHISH RAO",
      lastName: "TOOM ANIL BABU",
      email: "ASHISHRAOTOOM@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 78,
      alternateId: "22301013N029",
      rollNo: "2K23CSUN01279",
      firstName: "UJARLA MAHITHESH",
      lastName: "UJARLA RAGHAVENDRA",
      email: "hemanthsaiujarla9542@gmail.com",
      section: "B",
    },
    {
      serialNo: 79,
      alternateId: "22301009N071",
      rollNo: "2K23CSUN01280",
      firstName: "VELURI YASHWANTH REDDY",
      lastName: "VELURI VENKATA RAMU",
      email: "radharamireddy@yahoo.com",
      section: "B",
    },
    {
      serialNo: 80,
      alternateId: "22301009N069",
      rollNo: "2K23CSUN01281",
      firstName: "VINAYVARMA DEVANABOINA",
      lastName: "NARIMHULU DEVANABOINA",
      email: "devanaboinavinayvarma@gmail.com",
      section: "B",
    },
    {
      serialNo: 81,
      alternateId: "22301009N013",
      rollNo: "2K23CSUN01282",
      firstName: "VIVEK SHARMA",
      lastName: "BHUDEV",
      email: "vivekbhardwaj9518@gmail.com",
      section: "B",
    },
    {
      serialNo: 82,
      alternateId: "22301009N056",
      rollNo: "2K23CSUN01283",
      firstName: "YASH PANDEY",
      lastName: "RANJEET KUMAR PANDEY",
      email: "yashsumit076@gmail.com",
      section: "B",
    },
    {
      serialNo: 83,
      alternateId: "22301009N011",
      rollNo: "2K23CSUN01284",
      firstName: "YASHVARDHAN SINGH TOMAR",
      lastName: "RITURAJ SINGH TOMAR",
      email: "mde1399@gmail.com",
      section: "B",
    },
    {
      serialNo: 84,
      alternateId: "22301009N918115",
      rollNo: "2K23CSUN01285",
      firstName: "YASWANTH KUMAR PALAGANI",
      lastName: "MANGARAO PALAGANI",
      email: "PYASWANTHKUMARP@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 85,
      alternateId: "22301009N099",
      rollNo: "2K23CSUN01286",
      firstName: "AALLA SWATHI KIRAN",
      lastName: "AALLA VENKATA RAO",
      email: "aallaswathikiran@gmail.com",
      section: "C",
    },
    {
      serialNo: 86,
      alternateId: "22301009N103",
      rollNo: "2K23CSUN01287",
      firstName: "BADE SUMANTH",
      lastName: "BADE MUKUNDA",
      email: "sumanthreddybade1@gmail.com",
      section: "C",
    },
    {
      serialNo: 87,
      alternateId: "22301009N048",
      rollNo: "2K23CSUN01288",
      firstName: "BOBBLI SHIVA SAI",
      lastName: "BOBBLI SANTHOSH KUMAR",
      email: "bobbilisanthosh3380@gmail.com",
      section: "C",
    },
    {
      serialNo: 88,
      alternateId: "22301009N108",
      rollNo: "2K23CSUN01289",
      firstName: "DAKSH KUMAR",
      lastName: "SANJAY KUMAR",
      email: "vandanavats2002@gmail.com",
      section: "C",
    },
    {
      serialNo: 89,
      alternateId: "22301009N051",
      rollNo: "2K23CSUN01290",
      firstName: "DIMPLE",
      lastName: "NAND KISHORE",
      email: "dimplegupta0776@gmail.com",
      section: "C",
    },
    {
      serialNo: 90,
      alternateId: "22301009N098",
      rollNo: "2K23CSUN01291",
      firstName: "DRISH BHALLA",
      lastName: "NIKHIL BHALLA",
      email: "drish.bhalla@gmail.com",
      section: "C",
    },
    {
      serialNo: 91,
      alternateId: "22301009N097",
      rollNo: "2K23CSUN01292",
      firstName: "DRISHTI",
      lastName: "DINESH KUMAR KATARIA",
      email: "drishtikataria252@gmail.com",
      section: "C",
    },
    {
      serialNo: 92,
      alternateId: "22301009N100",
      rollNo: "2K23CSUN01293",
      firstName: "GUNJAN",
      lastName: "VIJAY KUMAR",
      email: "virmanigunjan3@gmail.com",
      section: "C",
    },
    {
      serialNo: 93,
      alternateId: "22301009N109",
      rollNo: "2K23CSUN01294",
      firstName: "JAI GUPTA",
      lastName: "SANJAY GUPTA",
      email: "me.jai.gupta@gmail.com",
      section: "C",
    },
    {
      serialNo: 94,
      alternateId: "22301009N114",
      rollNo: "2K23CSUN01295",
      firstName: "JAI KUMAR",
      lastName: "RAJESH KUMAR",
      email: "jaikumar9311413@gmail.com",
      section: "C",
    },
    {
      serialNo: 95,
      alternateId: "22301009N111",
      rollNo: "2K23CSUN01296",
      firstName: "JATIN KANINWAL",
      lastName: "NARESH KUMAR",
      email: "jatin208rao@gmail.com",
      section: "C",
    },
    {
      serialNo: 96,
      alternateId: "22301009N063",
      rollNo: "2K23CSUN01298",
      firstName: "KAKULAPATI ESWAR",
      lastName: "KAKULAPATI VENKATESHWARARAO",
      email: "nava2021@gmail.com",
      section: "C",
    },
    {
      serialNo: 97,
      alternateId: "22301009N116",
      rollNo: "2K23CSUN01299",
      firstName: "KASHISH VASHISTH",
      lastName: "PURAN CHAND",
      email: "kashishvash2805@gmail.com",
      section: "C",
    },
    {
      serialNo: 98,
      alternateId: "22301009N117",
      rollNo: "2K23CSUN01300",
      firstName: "KAVAY YADAV",
      lastName: "BHUPENDER YADAV",
      email: "rekhayadav8500@gmail.com",
      section: "C",
    },
    {
      serialNo: 99,
      alternateId: "22301009N047",
      rollNo: "2K23CSUN01302",
      firstName: "PRATHAM",
      lastName: "PRAFUL KUMAR",
      email: "prathamdecember04@gmail.com",
      section: "C",
    },
    {
      serialNo: 100,
      alternateId: "22301009N123",
      rollNo: "2K23CSUN01303",
      firstName: "SAHEB ALAM",
      lastName: "MOHAMMAD FIROZ",
      email: "129aahil234@gmail.com",
      section: "C",
    },
    {
      serialNo: 101,
      alternateId: "22301010NN010",
      rollNo: "2K23CSUN01304",
      firstName: "SANCHIT CHUGH",
      lastName: "PRITAM CHUGH",
      email: "sanchitchugh7@gmail.com",
      section: "C",
    },
    {
      serialNo: 102,
      alternateId: "22301009N113",
      rollNo: "2K23CSUN01305",
      firstName: "SATYA BHARDWAJ",
      lastName: "SANDEEP BHARDWAJ",
      email: "satyabhardwaj007@gmail.com",
      section: "C",
    },
    {
      serialNo: 103,
      alternateId: "22301009N105",
      rollNo: "2K23CSUN01306",
      firstName: "SAURABH RAI",
      lastName: "ARUN KUMAR",
      email: "saurabhrai3108@gmail.com",
      section: "C",
    },
    {
      serialNo: 104,
      alternateId: "22301009N122",
      rollNo: "2K23CSUN01308",
      firstName: "TARUN BISHT",
      lastName: "JAGDISH SINGH BIST",
      email: "jagsbist@gmail.com",
      section: "C",
    },
    {
      serialNo: 105,
      alternateId: "22301009N115",
      rollNo: "2K23CSUN01309",
      firstName: "THALLAPAREDDY SRAVANI",
      lastName: "THALLAPAREDDY KONDA REDDY",
      email: "thallapareddysravanithallapare@gmail.com",
      section: "C",
    },
    {
      serialNo: 106,
      alternateId: "22301001N266",
      rollNo: "2K23CSUN01310",
      firstName: "YASH SHARMA",
      lastName: "SOMDUTT SHARMA",
      email: "jangiryash801@gmail.com",
      section: "C",
    },
    {
      serialNo: 107,
      alternateId: "22301009N040",
      rollNo: "2K23CSUN01311",
      firstName: "YUG BENIWAL",
      lastName: "ANIL KUMAR BENIWAL",
      email: "yugbeniwal18@gmail.com",
      section: "C",
    },
  ];

  // Group students by batch year and section
  const studentsByBatchAndSection: {
    [key: number]: { [key: string]: StudentData[] };
  } = {};

  for (const student of allStudents) {
    if (!student.section || student.section.toLowerCase() === "none") {
      console.log(
        `⏩ Skipping student ${student.rollNo} - ${student.firstName} as section is missing or 'none'.`
      );
      continue;
    }

    const match = student.rollNo.match(/2K(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1], 10);
      if (!studentsByBatchAndSection[year]) {
        studentsByBatchAndSection[year] = { A: [], B: [], C: [], D: [] };
      }
      if (studentsByBatchAndSection[year].hasOwnProperty(student.section)) {
        studentsByBatchAndSection[year][student.section].push(student);
      } else {
        console.warn(
          `⚠️  Student ${student.rollNo} has an unknown section '${student.section}'. Skipping.`
        );
      }
    } else {
      console.warn(
        `⚠️  Could not determine batch year for student ${student.rollNo}. Skipping.`
      );
    }
  }

  // Seed students for each group
  for (const yearStr in studentsByBatchAndSection) {
    const year = parseInt(yearStr, 10);
    for (const sectionName in studentsByBatchAndSection[year]) {
      const sectionStudents = studentsByBatchAndSection[year][sectionName];
      if (sectionStudents.length > 0) {
        const sectionConfig: SectionConfig = {
          programCode: "AI-ML",
          programName: "Artificial Intelligence and Machine Learning",
          sectionName,
          semester: 5,
          batchYear: year,
        };
        await seedStudents(sectionConfig, sectionStudents);
      }
    }
  }

  console.log(
    "\n✅ All AI-ML 5th Semester student seeding tasks completed successfully!\n"
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
