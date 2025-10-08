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
      serialNo: 196,
      alternateId: "225501001002",
      rollNo: "2K25CSUM01001",
      firstName: "BHAVUK ADLAKHA",
      lastName: "SURESH ADLAKHA",
      email: "badlakha96@gmail.com",
      section: "B",
    },
    {
      serialNo: 195,
      alternateId: "224301001009",
      rollNo: "2K24CSUM01003",
      firstName: "PARAS SHARMA",
      lastName: "VIKRAM SHARMA",
      email: "parassharma280505@gmail.com",
      section: "C",
    },
    {
      serialNo: 194,
      alternateId: "22430100122",
      rollNo: "2K24CSUM01001",
      firstName: "OMANSH ATTREE",
      lastName: "GAURAV ATTREE",
      email: "omanshattree@gmail.com",
      section: "C",
    },
    {
      serialNo: 193,
      alternateId: "224301001007",
      rollNo: "2K24CSUL01007",
      firstName: "TAMAN",
      lastName: "ANIL KUMAR",
      email: "tamanyaduvanshi89@gmail.com",
      section: "A",
    },
    {
      serialNo: 192,
      alternateId: "224101001154",
      rollNo: "2K24CSUL01006",
      firstName: "PRINCE SHARMA",
      lastName: "MUNISH KUMAR SHARMA",
      email: "prince.sharma060303@gmail.com",
      section: "A",
    },
    {
      serialNo: 191,
      alternateId: "22401001L02",
      rollNo: "2K24CSUL01005",
      firstName: "NISHA VERMA",
      lastName: "BRAHAM SINGH VERMA",
      email: "1611.nishaverma@gmail.com",
      section: "A",
    },
    {
      serialNo: 190,
      alternateId: "22430100132",
      rollNo: "2K24CSUL01004",
      firstName: "KETAN KUMAR",
      lastName: "DEVENDER BHATT",
      email: "bhattketan074@gmail.com",
      section: "C",
    },
    {
      serialNo: 189,
      alternateId: "224301001006",
      rollNo: "2K24CSUL01003",
      firstName: "AMAN SHARMA",
      lastName: "RATAN SHARMA",
      email: "asharma8464@gmail.com",
      section: "A",
    },
    {
      serialNo: 188,
      alternateId: "22430100142",
      rollNo: "2K24CSUL01002",
      firstName: "AKASH KUMAR",
      lastName: "PANKAJ KUMAR",
      email: "akashkumarssksingh2002@gmail.com",
      section: "C",
    },
    {
      serialNo: 187,
      alternateId: "224101001174",
      rollNo: "2K24CSUL01001",
      firstName: "ACHAL KUMAR",
      lastName: "ARUN KUMAR",
      email: "achalkumar6976@gmail.com",
      section: "A",
    },
    {
      serialNo: 186,
      alternateId: "22301001N9256",
      rollNo: "2K23CSUN01370",
      firstName: "AAKASH KUMAR JHA",
      lastName: "SANT NATH JHA",
      email: "aakashkumarjha0001@gmail.com",
      section: "B",
    },
    {
      serialNo: 185,
      alternateId: "22301001N27550734",
      rollNo: "2K23CSUN01369",
      firstName: "AAYUSHMAAN",
      lastName: "ASHOK KUMAR",
      email: "MAANUKAUSHIK990@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 184,
      alternateId: "22301001N207",
      rollNo: "2K23CSUN01192",
      firstName: "YOGEETA",
      lastName: "RAMESH CHANDER",
      email: "rameshchnader1805@gmail.com",
      section: "C",
    },
    {
      serialNo: 183,
      alternateId: "22301001N178",
      rollNo: "2K23CSUN01191",
      firstName: "VIVEK",
      lastName: "RAMPHAL SINGH",
      email: "praveenk4293@gmail.com",
      section: "C",
    },
    {
      serialNo: 182,
      alternateId: "22301001N185",
      rollNo: "2K23CSUN01190",
      firstName: "VINAY SHARMA",
      lastName: "PREM CHAND SHARMA",
      email: "vinaysharma005252@gmail.com",
      section: "C",
    },
    {
      serialNo: 181,
      alternateId: "22301001N974",
      rollNo: "2K23CSUN01189",
      firstName: "VEDANT BHARGAW RAI",
      lastName: "AKHILESH RAI",
      email: "officialaryan2005@gmail.com",
      section: "C",
    },
    {
      serialNo: 180,
      alternateId: "22301009N417",
      rollNo: "2K23CSUN01188",
      firstName: "VANSH RAHEJA",
      lastName: "KRISHAN RAHEJA",
      email: "vanshraheja05@gmail.com",
      section: "C",
    },
    {
      serialNo: 179,
      alternateId: "22301001N171",
      rollNo: "2K23CSUN01186",
      firstName: "UDIT BANSIWAL",
      lastName: "VIKRANT SINGH",
      email: "bansiwaludit30@gmail.com",
      section: "C",
    },
    {
      serialNo: 178,
      alternateId: "22301018NN502",
      rollNo: "2K23CSUN01185",
      firstName: "TANISH SINGLA",
      lastName: "RAKESH SINGLA",
      email: "tsingla2005@gmail.com",
      section: "C",
    },
    {
      serialNo: 177,
      alternateId: "22301001N058",
      rollNo: "2K23CSUN01184",
      firstName: "SUHANI GOYAL",
      lastName: "RAJEEV KUMAR GOYAL",
      email: "suhaniviru@gmail.com",
      section: "C",
    },
    {
      serialNo: 176,
      alternateId: "22301001N274",
      rollNo: "2K23CSUN01183",
      firstName: "SHIVAM YADAV",
      lastName: "SUSHIL KUMAR YADAV",
      email: "shivamaarush2004@gmail.com",
      section: "C",
    },
    {
      serialNo: 175,
      alternateId: "22301001N023",
      rollNo: "2K23CSUN01182",
      firstName: "SHIVAM KUMAR JHA",
      lastName: "LALIT KUMAR JHA",
      email: "shivamkumarjha2305@gmail.com",
      section: "C",
    },
    {
      serialNo: 174,
      alternateId: "22301001N106",
      rollNo: "2K23CSUN01181",
      firstName: "SHANKUPAL RISHWANTHRAO",
      lastName: "SHANKUPAL RAJESHWAR",
      email: "shankupalrish@gmail.com",
      section: "C",
    },
    {
      serialNo: 173,
      alternateId: "22301001N083",
      rollNo: "2K23CSUN01180",
      firstName: "SAURABH",
      lastName: "SANJAY",
      email: "saurabhsanjaybansal@gmail.com",
      section: "C",
    },
    {
      serialNo: 172,
      alternateId: "22301001N174",
      rollNo: "2K23CSUN01179",
      firstName: "SARTHAK TYAGI",
      lastName: "PANKAJ TYAGI",
      email: "s.sarthaktyagi7@gmail.com",
      section: "C",
    },
    {
      serialNo: 171,
      alternateId: "22301001N176",
      rollNo: "2K23CSUN01178",
      firstName: "SAKSHAM",
      lastName: "RAJNESH KUMAR",
      email: "kauntsaksham@gmail.com",
      section: "C",
    },
    {
      serialNo: 170,
      alternateId: "22301001N177",
      rollNo: "2K23CSUN01177",
      firstName: "SAHIL",
      lastName: "KULDEEP SINGH",
      email: "sahiljangra743@gmail.com",
      section: "C",
    },
    {
      serialNo: 169,
      alternateId: "22301001N175",
      rollNo: "2K23CSUN01176",
      firstName: "SACHIN KUMAR RAI",
      lastName: "DILIP RAI",
      email: "sachinkumarrai7678@gmail.com",
      section: "C",
    },
    {
      serialNo: 168,
      alternateId: "22301001N172",
      rollNo: "2K23CSUN01175",
      firstName: "ROHIT SINGH",
      lastName: "BIJENDER SINGH",
      email: "bijendersingh5684@gmail.com",
      section: "C",
    },
    {
      serialNo: 167,
      alternateId: "22301001N053",
      rollNo: "2K23CSUN01174",
      firstName: "RISHI GUPTA",
      lastName: "MANVENDRA GUPTA",
      email: "rishimegupta@gmail.com",
      section: "C",
    },
    {
      serialNo: 166,
      alternateId: "22301001N024",
      rollNo: "2K23CSUN01173",
      firstName: "PUSHKAR YADAV",
      lastName: "SHIV RATAN SINGH YADAV",
      email: "pushkaryadav1026@gmail.com",
      section: "C",
    },
    {
      serialNo: 165,
      alternateId: "22301001N107",
      rollNo: "2K23CSUN01172",
      firstName: "PUPPALA SAI CHARAN REDDY",
      lastName: "PUPPALA VENKATA SRIDHAR REDDY",
      email: "sreedharreddy@gmail.com",
      section: "C",
    },
    {
      serialNo: 164,
      alternateId: "22301001N165",
      rollNo: "2K23CSUN01171",
      firstName: "PUJARI SAI RAMANA",
      lastName: "PUJARI RAMESH",
      email: "sairampoojari708@gmail.com",
      section: "C",
    },
    {
      serialNo: 163,
      alternateId: "22301001N210",
      rollNo: "2K23CSUN01170",
      firstName: "PRIYANSHU SHARMA",
      lastName: "RAMBIR SHARMA",
      email: "sharmapriyanshu7723@gmail.com",
      section: "C",
    },
    {
      serialNo: 162,
      alternateId: "22301001N161",
      rollNo: "2K23CSUN01169",
      firstName: "PRIYANSHU KHARI",
      lastName: "RAJENDER PAL",
      email: "priyanshukhari02@gmail.com",
      section: "A",
    },
    {
      serialNo: 161,
      alternateId: "22301001N197",
      rollNo: "2K23CSUN01168",
      firstName: "PRIYANK SHARMA",
      lastName: "BHARAT LAL SHARMA",
      email: "bharatsharma0069@gmail.com",
      section: "C",
    },
    {
      serialNo: 160,
      alternateId: "22301001N079",
      rollNo: "2K23CSUN01167",
      firstName: "PRISHA CHOPRA",
      lastName: "LALIT CHOPRA",
      email: "prishachopra1723@gmail.com",
      section: "C",
    },
    {
      serialNo: 159,
      alternateId: "22301001N159",
      rollNo: "2K23CSUN01166",
      firstName: "PARAS GERA",
      lastName: "HARISH KUMAR",
      email: "harishlakshit@yahoo.com",
      section: "C",
    },
    {
      serialNo: 158,
      alternateId: "22301001N145",
      rollNo: "2K23CSUN01165",
      firstName: "PALAMAKULA SOWMIKA REDDY",
      lastName: "PALAMAKULA SRINIVAS REDDY",
      email: "sowmikareddy08@gmail.com",
      section: "C",
    },
    {
      serialNo: 157,
      alternateId: "22301001N141",
      rollNo: "2K23CSUN01164",
      firstName: "NISHANT PAL",
      lastName: "SANJEEV PAL",
      email: "nishantpal072@gmail.com",
      section: "C",
    },
    {
      serialNo: 156,
      alternateId: "22301001N9239",
      rollNo: "2K23CSUN01163",
      firstName: "NIKITA SHARMA",
      lastName: "MEHAR PAL SHARMA",
      email: "ns8136488@gmail.com",
      section: "C",
    },
    {
      serialNo: 155,
      alternateId: "22301001N184",
      rollNo: "2K23CSUN01162",
      firstName: "NAQUI HASAN SHAMSI",
      lastName: "NAWAID SHAMSI",
      email: "naqui72711@gmail.com",
      section: "C",
    },
    {
      serialNo: 154,
      alternateId: "22301001N166",
      rollNo: "2K23CSUN01161",
      firstName: "MUSKAN",
      lastName: "TEJPAL",
      email: "muskanjangid23@gmail.com",
      section: "C",
    },
    {
      serialNo: 153,
      alternateId: "22301001N084",
      rollNo: "2K23CSUN01160",
      firstName: "MUKUL JAIN",
      lastName: "ARUN JAIN",
      email: "jainmukul335@gmail.com",
      section: "C",
    },
    {
      serialNo: 152,
      alternateId: "22301001N173",
      rollNo: "2K23CSUN01159",
      firstName: "MAYANK SINGH NEGI",
      lastName: "PRITAM SINGH",
      email: "negimayank40@gmail.com",
      section: "C",
    },
    {
      serialNo: 151,
      alternateId: "22301001N029",
      rollNo: "2K23CSUN01158",
      firstName: "MANU GOYAL",
      lastName: "SURENDRA KUMAR GOYAL",
      email: "goyalmanu026@gmail.com",
      section: "C",
    },
    {
      serialNo: 150,
      alternateId: "22301001N092",
      rollNo: "2K23CSUN01157",
      firstName: "MANISH KUMAR SINGH",
      lastName: "DILEEP KUMAR SINGH",
      email: "manishsingh770394@gmail.com",
      section: "C",
    },
    {
      serialNo: 149,
      alternateId: "22301001N066",
      rollNo: "2K23CSUN01156",
      firstName: "MANAS RANJAN",
      lastName: "MANISH RANJAN",
      email: "ranjanmanas957@gmail.com",
      section: "B",
    },
    {
      serialNo: 148,
      alternateId: "22301001N076",
      rollNo: "2K23CSUN01155",
      firstName: "KHUSHBOO MEHTA",
      lastName: "RAMESH CHANDER MEHTA",
      email: "rcmehta737@gmail.com",
      section: "C",
    },
    {
      serialNo: 147,
      alternateId: "22301001N152",
      rollNo: "2K23CSUN01154",
      firstName: "KAVYA DHINGRA",
      lastName: "DHARMENDER DHINGRA",
      email: "KAVYA.DHINGRA14@GMAIL.COM.",
      section: "C",
    },
    {
      serialNo: 146,
      alternateId: "22301001N123",
      rollNo: "2K23CSUN01153",
      firstName: "KASIREDDI SRAVANTHI",
      lastName: "KASIREDDI VENKATA SATYANARAYANA",
      email: "kasireddisravanthi@gmail.com",
      section: "C",
    },
    {
      serialNo: 145,
      alternateId: "22301001N082",
      rollNo: "2K23CSUN01152",
      firstName: "KARTIK GUPTA",
      lastName: "VIVEK GUPTA",
      email: "gkartik2007@gmail.com",
      section: "C",
    },
    {
      serialNo: 144,
      alternateId: "22301001N143",
      rollNo: "2K23CSUN01151",
      firstName: "KAMRE SRIHARSH",
      lastName: "K NARENDER",
      email: "kamblesriharsh1234@gmail.com",
      section: "C",
    },
    {
      serialNo: 143,
      alternateId: "22301001N209",
      rollNo: "2K23CSUN01150",
      firstName: "HIMANSHU SHARMA",
      lastName: "SANJAY SHARMA",
      email: "dharmaricha@gmail.com",
      section: "C",
    },
    {
      serialNo: 142,
      alternateId: "22301001N085",
      rollNo: "2K23CSUN01149",
      firstName: "HAYAT ATAUL KHAN",
      lastName: "ATAUL HAQUE KHAN",
      email: "khanhayatataul@gmail.com",
      section: "C",
    },
    {
      serialNo: 141,
      alternateId: "22301001N9254",
      rollNo: "2K23CSUN01148",
      firstName: "HARSHIT PANWAR",
      lastName: "JITENDER",
      email: "harshitpanwar56@gmail.com",
      section: "C",
    },
    {
      serialNo: 140,
      alternateId: "22301018NN264432",
      rollNo: "2K23CSUN01147",
      firstName: "HARMANT SINGH",
      lastName: "NARINDER SINGH",
      email: "anjubhatia107@gmail.com",
      section: "C",
    },
    {
      serialNo: 139,
      alternateId: "22301001N030",
      rollNo: "2K23CSUN01146",
      firstName: "DIYA",
      lastName: "DHIRENDRA KUMAR",
      email: "deepa98185@gmail.com",
      section: "C",
    },
    {
      serialNo: 138,
      alternateId: "22301001N078",
      rollNo: "2K23CSUN01145",
      firstName: "DIWAKAR PARSAD VERMA",
      lastName: "LAXMAN PARSAD VERMA",
      email: "diwakarverma737@gmail.com",
      section: "C",
    },
    {
      serialNo: 137,
      alternateId: "22301001N038",
      rollNo: "2K23CSUN01144",
      firstName: "DIVYANSH SINGH",
      lastName: "SANJAY KUMAR SINGH",
      email: "singhmamata346@gmail.com",
      section: "C",
    },
    {
      serialNo: 136,
      alternateId: "22301001N183",
      rollNo: "2K23CSUN01143",
      firstName: "DAKSH BHARDWAJ",
      lastName: "BHARTESH BHARDWAJ",
      email: "dakshbhardwaj2005@gmail.com",
      section: "A",
    },
    {
      serialNo: 135,
      alternateId: "22301001N142",
      rollNo: "2K23CSUN01142",
      firstName: "CHHAYA SHARMA",
      lastName: "PARMOD SHARMA",
      email: "jyotisna1984@gmail.com",
      section: "C",
    },
    {
      serialNo: 134,
      alternateId: "22301001N138",
      rollNo: "2K23CSUN01141",
      firstName: "CHESHTA GARG",
      lastName: "SANJAY KUMAR GARG",
      email: "cheshtagarg28@gmail.com",
      section: "C",
    },
    {
      serialNo: 133,
      alternateId: "22301001N203",
      rollNo: "2K23CSUN01140",
      firstName: "CHALLA REVANTH REDDY",
      lastName: "CHALLA NAVEEN REDDY",
      email: "revanthreddy22c@gmail.com",
      section: "C",
    },
    {
      serialNo: 132,
      alternateId: "22301001N9228",
      rollNo: "2K23CSUN01139",
      firstName: "CHAITANYA DHAWAN",
      lastName: "MEHUL DHAWAN",
      email: "cmrdhawan@gmail.com",
      section: "C",
    },
    {
      serialNo: 131,
      alternateId: "22301001N022",
      rollNo: "2K23CSUN01138",
      firstName: "BHAVYA BEHL",
      lastName: "SANJAY BEHL",
      email: "bhavyabehl44@gmail.com",
      section: "C",
    },
    {
      serialNo: 130,
      alternateId: "22301001N170",
      rollNo: "2K23CSUN01137",
      firstName: "BHAVESH",
      lastName: "HANSRAJ NARANG",
      email: "hansrajnarang65@gmail.com",
      section: "C",
    },
    {
      serialNo: 129,
      alternateId: "22301001N116",
      rollNo: "2K23CSUN01136",
      firstName: "BAZARU SIVA NANDINI",
      lastName: "BAZARU RAMESH",
      email: "saikrishnabazaru@gmail.com",
      section: "C",
    },
    {
      serialNo: 128,
      alternateId: "22301001N26645494",
      rollNo: "2K23CSUN01135",
      firstName: "AYUSH KUMAR SINHA",
      lastName: "SANJEEV KUMAR SINHA",
      email: "ayushkrsinha2005@gmail.com",
      section: "A",
    },
    {
      serialNo: 127,
      alternateId: "22301001N151",
      rollNo: "2K23CSUN01134",
      firstName: "ASHMIT MANCHANDA",
      lastName: "PAWAN KUMAR",
      email: "ashmitmanchanda112@gmail.com",
      section: "C",
    },
    {
      serialNo: 126,
      alternateId: "22301018NN264433",
      rollNo: "2K23CSUN01133",
      firstName: "ASHMEET SINGH",
      lastName: "AVTAR SINGH",
      email: "ashmeetsingh54321@gmail.com",
      section: "C",
    },
    {
      serialNo: 125,
      alternateId: "22301001N200",
      rollNo: "2K23CSUN01132",
      firstName: "ARUSHI SHARMA",
      lastName: "S S SHASTRI",
      email: "sharmaarushi045@gmail.com",
      section: "C",
    },
    {
      serialNo: 124,
      alternateId: "22301001N108",
      rollNo: "2K23CSUN01131",
      firstName: "ARSHEYA ANTIK MISHRA",
      lastName: "ASIT JATASHANKAR MISHRA",
      email: "arsheyamishra0@outlook.com",
      section: "C",
    },
    {
      serialNo: 123,
      alternateId: "22301001N216",
      rollNo: "2K23CSUN01130",
      firstName: "ARJUN MATHUR",
      lastName: "RAM SINGH MATHUR",
      email: "rahulvbl24@gmail.com",
      section: "C",
    },
    {
      serialNo: 122,
      alternateId: "22301001N020",
      rollNo: "2K23CSUN01129",
      firstName: "ANURAG",
      lastName: "MANOJ KUMAR",
      email: "anuragraman52@gmail.com",
      section: "C",
    },
    {
      serialNo: 121,
      alternateId: "22301001N075",
      rollNo: "2K23CSUN01128",
      firstName: "ANSHUL",
      lastName: "BRAHMPARKASH",
      email: "kasanaanshul05@gmail.com",
      section: "C",
    },
    {
      serialNo: 120,
      alternateId: "22301001N097",
      rollNo: "2K23CSUN01125",
      firstName: "VITTHAL AGARWAL",
      lastName: "VISHNU KUMAR AGARWAL",
      email: "vitthalagrawal21@gmail.com",
      section: "B",
    },
    {
      serialNo: 119,
      alternateId: "22301001N135",
      rollNo: "2K23CSUN01124",
      firstName: "VISSARAPU ASWANTH",
      lastName: "VISSARAPU SESHAIAH",
      email: "vissarapuaswanth@gmail.com",
      section: "B",
    },
    {
      serialNo: 118,
      alternateId: "22301001N130",
      rollNo: "2K23CSUN01123",
      firstName: "VARUN VASISTHA",
      lastName: "JIT KUMAR VASISTH",
      email: "vandanavashisth73@gmail.com",
      section: "B",
    },
    {
      serialNo: 117,
      alternateId: "22301001N001",
      rollNo: "2K23CSUN01122",
      firstName: "VAISHNAVI GAUTAM",
      lastName: "RAHUL DEO GAUTAM",
      email: "RAHULDEO.RG@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 116,
      alternateId: "202",
      rollNo: "2K23CSUN01121",
      firstName: "TANISHQ",
      lastName: "VIJAY KUMAR",
      email: "vatstanishq5108@gmail.com",
      section: "B",
    },
    {
      serialNo: 115,
      alternateId: "22301001N048",
      rollNo: "2K23CSUN01120",
      firstName: "SWATI BHATI",
      lastName: "RAKESH KUMAR BHATI",
      email: "swatisinghbhati04112019@gmail.com",
      section: "B",
    },
    {
      serialNo: 114,
      alternateId: "22301001N191",
      rollNo: "2K23CSUN01119",
      firstName: "SOMYA PRABHAKAR",
      lastName: "SANJAY KUMAR PRABHAKAR",
      email: "somyaprabhakar399@gmail.com",
      section: "B",
    },
    {
      serialNo: 113,
      alternateId: "22301001N214",
      rollNo: "2K23CSUN01118",
      firstName: "SIRIPIREDDY BHAVANA REDDY",
      lastName: "SIRIPIREDDY VENJATA RAMANA REDDY",
      email: "siripireddybhavanareddy12@gmail.com",
      section: "B",
    },
    {
      serialNo: 112,
      alternateId: "22301001N136",
      rollNo: "2K23CSUN01117",
      firstName: "SHREY CHAUDHARY",
      lastName: "MANOJ KUMAR",
      email: "shrey.chaudhary2004@gmail.com",
      section: "B",
    },
    {
      serialNo: 111,
      alternateId: "22301001N167",
      rollNo: "2K23CSUN01116",
      firstName: "SANSKAR AGARWAL",
      lastName: "VISHNU AGARWAL",
      email: "sanskaragarwal175@gmail.com",
      section: "B",
    },
    {
      serialNo: 110,
      alternateId: "22301001N202",
      rollNo: "2K23CSUN01115",
      firstName: "SANIYA NIRANIYA",
      lastName: "RAJENDER NIRANIYA",
      email: "niraniyasaniya4@gmail.com",
      section: "B",
    },
    {
      serialNo: 109,
      alternateId: "22301001N010",
      rollNo: "2K23CSUN01114",
      firstName: "SANA GHOSH CHOWDHURY",
      lastName: "PARTHA GHOSH CHOWDHURY",
      email: "gc.sana10@gmail.com",
      section: "B",
    },
    {
      serialNo: 108,
      alternateId: "22301001N132",
      rollNo: "2K23CSUN01113",
      firstName: "SAMRIDDHI KAPOOR",
      lastName: "SANJAY KAPOOR",
      email: "samriddhik4@gmail.com",
      section: "B",
    },
    {
      serialNo: 107,
      alternateId: "22301001N122",
      rollNo: "2K23CSUN01112",
      firstName: "SAMAY NARWAT",
      lastName: "SANJAY NARWAT",
      email: "samaynarwat066@gmail.com",
      section: "B",
    },
    {
      serialNo: 106,
      alternateId: "22301001N074",
      rollNo: "2K23CSUN01110",
      firstName: "RITIKA SINGH",
      lastName: "SANJAY SINGH",
      email: "shanujadon30@gmail.com",
      section: "B",
    },
    {
      serialNo: 105,
      alternateId: "22301001N068",
      rollNo: "2K23CSUN01109",
      firstName: "RITESH YADAV",
      lastName: "PAWAN KUMAR",
      email: "anil382@gmail.com",
      section: "B",
    },
    {
      serialNo: 104,
      alternateId: "22301018NN009",
      rollNo: "2K23CSUN01108",
      firstName: "RIMJHIM VERMA",
      lastName: "DIWAKER VERMA",
      email: "vermarimjhim218@gmail.com",
      section: "B",
    },
    {
      serialNo: 103,
      alternateId: "22301001N181",
      rollNo: "2K23CSUN01107",
      firstName: "RIDDHIMA PHALSWAL",
      lastName: "JAYANT PHALSWAL",
      email: "riddhimaphalswal@gmail.com",
      section: "B",
    },
    {
      serialNo: 102,
      alternateId: "22301001N014",
      rollNo: "2K23CSUN01106",
      firstName: "RAAHI SINGH",
      lastName: "SATBIR SINGH",
      email: "satbirattri@yahoo.com",
      section: "B",
    },
    {
      serialNo: 101,
      alternateId: "22301001N9165",
      rollNo: "2K23CSUN01105",
      firstName: "PUSHKAR GARG",
      lastName: "RAJESH GUPTA",
      email: "pushkargarg61@gmail.com",
      section: "B",
    },
    {
      serialNo: 100,
      alternateId: "22301001N148",
      rollNo: "2K23CSUN01104",
      firstName: "PRATHAM CHAHAR",
      lastName: "ANUJ KUMAR",
      email: "prthmchahar@gmail.com",
      section: "B",
    },
    {
      serialNo: 99,
      alternateId: "22301012N69029",
      rollNo: "2K23CSUN01103",
      firstName: "NITISH SHARMA",
      lastName: "SATISH SHARMA",
      email: "nitishsharma2411@gmail.com",
      section: "B",
    },
    {
      serialNo: 98,
      alternateId: "22301001N096",
      rollNo: "2K23CSUN01102",
      firstName: "NISHANT DUNG",
      lastName: "DINESH DUNG",
      email: "nishantdung01@gmail.com",
      section: "B",
    },
    {
      serialNo: 97,
      alternateId: "22301001N069",
      rollNo: "2K23CSUN01101",
      firstName: "NIKHIL KHANDELWAL",
      lastName: "OM PRAKASH",
      email: "nikhilkhandelwal7011@gmail.com",
      section: "B",
    },
    {
      serialNo: 96,
      alternateId: "22301001N9241",
      rollNo: "2K23CSUN01099",
      firstName: "MAYANK SHARMA",
      lastName: "PRADEEP KUMAR",
      email: "mayanks10e@gmail.com",
      section: "B",
    },
    {
      serialNo: 95,
      alternateId: "22301001N153",
      rollNo: "2K23CSUN01098",
      firstName: "MANOJIT SINHA",
      lastName: "MAHENDRA SINHA",
      email: "andreassirmlmss08800090984@gmail.com",
      section: "B",
    },
    {
      serialNo: 94,
      alternateId: "22301001N051",
      rollNo: "2K23CSUN01097",
      firstName: "MANISH",
      lastName: "LALIT KUMAR",
      email: "manishkumar123027@gmail.com",
      section: "B",
    },
    {
      serialNo: 93,
      alternateId: "22301001N018",
      rollNo: "2K23CSUN01096",
      firstName: "MANAS SHARMA",
      lastName: "DINESH KUMAR",
      email: "manassharma027@gmail.com",
      section: "B",
    },
    {
      serialNo: 92,
      alternateId: "22301001N163",
      rollNo: "2K23CSUN01095",
      firstName: "MAILARAM VAMSHI",
      lastName: "MAILARAM SRINIVAS",
      email: "MAILARAMSRINIVAS16@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 91,
      alternateId: "22301001N9204",
      rollNo: "2K23CSUN01094",
      firstName: "MADDI GIRIDHARA SAI",
      lastName: "MADDI SRINIVASA RAO",
      email: "girimaddi685@gmail.com",
      section: "B",
    },
    {
      serialNo: 90,
      alternateId: "22301001N003",
      rollNo: "2K23CSUN01093",
      firstName: "LAVANYA PULANI",
      lastName: "SHAILESH PULANI",
      email: "lavanyapulani@gmail.com",
      section: "B",
    },
    {
      serialNo: 89,
      alternateId: "22301001N043",
      rollNo: "2K23CSUN01092",
      firstName: "KUTHURU RAMA KRISHNA",
      lastName: "KUTHURU SATHISH",
      email: "ramakrishnakuthuru.004@gmail.com",
      section: "B",
    },
    {
      serialNo: 88,
      alternateId: "22301009N070",
      rollNo: "2K23CSUN01091",
      firstName: "KUNAL DAGAR",
      lastName: "RATTAN SINGH",
      email: "dkunal891@gmail.com",
      section: "B",
    },
    {
      serialNo: 87,
      alternateId: "22301001N046",
      rollNo: "2K23CSUN01089",
      firstName: "KRRISH SHARMA",
      lastName: "DEEPAK SHARMA",
      email: "krrishsharma917@gmail.com",
      section: "B",
    },
    {
      serialNo: 86,
      alternateId: "22301001N093",
      rollNo: "2K23CSUN01088",
      firstName: "KARTIK KHILAN",
      lastName: "ASHOK KUMAR KHILAN",
      email: "kartikkhilan@gmail.com",
      section: "B",
    },
    {
      serialNo: 85,
      alternateId: "22301001N034",
      rollNo: "2K23CSUN01087",
      firstName: "KARTHIK REDDY",
      lastName: "RAMESH REDDY",
      email: "nomulakarthikreddy695@gmail.com",
      section: "B",
    },
    {
      serialNo: 84,
      alternateId: "22301001N133",
      rollNo: "2K23CSUN01086",
      firstName: "ISHITA SHARMA",
      lastName: "MUKESH SHARMA",
      email: "ishitas0503@gmail.com",
      section: "B",
    },
    {
      serialNo: 83,
      alternateId: "22301001N180",
      rollNo: "2K23CSUN01085",
      firstName: "ISHAAN PHALSWAL",
      lastName: "DEEPAK KUMAR SHOKEEN",
      email: "ishaanpreeti01@gmail.com",
      section: "B",
    },
    {
      serialNo: 82,
      alternateId: "22301001N016",
      rollNo: "2K23CSUN01084",
      firstName: "HITESH",
      lastName: "MUKESH KUMAR",
      email: "hitesh0956@gmail.com",
      section: "B",
    },
    {
      serialNo: 81,
      alternateId: "22301001N9162",
      rollNo: "2K23CSUN01083",
      firstName: "HARDIK TRIVEDI",
      lastName: "ANIL KUMAR TRIVEDI",
      email: "trivedihardik121@gmail.com",
      section: "B",
    },
    {
      serialNo: 80,
      alternateId: "22301001N146",
      rollNo: "2K23CSUN01082",
      firstName: "GANTALA HARSHA VARSHAN GOUD",
      lastName: "GANTALA BHOOMA GOUD",
      email: "harsha99121@gmail.com",
      section: "B",
    },
    {
      serialNo: 79,
      alternateId: "22301001N192",
      rollNo: "2K23CSUN01081",
      firstName: "GAJULA SAI CHARAN",
      lastName: "GAJULA RAMCHANDAR",
      email: "gajulasaicharan9999@gmail.com",
      section: "B",
    },
    {
      serialNo: 78,
      alternateId: "22301001N049",
      rollNo: "2K23CSUN01080",
      firstName: "DHRUV",
      lastName: "KULDEEP SINGH",
      email: "danesdave2023@gmail.com",
      section: "B",
    },
    {
      serialNo: 77,
      alternateId: "22301009N043",
      rollNo: "2K23CSUN01079",
      firstName: "DANDUGULA ARVIND",
      lastName: "DANDUGULA DEVENDER",
      email: "aravinddandugula96@gmail.com",
      section: "B",
    },
    {
      serialNo: 76,
      alternateId: "22301001N042",
      rollNo: "2K23CSUN01078",
      firstName: "DANDAVENI THRIGNAN",
      lastName: "DANDAVENI RAJENDER",
      email: "thrignanmudhiraj230@gmail.com",
      section: "B",
    },
    {
      serialNo: 75,
      alternateId: "22301001N047",
      rollNo: "2K23CSUN01077",
      firstName: "CHESHTA",
      lastName: "RAVISH KUMAR SHARMA",
      email: "cheshta.sharma2006@gmail.com",
      section: "B",
    },
    {
      serialNo: 74,
      alternateId: "22301001N011",
      rollNo: "2K23CSUN01076",
      firstName: "CHARU",
      lastName: "RAJU SHARMA",
      email: "sh.charu9306@gmail.com",
      section: "B",
    },
    {
      serialNo: 73,
      alternateId: "22301001N9166",
      rollNo: "2K23CSUN01075",
      firstName: "BILAL RAIS",
      lastName: "RAIS AHMED",
      email: "bilalrais999@gmail.com",
      section: "B",
    },
    {
      serialNo: 72,
      alternateId: "22301001NN186",
      rollNo: "2K23CSUN01074",
      firstName: "AYUSH MANGLA",
      lastName: "TARUN MANGLA",
      email: "ayushmangla73@gmail.com",
      section: "B",
    },
    {
      serialNo: 71,
      alternateId: "22301001N070",
      rollNo: "2K23CSUN01073",
      firstName: "AVIRAL GUPTA",
      lastName: "VISHAL GUPTA",
      email: "aviralgpt10@gmail.com",
      section: "B",
    },
    {
      serialNo: 70,
      alternateId: "22301001N013",
      rollNo: "2K23CSUN01072",
      firstName: "ATHARV NAUTIYAL",
      lastName: "PRAMOD NAUTIYAL",
      email: "atharvnauti21@gmail.com",
      section: "B",
    },
    {
      serialNo: 69,
      alternateId: "22301001N101",
      rollNo: "2K23CSUN01071",
      firstName: "ARPIT SHARMA",
      lastName: "RAVI DUTT SHARMA",
      email: "arpit0912sharma@gmail.com",
      section: "B",
    },
    {
      serialNo: 68,
      alternateId: "22301001N050",
      rollNo: "2K23CSUN01070",
      firstName: "ARPIT ARORA",
      lastName: "PRADEEP ARORA",
      email: "arpitarora9371@gmail.com",
      section: "B",
    },
    {
      serialNo: 67,
      alternateId: "22301001N071",
      rollNo: "2K23CSUN01069",
      firstName: "ANKUSH",
      lastName: "LAXMAN KUMAR DEVANI",
      email: "devniankush582@gmail.com",
      section: "B",
    },
    {
      serialNo: 66,
      alternateId: "22301018NN008",
      rollNo: "2K23CSUN01068",
      firstName: "ANAS MARGUB",
      lastName: "MARGUB ALAM",
      email: "anasmgb95@gmail.com",
      section: "B",
    },
    {
      serialNo: 65,
      alternateId: "22301001N179",
      rollNo: "2K23CSUN01067",
      firstName: "AMIT BESRA",
      lastName: "DAYANAND BESRA",
      email: "akhilbesra10@gmail.com",
      section: "B",
    },
    {
      serialNo: 64,
      alternateId: "22301001N002",
      rollNo: "2K23CSUN01066",
      firstName: "AKSHAT TIWARI",
      lastName: "SHAILENDRA TIWARI",
      email: "KANCHAN82BETU@GMAIL.COM",
      section: "B",
    },
    {
      serialNo: 63,
      alternateId: "22301001N009",
      rollNo: "2K23CSUN01065",
      firstName: "AKSHAT MATHUR",
      lastName: "ASHOK KUMAR MATHUR",
      email: "aksmats2005@gmail.com",
      section: "B",
    },
    {
      serialNo: 62,
      alternateId: "22301001N017",
      rollNo: "2K23CSUN01064",
      firstName: "AKSHAT BINDAL",
      lastName: "RAJESH KUMAR",
      email: "akshatbindal13305@gmail.com",
      section: "B",
    },
    {
      serialNo: 61,
      alternateId: "22301001N067",
      rollNo: "2K23CSUN01063",
      firstName: "ADHISH ARYA",
      lastName: "SATISH KUMAR ARYA",
      email: "adhisharya777@gmail.com",
      section: "B",
    },
    {
      serialNo: 60,
      alternateId: "22301001N065",
      rollNo: "2K23CSUN01062",
      firstName: "ABHISHEK GUSAIN",
      lastName: "BIRENDRA SINGH GUSAIN",
      email: "abhishekgusain18@gmail.com",
      section: "B",
    },
    {
      serialNo: 59,
      alternateId: "22301001N198",
      rollNo: "2K23CSUN01061",
      firstName: "YASHRAJ CHAUHAN",
      lastName: "DEEPAK RAJA CHAUHAN",
      email: "shadengaming777@gmail.com",
      section: "A",
    },
    {
      serialNo: 58,
      alternateId: "22301001N036",
      rollNo: "2K23CSUN01060",
      firstName: "VIDHI",
      lastName: "HITENDER PAL",
      email: "vidhiaryaduhan@gmail.com",
      section: "A",
    },
    {
      serialNo: 57,
      alternateId: "22301001N109",
      rollNo: "2K23CSUN01059",
      firstName: "VENNAPUSA ABHINAY KUMAR REDDY",
      lastName: "VENNAPUSA RAMANJANEYA REDDY",
      email: "abhinayreddi0@gmail.com",
      section: "A",
    },
    {
      serialNo: 56,
      alternateId: "151",
      rollNo: "2K23CSUN01058",
      firstName: "UPENDRA KUMAR PATHAK",
      lastName: "RAMESH CHAND",
      email: "upk060905@gmail.com",
      section: "A",
    },
    {
      serialNo: 55,
      alternateId: "22301001N162",
      rollNo: "2K23CSUN01057",
      firstName: "TUSHAR SHARMA",
      lastName: "MAHESH CHANDRA",
      email: "crazeart5123@gmail.com",
      section: "A",
    },
    {
      serialNo: 54,
      alternateId: "22301001N089",
      rollNo: "2K23CSUN01056",
      firstName: "TUSHAR BHARDWAJ",
      lastName: "GULSHAN KUMAR",
      email: "bhardwajtushar247@gmail.com",
      section: "C",
    },
    {
      serialNo: 53,
      alternateId: "22301013N83",
      rollNo: "2K23CSUN01055",
      firstName: "SURESH REVALLLI",
      lastName: "SAYANNA",
      email: "revallysayanna@gmail.com",
      section: "A",
    },
    {
      serialNo: 52,
      alternateId: "22301001N188",
      rollNo: "2K23CSUN01054",
      firstName: "SOURABH NARULA",
      lastName: "SUMIT NARULA",
      email: "sourabh.narula1586@gmail.com",
      section: "A",
    },
    {
      serialNo: 51,
      alternateId: "22301001N164",
      rollNo: "2K23CSUN01053",
      firstName: "SONIA",
      lastName: "DEVENDER SINGH",
      email: "chaudharysonia8632@gmail.com",
      section: "A",
    },
    {
      serialNo: 50,
      alternateId: "22301001N090",
      rollNo: "2K23CSUN01052",
      firstName: "SIDDHANT SINGH",
      lastName: "JUGENDER SINGH",
      email: "siddhantchaudhary711@gmail.com",
      section: "A",
    },
    {
      serialNo: 49,
      alternateId: "22301001N061",
      rollNo: "2K23CSUN01051",
      firstName: "SHRISTI",
      lastName: "YOGENDER SINGH",
      email: "d.shristi17@gmail.com",
      section: "A",
    },
    {
      serialNo: 48,
      alternateId: "22301001N112",
      rollNo: "2K23CSUN01050",
      firstName: "SHIVIKA OHLAN",
      lastName: "MANJIT OHLAN",
      email: "shivikaohlan06@gmail.com",
      section: "A",
    },
    {
      serialNo: 47,
      alternateId: "22301001N006",
      rollNo: "2K23CSUN01049",
      firstName: "SHIVAM KUMAR YADAV",
      lastName: "SATYA RAM YADAV",
      email: "shivamkumaryadav017@gmail.com",
      section: "A",
    },
    {
      serialNo: 46,
      alternateId: "22301001N032",
      rollNo: "2K23CSUN01048",
      firstName: "SACHIN KUMAR",
      lastName: "RANA PRATAP SINGH",
      email: "sachinsinghrj1@gmail.com",
      section: "A",
    },
    {
      serialNo: 45,
      alternateId: "22301001N086",
      rollNo: "2K23CSUN01047",
      firstName: "RUDRAKSH BALUNI",
      lastName: "VINOD KUMAR",
      email: "baluni_rudraksh02@gmail.com",
      section: "A",
    },
    {
      serialNo: 44,
      alternateId: "22301001N005",
      rollNo: "2K23CSUN01045",
      firstName: "RIYANSH AGARWAL",
      lastName: "HARISH AGARWAL",
      email: "harish.agarwal1092@gmail.com",
      section: "A",
    },
    {
      serialNo: 43,
      alternateId: "22301001N9153",
      rollNo: "2K23CSUN01044",
      firstName: "RAJAT KAR",
      lastName: "JAGANNATH KAR",
      email: "rajatkar9582679590@gmail.com",
      section: "A",
    },
    {
      serialNo: 42,
      alternateId: "22301001N215",
      rollNo: "2K23CSUN01043",
      firstName: "RAGHAV MITTAL",
      lastName: "SANDEEP MITTAL",
      email: "raghavmittal770@gmail.com",
      section: "A",
    },
    {
      serialNo: 41,
      alternateId: "22301001N150",
      rollNo: "2K23CSUN01042",
      firstName: "PRIYA",
      lastName: "PRAVEEN",
      email: "PARVEENSINGHKODAN1982@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 40,
      alternateId: "22301001N155",
      rollNo: "2K23CSUN01041",
      firstName: "PRITHUL GOYAL",
      lastName: "CHIRAG GOYAL",
      email: "pgprithul@gmail.com",
      section: "B",
    },
    {
      serialNo: 39,
      alternateId: "22301001N213",
      rollNo: "2K23CSUN01040",
      firstName: "POLIMERA HEMANTH REDDY",
      lastName: "POLIMERA NAGI REDDY",
      email: "phr8519834@gmail.com",
      section: "A",
    },
    {
      serialNo: 38,
      alternateId: "22301001N9150",
      rollNo: "2K23CSUN01039",
      firstName: "PIYUSH VIJ",
      lastName: "SHYAM VIJ",
      email: "piyushvij28@gmail.com",
      section: "B",
    },
    {
      serialNo: 37,
      alternateId: "22301001N158",
      rollNo: "2K23CSUN01038",
      firstName: "PIYUSH SHARMA",
      lastName: "RAMCHET SHARMA",
      email: "piyusharmas2005@gmail.com",
      section: "A",
    },
    {
      serialNo: 36,
      alternateId: "22301001N154",
      rollNo: "2K23CSUN01037",
      firstName: "PIYUSH KUMAR SINGH",
      lastName: "SUNIL KUMAR SINGH",
      email: "PIYUSH147SINGH@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 35,
      alternateId: "22301009N082",
      rollNo: "2K23CSUN01036",
      firstName: "PALEM VINISH",
      lastName: "PALLEM CHINNA BALREDDY",
      email: "palemvinishreddie@gmail.com",
      section: "A",
    },
    {
      serialNo: 34,
      alternateId: "22301001N9151",
      rollNo: "2K23CSUN01035",
      firstName: "NIKHIL SINGH",
      lastName: "LT. YASHVIR SINGH",
      email: "nikhilrajput1234234@gmail.com",
      section: "A",
    },
    {
      serialNo: 33,
      alternateId: "22301001N147",
      rollNo: "2K23CSUN01034",
      firstName: "NEERAJ",
      lastName: "MUKESH",
      email: "neerajbanswal74@gmail.com",
      section: "A",
    },
    {
      serialNo: 32,
      alternateId: "22301001N007",
      rollNo: "2K23CSUN01033",
      firstName: "NARPAL SINGH MOR",
      lastName: "NARENDER PAL MOR",
      email: "mornarpal@gmail.com",
      section: "A",
    },
    {
      serialNo: 31,
      alternateId: "22301001N113",
      rollNo: "2K23CSUN01032",
      firstName: "MOKSH SHEOKAND",
      lastName: "JASBEER SINGH",
      email: "mokshsheokand11@gmail.com",
      section: "A",
    },
    {
      serialNo: 30,
      alternateId: "22301001N196",
      rollNo: "2K23CSUN01031",
      firstName: "MANN YADAV",
      lastName: "RAJ KUMAR YADAV",
      email: "yadav84sunita@gmail.com",
      section: "A",
    },
    {
      serialNo: 29,
      alternateId: "22301001N031",
      rollNo: "2K23CSUN01030",
      firstName: "MAHIMA SINGH",
      lastName: "SATYENDRA SINGH",
      email: "MSIN12401@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 28,
      alternateId: "22301001N190",
      rollNo: "2K23CSUN01029",
      firstName: "MAAN SINGH",
      lastName: "DAVINDER SINGH",
      email: "maansgh21@gmail.com",
      section: "A",
    },
    {
      serialNo: 27,
      alternateId: "22301001N027",
      rollNo: "2K23CSUN01028",
      firstName: "M VENKATESH",
      lastName: "M TIRUPATHI",
      email: "medamonivenkatesh792@gmail.com",
      section: "A",
    },
    {
      serialNo: 26,
      alternateId: "22301001N27450644",
      rollNo: "2K23CSUN01027",
      firstName: "KUSH SHARMA",
      lastName: "CHAITANYA KUMAR",
      email: "ks1750092@gmail.com",
      section: "A",
    },
    {
      serialNo: 25,
      alternateId: "22301001N039",
      rollNo: "2K23CSUN01026",
      firstName: "KARAN SHARMA",
      lastName: "ISHWAR CHAND",
      email: "karansharma042006@gmail.com",
      section: "A",
    },
    {
      serialNo: 24,
      alternateId: "22301001N182",
      rollNo: "2K23CSUN01025",
      firstName: "JASKARAN SINGH",
      lastName: "SWARN JEET SINGH",
      email: "swajee1962@gmail.com",
      section: "B",
    },
    {
      serialNo: 23,
      alternateId: "22301001N026",
      rollNo: "2K23CSUN01024",
      firstName: "JANIGE NANDHA",
      lastName: "MANIKANTAJ BALARAJU",
      email: "madhu.u2000@gmail.com",
      section: "A",
    },
    {
      serialNo: 22,
      alternateId: "22301001N9242",
      rollNo: "2K23CSUN01023",
      firstName: "ISHIKA GAUR",
      lastName: "SHARAD CHAND GAUR",
      email: "gaurishika315@gmail.com",
      section: "A",
    },
    {
      serialNo: 21,
      alternateId: "22301001N091",
      rollNo: "2K23CSUN01022",
      firstName: "HIMANSHI",
      lastName: "SATISH KUMAR",
      email: "himanshitaneja406@gmail.com",
      section: "A",
    },
    {
      serialNo: 20,
      alternateId: "22301001N095",
      rollNo: "2K23CSUN01020",
      firstName: "HARSH KUMAR",
      lastName: "RAJEEV PODDAR",
      email: "ptrajiv1@gmail.com",
      section: "A",
    },
    {
      serialNo: 19,
      alternateId: "22301001N208",
      rollNo: "2K23CSUN01019",
      firstName: "HARISHARNAM SAHAL",
      lastName: "ASHWANI SAHAL",
      email: "harisharnamsharma49@gmail.com",
      section: "A",
    },
    {
      serialNo: 18,
      alternateId: "22301001N195",
      rollNo: "2K23CSUN01018",
      firstName: "GODUGU PREM",
      lastName: "GODUGU YAKAIAH",
      email: "goduguprem@gmail.com",
      section: "A",
    },
    {
      serialNo: 17,
      alternateId: "22301001N044",
      rollNo: "2K23CSUN01016",
      firstName: "GARV PARASHAR",
      lastName: "YOGENDER PARASHAR",
      email: "ga1rv2@gmail.com",
      section: "A",
    },
    {
      serialNo: 16,
      alternateId: "22301001N114",
      rollNo: "2K23CSUN01015",
      firstName: "GADDAM NIKHIL REDDY",
      lastName: "GADDAM LIMBADRI",
      email: "gaddamnikhil677@gmail.com",
      section: "A",
    },
    {
      serialNo: 15,
      alternateId: "22301001N063",
      rollNo: "2K23CSUN01014",
      firstName: "DHRUV KUMAR",
      lastName: "KHUSENDER KUMAR",
      email: "vahbiav412@gmail.com",
      section: "A",
    },
    {
      serialNo: 14,
      alternateId: "22301001N217",
      rollNo: "2K23CSUN01013",
      firstName: "DHRUV CHAUHAN",
      lastName: "NAKSHATRA PAL",
      email: "RKCHAUHANGS@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 13,
      alternateId: "22301001N104",
      rollNo: "2K23CSUN01012",
      firstName: "DEV KARAN SHARMA",
      lastName: "HIRDESH KUMAR SHARMA",
      email: "devsharma5666@gmail.com",
      section: "A",
    },
    {
      serialNo: 12,
      alternateId: "22301001N187",
      rollNo: "2K23CSUN01011",
      firstName: "DEV DUTT SHARMA",
      lastName: "LALIT KISHORE SHARMA",
      email: "ddsharma629@gmail.com",
      section: "A",
    },
    {
      serialNo: 11,
      alternateId: "22301001N9152",
      rollNo: "2K23CSUN01010",
      firstName: "DESABOINA PRUDHVI",
      lastName: "DESABOINA VENKATA APPA RAO",
      email: "desaboinaprudhvi@gmail.com",
      section: "A",
    },
    {
      serialNo: 10,
      alternateId: "22301001N102",
      rollNo: "2K23CSUN01009",
      firstName: "CHEPUR NIROOP REDDY",
      lastName: "CHEPUR MAHIPAL",
      email: "niroopreddy22@gmail.com",
      section: "A",
    },
    {
      serialNo: 9,
      alternateId: "22301018NN264425",
      rollNo: "2K23CSUN01008",
      firstName: "BANDARU ESHWAR",
      lastName: "BANDARU MAHESH",
      email: "BANDARUESHWAR0@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 8,
      alternateId: "22301001N149",
      rollNo: "2K23CSUN01007",
      firstName: "ARYAN SINGH",
      lastName: "ARUN SINGH",
      email: "aryansingh0037n@gmail.com",
      section: "A",
    },
    {
      serialNo: 7,
      alternateId: "22301001N129",
      rollNo: "2K23CSUN01006",
      firstName: "ARCHIT MATHUR",
      lastName: "VIKAS MATHUR",
      email: "aachimathur17@gmail.com",
      section: "A",
    },
    {
      serialNo: 6,
      alternateId: "22301001N094",
      rollNo: "2K23CSUN01005",
      firstName: "APEKSHA SHARMA",
      lastName: "NITIN SHARMA",
      email: "apekshasharma190905@gmail.com",
      section: "A",
    },
    {
      serialNo: 5,
      alternateId: "22301001N033",
      rollNo: "2K23CSUN01004",
      firstName: "ANIKET JAISWAL",
      lastName: "ARVIND KUMAR",
      email: "dongon40413@gmail.com",
      section: "A",
    },
    {
      serialNo: 4,
      alternateId: "22301001N157",
      rollNo: "2K23CSUN01003",
      firstName: "AKSHAT SINGH BISHT",
      lastName: "NARESH SINGH BISHT",
      email: "BISHTAKSHAT21@GMAIL.COM",
      section: "A",
    },
    {
      serialNo: 3,
      alternateId: "22301001N064",
      rollNo: "2K23CSUN01002",
      firstName: "ADITYA SEHGAL",
      lastName: "SHARAD RAKESH SEHGAL",
      email: "adityasehgal375@gmail.com",
      section: "A",
    },
    {
      serialNo: 2,
      alternateId: "22301013N011",
      rollNo: "2K23CSUN01001",
      firstName: "AADITYA BHARDWAJ",
      lastName: "INDERPAL SHARMA",
      email: "aadityabhardwaj5555@gmail.com",
      section: "A",
    },
    {
      serialNo: 1,
      alternateId: "22101001N043",
      rollNo: "2K21CSUN01011",
      firstName: "ANURAG TANWER",
      lastName: "ANIL TANWER",
      email: "anuragtanwar9696@gmail.com",
      section: "A",
    },
  ];

  // Group students by batch year and secti
  // on
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
          programCode: "CSE",
          programName: "Computer Science and Engineering",
          sectionName,
          semester: 5,
          batchYear: year,
        };
        await seedStudents(sectionConfig, sectionStudents);
      }
    }
  }

  console.log(
    "\n✅ All CSE 5th Semester student seeding tasks completed successfully!\n"
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
