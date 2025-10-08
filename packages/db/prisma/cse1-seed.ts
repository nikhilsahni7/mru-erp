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
      serialNo: 2,
      alternateId: "225101001039",
      rollNo: "2K25CSUN01001",
      firstName: "ABHAY KUMAR",
      lastName: "DINESH KUMAR",
      email: "abhaykumar.5766@gmail.com",
      section: "C",
    },
    {
      serialNo: 3,
      alternateId: "225101001043",
      rollNo: "2K25CSUN01002",
      firstName: "ABHISHEK SHARMA",
      lastName: "PREM CHAND SHARMA",
      email: "abhisheksharma15733@gmail.com",
      section: "C",
    },
    {
      serialNo: 4,
      alternateId: "225101001025",
      rollNo: "2K25CSUN01003",
      firstName: "ABHISHEK VATS",
      lastName: "VIJAY VATS",
      email: "vatsabhishek636@gmail.com",
      section: "C",
    },
    {
      serialNo: 5,
      alternateId: "125101005008",
      rollNo: "2K25CSUN01004",
      firstName: "ADITYA KUMAR GUPTA",
      lastName: "BIJAY KUMAR GUPTA",
      email: "adityaanshu2006@gmail.com",
      section: "B",
    },
    {
      serialNo: 6,
      alternateId: "125101005094",
      rollNo: "2K25CSUN01006",
      firstName: "AKSHIT ISTWAL",
      lastName: "SUDHIR ISTWAL",
      email: "istwalakshit3@gmail.com",
      section: "B",
    },
    {
      serialNo: 7,
      alternateId: "225101001030",
      rollNo: "2K25CSUN01007",
      firstName: "ANURAG SHARMA",
      lastName: "BIPIN BIHARI",
      email: "anuragsharma3827@gmail.com",
      section: "A",
    },
    {
      serialNo: 8,
      alternateId: "225101001007",
      rollNo: "2K25CSUN01010",
      firstName: "ASHMITA SHUKLA",
      lastName: "AMIT KUMAR SHUKLA",
      email: "ashmitacandoit@gmail.com",
      section: "A",
    },
    {
      serialNo: 9,
      alternateId: "225101001018",
      rollNo: "2K25CSUN01011",
      firstName: "ASHNA BHUI",
      lastName: "GAUTAM BHUI",
      email: "ashnabhui11@gmail.com",
      section: "C",
    },
    {
      serialNo: 10,
      alternateId: "225101001064",
      rollNo: "2K25CSUN01012",
      firstName: "ASHWARAYA SHARMA",
      lastName: "RAKESH KUMAR",
      email: "rakeshsharma1679@gmail.com",
      section: "C",
    },
    {
      serialNo: 11,
      alternateId: "225101001002",
      rollNo: "2K25CSUN01013",
      firstName: "ATULYA SINGH",
      lastName: "RAJU KUMAR SINGH",
      email: "mamta280472@gmail.com",
      section: "A",
    },
    {
      serialNo: 12,
      alternateId: "225101001061",
      rollNo: "2K25CSUN01014",
      firstName: "AVIPSA GON",
      lastName: "TUHIN SUBHRA GON",
      email: "avipsagon@gmail.com",
      section: "A",
    },
    {
      serialNo: 13,
      alternateId: "225101001098",
      rollNo: "2K25CSUN01015",
      firstName: "AYAAN ZAFIR KHAN",
      lastName: "ZAFIR KHAN",
      email: "ayaanzafir8@gmail.com",
      section: "B",
    },
    {
      serialNo: 14,
      alternateId: "225101001004",
      rollNo: "2K25CSUN01016",
      firstName: "DEEPAK KUMAR",
      lastName: "ANANDI PRASAD",
      email: "anandiprasad939@gmail.com",
      section: "C",
    },
    {
      serialNo: 15,
      alternateId: "225101001051",
      rollNo: "2K25CSUN01017",
      firstName: "DEV DAHIYA",
      lastName: "NARENDER SINGH",
      email: "dev.dd1903@gmail.com",
      section: "B",
    },
    {
      serialNo: 16,
      alternateId: "225101001029",
      rollNo: "2K25CSUN01018",
      firstName: "DHEERAJ RAI",
      lastName: "RAM LOCHAN RAI",
      email: "dheerajrai4113m@gmail.com",
      section: "A",
    },
    {
      serialNo: 17,
      alternateId: "225101001065",
      rollNo: "2K25CSUN01019",
      firstName: "DHRUV GARG",
      lastName: "SANJAY GARG",
      email: "dhruvgarg232@gmail.com",
      section: "A",
    },
    {
      serialNo: 18,
      alternateId: "225101001012",
      rollNo: "2K25CSUN01020",
      firstName: "GAURAV YADAV",
      lastName: "ROOPESH KUMAR",
      email: "gy70285@gmail.com",
      section: "A",
    },
    {
      serialNo: 19,
      alternateId: "225101001008",
      rollNo: "2K25CSUN01021",
      firstName: "HARSH",
      lastName: "AMIR CHAND",
      email: "createrharsh69@gmail.com",
      section: "B",
    },
    {
      serialNo: 20,
      alternateId: "225101001011",
      rollNo: "2K25CSUN01022",
      firstName: "HARSH SHARMA",
      lastName: "DEEP CHAND SHARMA",
      email: "sharmaharsh.6sept@gmail.com",
      section: "B",
    },
    {
      serialNo: 21,
      alternateId: "225101001049",
      rollNo: "2K25CSUN01023",
      firstName: "HIMANSHU",
      lastName: "SANDEEP KUMAR",
      email: "himanshuya2411@gmail.com",
      section: "B",
    },
    {
      serialNo: 22,
      alternateId: "225101001069",
      rollNo: "2K25CSUN01024",
      firstName: "ISHANT SHARMA",
      lastName: "DEVENDER SHARMA",
      email: "ishantsharmatkd41@gmail.com",
      section: "C",
    },
    {
      serialNo: 23,
      alternateId: "225101001020",
      rollNo: "2K25CSUN01025",
      firstName: "JAHANVI PULANI",
      lastName: "SHAILESH PULANI",
      email: "jahanvipulani@gmail.com",
      section: "A",
    },
    {
      serialNo: 24,
      alternateId: "225101001054",
      rollNo: "2K25CSUN01026",
      firstName: "JAI",
      lastName: "ANIL KUMAR",
      email: "ganaxhjai@gmail.com",
      section: "C",
    },
    {
      serialNo: 25,
      alternateId: "225101001067",
      rollNo: "2K25CSUN01027",
      firstName: "JATIN NONIHAL",
      lastName: "DINESH NONIHAL",
      email: "bjps2003@yahoo.co.in",
      section: "A",
    },
    {
      serialNo: 26,
      alternateId: "225101001014",
      rollNo: "2K25CSUN01028",
      firstName: "KAMAL SINGH",
      lastName: "GOPAL SINGH",
      email: "kamal113singh@gmail.com",
      section: "C",
    },
    {
      serialNo: 27,
      alternateId: "225101001017",
      rollNo: "2K25CSUN01029",
      firstName: "KARTHIKEYA SHARMA KOVVALI",
      lastName: "SRIRAMA C M KOVVALI",
      email: "karthikey.kovvali@gmail.com",
      section: "C",
    },
    {
      serialNo: 28,
      alternateId: "225101001046",
      rollNo: "2K25CSUN01030",
      firstName: "KARTIK ARORA",
      lastName: "VINOD ARORA",
      email: "arorakartik913@gmail.com",
      section: "B",
    },
    {
      serialNo: 29,
      alternateId: "225101001016",
      rollNo: "2K25CSUN01031",
      firstName: "KARTIK PATHAK",
      lastName: "RADHA RAMAN PATHAK",
      email: "KARTIKPATHAK5013@GMAIL.COM",
      section: "C",
    },
    {
      serialNo: 30,
      alternateId: "225101001045",
      rollNo: "2K25CSUN01032",
      firstName: "KESHAV KUMAR",
      lastName: "YADESH KUMAR",
      email: "kumaryadesh51@gmail.com",
      section: "A",
    },
    {
      serialNo: 31,
      alternateId: "225101001058",
      rollNo: "2K25CSUN01033",
      firstName: "KOMAL .",
      lastName: "AMIT KUMAR SINGHAL",
      email: "komalsinghal5677@gmail.com",
      section: "B",
    },
    {
      serialNo: 32,
      alternateId: "225101001059",
      rollNo: "2K25CSUN01034",
      firstName: "KUSHAGRA RAJ",
      lastName: "RAJESH KUMAR",
      email: "kushagrar363@gmail.com",
      section: "C",
    },
    {
      serialNo: 33,
      alternateId: "225101001038",
      rollNo: "2K25CSUN01035",
      firstName: "LAKSHAY TEWATIA",
      lastName: "NARENDER SINGH TEWATIA",
      email: "narendertewatia12@gmail.com",
      section: "B",
    },
    {
      serialNo: 34,
      alternateId: "225101001019",
      rollNo: "2K25CSUN01036",
      firstName: "LAKSHAY VASHISHTH",
      lastName: "KAMAL KISHOR SHARMA",
      email: "kamalnotes@gmail.com",
      section: "C",
    },
    {
      serialNo: 35,
      alternateId: "225101001070",
      rollNo: "2K25CSUN01037",
      firstName: "LAKSHMI MAHESH BOLE",
      lastName: "MADHUSUDHAN RAO BOLE",
      email: "rg.gopi999@gmail.com",
      section: "A",
    },
    {
      serialNo: 36,
      alternateId: "225101001037",
      rollNo: "2K25CSUN01040",
      firstName: "MOHAMMAD ARHAM KHAN",
      lastName: "MOHD YUNUS",
      email: "ltyunus672@gmail.com",
      section: "C",
    },
    {
      serialNo: 37,
      alternateId: "225101001048",
      rollNo: "2K25CSUN01041",
      firstName: "NIHAL KUMAR",
      lastName: "VIKASH KUMAR SINGH",
      email: "aryanjrnihal@gmail.com",
      section: "C",
    },
    {
      serialNo: 38,
      alternateId: "225101001047",
      rollNo: "2K25CSUN01042",
      firstName: "NIKHIL BAGAI",
      lastName: "MANISH KUMAR",
      email: "nikhilbagai0129@gmail.com",
      section: "A",
    },
    {
      serialNo: 39,
      alternateId: "OU125101005006",
      rollNo: "2K25CSUN01043",
      firstName: "NYI LIN HTIKE",
      lastName: "U MIN THWIN",
      email: "nyilinhtikeacademic@gmail.com",
      section: "B",
    },
    {
      serialNo: 40,
      alternateId: "225101001053",
      rollNo: "2K25CSUN01044",
      firstName: "OMPRAKASH KUMAR",
      lastName: "VISHUNDAYAL SAH",
      email: "omprakashkumar55554@gmail.com",
      section: "B",
    },
    {
      serialNo: 41,
      alternateId: "225101001021",
      rollNo: "2K25CSUN01045",
      firstName: "PALAK CHANDNA",
      lastName: "KAMAL CHANDNA",
      email: "plk565356@gmail.com",
      section: "B",
    },
    {
      serialNo: 42,
      alternateId: "225101001057",
      rollNo: "2K25CSUN01046",
      firstName: "PARTH ARORA",
      lastName: "RAJESH KUMAR ARORA",
      email: "kamdhenuclothtraders@gmail.com",
      section: "A",
    },
    {
      serialNo: 43,
      alternateId: "225101001041",
      rollNo: "2K25CSUN01047",
      firstName: "PARTH GROVER",
      lastName: "NAVEEN KUMAR",
      email: "groverparth23@gmail.com",
      section: "A",
    },
    {
      serialNo: 44,
      alternateId: "225101001003",
      rollNo: "2K25CSUN01049",
      firstName: "PRANJAL KUMAR",
      lastName: "AJAY KUMAR",
      email: "contact@pranjalkumar.com",
      section: "C",
    },
    {
      serialNo: 45,
      alternateId: "225101001033",
      rollNo: "2K25CSUN01050",
      firstName: "PRASHANT TYAGI",
      lastName: "RAHUL KUMAR",
      email: "prashanttyagi@gmail.com",
      section: "C",
    },
    {
      serialNo: 46,
      alternateId: "225101001010",
      rollNo: "2K25CSUN01051",
      firstName: "PRATEEK MUKHIJA",
      lastName: "VIPIN MUKHIJA",
      email: "prateekmukhija15@gmail.com",
      section: "A",
    },
    {
      serialNo: 47,
      alternateId: "225101001032",
      rollNo: "2K25CSUN01052",
      firstName: "PULKIT .",
      lastName: "RAJESH KUMAR",
      email: "pulkittaneja1107@gmail.com",
      section: "A",
    },
    {
      serialNo: 48,
      alternateId: "225101001055",
      rollNo: "2K25CSUN01053",
      firstName: "RIDHIMA",
      lastName: "SONU ROHILLA",
      email: "rohillasonu560@gmail.com",
      section: "A",
    },
    {
      serialNo: 49,
      alternateId: "225101001066",
      rollNo: "2K25CSUN01054",
      firstName: "RIYA",
      lastName: "SURENDER SINGH",
      email: "riyadalal187@gmail.com",
      section: "B",
    },
    {
      serialNo: 50,
      alternateId: "225101001062",
      rollNo: "2K25CSUN01055",
      firstName: "ROHAN JAIN",
      lastName: "AVINASH JAIN",
      email: "rj4883469@gmail.com",
      section: "C",
    },
    {
      serialNo: 51,
      alternateId: "225101001040",
      rollNo: "2K25CSUN01056",
      firstName: "SAKSHAM YADAV",
      lastName: "VIPIN KUMAR",
      email: "vipinyadav.mppl@gmail.com",
      section: "C",
    },
    {
      serialNo: 52,
      alternateId: "225101001035",
      rollNo: "2K25CSUN01057",
      firstName: "SHREY",
      lastName: "RAGHBIR SINGH",
      email: "raghbirsingh921@gmail.com",
      section: "A",
    },
    {
      serialNo: 53,
      alternateId: "225101001060",
      rollNo: "2K25CSUN01058",
      firstName: "SUBHAAN SAIFI",
      lastName: "SANJAY KHAN SAIFI",
      email: "subhaansaifi04@gmail.com",
      section: "A",
    },
    {
      serialNo: 54,
      alternateId: "225101001023",
      rollNo: "2K25CSUN01059",
      firstName: "SUJAL ANEJA",
      lastName: "DINESH KUMAR",
      email: "sujalaneja45@gmail.com",
      section: "B",
    },
    {
      serialNo: 55,
      alternateId: "225101001056",
      rollNo: "2K25CSUN01060",
      firstName: "SURAJ YADAV",
      lastName: "DINESH",
      email: "tuktukyadav60605@gmail.com",
      section: "C",
    },
    {
      serialNo: 56,
      alternateId: "125101005017",
      rollNo: "2K25CSUN01061",
      firstName: "TANMAY PRAKASH",
      lastName: "OM PRAKASH",
      email: "tanmayprakash94@gmail.com",
      section: "B",
    },
    {
      serialNo: 57,
      alternateId: "125101005027",
      rollNo: "2K25CSUN01062",
      firstName: "TUSHAR",
      lastName: "KANHAIYA LAL",
      email: "tusharbnwl@gmail.com",
      section: "A",
    },
    {
      serialNo: 58,
      alternateId: "225101001026",
      rollNo: "2K25CSUN01063",
      firstName: "UJJWAL TANWAR",
      lastName: "SURENDER SINGH",
      email: "ujjwaltanwar0099@gmail.com",
      section: "B",
    },
    {
      serialNo: 59,
      alternateId: "225101001022",
      rollNo: "2K25CSUN01065",
      firstName: "VAIBHAV VASHISTHA",
      lastName: "DEVDUTT VASHISTHA",
      email: "vanivashistha1980@gmail.com",
      section: "C",
    },
    {
      serialNo: 60,
      alternateId: "225101001036",
      rollNo: "2K25CSUN01066",
      firstName: "VANSH GAUR",
      lastName: "MAHENDER SHARMA",
      email: "vanshog88@gmail.com",
      section: "B",
    },
    {
      serialNo: 61,
      alternateId: "225101001031",
      rollNo: "2K25CSUN01067",
      firstName: "VANSH KHANNA",
      lastName: "RAKESH KHANNA",
      email: "ironmanvansh2007@gmail.com",
      section: "B",
    },
    {
      serialNo: 62,
      alternateId: "225101001028",
      rollNo: "2K25CSUN01068",
      firstName: "VASISHT SAHOO",
      lastName: "RUDRA PRASAD SAHOO",
      email: "vasishtsahoo26@gmail.com",
      section: "C",
    },
    {
      serialNo: 63,
      alternateId: "225101001015",
      rollNo: "2K25CSUN01069",
      firstName: "VAYU GUPTA",
      lastName: "PANKAJ KUMAR GUPTA",
      email: "pankaj81gupta@gmail.com",
      section: "B",
    },
    {
      serialNo: 64,
      alternateId: "225101001006",
      rollNo: "2K25CSUN01071",
      firstName: "YASH CHAUHAN",
      lastName: "OM PRAKASH",
      email: "yashcpw@gmail.com",
      section: "A",
    },
    {
      serialNo: 65,
      alternateId: "225101001052",
      rollNo: "2K25CSUN01072",
      firstName: "YASH DAGAR",
      lastName: "RATTAN SINGH",
      email: "hydagar787@gmail.com",
      section: "C",
    },
    {
      serialNo: 66,
      alternateId: "225101001071",
      rollNo: "2K25CSUN01073",
      firstName: "THOTA AVINASH CHANDRA",
      lastName: "THOTA RAMESH",
      email: "thotarameshlal@gmail.com",
      section: "B",
    },
    {
      serialNo: 67,
      alternateId: "225101001072",
      rollNo: "2K25CSUN01074",
      firstName: "LAKSHAY .",
      lastName: "SANJAY SHARMA",
      email: "sharmal9266@gmail.com",
      section: "C",
    },
    {
      serialNo: 68,
      alternateId: "225101001073",
      rollNo: "2K25CSUN01075",
      firstName: "DEV SINGH",
      lastName: "AJAY SINGH",
      email: "devsinghp1111@gmail.com",
      section: "C",
    },
    {
      serialNo: 69,
      alternateId: "225101001074",
      rollNo: "2K25CSUN01076",
      firstName: "BANDARU VISHNU TEJA",
      lastName: "BANDARU MAHESH",
      email: "bandaruvishnuteja22@gmail.com",
      section: "A",
    },
    {
      serialNo: 70,
      alternateId: "225101001075",
      rollNo: "2K25CSUN01077",
      firstName: "HITESH SHEORAN",
      lastName: "LOKESH KUMAR",
      email: "sheoranlokesh@gmail.com",
      section: "C",
    },
    {
      serialNo: 71,
      alternateId: "225101001076",
      rollNo: "2K25CSUN01078",
      firstName: "JATIN PARMAR",
      lastName: "SURESH KUMAR",
      email: "jatinparmar7098@gmail.com",
      section: "A",
    },
    {
      serialNo: 72,
      alternateId: "225101001077",
      rollNo: "2K25CSUN01079",
      firstName: "VANSH TEWATIA",
      lastName: "RAKESH TEWATIA",
      email: "Bhupi.2828@gmail.com",
      section: "C",
    },
    {
      serialNo: 73,
      alternateId: "225101001078",
      rollNo: "2K25CSUN01080",
      firstName: "PURNIMA TEWATIA",
      lastName: "YOGESH TEWATIA",
      email: "Yogeshtewatia4621@gmail.com",
      section: "B",
    },
    {
      serialNo: 74,
      alternateId: "225101001080",
      rollNo: "2K25CSUN01081",
      firstName: "DEVISMITA PATNAIK",
      lastName: "RAJANIKANT PATTANAIK",
      email: "devismitapatnaik@gmail.com",
      section: "C",
    },
    {
      serialNo: 75,
      alternateId: "225101001081",
      rollNo: "2K25CSUN01082",
      firstName: "YUVRAJ",
      lastName: "PRITAM",
      email: "mahakpawar30@gmail.com",
      section: "A",
    },
    {
      serialNo: 76,
      alternateId: "225101001083",
      rollNo: "2K25CSUN01084",
      firstName: "RASHI KAWATRA",
      lastName: "ARVIND KUMAR",
      email: "itsrashi2007@gmail.com",
      section: "A",
    },
    {
      serialNo: 77,
      alternateId: "225101001084",
      rollNo: "2K25CSUN01085",
      firstName: "PUSHAKAR KUMAR",
      lastName: "CHANDRA PRATAP SINGH",
      email: "pushkr1978@gmail.com",
      section: "A",
    },
    {
      serialNo: 78,
      alternateId: "225101001085",
      rollNo: "2K25CSUN01086",
      firstName: "KUMAR ABHIGYAN",
      lastName: "PRASUN KUMAR",
      email: "abhigyank444@gmail.com",
      section: "C",
    },
    {
      serialNo: 79,
      alternateId: "225101001087",
      rollNo: "2K25CSUN01087",
      firstName: "ISHAN SAROHA",
      lastName: "JITENDER KUMAR",
      email: "sarohaishan2@gmail.com",
      section: "B",
    },
    {
      serialNo: 80,
      alternateId: "225101001086",
      rollNo: "2K25CSUN01088",
      firstName: "SHIVAM PANWAR",
      lastName: "SHER SINGH",
      email: "ss8799019@gmail.com",
      section: "B",
    },
    {
      serialNo: 81,
      alternateId: "225101001088",
      rollNo: "2K25CSUN01089",
      firstName: "RUDRANSH BHATI",
      lastName: "PARVEEN KUMAR",
      email: "aditibhati1507@gmail.com",
      section: "C",
    },
    {
      serialNo: 82,
      alternateId: "225101018N026",
      rollNo: "2K25CSUN01090",
      firstName: "SHASHANK NARWAT",
      lastName: "TEJRAM",
      email: "shashankchoudhary1111@gmail.com",
      section: "A",
    },
    {
      serialNo: 83,
      alternateId: "225101001089",
      rollNo: "2K25CSUN01091",
      firstName: "ABHAY KESHAR",
      lastName: "DURJAN SINGH KESHAR",
      email: "siddharthscientific@gmail.com",
      section: "C",
    },
    {
      serialNo: 84,
      alternateId: "225101001090",
      rollNo: "2K25CSUN01092",
      firstName: "AARNAV JHA",
      lastName: "KUMAR SUNIL SUMAN",
      email: "aarnavjha2006@gmail.com",
      section: "C",
    },
    {
      serialNo: 85,
      alternateId: "225101001094",
      rollNo: "2K25CSUN01094",
      firstName: "RAJESHWARI SARKAR",
      lastName: "BISWAJIT SARKAR",
      email: "rajeshwarisarkar180306@gmail.com",
      section: "A",
    },
    {
      serialNo: 86,
      alternateId: "225101001095",
      rollNo: "2K25CSUN01095",
      firstName: "HARDIK MADAN",
      lastName: "KAPIL MADAN",
      email: "hardikprobro@gmail.com",
      section: "B",
    },
    {
      serialNo: 87,
      alternateId: "225101001096",
      rollNo: "2K25CSUN01096",
      firstName: "SUNNY KUMAR BHARDWAJ",
      lastName: "NILESH KUMAR",
      email: "sunny96256@gmail.com",
      section: "A",
    },
    {
      serialNo: 88,
      alternateId: "225101001097",
      rollNo: "2K25CSUN01097",
      firstName: "NIKHIL KUMAR BHARDWAJ",
      lastName: "NILESH KUMAR",
      email: "nkk83840@gmail.com",
      section: "B",
    },
    {
      serialNo: 89,
      alternateId: "22501001N001",
      rollNo: "2K25CSUN01098",
      firstName: "DEEPAK KUMAR",
      lastName: "DHARAM PAL",
      email: "deepakarora905020@gmail.com",
      section: "A",
    },
    {
      serialNo: 90,
      alternateId: "22501001N003",
      rollNo: "2K25CSUN01100",
      firstName: "KUMKUM .",
      lastName: "RAKESH KUMAR",
      email: "kumkumbaghel4646@gmail.com",
      section: "C",
    },
    {
      serialNo: 91,
      alternateId: "225101001079",
      rollNo: "2K25CSUN01101",
      firstName: "AMAN KUMAR",
      lastName: "RAJESH KUMAR",
      email: "aman.5911591159115911@gmail.com",
      section: "A",
    },
    {
      serialNo: 92,
      alternateId: "22501001N004",
      rollNo: "2K25CSUN01102",
      firstName: "ADITYA RASTOGI",
      lastName: "NEERAJ RASTOGI",
      email: "adityarastogi299@gmail.com",
      section: "A",
    },
    {
      serialNo: 93,
      alternateId: "22501001N005",
      rollNo: "2K25CSUN01103",
      firstName: "VARNIKA SHARMA",
      lastName: "ANKUSH SHARMA",
      email: "soniavani11@yahoo.in",
      section: "A",
    },
    {
      serialNo: 94,
      alternateId: "22501001N006",
      rollNo: "2K25CSUN01104",
      firstName: "SANJANA KUMARI",
      lastName: "PAWAN KUMAR RAI",
      email: "sanju.kumyadav505@gmail.com",
      section: "B",
    },
    {
      serialNo: 95,
      alternateId: "22501001N008",
      rollNo: "2K25CSUN01106",
      firstName: "MEHAR ARORA",
      lastName: "PANKAJ ARORA",
      email: "mehar.arorap@gmail.com",
      section: "A",
    },
    {
      serialNo: 96,
      alternateId: "22501001N010",
      rollNo: "2K25CSUN01108",
      firstName: "ABHAY SINGH",
      lastName: "YASHPAL SINGH",
      email: "rajeshweriraghav@gmail.com",
      section: "C",
    },
    {
      serialNo: 97,
      alternateId: "22501001N011",
      rollNo: "2K25CSUN01109",
      firstName: "ARIHANT JAIN",
      lastName: "NIRMAL KUMAR JAIN",
      email: "jainarihant023@gmail.com",
      section: "C",
    },
    {
      serialNo: 98,
      alternateId: "22501001N012",
      rollNo: "2K25CSUN01110",
      firstName: "DEV",
      lastName: "DALBIR",
      email: "devtawar9817@gmail.com",
      section: "C",
    },
    {
      serialNo: 99,
      alternateId: "22501001N013",
      rollNo: "2K25CSUN01111",
      firstName: "HIMANSHI PAL",
      lastName: "SANJEEV PAL",
      email: "himanshipal814@gmail.com",
      section: "A",
    },
    {
      serialNo: 100,
      alternateId: "22501001N014",
      rollNo: "2K25CSUN01112",
      firstName: "MOHAMMED KAIF",
      lastName: "INTZAR HUSSAIN",
      email: "kaifchaudhary81@gmail.com",
      section: "B",
    },
    {
      serialNo: 101,
      alternateId: "22501001N015",
      rollNo: "2K25CSUN01113",
      firstName: "PRACHI .",
      lastName: "ANIL KUMAR",
      email: "prachimahroliya@gmail.com",
      section: "A",
    },
    {
      serialNo: 102,
      alternateId: "22501001N016",
      rollNo: "2K25CSUN01114",
      firstName: "GYANESHWAR SANTI",
      lastName: "MALAYA SANTI",
      email: "gyaneshwar.s.200@gmail.com",
      section: "C",
    },
    {
      serialNo: 103,
      alternateId: "22501001N017",
      rollNo: "2K25CSUN01115",
      firstName: "ADITYA BHATI",
      lastName: "KARAN SINGH",
      email: "adityabhati204@gmail.com",
      section: "B",
    },
    {
      serialNo: 104,
      alternateId: "22501001N018",
      rollNo: "2K25CSUN01116",
      firstName: "KUNAL VIKAL",
      lastName: "RAJEEV KUMAR",
      email: "rajkunal1507@gmail.com",
      section: "B",
    },
    {
      serialNo: 105,
      alternateId: "22501001N679",
      rollNo: "2K25CSUN01117",
      firstName: "RITIKA .",
      lastName: "VIKRAM PAL",
      email: "ritikapal0088@gmail.com",
      section: "C",
    },
    {
      serialNo: 106,
      alternateId: "22501001N680",
      rollNo: "2K25CSUN01118",
      firstName: "SAMEER SHARMA",
      lastName: "SANJOY SHARMA",
      email: "ss6056658@gmail.com",
      section: "B",
    },
    {
      serialNo: 107,
      alternateId: "22501001N706",
      rollNo: "2K25CSUN01119",
      firstName: "TAURAI NDHLOVU",
      lastName: "LYSON NDHLOVU",
      email: "tauraiability@gmail.com",
      section: "B",
    },
    {
      serialNo: 108,
      alternateId: "22501001N682",
      rollNo: "2K25CSUN01120",
      firstName: "VALLAPUNENI VENKATA PRASAD",
      lastName: "VALLAPUNENI PEDDA VENKATESWARLU",
      email: "vvenkatsprasad913@gmail.com",
      section: "B",
    },
    {
      serialNo: 109,
      alternateId: "22501001N686",
      rollNo: "2K25CSUN01121",
      firstName: "VENKANT NARENDRA",
      lastName: "VALLAPUNENI ALLURAIAH",
      email: "vallapuneninarendrardsrnk@gmail.com",
      section: "C",
    },
    {
      serialNo: 110,
      alternateId: "22501001N683",
      rollNo: "2K25CSUN01122",
      firstName: "VIPPARLA VENKATA ANIL KUMAR",
      lastName: "VIPPARLA ALLURAIAH",
      email: "vipparlaanilchowdary@gmail.com",
      section: "A",
    },
    {
      serialNo: 111,
      alternateId: "22501001N685",
      rollNo: "2K25CSUN01123",
      firstName: "SANCHIT TIWARI",
      lastName: "SANTOSH KUMAR TIWARI",
      email: "tiwarisanchit50@gmail.com",
      section: "C",
    },
    {
      serialNo: 112,
      alternateId: "22501001N684",
      rollNo: "2K25CSUN01124",
      firstName: "MAITREE BEDARKAR",
      lastName: "NAVIN BEDARKAR",
      email: "bharti.bedarkar29@gmail.com",
      section: "B",
    },
    {
      serialNo: 113,
      alternateId: "22501001N687",
      rollNo: "2K25CSUN01125",
      firstName: "MOHIT HOODA",
      lastName: "LALLU",
      email: "hmohit211@gmail.com",
      section: "A",
    },
    {
      serialNo: 114,
      alternateId: "22501001N688",
      rollNo: "2K25CSUN01126",
      firstName: "VIPPARLA DURGA PRASAD",
      lastName: "VIPPARLA CHINNA SUBBAIAH",
      email: "prasaddurgaprasad726@gmail.com",
      section: "A",
    },
    {
      serialNo: 115,
      alternateId: "22501001N689",
      rollNo: "2K25CSUN01127",
      firstName: "PRIYANSH",
      lastName: "RAJ KUMAR",
      email: "littlebully41@gmail.com",
      section: "A",
    },
    {
      serialNo: 116,
      alternateId: "22501001N690",
      rollNo: "2K25CSUN01128",
      firstName: "ANGEL CHUGH",
      lastName: "PANKAJ CHUGH",
      email: "angel.mrgs0406@gmail.com",
      section: "B",
    },
    {
      serialNo: 117,
      alternateId: "22501001N691",
      rollNo: "2K25CSUN01129",
      firstName: "TANISHQ BAJAJ",
      lastName: "SANDEEP BAJAJ",
      email: "sandeepbajaj8322@gmail.com",
      section: "B",
    },
    {
      serialNo: 118,
      alternateId: "22501001N693",
      rollNo: "2K25CSUN01132",
      firstName: "RHYTHM SINGH",
      lastName: "DAVINDER SINGH",
      email: "rhythms535@gmail.com",
      section: "C",
    },
    {
      serialNo: 119,
      alternateId: "22501001N694",
      rollNo: "2K25CSUN01133",
      firstName: "PARTH ANEJA",
      lastName: "ANIL KUMAR",
      email: "parthaneja54@gmail.com",
      section: "A",
    },
    {
      serialNo: 120,
      alternateId: "22501001N696",
      rollNo: "2K25CSUN01134",
      firstName: "FRANCIS MAPONGA",
      lastName: "MAPONGA RABION",
      email: "mapongafrancis89@gmail.com",
      section: "B",
    },
    {
      serialNo: 121,
      alternateId: "22501001N698",
      rollNo: "2K25CSUN01135",
      firstName: "AMAN VERMA",
      lastName: "VINOD KUMAR VERMA",
      email: "sv365479@gmail.com",
      section: "B",
    },
    {
      serialNo: 122,
      alternateId: "225101CSU08004",
      rollNo: "2K25CSUN01136",
      firstName: "KRISHNA ARYA",
      lastName: "SATISH KUMAR ARYA",
      email: "karya00786@gmail.com",
      section: "B",
    },
    {
      serialNo: 123,
      alternateId: "225101CSU08003",
      rollNo: "2K25CSUN01137",
      firstName: "ANANDIT SHARMA",
      lastName: "SANDEEP SHARMA",
      email: "ananditsharma94@gmail.com",
      section: "C",
    },
    {
      serialNo: 124,
      alternateId: "22501001N699",
      rollNo: "2K25CSUN01138",
      firstName: "DHRUV",
      lastName: "CHANDER PRAKASH",
      email: "dhruvsharma6oct@gmail.com",
      section: "B",
    },
    {
      serialNo: 125,
      alternateId: "22501001N700",
      rollNo: "2K25CSUN01139",
      firstName: "SANCHIT KUMAR",
      lastName: "ANIL KUMAR",
      email: "sanchitkataria321@gmail.com",
      section: "B",
    },
    {
      serialNo: 126,
      alternateId: "22501001N702",
      rollNo: "2K25CSUN01140",
      firstName: "ANKIT",
      lastName: "RAKESH KUMAR",
      email: "Shwetabainsla@gmail.com",
      section: "B",
    },
    {
      serialNo: 127,
      alternateId: "22501001N701",
      rollNo: "2K25CSUN01141",
      firstName: "BOBY .",
      lastName: "SUKHPAL",
      email: "ldpublicschool1014@gmail.com",
      section: "C",
    },
    {
      serialNo: 128,
      alternateId: "22501001N704",
      rollNo: "2K25CSUN01143",
      firstName: "AARIN RAJPUT",
      lastName: "VISHAL RAJPUT",
      email: "rajputvishal2@rediffmail.com",
      section: "C",
    },
    {
      serialNo: 129,
      alternateId: "22501001N709",
      rollNo: "2K25CSUN01146",
      firstName: "POOJYA",
      lastName: "UMESH PUSHP",
      email: "pushp.poojya@gmail.com",
      section: "B",
    },
    {
      serialNo: 130,
      alternateId: "22501001N710",
      rollNo: "2K25CSUN01147",
      firstName: "PRACHI",
      lastName: "RAJESH KUMAR",
      email: "rakeshoctober1@gmail.com",
      section: "C",
    },
    {
      serialNo: 131,
      alternateId: "22501001N711",
      rollNo: "2K25CSUN01148",
      firstName: "KARTIK ARORA",
      lastName: "VINAY ARORA",
      email: "uniquepapers1@gmail.com",
      section: "C",
    },
    {
      serialNo: 132,
      alternateId: "22501001N712",
      rollNo: "2K25CSUN01149",
      firstName: "PRIYANSHU ARYA",
      lastName: "SATYAKAM",
      email: "arya16priyanshu@gmail.com",
      section: "C",
    },
    {
      serialNo: 133,
      alternateId: "22501001N714",
      rollNo: "2K25CSUN01151",
      firstName: "RITIKA YADAV",
      lastName: "LAL CHANDRA YADAV",
      email: "lalchandra1980@gmail.com",
      section: "C",
    },
    {
      serialNo: 134,
      alternateId: "22501001N713",
      rollNo: "2K25CSUN01152",
      firstName: "PRABHLEEN KAUR MAKKED",
      lastName: "GURDEEP SINGH MAKKER",
      email: "prabhleen477@gmail.com",
      section: "C",
    },
    {
      serialNo: 135,
      alternateId: "22501001N716",
      rollNo: "2K25CSUN01153",
      firstName: "KUNAL BAINSLA",
      lastName: "TEJ SINGH SINGH",
      email: "tejsinghbainsla2904@gmail.com",
      section: "B",
    },
    {
      serialNo: 136,
      alternateId: "22501001N717",
      rollNo: "2K25CSUN01154",
      firstName: "ABHIRAG CHOWDHURY",
      lastName: "DEBASISH CHOWDHURY",
      email: "abhirag.chowdhury@gmail.com",
      section: "A",
    },
    {
      serialNo: 137,
      alternateId: "22501001N718",
      rollNo: "2K25CSUN01155",
      firstName: "HIMESH KUMAR SHARMA",
      lastName: "RAJ KUMAR SHARMA",
      email: "himeshs421@gmail.com",
      section: "A",
    },
    {
      serialNo: 138,
      alternateId: "22501001N719",
      rollNo: "2K25CSUN01156",
      firstName: "KANAK SHARMA",
      lastName: "PANKAJ SHARMA",
      email: "kanaksharma7002@gmail.com",
      section: "A",
    },
    {
      serialNo: 139,
      alternateId: "22501001N721",
      rollNo: "2K25CSUN01158",
      firstName: "BISHAL KUMAR RAY",
      lastName: "LALIT KUMAR RAY",
      email: "bishalray623@gmail.com",
      section: "B",
    },
    {
      serialNo: 140,
      alternateId: "22501001N722",
      rollNo: "2K25CSUN01159",
      firstName: "OM KUMAR MADHUR",
      lastName: "MANOJ KUMAR",
      email: "ommadhur2k@gmail.com",
      section: "B",
    },
    {
      serialNo: 141,
      alternateId: "22501001N723",
      rollNo: "2K25CSUN01160",
      firstName: "AMAN KAUSHIK",
      lastName: "SHIVRAJ SHARMA",
      email: "kaushikboy311@gmail.com",
      section: "B",
    },
    {
      serialNo: 142,
      alternateId: "225101009046",
      rollNo: "2K25CSUN01303",
      firstName: "NUPUR GARG",
      lastName: "YOGESH GARG",
      email: "nupur0115garg@gmail.com",
      section: "C",
    },
  ];

  // Group students by batch year and section
  const studentsByBatchAndSection: {
    [key: number]: { [key: string]: StudentData[] };
  } = {};

  for (const student of allStudents) {
    // Skip students with no section assigned
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
        // If section is not A, B, C, or D, log it but don't stop the process
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
        programCode: "CSE",
        programName: "Computer Science and Engineering",
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
    "\n✅ All CSE 1st Semester student seeding tasks completed successfully!\n"
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
