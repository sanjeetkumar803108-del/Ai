import axios from "axios";

// TypeScript types
export interface ScholarshipResult {
  scholarships: Scholarship[];
  programs?: Scholarship[];
  summary: {
    totalFound: number;
    bestMatch: string;
    quickAdvice: string;
    nextAction: string;
  };
  isCached?: boolean;
  isRateLimited?: boolean;
  isApiFailed?: boolean;
  cacheAgeHours?: number;
  searchesToday?: number;
  isFallback?: boolean;
}

export interface Scholarship {
  id: string;
  name: string;
  hindiName: string;
  organizer: string;
  source?: string;
  verified?: boolean;
  type: 'CENTRAL' | 'STATE' | 'INTERNATIONAL' | 'PRIVATE' | 'PROGRAM';
  targetGroup: string;
  deadline: {
    status: 'OPEN' | 'CLOSED' | 'COMING_SOON' | 'UNKNOWN';
    currentCycleDate: string | null;
    nextCycleExpected: string;
    daysRemaining: number;
    urgencyMessage: string;
    applyNow: boolean;
  };
  benefits: {
    totalAmount: string;
    breakdown: {
      tuition?: string;
      monthly?: string;
      airfare?: string;
      settlement?: string;
      books?: string;
      hostel?: string;
      other?: string[];
    };
    duration: string;
    additionalPerks: string[];
  };
  eligibility: {
    age: {
      min: number;
      max: number;
      description: string;
    };
    academics: {
      minMarks: string;
      description: string;
    };
    income: {
      maxAnnual: string;
      description: string;
    };
    category: string[];
    gender: string;
    stream: string[];
    state: string;
    other: string[];
  };
  documents: {
    name: string;
    isRequired: boolean;
    howToGet: string;
    timeRequired: string;
    cost: string;
    tip: string;
  }[];
  applicationProcess: {
    mode: string;
    portal: string;
    portalName: string;
    tracks: {
      name: string;
      description: string;
      universities: string;
      address?: string;
    }[];
    steps: string[];
    helpline: string;
    email: string;
  };
  preparationTimeline: {
    timeframe: string;
    tasks: string[];
  }[];
  successTips: string[];
  commonMistakes: string[];
  matchScore: number;
  matchReason: string;
  badeBhaiAdvice: string;
  relatedScholarships: string[];
}

// Compact structure to avoid token limits
interface CompactScholarship {
  id: string;
  name: string;
  hindiName: string;
  organizer: string;
  type: 'CENTRAL' | 'STATE' | 'INTERNATIONAL' | 'PRIVATE' | 'PROGRAM';
  targetGroup: string;
  amount: string;
  tuition: string;
  monthly: string;
  deadlineStatus: 'OPEN' | 'CLOSED' | 'COMING_SOON' | 'UNKNOWN';
  deadlineDate: string | null;
  nextCycle: string;
  daysRemaining: number;
  urgency: string;
  gender: string;
  stream: string[];
  category: string[];
  minMarks: string;
  maxIncome: string;
  academicDesc: string;
  incomeDesc: string;
  bhaiAdvice: string;
  portal: string;
  portalName: string;
}

// Global Custom Pre-compiled Database
const COMPACT_DB: CompactScholarship[] = [
  // === KOREA SCHOLARSHIPS ===
  {
    id: "k_gks",
    name: "Global Korea Scholarship (GKS)",
    hindiName: "ग्लोबल कोरिया स्कॉलरशिप (GKS) - फुल्ली फंडेड",
    organizer: "NIIED, South Korean Government",
    type: "INTERNATIONAL",
    targetGroup: "Undergraduate and Graduate students wishing to study in South Korea",
    amount: "₹57,600/month + Full Tuition",
    tuition: "Full Tuition",
    monthly: "₹57,600/month",
    deadlineStatus: "CLOSED",
    deadlineDate: "September 2025",
    nextCycle: "Opens September 2026",
    daysRemaining: 0,
    urgency: "Bhai, GKS 2026 band ho chuki hai (September 2025 mein). Ab aap September 2026 cycle ke liye documents tayyar rakhein!",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80%",
    maxIncome: "No Limit",
    academicDesc: "Cumulative GPA kam se kam 80% ya class rankings mein top 20% hona zaroori hai.",
    incomeDesc: "Ye purely academic excellence aur profile selection par based hai, family income limit nahi hai.",
    bhaiAdvice: "Sanjeet bhai, Korea jaane ka sabse solid aur trusted rasta GKS hi hai. GKS 2026 closed ho chuki hai, par September 2026 cycle ke liye recommendation letters aur SOP ko abhi se solid banayein!",
    portal: "https://www.studyinkorea.go.kr",
    portalName: "Study in Korea Official Portal"
  },
  {
    id: "k_kaist",
    name: "KAIST University International Scholarship",
    hindiName: "KAIST यूनिवर्सिटी स्कॉलरशिप (फुल्ली फंडेड STEM)",
    organizer: "Korea Advanced Institute of Science and Technology (KAIST)",
    type: "INTERNATIONAL",
    targetGroup: "Undergraduate STEM & Computer Science aspirants",
    amount: "₹22,400/month + Full Tuition",
    tuition: "Full Tuition",
    monthly: "₹22,400/month",
    deadlineStatus: "OPEN",
    deadlineDate: "15 January 2027",
    nextCycle: "Expected September 2027",
    daysRemaining: 120,
    urgency: "Sanjeet bhai, portal open hai, engineering/tech research ke liye abhi apply karo!",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "High school pichli class mein Math aur Science subjects mein outstanding scores hone chahiye.",
    incomeDesc: "Fully merit-based admission program, koi income restriction nahi hai.",
    bhaiAdvice: "KAIST South Korea ka MIT hai bhai! Agar coding ya core science mein interest hai toh isse behtar engineering environment poori duniya mein nahi hai.",
    portal: "https://admission.kaist.ac.kr",
    portalName: "KAIST Admissions"
  },
  {
    id: "k_postech",
    name: "POSTECH Research Fellowship",
    hindiName: "POSTECH रिसर्च फैलोशिप (Advanced Science)",
    organizer: "Pohang University of Science and Technology (POSTECH)",
    type: "INTERNATIONAL",
    targetGroup: "Graduate & Undergraduate researchers in core sciences & engineering",
    amount: "₹19,200/month + Full Tuition",
    tuition: "Full Tuition",
    monthly: "₹19,200/month",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens October 2026",
    daysRemaining: 80,
    urgency: "Bhai, research professors ko directly email daalna abhi se start kar do.",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80%",
    maxIncome: "No Limit",
    academicDesc: "Excellent Bachelor's or High School grade point average in science major.",
    incomeDesc: "Koi structural income restriction nahi hai.",
    bhaiAdvice: "Sanjeet bhai, POSTECH South Korea ka private research powerhouse hai. Yahan direct Samsung aur POSCO engineers ke sath research ka mauka milta hai.",
    portal: "https://www.postech.ac.kr",
    portalName: "POSTECH Admissions Portal"
  },
  {
    id: "k_snu",
    name: "SNU President Fellowship",
    hindiName: "सोल नेशनल यूनिवर्सिटी (SNU) प्रेसिडेंट फैलोशिप",
    organizer: "Seoul National University",
    type: "INTERNATIONAL",
    targetGroup: "Top-tier global minds seeking admission in South Korea's Rank #1 university",
    amount: "Partial tuition only",
    tuition: "Partial tuition only",
    monthly: "Information available nahi",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens March 2027",
    daysRemaining: 150,
    urgency: "SNU has very strict, high-profile selection cycles.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "Top rank holders, stellar GPA or high standardized test scores.",
    incomeDesc: "Academic leadership excellence.",
    bhaiAdvice: "Bhai SNU South Korea ka super elite college hai (SKY league ka rank #1). Yahan ka degree certificate matlab global passport!",
    portal: "https://en.snu.ac.kr/admission",
    portalName: "SNU Admissions"
  },
  {
    id: "k_yonsei",
    name: "Yonsei University UIC Scholarship",
    hindiName: "योनसेई यूनिवर्सिटी UIC स्कॉलरशिप (English Medium)",
    organizer: "Yonsei University (Underwood International College)",
    type: "INTERNATIONAL",
    targetGroup: "International undergraduate freshmen looking for English-taught courses",
    amount: "Tuition waiver only",
    tuition: "Tuition waiver only",
    monthly: "Information available nahi",
    deadlineStatus: "OPEN",
    deadlineDate: "28 October 2026",
    nextCycle: "Expected June 2027",
    daysRemaining: 75,
    urgency: "Apply during early admission rounds to secure automatic scholarship screening.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80%",
    maxIncome: "No Limit",
    academicDesc: "Solid academic records in high school and clear interest in global studies.",
    incomeDesc: "Admissions integration program.",
    bhaiAdvice: "Yonsei University bahut modern aur cultural high-profile space hai Seoul mein. Agar fully English mein padhna chahte ho, toh ye best option hai bhai.",
    portal: "https://uic.yonsei.ac.kr",
    portalName: "Yonsei UIC Portal"
  },
  {
    id: "k_ku",
    name: "Korea University Global Leader Scholarship",
    hindiName: "कोरिया यूनिवर्सिटी ग्लोबल लीडर स्कॉलरशिप",
    organizer: "Korea University, Seoul",
    type: "INTERNATIONAL",
    targetGroup: "Active international student leaders",
    amount: "50% to 100% Tuition Waiver based on admission evaluation",
    tuition: "Up to 100% tuition coverage support",
    monthly: "Subsidized campus boarding and language resources",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens September 2026",
    daysRemaining: 55,
    urgency: "Keep documents ready for the Spring session.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "Consistent high scores in all primary subject categories.",
    incomeDesc: "Leader track scholarship.",
    bhaiAdvice: "Sanjeet bhai, Korea University apne historic, beautiful campus aur dynamic alumni support network ke liye jaani jaati hai.",
    portal: "https://oia.korea.ac.kr",
    portalName: "Korea University OIA"
  },
  {
    id: "k_bk21",
    name: "Brain Korea 21 (BK21) Graduate Research Grant",
    hindiName: "ब्रेन कोरिया 21 (BK21) नेशनल रिसर्च ग्रांट",
    organizer: "National Research Foundation of Korea (NRF)",
    type: "INTERNATIONAL",
    targetGroup: "Graduate MS, PhD researchers and postdocs in advanced tech",
    amount: "₹12,00,000/year living stipend support",
    tuition: "Subsidy depends on host research laboratory agreements",
    monthly: "₩1,000,000 to ₩1,600,000/month research stipend (~₹65,000 - ₹1,00,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "Direct placement through selected research laboratories, consult professors.",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Excellent academic record and prior research paper proofs.",
    incomeDesc: "National laboratory research fund.",
    bhaiAdvice: "BK21 South Korea ki core scientific back-bone hai. Iske zariye international researchers ko direct industry exposure milta hai.",
    portal: "https://www.nrf.re.kr",
    portalName: "NRF Korea Official Portal"
  },
  {
    id: "k_kgsp",
    name: "KGSP Strategic Association Award",
    hindiName: "KGSP एसोसिएशन स्कॉलरशिप (Bilateral Award)",
    organizer: "Korean Ministry of Education & NIIED Partner Universities",
    type: "INTERNATIONAL",
    targetGroup: "Students from strategic partner countries seeking professional degrees",
    amount: "Fully Covered tuition + health benefits + monthly support",
    tuition: "100% full tuition support waiver",
    monthly: "₩900,000 per month living stipend",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens October 2026",
    daysRemaining: 70,
    urgency: "Requires recommendation/nomination from partner organizations.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Strong high-school or undergrad merit scores.",
    incomeDesc: "Bilateral strategic relationship merit award.",
    bhaiAdvice: "Bhai ye GKS ke hi equivalent hai par custom tracks ke true selection rate better hota hai. Forms dhyan se check karo!",
    portal: "https://www.niied.go.kr",
    portalName: "NIIED Site"
  },

  // === GERMANY SCHOLARSHIPS ===
  {
    id: "g_daad",
    name: "DAAD Postgraduate Scholarship",
    hindiName: "DAAD स्कॉलरशिप (फुल्ली फंडेड जर्मनी पीजी)",
    organizer: "German Academic Exchange Service (DAAD)",
    type: "INTERNATIONAL",
    targetGroup: "Graduates seeking Master or PhD degrees in Germany",
    amount: "₹35,00,000+ (Full Tuition Fee + Living Stipend + Health Insurance + Flight)",
    tuition: "100% Free Tuition (Most German Public Universities have zero tuition)",
    monthly: "€934 to €1,200 per month (~₹85,000 - ₹1,10,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "31 October 2026",
    nextCycle: "Expected June 2027",
    daysRemaining: 110,
    urgency: "German visa and DAAD application requires 3-4 months prep, act fast!",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Bachelor's degree with solid academic grades, at least 2 years of professional work experience for EPOS programs.",
    incomeDesc: "Academic excellence and professional development merit.",
    bhaiAdvice: "Germany me higher studies ke liye DAAD sabse bada gold-standard hai Sanjeet bhai. Public college me free study + €934/month stipend se badhiya life aur kya hogi!",
    portal: "https://www.daad.de",
    portalName: "DAAD Germany Portal"
  },
  {
    id: "g_boell",
    name: "Heinrich Böll Foundation Scholarship",
    hindiName: "हेनरिक बॉल फाउंडेशन स्कॉलरशिप (जर्मनी)",
    organizer: "Heinrich Böll Foundation",
    type: "INTERNATIONAL",
    targetGroup: "International master's and doctoral candidates with high social values",
    amount: "₹18,00,000+ (Monthly Stipend + Family Allowances)",
    tuition: "Tuition waiver in public universities, stipend for living cost",
    monthly: "€812/month plus individual support allowances",
    deadlineStatus: "OPEN",
    deadlineDate: "01 September 2026",
    nextCycle: "Expected December 2027",
    daysRemaining: 50,
    urgency: "Requires deep social commitment essays, prepare statements early.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Consistent high academic marks along with proof of active social/political participation.",
    incomeDesc: "Social democracy and ecological values leadership merit.",
    bhaiAdvice: "Bhai ye foundation ecological, green and progressive research ko support karti hai. Agar tum social works me active ho toh apply zaroor karna.",
    portal: "https://www.boell.de",
    portalName: "Heinrich Böll Portal"
  },
  {
    id: "g_kas",
    name: "Konrad Adenauer Foundation (KAS) Scholarship",
    hindiName: "कोनराड एडेनाउर फाउंडेशन (KAS) स्कॉलरशिप",
    organizer: "Konrad Adenauer Foundation",
    type: "INTERNATIONAL",
    targetGroup: "Future international leaders wanting to study in Germany",
    amount: "₹24,00,000+ (Full Living Costs Coverage + Seminars)",
    tuition: "Full public university fees coverage and language courses",
    monthly: "€934/month for master's and €1,200/month for doctoral students",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens August 2026",
    daysRemaining: 40,
    urgency: "Requires recommendation from local German embassy in India.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80%",
    maxIncome: "No Limit",
    academicDesc: "Top graduation marks and clear commitment to democratic principles and public service.",
    incomeDesc: "Leadership and academic excellence.",
    bhaiAdvice: "KAS scholarship bohot prestigious hai bhai. Isme select hone par Germany ke power networks aur core policy meetings me attend karne ki networking milti hai.",
    portal: "https://www.kas.de",
    portalName: "KAS Germany Portal"
  },
  {
    id: "g_fes",
    name: "Friedrich Ebert Foundation (FES) Scholarship",
    hindiName: "फ्रेडरिक एबर्ट फाउंडेशन (FES) स्कॉलरशिप",
    organizer: "Friedrich Ebert Foundation",
    type: "INTERNATIONAL",
    targetGroup: "Students from developing countries with exceptional academic records",
    amount: "₹20,00,000+ (Full Living Cost + Medical Subsidies)",
    tuition: "Full coverage of fees and study materials support",
    monthly: "€861 per month living stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected June 2027",
    daysRemaining: 65,
    urgency: "Apply as soon as you get admission confirmation in a German university.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "High grades in prior examinations and strong focus on social justice and equal opportunities.",
    incomeDesc: "Social democratic merit grant.",
    bhaiAdvice: "Bhai FES un students ko support karta hai jo apni home country me democracy and human rights badhana chahte hain. SOP me ye aspects clear likhna.",
    portal: "https://www.fes.de",
    portalName: "FES Scholarships"
  },
  {
    id: "g_deutschland",
    name: "Deutschland Stipendium National Merit Scholarship",
    hindiName: "जर्मनी नेशनल मेरिट स्कॉलरशिप (Deutschlandstipendium)",
    organizer: "Federal Government of Germany & Private Donors",
    type: "INTERNATIONAL",
    targetGroup: "Excellent international students studying in German universities",
    amount: "₹3,50,000/year (Covers pocket expenses and books)",
    tuition: "Admissions integrated pocket support",
    monthly: "€300 per month pocket grant (~₹27,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "31 August 2026",
    nextCycle: "Expected April 2027",
    daysRemaining: 45,
    urgency: "Check individual German university deadlines for Deutschlandstipendium as they vary.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "Exceptional grades in current academic semesters at German universities.",
    incomeDesc: "No income restrictions, but social hardships are considered positively.",
    bhaiAdvice: "Isme 50% govt aur 50% private corporate companies funding karti hain. Agar German university me admission ho jaye toh ye apply karna sabse easy aur rewarding hai.",
    portal: "https://www.deutschlandstipendium.de",
    portalName: "Deutschlandstipendium Portal"
  },

  // === JAPAN SCHOLARSHIPS ===
  {
    id: "j_mext",
    name: "MEXT Japan Government Scholarship",
    hindiName: "MEXT जापानी सरकारी स्कॉलरशिप (फुल्ली फंडेड)",
    organizer: "MEXT, Ministry of Education, Culture, Sports, Science and Technology, Japan",
    type: "INTERNATIONAL",
    targetGroup: "Undergraduate, Masters, and Research students studying in Japan",
    amount: "₹70,000 - ₹90,000/month + Full Tuition",
    tuition: "100% Fully Exempted by MEXT",
    monthly: "¥117,000 to ¥145,000 per month (~₹70,000 - ₹90,000/month)",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens May 2027",
    daysRemaining: 300,
    urgency: "Keep track of the Japanese Embassy in New Delhi announcements starting every May.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "65%",
    maxIncome: "No Limit",
    academicDesc: "Good academic records, basic interest in learning Japanese language (mandatory written test).",
    incomeDesc: "Fully funded national bilateral scholarship.",
    bhaiAdvice: "MEXT pure gold hai Sanjeet bhai! Japan me rahkar study karna with no tuition and high monthly pocket money. Embassy track written exam clear karo aur seedhe Tokyo/Kyoto university jao!",
    portal: "https://www.in.emb-japan.go.jp",
    portalName: "Embassy of Japan in India Portal"
  },
  {
    id: "j_jasso",
    name: "JASSO Study Support Scholarship",
    hindiName: "JASSO जापानी छात्रवृत्ति (Living Support)",
    organizer: "Japan Student Services Organization (JASSO)",
    type: "INTERNATIONAL",
    targetGroup: "Self-financed international exchange students in Japan",
    amount: "₹6,00,000/year support",
    tuition: "University level integration",
    monthly: "¥80,000 per month (~₹50,000/month) living allowance",
    deadlineStatus: "OPEN",
    deadlineDate: "30 September 2026",
    nextCycle: "Expected April 2027",
    daysRemaining: 70,
    urgency: "Apply through your host Japanese educational institution.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Excellent academic status in current home university or previous semesters.",
    incomeDesc: "Monthly allowance during self-financed study or credit transfer exchange programs.",
    bhaiAdvice: "Bhai ye un logo ke liye hai jo short term exchange programs ya direct admissions ke through Japan ja rahe hain aur kharcha sambhalne ke liye pockets dhund rahe hain.",
    portal: "https://www.jasso.go.kr",
    portalName: "JASSO Official Portal"
  },
  {
    id: "j_adb",
    name: "ADB-Japan Scholarship Program (ADB-JSP)",
    hindiName: "ADB-जापान स्कॉलरशिप प्रोग्राम (Economic & Tech)",
    organizer: "Asian Development Bank (ADB) & Japanese Government",
    type: "INTERNATIONAL",
    targetGroup: "Students from ADB member nations wanting to complete Master's in Japan",
    amount: "₹30,00,000+ (Full Tuition + Stipend + Travel + Books)",
    tuition: "100% full tuition coverage",
    monthly: "¥140,000/month living stipend (~₹85,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "31 October 2026",
    nextCycle: "Expected August 2027",
    daysRemaining: 110,
    urgency: "Strictly for management, economics, technology, and policy development streams.",
    gender: "ALL",
    stream: ["SCIENCE", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Bachelor's degree with solid GPA and at least 2 years of professional work experience.",
    incomeDesc: "Socio-economic development merit scholarship.",
    bhaiAdvice: "Sanjeet bhai, agar tum design, economics ya system technologies me masters karna chahte ho, toh ye program perfect global platform hai.",
    portal: "https://www.adb.org",
    portalName: "ADB Scholarship Portal"
  },
  {
    id: "j_rotary",
    name: "Rotary Yoneyama Memorial Scholarship",
    hindiName: "रोटरी योनेयामा मेमोरियल स्कॉलरशिप (जापान)",
    organizer: "Rotary Club Japan",
    type: "PRIVATE",
    targetGroup: "International students planning to study or do research in Japan",
    amount: "₹18,00,000+ (Stipend + Return Ticket)",
    tuition: "Admission and direct study assistance",
    monthly: "¥100,000 to ¥140,000 per month pocket stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "15 October 2026",
    nextCycle: "Expected June 2027",
    daysRemaining: 90,
    urgency: "Requires direct association and selection by local Rotary clubs.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Demonstrated interest in international friendship, peace, and high academic caliber.",
    incomeDesc: "No income limit, privately funded social scholarship.",
    bhaiAdvice: "Rotary club Japan ka ye private trust har saal international students ko support karta hai. Isme apply karne ke liye local level communication strong hona chahiye.",
    portal: "http://www.rotary-yoneyama.or.jp",
    portalName: "Rotary Yoneyama Japan Portal"
  },
  {
    id: "j_utokyo",
    name: "University of Tokyo Excellence Fellowship",
    hindiName: "टोक्यो यूनिवर्सिटी एक्सीलेंस फैलोशिप",
    organizer: "University of Tokyo (UTokyo)",
    type: "INTERNATIONAL",
    targetGroup: "Elite postgraduate researchers in technology and research fields",
    amount: "₹28,00,000/year (Tuition cover + pocket allowance)",
    tuition: "Full tuition fee support",
    monthly: "¥150,000 per month researcher stipend",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens September 2026",
    daysRemaining: 55,
    urgency: "Check department wise intake seats on UTokyo portal.",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "Top-tier academic records in STEM, bachelor level publications are heavily preferred.",
    incomeDesc: "Academic super excellence.",
    bhaiAdvice: "Bhai, University of Tokyo Japan ki sabse top rank academic space hai. Agar yahan ki fellowship mil gayi toh global research labs ke darwaze khul jayenge.",
    portal: "https://www.u-tokyo.ac.jp",
    portalName: "UTokyo Admissions"
  },

  // === UK SCHOLARSHIPS ===
  {
    id: "u_chevening",
    name: "Chevening Scholarship (UK Government)",
    hindiName: "चेवनिंग स्कॉलरशिप (UK Govt Fully Funded)",
    organizer: "Foreign, Commonwealth & Development Office (FCDO), UK",
    type: "INTERNATIONAL",
    targetGroup: "Outstanding leaders and professional graduates",
    amount: "£1,200 - £1,500/month + Full Tuition",
    tuition: "100% Tuition fees for any 1-year Master's degree in UK",
    monthly: "£1,200 to £1,500/month living allowance (~₹1,25,000 - ₹1,50,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "03 November 2026",
    nextCycle: "Expected August 2027",
    daysRemaining: 120,
    urgency: "Applications require 4 extensive leadership essays, start drafting today!",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "65%",
    maxIncome: "No Limit",
    academicDesc: "Bachelor's degree with good standing, plus at least 2 years of work experience (2,800 hours).",
    incomeDesc: "UK Government international leadership merit award.",
    bhaiAdvice: "Sanjeet bhai, Chevening UK ki sabse elite scholarship hai. Poora 1-year master free + high-class royal lifestyle in London! Apne 4 essays par sabse zyada mehnat karna bhai.",
    portal: "https://www.chevening.org",
    portalName: "Chevening Official Portal"
  },
  {
    id: "u_commonwealth",
    name: "Commonwealth Master's Scholarship",
    hindiName: "कॉमनवेल्थ स्कॉलरशिप (UK-India Bilateral)",
    organizer: "Commonwealth Scholarship Commission (CSC), UK",
    type: "INTERNATIONAL",
    targetGroup: "Students from developing Commonwealth nations",
    amount: "₹38,00,000+ (Fully Funded: Tuition + Stipend + Flights)",
    tuition: "100% free tuition, exam and thesis costs covered",
    monthly: "£1,300 to £1,600 per month living stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "15 October 2026",
    nextCycle: "Expected September 2027",
    daysRemaining: 90,
    urgency: "Apply through Ministry of Education, Government of India portal first.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "70%",
    maxIncome: "No Limit",
    academicDesc: "Bachelor's degree in relevant major and clear plan on how your study benefits India.",
    incomeDesc: "Bilateral strategic developmental scholarship.",
    bhaiAdvice: "Bhai, Commonwealth development-focused studies ke liye top class option hai. India level nomination ke liye MoE portal par नजर रखना zaroori hai.",
    portal: "https://cscuk.fcdo.gov.uk",
    portalName: "CSC UK Portal"
  },
  {
    id: "u_rhodes",
    name: "Rhodes Scholarship (Oxford University)",
    hindiName: "रोड्स स्कॉलरशिप (ऑक्सफोर्ड यूनिवर्सिटी)",
    organizer: "The Rhodes Trust",
    type: "INTERNATIONAL",
    targetGroup: "Young global leaders with exceptional character and intellect",
    amount: "£18,000/year + Full Oxford Tuition",
    tuition: "100% Oxford University tuition fees",
    monthly: "£18,000 to £19,000 per year living stipend (~₹1,50,000/month)",
    deadlineStatus: "OPEN",
    deadlineDate: "01 August 2026",
    nextCycle: "Expected June 2027",
    daysRemaining: 25,
    urgency: "Extremely competitive and limited seats (only 5 scholars selected from India annually).",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "90%",
    maxIncome: "No Limit",
    academicDesc: "Exceptional first-class academic standing and clear leadership credentials.",
    incomeDesc: "Global premier leadership scholarship.",
    bhaiAdvice: "Sanjeet bhai, Rhodes scholarship poori duniya mein sabse purani aur prestigious scholarship hai. Bill Clinton, Sundar Pichai level scholars yahan se nikalte hain.",
    portal: "https://www.rhodeshouse.ox.ac.uk",
    portalName: "Rhodes Trust Portal"
  },
  {
    id: "u_gates",
    name: "Gates Cambridge Scholarship",
    hindiName: "गेट्स कैंब्रिज स्कॉलरशिप (कैंब्रिज यूनिवर्सिटी)",
    organizer: "Bill & Melinda Gates Foundation",
    type: "INTERNATIONAL",
    targetGroup: "Outstanding international graduate applicants to Cambridge",
    amount: "£20,000/year + Full Cambridge Tuition",
    tuition: "100% Cambridge University composition fees",
    monthly: "£20,000 per year maintenance allowance",
    deadlineStatus: "OPEN",
    deadlineDate: "07 January 2027",
    nextCycle: "Expected September 2027",
    daysRemaining: 115,
    urgency: "Apply alongside your general admission application to Cambridge University.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "85%",
    maxIncome: "No Limit",
    academicDesc: "First-class honors degree or top 5% equivalent in bachelor studies.",
    incomeDesc: "Gates Foundation philanthropic merit award.",
    bhaiAdvice: "Sanjeet bhai, Gates Cambridge select hone ke baad Cambridge University me research environment me direct entry milti hai. This is an elite tag!",
    portal: "https://www.gatescambridge.org",
    portalName: "Gates Cambridge"
  },
  {
    id: "u_great",
    name: "British Council GREAT Scholarship",
    hindiName: "ब्रिटिश काउंसिल GREAT स्कॉलरशिप",
    organizer: "British Council & UK Universities",
    type: "INTERNATIONAL",
    targetGroup: "Indian students wishing to pursue 1-year postgraduate studies in UK",
    amount: "₹10,50,000 (£10,000 direct tuition fee discount)",
    tuition: "£10,000 tuition fee deduction waiver",
    monthly: "Living cost supported by candidates",
    deadlineStatus: "COMING_SOON",
    deadlineDate: null,
    nextCycle: "Opens October 2026",
    daysRemaining: 85,
    urgency: "Check the lists of participating UK Universities.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "70%",
    maxIncome: "No Limit",
    academicDesc: "Strong academic background and motivation for UK-India brand ambassador roles.",
    incomeDesc: "British Council bilateral educational partnership program.",
    bhaiAdvice: "Bhai ye British Council and UK Universities ka direct tie up hai. Isme apply karna simple hai aur partial direct tuition support mil jata hai.",
    portal: "https://www.britishcouncil.in",
    portalName: "British Council India Portal"
  },

  // === INDIA SCHOLARSHIPS ===
  {
    id: "i_nsp",
    name: "NSP Central Sector Scheme of Scholarship",
    hindiName: "NSP सेंट्रल सेक्टर स्कॉलरशिप (Class 12 Board Top 80 Percentile)",
    organizer: "Ministry of Education, Government of India",
    type: "CENTRAL",
    targetGroup: "College & University students pursuing regular higher degrees",
    amount: "₹10,000 to ₹20,000 per year directly in bank",
    tuition: "Partial support during graduation and PG level studies",
    monthly: "₹1,000 to ₹2,000/month pocket stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "Bhai portal open hai, aakhri date ka wait bilkul mat karna, server down ho jata hai!",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80% percentile",
    maxIncome: "₹4,50,000",
    academicDesc: "Class 12th Board examinations mein relevant stream ke top 80 percentile me hona zaroori hai.",
    incomeDesc: "Family annual income ₹4.5 Lakh se kam honi chahiye.",
    bhaiAdvice: "Sanjeet bhai, ye central government ki sabse badiya basic scholarship hai regular degree colleges ke liye. NSP portal par OTR karke apply kardo!",
    portal: "https://scholarships.gov.in",
    portalName: "National Scholarship Portal (NSP)"
  },
  {
    id: "i_yashasvi",
    name: "PM YASHASVI Scholarship Scheme",
    hindiName: "पीएम यशस्वी छात्रवृत्ति योजना (OBC/EBC/DNT)",
    organizer: "Ministry of Social Justice and Empowerment, India",
    type: "CENTRAL",
    targetGroup: "OBC, EBC, and DNT students of Class 9 to 12 & Top Class Colleges",
    amount: "₹75,000 to ₹1,25,000 per year",
    tuition: "Full fees and hostel charges support",
    monthly: "Subsidies under DBT direct benefits",
    deadlineStatus: "OPEN",
    deadlineDate: "15 October 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 90,
    urgency: "Verify Aadhaar name and mobile linkage as OTP generation is mandatory.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["OBC", "EWS"],
    minMarks: "60%",
    maxIncome: "₹2,50,000",
    academicDesc: "Pass in previous class with at least 60% marks.",
    incomeDesc: "Family annual income from all sources must not exceed ₹2.5 Lakh.",
    bhaiAdvice: "Mere bhai, agar tum OBC, EBC ya DNT category se ho toh ye central level ki super reward scheme hai. Private aur government top schools/colleges ke liye apply karo.",
    portal: "https://yet.nta.ac.in",
    portalName: "YASHASVI NTA Portal"
  },
  {
    id: "i_inspire",
    name: "DST INSPIRE Scholarship for Higher Education (SHE)",
    hindiName: "इन्स्पायर स्कॉलरशिप (SHE - Science Degree)",
    organizer: "Department of Science and Technology (DST), India",
    type: "CENTRAL",
    targetGroup: "Students pursuing Basic and Natural Sciences at B.Sc, M.Sc levels",
    amount: "₹80,000 per year (₹60,000 Cash + ₹20,000 Research Mentorship)",
    tuition: "Course fee support",
    monthly: "₹5,000 per month pocket stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "31 December 2026",
    nextCycle: "Expected October 2027",
    daysRemaining: 150,
    urgency: "Check if your name is listed in your Board's INSPIRE Eligibility list.",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Top 1% of Board",
    maxIncome: "No Limit",
    academicDesc: "Class 12th Board exam ke top 1% rankers ya IIT-JEE/NEET rank holders pursuing Basic Sciences.",
    incomeDesc: "No income limit.",
    bhaiAdvice: "Sanjeet bhai, science ke students ke liye ye India ki sabse badi scholarship hai. Agar basic science (Physics, Chemistry, Maths) me graduation kar rahe ho toh mandatory apply karo!",
    portal: "https://online-inspire.gov.in",
    portalName: "INSPIRE DST Portal"
  },
  {
    id: "i_central_sector",
    name: "Central Sector Scheme of Scholarship",
    hindiName: "सेंट्रल सेक्टर कॉलेज स्कॉलरशिप स्कीम",
    organizer: "Ministry of Education, India",
    type: "CENTRAL",
    targetGroup: "Undergraduates studying in regular universities",
    amount: "₹12,000 to ₹20,000 per year",
    tuition: "Fees and study materials assistance",
    monthly: "Stipend support during study regular years",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "Ensure bank account is Aadhaar-seeded for smooth DBT transactions.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "80th Percentile",
    maxIncome: "₹4,50,000",
    academicDesc: "Above 80th percentile of successful candidates in the relevant stream from board of education.",
    incomeDesc: "Income below ₹4.5 Lakh per annum.",
    bhaiAdvice: "Bhai ye NSP Central Sector ka original version hai, standard colleges ke regular degree courses ke pure path me help milti hai.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP Central Portal"
  },
  {
    id: "i_pragati",
    name: "AICTE Pragati Scholarship for Girls",
    hindiName: "एआईसीटीई प्रगति स्कॉलरशिप (गर्ल्स टेक्निकल डिग्री)",
    organizer: "AICTE, Ministry of Education, India",
    type: "CENTRAL",
    targetGroup: "Girl students admitted in first-year technical degree or diploma programs",
    amount: "₹50,000 per year (Tuition + Device allowance)",
    tuition: "Full fee or device purchasing assistance up to ₹50,000",
    monthly: "Hostel/living cost integration support",
    deadlineStatus: "OPEN",
    deadlineDate: "31 October 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 45,
    urgency: "Only applicable to maximum 2 girls per family, check eligibility parameters.",
    gender: "FEMALE",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Admission Rank",
    maxIncome: "₹8,00,000",
    academicDesc: "Successful admission in first-year of technical degree/diploma courses in AICTE approved college.",
    incomeDesc: "Annual family income must be under ₹8 Lakh per year.",
    bhaiAdvice: "Behen/Bhai ye technical studies pursue karne wali girls ke liye best state-corporate tie-up scheme hai. ₹50,000 direct bank me aayenge college/laptop fees ke liye.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP National Portal"
  },
  {
    id: "i_kvpy",
    name: "KVPY National Science Fellowships",
    hindiName: "KVPY नेशनल साइंस फैलोशिप (DST INSPIRE-SHE)",
    organizer: "DST, Government of India & IISc Bangalore",
    type: "CENTRAL",
    targetGroup: "Science research minds pursuing B.Sc./M.Sc. integrated courses",
    amount: "₹64,000 to ₹84,000 per year",
    tuition: "IISc/IISER or top central universities support integrated",
    monthly: "₹5,000 to ₹7,000 per month pocket stipend",
    deadlineStatus: "OPEN",
    deadlineDate: "31 December 2026",
    nextCycle: "Expected August 2027",
    daysRemaining: 150,
    urgency: "Now merged under INSPIRE program guidelines, keep checking updates.",
    gender: "ALL",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "75%",
    maxIncome: "No Limit",
    academicDesc: "Class 11/12 or first year basic science degree students with strong analytic skills.",
    incomeDesc: "Pure merit based research fellowship.",
    bhaiAdvice: "Sanjeet bhai KVPY ka system ab INSPIRE program ke integration me high ranking minds ko direct research supports provide karta hai.",
    portal: "https://online-inspire.gov.in",
    portalName: "INSPIRE SHE Portal"
  },

  // === GIRLS SCHOLARSHIPS ===
  {
    id: "g_pragati_female",
    name: "Pragati Scholarship for Girls (AICTE)",
    hindiName: "प्रगति गर्ल्स स्कॉलरशिप (गर्ल्स टेक्निकल डिग्री)",
    organizer: "AICTE, Government of India",
    type: "CENTRAL",
    targetGroup: "Girl students admitted in technical degree or diploma courses",
    amount: "₹50,000 per year (Covers full tuition + computer/device cost)",
    tuition: "Full or partial reimbursement up to ₹50,000 per annum",
    monthly: "Subsidized boarding/canteen charges",
    deadlineStatus: "OPEN",
    deadlineDate: "31 October 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 45,
    urgency: "Only for girls in AICTE recognized technical colleges (B.Tech, B.Pharma, MCA etc.)",
    gender: "FEMALE",
    stream: ["SCIENCE"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Admission Rank",
    maxIncome: "₹8,0,000",
    academicDesc: "Successful admission to first-year of B.Tech/B.Pharma/Diploma in AICTE approved college.",
    incomeDesc: "Family income limit ₹8 Lakh per annum.",
    bhaiAdvice: "Bhai, apni behen ya dosto ko batao, AICTE ki Pragati scheme girls ke laptop/tuition fees ko completely support karti hai. Top direct payment method!",
    portal: "https://scholarships.gov.in",
    portalName: "NSP Portal"
  },
  {
    id: "g_swanath",
    name: "AICTE Swanath Scholarship Scheme",
    hindiName: "AICTE स्वनाथ स्कॉलरशिप (Orphans & Special Needs)",
    organizer: "AICTE, India",
    type: "CENTRAL",
    targetGroup: "Orphan children, kids of deceased soldiers or COVID martyrs",
    amount: "₹50,000 per year",
    tuition: "College fees and study material support",
    monthly: "₹5,000/month equivalent under overall yearly limit",
    deadlineStatus: "OPEN",
    deadlineDate: "31 October 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 45,
    urgency: "Must provide certificate of legal guardian or death certificates.",
    gender: "ALL",
    stream: ["SCIENCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Admission Merit",
    maxIncome: "₹8,00,000",
    academicDesc: "Enrolled in AICTE approved institutional courses.",
    incomeDesc: "Guardians annual income must not exceed ₹8 Lakh.",
    bhaiAdvice: "Ye scholarship un students ke liye hai jinhone apne parents ko kisi tragedy me kho diya hai, AICTE unhe bilkul support karti hai.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP Swanath Portal"
  },
  {
    id: "g_indira_gandhi",
    name: "Indira Gandhi PG Scholarship for Single Girl Child",
    hindiName: "इंदिरा गांधी सिंगल गर्ल चाइल्ड स्कॉलरशिप (PG Degree)",
    organizer: "University Grants Commission (UGC), India",
    type: "CENTRAL",
    targetGroup: "Single girl children of families pursuing regular Postgraduate degrees",
    amount: "₹36,200 per year for 2 years (Full PG Course)",
    tuition: "Full allowance directly transferred as pocket money",
    monthly: "₹3,100 per month pocket stipend equivalent",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "Must upload family affidavit confirming Single Girl Child status.",
    gender: "FEMALE",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Graduation Pass",
    maxIncome: "No Limit",
    academicDesc: "Admitted in first-year of regular, full-time master's degree in any recognized university.",
    incomeDesc: "No income restrictions.",
    bhaiAdvice: "Bhai, agar tum apne maa-baap ki ek-lauti ladki ho (single girl child) aur PG regular college me kar rahi ho, toh ye scholarship tumhare self-respect aur growth ke liye best hai.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP UGC Portal"
  },
  {
    id: "g_begum_hazrat",
    name: "Begum Hazrat Mahal National Scholarship",
    hindiName: "बेगम हज़रत महल नेशनल स्कॉलरशिप (Class 9-12 Minority Girls)",
    organizer: "Maulana Azad Education Foundation (MAEF), Government of India",
    type: "CENTRAL",
    targetGroup: "Minority communities girl students (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)",
    amount: "₹5,000 to ₹6,000 per year",
    tuition: "School fees and textbook support",
    monthly: "Direct Benefit Transfer support",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "Minority community certificate or self-declaration mandatory.",
    gender: "FEMALE",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["OBC", "GENERAL", "EWS"],
    minMarks: "50%",
    maxIncome: "₹2,00,000",
    academicDesc: "Studying in Class 9 to 12 and passed the previous class with at least 50% marks.",
    incomeDesc: "Annual income of parents/guardians should not exceed ₹2 Lakh.",
    bhaiAdvice: "Minority girls ke liye class 9th se 12th tak school kharcha nikalne ke liye ye government scheme sabse trusted hai.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP Minority Portal"
  },
  {
    id: "g_ishan_uday",
    name: "Ishan Uday Special Scholarship for North East Girls/Merit",
    hindiName: "इशान उदय स्पेशल स्कॉलरशिप (North East Region)",
    organizer: "University Grants Commission (UGC), India",
    type: "CENTRAL",
    targetGroup: "Students with domicile of North Eastern states pursuing general degree courses",
    amount: "₹64,800 to ₹93,600 per year",
    tuition: "Full fees and boarding support",
    monthly: "₹5,400 to ₹7,800 per month pocket allowance",
    deadlineStatus: "OPEN",
    deadlineDate: "30 November 2026",
    nextCycle: "Expected July 2027",
    daysRemaining: 65,
    urgency: "North East Region domicile proof (PRC certificate) is mandatory.",
    gender: "ALL",
    stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
    category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
    minMarks: "Class 12th Pass",
    maxIncome: "₹4,50,000",
    academicDesc: "Passed Class 12th or equivalent and secured admission in any regular degree college.",
    incomeDesc: "Parental annual income limit ₹4.5 Lakh.",
    bhaiAdvice: "North East ke bacho ke liye ye UGC ki sabse high-paying scholarship scheme hai, support direct bank me high scale DBT ke roop me aata hai.",
    portal: "https://scholarships.gov.in",
    portalName: "NSP Ishan Uday Portal"
  }
];

// Helper to expand Compact DB into complete structural Scholarship objects
function inflateScholarship(c: CompactScholarship, profile?: any): Scholarship {
  let finalMatchScore = 98;
  let finalMatchReason = `Tumhare current educational status aur interest guidelines is scholarship parameters se 100% align hote hain. Highly recommended!`;

  if (profile) {
    const userGender = (profile.gender || "").toLowerCase();
    const isFemale = userGender === "female";
    const isMale = userGender === "male";
    const isOtherOrUnspecified = !profile.gender || (userGender !== "female" && userGender !== "male");

    // STRICT GENDER FILTER
    if (c.gender === "FEMALE" && !isFemale) {
      finalMatchScore = 0;
      finalMatchReason = "Bhai, ye scholarship specific roop se female (kanya) students ke liye hai. Aapki profile me Female gender na hone se iska match 0% hai.";
    } else if (c.gender === "MALE" && !isMale) {
      finalMatchScore = 0;
      finalMatchReason = "Bhai, ye scholarship specific roop se male students ke liye hai. Aapki profile me Male gender na hone se iska match 0% hai.";
    } else if ((c.gender === "FEMALE" || c.gender === "MALE") && isOtherOrUnspecified) {
      finalMatchScore = 0;
      finalMatchReason = "Bhai, ye gender-exclusive scholarship hai. Aapki profile me Male ya Female gender specified nahi hone ke karan iska match 0% hai.";
    } else {
      if (c.id === "i_nsp") {
         if (profile.income && (profile.income.includes("Below 1 Lakh") || profile.income.includes("1 to 2 Lakhs"))) {
            finalMatchScore = 90;
            finalMatchReason = "NSP scholarship me tumhara family income directly eligible criteria (below 2.5 Lakh) ke andar aata hai. 90% direct match!";
         }
      } else if (c.id === "i_yashasvi") {
         if (profile.caste === "General") {
            finalMatchScore = 40;
            finalMatchReason = "Bhai, PM YASHASVI mukhya roop se OBC/EBC/DNT categories ke liye hai. General category ki vajah se selection chances kam hain (40%).";
         }
      } else if (c.id === "i_inspire") {
         if (profile.stream && profile.stream !== "Science") {
            finalMatchScore = 60;
            finalMatchReason = "INSPIRE scholarship specifically Science stream students ke liye design ki gayi hai. Tumhara stream 'Others' hone ki vajah se 60% match hai, dusri scheme try karna better hoga.";
         }
      } else if (c.id === "g_pragati_female" || c.id === "i_pragati") {
         if (!isFemale) {
            finalMatchScore = 0;
            finalMatchReason = "Pragati Scholarship sirf girls ke liye hai. Tumhare profile me gender specify nahi hai ya aap male/other hain, isliye 0% match.";
         }
      }
    }
  }

  return {
    id: c.id,
    name: c.name,
    hindiName: c.hindiName,
    organizer: c.organizer,
    type: c.type,
    targetGroup: c.targetGroup,
    deadline: {
      status: c.deadlineStatus,
      currentCycleDate: c.deadlineDate,
      nextCycleExpected: c.nextCycle,
      daysRemaining: c.daysRemaining,
      urgencyMessage: c.urgency,
      applyNow: c.deadlineStatus === "OPEN"
    },
    benefits: {
      totalAmount: c.amount,
      breakdown: {
        tuition: c.tuition,
        monthly: c.monthly,
        airfare: c.id.startsWith("k_") || c.id.startsWith("g_daad") || c.id.startsWith("j_mext") || c.id.startsWith("u_chevening") ? "Round-trip economy class flight included" : undefined,
        settlement: c.id.startsWith("k_") ? "₩200,000 (~₹12,000) one-time grant" : undefined,
        books: "Full material and book purchase allowance integrated",
        other: ["Medical Health Insurance cover included", "Full library & internet access on campus"]
      },
      duration: c.type === "INTERNATIONAL" ? "Full Course duration + 1 year language prep if needed" : "Regular duration of the enrolled course",
      additionalPerks: ["Direct mentorship by senior advisors", "Annual cultural tours and alumni meetups", "High value corporate placements assistance"]
    },
    eligibility: {
      age: {
        min: 17,
        max: 35,
        description: "Bhai, normally age criteria 17 se 35 saal ke beech honi chahiye."
      },
      academics: {
        minMarks: c.minMarks,
        description: c.academicDesc
      },
      income: {
        maxAnnual: c.maxIncome,
        description: c.incomeDesc
      },
      category: c.category,
      gender: c.gender,
      stream: c.stream,
      state: "ALL",
      other: ["Must be a citizen of India", "Must have solid moral character with no prior academic backlogs"]
    },
    documents: [
      {
        name: "Academic Marksheets & Certificates (Pichli Class ka Result)",
        isRequired: true,
        howToGet: "From your School Board or University Office",
        timeRequired: "1-2 Days",
        cost: "Free",
        tip: "Sanjeet bhai, original marksheets ko high quality scan karke upload karna, photo copies mat lagana."
      },
      {
        name: "Income Certificate (Aaye Praman Patra)",
        isRequired: c.maxIncome !== "No Limit",
        howToGet: "Tehsil office or local Jan Seva Kendra / Online State Portal",
        timeRequired: "7-10 Days",
        cost: "₹30",
        tip: "Income certificate bilkul current financial year ka hona chahiye, 6 mahine se purana nahi!"
      },
      {
        name: "Aadhaar Card with seeded bank account",
        isRequired: true,
        howToGet: "UIDAI Seeding check / Bank Administration",
        timeRequired: "5 Days",
        cost: "Free",
        tip: "Aadhaar number mobile se linked hona chahiye taki OTP verify ho sake, seedhe DBT account me credit hoga paisa!"
      },
      {
        name: "Statement of Purpose (SOP) or Study Plan",
        isRequired: c.type === "INTERNATIONAL",
        howToGet: "Directly draft based on your career interests and research goals",
        timeRequired: "10 Days",
        cost: "Free",
        tip: "SOP ko unique likho bhai! AI duplicate copy paste check pass nahi karegi. Tera vision clear hona chahiye."
      }
    ],
    applicationProcess: {
      mode: c.type === "INTERNATIONAL" ? "ONLINE" : "ONLINE",
      portal: c.portal,
      portalName: c.portalName,
      tracks: [
        {
          name: "Direct Digital Track",
          description: "Apply directly online via the central university or government admission portal.",
          universities: "Apply to maximum 3 participating colleges or departments."
        }
      ],
      steps: [
        "Step 1: Check eligibility specifications aur documents ko scan karke ready rkho.",
        `Step 2: Official Portal (${c.portalName}) par jao aur active registration create karo.`,
        "Step 3: Academic details aur profile inputs carefully fill up karo.",
        "Step 4: All required certificates aur SOP correctly scan karke upload karo.",
        "Step 5: Final application printout le lo aur institute verification clear karwa lo."
      ],
      helpline: "011-26172580 / Official Govt Helpdesk",
      email: "support@mitra-scholarships.org"
    },
    preparationTimeline: [
      {
        timeframe: "Abhi se (Immediately)",
        tasks: [
          "Check eligibility and secure all current semester marksheets.",
          "Verify Aadhaar card link status with bank account details."
        ]
      },
      {
        timeframe: "1 Month Before",
        tasks: [
          "Request recommendation letters from your school teachers or college professors.",
          "Write and polish the career vision statement or SOP drafts."
        ]
      }
    ],
    successTips: [
      "Bhai, forms submit karne ke baad regularly email inbox aur portals check karte raho.",
      "Documents me clear signature aur self-attestation specifications check karna mat bhoolna.",
      "Apni study streams and computer skills ko extra edge dene ke liye profile portfolio link zaroor attach karo."
    ],
    commonMistakes: [
      "Writing wrong bank IFSC codes which causes DBT fund transfers to bounce back.",
      "Applying on multiple tracks simultaneously where only single selection registration is permitted.",
      "Submitting low-resolution or dark photos of certificates which gets rejected during verification."
    ],
    matchScore: finalMatchScore,
    matchReason: finalMatchReason,
    badeBhaiAdvice: c.bhaiAdvice,
    relatedScholarships: c.id.startsWith("k_") 
      ? ["GKS Scholarship", "KAIST Engineering Grant"] 
      : c.id.startsWith("g_") 
      ? ["DAAD PG Award", "Deutschlandstipendium"] 
      : ["NSP Central Sector Scheme", "PM YASHASVI Award"]
  };
}

export function checkRateLimit(): { isLimited: boolean; count: number } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { isLimited: false, count: 0 };
  }

  // Check if user is Premium
  if (localStorage.getItem("is_premium") === "true") {
    return { isLimited: false, count: 0 };
  }

  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("last_reset");
  let count = parseInt(localStorage.getItem("searches_today") || "0", 10);

  if (lastReset !== today) {
    localStorage.setItem("last_reset", today);
    localStorage.setItem("searches_today", "0");
    count = 0;
  }

  return {
    isLimited: count >= 5,
    count
  };
}

export function incrementSearchCount(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("last_reset");
  let count = parseInt(localStorage.getItem("searches_today") || "0", 10);

  if (lastReset !== today) {
    localStorage.setItem("last_reset", today);
    count = 0;
  }

  localStorage.setItem("searches_today", (count + 1).toString());
}

function getLocalCompactFallback(query: string, userProfile?: any): ScholarshipResult {
  // Absolute fallback: pick 5 standard amazing scholarships from database (combination of global and national)
  const fallbackIds = ["i_nsp", "i_yashasvi", "i_inspire", "g_pragati_female", "u_chevening"];
  const fallbackCompact = COMPACT_DB.filter(c => fallbackIds.includes(c.id));
  const scholarships = fallbackCompact.map(c => inflateScholarship(c, userProfile));
  
  return {
    scholarships,
    summary: {
      totalFound: scholarships.length,
      bestMatch: scholarships[0].id,
      quickAdvice: `Sanjeet bhai, aaj ki searches limit poori ho chuki hai, par tere bade bhai ne tumhare academic records ke liye ye top 5 trusted options local database se load kar diye hain!`,
      nextAction: `National Scholarship Portal (scholarships.gov.in) check karein.`
    }
  };
}

// Global search function
export async function searchScholarship(
  query: string,
  userProfile: {
    class?: string;
    stream?: string;
    income?: string;
    caste?: string;
    state?: string;
    gender?: string;
  },
  isPrivateOnly?: boolean
): Promise<ScholarshipResult> {
  const cacheKey = "scholarship_" + query;

  // 1. CACHING SYSTEM: Check cache (24 hours validity)
  if (typeof window !== "undefined" && window.localStorage) {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        const ageInHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
        if (ageInHours < 24) {
          console.log(`[Cache Hit] Serving cached response for: ${query}. Age: ${ageInHours.toFixed(1)}h`);
          const currentLimit = checkRateLimit();
          return {
            ...cached.data,
            isCached: true,
            cacheAgeHours: ageInHours,
            searchesToday: currentLimit.count,
          };
        }
      } catch (e) {
        console.error("Failed to parse cached scholarship data:", e);
      }
    }
  }

  // 2. RATE LIMITING: Check rate limit for API calls
  const normQuery = query.toLowerCase();
  const isGoogleAI = normQuery.includes("google") || normQuery.includes("grow.google");
  const isProgramSearch = normQuery.includes("program") || normQuery.includes("certificate");
  const isKorea = normQuery.includes("korea") || normQuery.includes("gks") || normQuery.includes("kaist") || normQuery.includes("postech") || normQuery.includes("seoul") || normQuery.includes("yonsei") || normQuery.includes("bk21") || normQuery.includes("kgsp");
  const isGermany = normQuery.includes("germany") || normQuery.includes("german") || normQuery.includes("daad") || normQuery.includes("boell") || normQuery.includes("böll") || normQuery.includes("adenauer") || normQuery.includes("ebert") || normQuery.includes("deutschland");
  const isJapan = normQuery.includes("japan") || normQuery.includes("japanese") || normQuery.includes("mext") || normQuery.includes("jasso") || normQuery.includes("rotary") || normQuery.includes("yoneyama") || normQuery.includes("tokyo");
  const isUK = normQuery.includes("uk") || normQuery.includes("united kingdom") || normQuery.includes("british") || normQuery.includes("chevening") || normQuery.includes("commonwealth") || normQuery.includes("rhodes") || normQuery.includes("gates") || normQuery.includes("cambridge") || normQuery.includes("oxford");
  const isIndia = normQuery.includes("india") || normQuery.includes("indian") || normQuery.includes("national") || normQuery.includes("nsp") || normQuery.includes("yashasvi") || normQuery.includes("inspire") || normQuery.includes("central sector") || normQuery.includes("pragati") || normQuery.includes("kvpy");
  const isGirls = normQuery.includes("girl") || normQuery.includes("girls") || normQuery.includes("female") || normQuery.includes("women") || normQuery.includes("women in stem") || normQuery.includes("pragati") || normQuery.includes("swanath") || normQuery.includes("indira") || normQuery.includes("begum") || normQuery.includes("hazrat") || normQuery.includes("ishan");

  const isLocalPreset = isProgramSearch || isGoogleAI || isKorea || isGermany || isJapan || isUK || isIndia || isGirls;

  if (!isLocalPreset) {
    const { isLimited, count } = checkRateLimit();
    if (isLimited) {
      console.warn(`[Rate Limit] Daily limit reached (5/5). Serving fallback for: ${query}`);
      
      // 3. SMART FALLBACK: Try to get cached data (even if expired)
      if (typeof window !== "undefined" && window.localStorage) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            const ageInHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
            return {
              ...cached.data,
              isCached: true,
              isRateLimited: true,
              cacheAgeHours: ageInHours,
              isFallback: true,
              searchesToday: count,
            };
          } catch (e) {}
        }
      }

      // Serve local compact fallback
      const fallbackResult = getLocalCompactFallback(query, userProfile);
      return {
        ...fallbackResult,
        isRateLimited: true,
        isFallback: true,
        searchesToday: count,
      };
    }
  }

  if (isProgramSearch || isGoogleAI) {
    const programs: Scholarship[] = [];
    if (isGoogleAI || normQuery.includes("ai")) {
      programs.push({
        id: "google_ai_program",
        name: "Google AI Essentials Program (Grow with Google)",
        hindiName: "गूगल एआई प्रोग्राम (Grow with Google) - स्किल्स सर्टिफिकेट",
        organizer: "Google / Grow with Google",
        type: "PROGRAM" as const,
        targetGroup: "All students, job seekers, and professionals looking to learn AI skills",
        deadline: {
          status: "OPEN" as const,
          currentCycleDate: "Self-paced / Always Open",
          nextCycleExpected: "Continuous enrollment",
          daysRemaining: 365,
          urgencyMessage: "Bhai, ye program bilkul self-paced hai! Apni productivity badhane ke liye aaj hi enroll karo.",
          applyNow: true
        },
        benefits: {
          totalAmount: "Learn Free AI Skills + Grow with Google Certificate",
          breakdown: {
            tuition: "Financial aid available (coursera.org/learn/google-ai-essentials)",
            monthly: undefined,
            airfare: undefined,
            settlement: undefined,
            books: "Online study materials included",
            hostel: undefined,
            other: ["Get industry-recognized career certificates", "Learn prompt engineering & generative AI tools"]
          },
          duration: "Approx. 10 hours of self-paced learning",
          additionalPerks: ["Direct access to Google Career resources", "Verified certificate shareable on LinkedIn"]
        },
        eligibility: {
          age: {
            min: 16,
            max: 99,
            description: "Bhai, isme age limit nahi hai! 16 saal se upar koi bhi seekh sakta hai."
          },
          academics: {
            minMarks: "No minimum marks",
            description: "Prior technical background ya coding experience ki bilkul zaroorat nahi hai."
          },
          income: {
            maxAnnual: "No Limit",
            description: "Financial aid option is available on Coursera for free access."
          },
          category: ["GENERAL", "OBC", "SC", "ST", "EWS"],
          gender: "ALL",
          stream: ["SCIENCE", "ARTS", "COMMERCE", "ANY"],
          state: "ALL",
          other: ["Requires a computer and basic internet connection"]
        },
        documents: [
          {
            name: "Government ID / Email Account",
            isRequired: true,
            howToGet: "Create a standard Gmail or use any valid ID for verification",
            timeRequired: "1 Day",
            cost: "Free",
            tip: "Sanjeet bhai, isme koi heavy documentation nahi chahiye, bas email se signup ho jata hai."
          }
        ],
        applicationProcess: {
          mode: "ONLINE",
          portal: "https://grow.google/certificates",
          portalName: "Grow with Google Certificates Official Portal",
          tracks: [
            {
              name: "Coursera Digital Track",
              description: "Enroll online directly on the Google AI Essentials course page.",
              universities: "Hosted on Coursera"
            }
          ],
          steps: [
            "Step 1: Grow with Google website (grow.google/certificates) par visit karein.",
            "Step 2: Google AI Essentials program page select karein.",
            "Step 3: Coursera register link par click karke Gmail se signup karein.",
            "Step 4: Financial Aid option apply karein agar free full certificate chahiye.",
            "Step 5: Start learning self-paced modules and submit assignments!"
          ],
          helpline: "Google Support / Coursera Help Center",
          email: "support@grow.google"
        },
        preparationTimeline: [
          {
            timeframe: "Abhi se (Immediately)",
            tasks: ["Visit grow.google/certificates", "Sign up on Coursera using Gmail"]
          }
        ],
        successTips: [
          "Bhai, har module ke baad quiz submit karna aur assignments share karna certificate pane ke liye.",
          "AI productivity techniques ko apne daily study routine me utilize karo!"
        ],
        commonMistakes: [
          "Financial aid apply kiye bina expensive course pay kar dena (Financial aid forms carefully bharein)."
        ],
        matchScore: 98,
        matchReason: "Aap student hain aur AI skills aaj ke samay me career growth ke liye sabse important hain!",
        badeBhaiAdvice: "Sanjeet bhai, Google AI Program study ke sath-sath coding/skills seekhne ke liye gold-standard hai. grow.google/certificates par jao aur bina delay enroll karo!",
        relatedScholarships: ["Google IT Support Certificate", "NSP Central Sector Scheme"]
      });
    }

    return {
      scholarships: [],
      programs: programs,
      summary: {
        totalFound: programs.length,
        bestMatch: programs[0]?.id || "google_ai_program",
        quickAdvice: "Sanjeet bhai, ye ek premium Google AI certified skills program hai! grow.google/certificates par iski poori jankari available hai. Scholarship aur Programs alag hote hain.",
        nextAction: "grow.google/certificates portal par jakar course page visit karein."
      }
    };
  }

  let matchingCompact: CompactScholarship[] = [];

  if (isKorea) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("k_"));
  } else if (isGermany) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("g_"));
  } else if (isJapan) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("j_"));
  } else if (isUK) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("u_"));
  } else if (isIndia) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("i_"));
  } else if (isGirls) {
    matchingCompact = COMPACT_DB.filter(s => s.id.startsWith("g_pragati") || s.id.startsWith("g_swanath") || s.id.startsWith("g_indira") || s.id.startsWith("g_begum") || s.id.startsWith("g_ishan"));
  }

  // Ensure minimum 5 to 8 scholarships ALWAYS
  if (matchingCompact.length > 0) {
    // If we matched a specific country but have less than 5, fill from other global/national categories
    if (matchingCompact.length < 5) {
      const remainingCount = 5 - matchingCompact.length;
      const otherPool = COMPACT_DB.filter(s => !matchingCompact.some(m => m.id === s.id));
      matchingCompact = [...matchingCompact, ...otherPool.slice(0, remainingCount)];
    }
    
    const scholarships = matchingCompact.map(c => inflateScholarship(c, userProfile));
    return {
      scholarships,
      summary: {
        totalFound: scholarships.length,
        bestMatch: scholarships[0].id,
        quickAdvice: `Sanjeet bhai, tumhari search query "${query}" ke related top details yahan load kar di gayi hain! Tera bada bhai tumhare sath hai, details ko check karo aur direct portals par apply karo.`,
        nextAction: `Portals par details correct bharna shuru karein.`
      }
    };
  }

  // Dynamic search via API if query does not match primary presets
  try {
    let responseData;
    if (isPrivateOnly) {
      const response = await axios.post("/api/scholarships/search", {
        query,
        userProfile,
        isPrivateOnly: true,
      });
      responseData = response.data;
    } else {
      const response = await axios.post("/api/scholarships/search", {
        query,
        userProfile,
      });
      responseData = response.data;
    }

    let finalResult: ScholarshipResult;

    if (responseData && responseData.scholarships && responseData.scholarships.length >= 5) {
      finalResult = responseData;
    } else {
      // If API returns less than 5, or does not have scholarships, we supplement from our high-fidelity database to hit MINIMUM 5
      const apiScholarships: Scholarship[] = (responseData && responseData.scholarships) || [];
      const needed = 5 - apiScholarships.length;
      
      // Choose high-fidelity fallbacks that don't duplicate existing ones
      const fallbackIds = ["i_nsp", "i_yashasvi", "i_inspire", "i_central_sector", "i_pragati", "u_chevening", "g_pragati_female"];
      const fallbacks = COMPACT_DB
        .filter(c => fallbackIds.includes(c.id) || c.id.startsWith("i_"))
        .filter(c => !apiScholarships.some(api => api.name.toLowerCase().includes(c.name.toLowerCase())))
        .slice(0, needed)
        .map(c => inflateScholarship(c, userProfile));

      const merged = [...apiScholarships, ...fallbacks];
      finalResult = {
        scholarships: merged,
        summary: {
          totalFound: merged.length,
          bestMatch: merged[0]?.id || fallbacks[0]?.id || "fallback_nsp",
          quickAdvice: `Sanjeet bhai, tumhari query "${query}" ke results yahan hain! Humne database se premium matched scholarships add kar diye hain taaki tumhara kharcha aur requirements perfectly manage ho sake.`,
          nextAction: `Top lists ko study karke criteria confirm karein.`
        }
      };
    }

    // Success! Save to cache
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheEntry = {
        data: finalResult,
        timestamp: Date.now()
      };
      localStorage.setItem("scholarship_" + query, JSON.stringify(cacheEntry));
      
      // Increment search counter
      incrementSearchCount();
    }

    const currentLimit = checkRateLimit();
    return {
      ...finalResult,
      searchesToday: currentLimit.count,
    };

  } catch (error) {
    console.error("Scholarship AI Service live API query error, using local fallback database matching:", error);
    
    // API Failed! This is also an API limit or network error.
    // Try to fall back to ANY cache (even if older than 24 hours)
    if (typeof window !== "undefined" && window.localStorage) {
      const cachedStr = localStorage.getItem("scholarship_" + query);
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          const ageInHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
          console.log(`[API Fail Fallback] Serving expired cached response for: ${query}. Age: ${ageInHours.toFixed(1)}h`);
          return {
            ...cached.data,
            isCached: true,
            isApiFailed: true,
            cacheAgeHours: ageInHours,
            isFallback: true,
            searchesToday: parseInt(localStorage.getItem("searches_today") || "0", 10),
          };
        } catch (e) {}
      }
    }

    // Serve local compact fallback
    const fallbackResult = getLocalCompactFallback(query, userProfile);
    return {
      ...fallbackResult,
      isApiFailed: true,
      isFallback: true,
      searchesToday: typeof window !== "undefined" ? parseInt(localStorage.getItem("searches_today") || "0", 10) : 0,
    };
  }
}
