import type {
  AuditLogEntry,
  ChatMessage,
  Conversation,
  DocumentRecord,
  FoodLog,
  IntegrationProvider,
  LabResult,
  LabStatus,
  LifestyleLog,
  Medication,
  OnboardingSurvey,
  Patient,
  Protocol,
  SleepData,
  SymptomLog,
} from "./types";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random helpers — keeps generated detail stable */
/* ------------------------------------------------------------------ */

function seeded(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3600_000).toISOString();
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function round(n: number, dp = 1) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ */
/* Patients                                                           */
/* ------------------------------------------------------------------ */

export const PATIENTS: Patient[] = [
  {
    id: "usr_8f2a1c",
    name: "Sarah Chen",
    email: "sarah.chen@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(214),
    lastLoginAt: hoursAgo(3),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (415) 555-0182",
    timezone: "America/Los_Angeles",
    location: "San Francisco, CA",
    dateOfBirth: "1991-04-12",
    biologicalSex: "FEMALE",
    heightCm: 165,
    weightKg: 62,
    unitSystem: "IMPERIAL",
    primaryGoal: "UNDERSTAND_MY_LABS",
    onboardingComplete: true,
    metabolicScore: 78,
    scoreDelta: 3,
    subscription: {
      tier: "PREMIUM",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk1Sarah",
      stripeSubscriptionId: "sub_1Pk1Sarah",
      currentPeriodEnd: daysAgo(-18),
      cancelAtPeriodEnd: false,
      mrr: 49,
      startedAt: daysAgo(180),
    },
    connectedIntegrations: ["apple_health", "oura"],
    flaggedLabsCount: 3,
    lastActivityAt: hoursAgo(3),
    avatarColor: "#0f766e",
  },
  {
    id: "usr_3b9e44",
    name: "Marcus Webb",
    email: "marcus.webb@outlook.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(167),
    lastLoginAt: hoursAgo(28),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (312) 555-0143",
    timezone: "America/Chicago",
    location: "Chicago, IL",
    dateOfBirth: "1985-09-30",
    biologicalSex: "MALE",
    heightCm: 183,
    weightKg: 91,
    unitSystem: "IMPERIAL",
    primaryGoal: "LOSE_WEIGHT",
    onboardingComplete: true,
    metabolicScore: 54,
    scoreDelta: -2,
    subscription: {
      tier: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk2Marcus",
      stripeSubscriptionId: "sub_1Pk2Marcus",
      currentPeriodEnd: daysAgo(-9),
      cancelAtPeriodEnd: false,
      mrr: 19,
      startedAt: daysAgo(150),
    },
    connectedIntegrations: ["google_fit"],
    flaggedLabsCount: 6,
    lastActivityAt: hoursAgo(28),
    avatarColor: "#14b8a6",
  },
  {
    id: "usr_7c1d05",
    name: "Priya Nair",
    email: "priya.nair@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(98),
    lastLoginAt: hoursAgo(11),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (646) 555-0199",
    timezone: "America/New_York",
    location: "Brooklyn, NY",
    dateOfBirth: "1994-12-03",
    biologicalSex: "FEMALE",
    heightCm: 160,
    weightKg: 57,
    unitSystem: "METRIC",
    primaryGoal: "BALANCE_HORMONES",
    onboardingComplete: true,
    metabolicScore: 71,
    scoreDelta: 5,
    subscription: {
      tier: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk3Priya",
      stripeSubscriptionId: "sub_1Pk3Priya",
      currentPeriodEnd: daysAgo(-21),
      cancelAtPeriodEnd: false,
      mrr: 19,
      startedAt: daysAgo(80),
    },
    connectedIntegrations: ["apple_health"],
    flaggedLabsCount: 2,
    lastActivityAt: hoursAgo(11),
    avatarColor: "#2dd4bf",
  },
  {
    id: "usr_2e8f31",
    name: "David Okonkwo",
    email: "d.okonkwo@protonmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(312),
    lastLoginAt: hoursAgo(54),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (713) 555-0166",
    timezone: "America/Chicago",
    location: "Houston, TX",
    dateOfBirth: "1979-06-21",
    biologicalSex: "MALE",
    heightCm: 178,
    weightKg: 84,
    unitSystem: "IMPERIAL",
    primaryGoal: "REDUCE_INFLAMMATION",
    onboardingComplete: true,
    metabolicScore: 63,
    scoreDelta: 1,
    subscription: {
      tier: "PREMIUM",
      status: "PAST_DUE",
      stripeCustomerId: "cus_Qk4David",
      stripeSubscriptionId: "sub_1Pk4David",
      currentPeriodEnd: daysAgo(4),
      cancelAtPeriodEnd: false,
      mrr: 49,
      startedAt: daysAgo(300),
    },
    connectedIntegrations: ["oura", "apple_health"],
    flaggedLabsCount: 4,
    lastActivityAt: hoursAgo(54),
    avatarColor: "#0f766e",
  },
  {
    id: "usr_9a4b72",
    name: "Emily Rodriguez",
    email: "emily.r@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(45),
    lastLoginAt: hoursAgo(6),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (305) 555-0121",
    timezone: "America/New_York",
    location: "Miami, FL",
    dateOfBirth: "1997-02-17",
    biologicalSex: "FEMALE",
    heightCm: 168,
    weightKg: 64,
    unitSystem: "IMPERIAL",
    primaryGoal: "IMPROVE_ENERGY",
    onboardingComplete: true,
    metabolicScore: 82,
    scoreDelta: 7,
    subscription: {
      tier: "FREE",
      status: "ACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      mrr: 0,
      startedAt: daysAgo(45),
    },
    connectedIntegrations: ["apple_health"],
    flaggedLabsCount: 1,
    lastActivityAt: hoursAgo(6),
    avatarColor: "#14b8a6",
  },
  {
    id: "usr_5d6c18",
    name: "James Sullivan",
    email: "jsullivan@yahoo.com",
    role: "PATIENT",
    status: "locked",
    emailVerified: true,
    createdAt: daysAgo(189),
    lastLoginAt: hoursAgo(72),
    lockedUntil: hoursAgo(-2),
    failedLoginAttempts: 5,
    phone: "+1 (206) 555-0177",
    timezone: "America/Los_Angeles",
    location: "Seattle, WA",
    dateOfBirth: "1988-11-08",
    biologicalSex: "MALE",
    heightCm: 175,
    weightKg: 79,
    unitSystem: "IMPERIAL",
    primaryGoal: "OPTIMIZE_PERFORMANCE",
    onboardingComplete: true,
    metabolicScore: 69,
    scoreDelta: 0,
    subscription: {
      tier: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk6James",
      stripeSubscriptionId: "sub_1Pk6James",
      currentPeriodEnd: daysAgo(-14),
      cancelAtPeriodEnd: true,
      mrr: 19,
      startedAt: daysAgo(170),
    },
    connectedIntegrations: ["google_fit"],
    flaggedLabsCount: 3,
    lastActivityAt: hoursAgo(72),
    avatarColor: "#d97706",
  },
  {
    id: "usr_1f7a93",
    name: "Aisha Mohammed",
    email: "aisha.m@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(122),
    lastLoginAt: hoursAgo(19),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (404) 555-0188",
    timezone: "America/New_York",
    location: "Atlanta, GA",
    dateOfBirth: "1992-07-25",
    biologicalSex: "FEMALE",
    heightCm: 163,
    weightKg: 59,
    unitSystem: "METRIC",
    primaryGoal: "BALANCE_HORMONES",
    onboardingComplete: true,
    metabolicScore: 75,
    scoreDelta: 2,
    subscription: {
      tier: "PREMIUM",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk7Aisha",
      stripeSubscriptionId: "sub_1Pk7Aisha",
      currentPeriodEnd: daysAgo(-25),
      cancelAtPeriodEnd: false,
      mrr: 49,
      startedAt: daysAgo(110),
    },
    connectedIntegrations: ["oura", "apple_health"],
    flaggedLabsCount: 2,
    lastActivityAt: hoursAgo(19),
    avatarColor: "#2dd4bf",
  },
  {
    id: "usr_6b3e57",
    name: "Tom Bradshaw",
    email: "tom.bradshaw@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: false,
    createdAt: daysAgo(8),
    lastLoginAt: hoursAgo(14),
    lockedUntil: null,
    failedLoginAttempts: 1,
    phone: "+1 (503) 555-0134",
    timezone: "America/Los_Angeles",
    location: "Portland, OR",
    dateOfBirth: "1990-03-19",
    biologicalSex: "MALE",
    heightCm: 180,
    weightKg: 88,
    unitSystem: "IMPERIAL",
    primaryGoal: "LOSE_WEIGHT",
    onboardingComplete: false,
    metabolicScore: 0,
    scoreDelta: 0,
    subscription: {
      tier: "FREE",
      status: "ACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      mrr: 0,
      startedAt: daysAgo(8),
    },
    connectedIntegrations: [],
    flaggedLabsCount: 0,
    lastActivityAt: hoursAgo(14),
    avatarColor: "#64748b",
  },
  {
    id: "usr_4c9d28",
    name: "Linda Park",
    email: "linda.park@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(276),
    lastLoginAt: hoursAgo(8),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (213) 555-0155",
    timezone: "America/Los_Angeles",
    location: "Los Angeles, CA",
    dateOfBirth: "1983-10-14",
    biologicalSex: "FEMALE",
    heightCm: 158,
    weightKg: 55,
    unitSystem: "IMPERIAL",
    primaryGoal: "REDUCE_INFLAMMATION",
    onboardingComplete: true,
    metabolicScore: 88,
    scoreDelta: 4,
    subscription: {
      tier: "PREMIUM",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk9Linda",
      stripeSubscriptionId: "sub_1Pk9Linda",
      currentPeriodEnd: daysAgo(-12),
      cancelAtPeriodEnd: false,
      mrr: 49,
      startedAt: daysAgo(260),
    },
    connectedIntegrations: ["oura", "apple_health", "google_fit"],
    flaggedLabsCount: 0,
    lastActivityAt: hoursAgo(8),
    avatarColor: "#059669",
  },
  {
    id: "usr_8e2f64",
    name: "Robert Klein",
    email: "rklein@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(143),
    lastLoginAt: hoursAgo(96),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (617) 555-0192",
    timezone: "America/New_York",
    location: "Boston, MA",
    dateOfBirth: "1976-01-29",
    biologicalSex: "MALE",
    heightCm: 177,
    weightKg: 95,
    unitSystem: "IMPERIAL",
    primaryGoal: "IMPROVE_ENERGY",
    onboardingComplete: true,
    metabolicScore: 47,
    scoreDelta: -4,
    subscription: {
      tier: "PRO",
      status: "TRIALING",
      stripeCustomerId: "cus_Qk10Rob",
      stripeSubscriptionId: "sub_1Pk10Rob",
      currentPeriodEnd: daysAgo(-5),
      cancelAtPeriodEnd: false,
      mrr: 0,
      startedAt: daysAgo(9),
    },
    connectedIntegrations: ["google_fit"],
    flaggedLabsCount: 7,
    lastActivityAt: hoursAgo(96),
    avatarColor: "#dc2626",
  },
  {
    id: "usr_3a5b81",
    name: "Sofia Andersson",
    email: "sofia.a@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(61),
    lastLoginAt: hoursAgo(2),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (303) 555-0147",
    timezone: "America/Denver",
    location: "Denver, CO",
    dateOfBirth: "1995-05-09",
    biologicalSex: "FEMALE",
    heightCm: 171,
    weightKg: 63,
    unitSystem: "METRIC",
    primaryGoal: "OPTIMIZE_PERFORMANCE",
    onboardingComplete: true,
    metabolicScore: 85,
    scoreDelta: 6,
    subscription: {
      tier: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk11Sofia",
      stripeSubscriptionId: "sub_1Pk11Sofia",
      currentPeriodEnd: daysAgo(-28),
      cancelAtPeriodEnd: false,
      mrr: 19,
      startedAt: daysAgo(52),
    },
    connectedIntegrations: ["oura", "apple_health"],
    flaggedLabsCount: 1,
    lastActivityAt: hoursAgo(2),
    avatarColor: "#14b8a6",
  },
  {
    id: "usr_7f8c39",
    name: "Michael Torres",
    email: "m.torres@gmail.com",
    role: "PATIENT",
    status: "deleted",
    emailVerified: true,
    createdAt: daysAgo(401),
    lastLoginAt: daysAgo(95),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (915) 555-0163",
    timezone: "America/Denver",
    location: "El Paso, TX",
    dateOfBirth: "1981-08-22",
    biologicalSex: "MALE",
    heightCm: 174,
    weightKg: 82,
    unitSystem: "IMPERIAL",
    primaryGoal: "LOSE_WEIGHT",
    onboardingComplete: true,
    metabolicScore: 58,
    scoreDelta: 0,
    subscription: {
      tier: "FREE",
      status: "CANCELED",
      stripeCustomerId: "cus_Qk12Mike",
      stripeSubscriptionId: "sub_1Pk12Mike",
      currentPeriodEnd: daysAgo(90),
      cancelAtPeriodEnd: true,
      mrr: 0,
      startedAt: daysAgo(390),
    },
    connectedIntegrations: [],
    flaggedLabsCount: 2,
    lastActivityAt: daysAgo(95),
    avatarColor: "#64748b",
  },
  {
    id: "usr_2d4e76",
    name: "Hannah Goldberg",
    email: "hannah.g@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(33),
    lastLoginAt: hoursAgo(20),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (612) 555-0129",
    timezone: "America/Chicago",
    location: "Minneapolis, MN",
    dateOfBirth: "1999-09-15",
    biologicalSex: "FEMALE",
    heightCm: 166,
    weightKg: 61,
    unitSystem: "IMPERIAL",
    primaryGoal: "UNDERSTAND_MY_LABS",
    onboardingComplete: true,
    metabolicScore: 73,
    scoreDelta: 3,
    subscription: {
      tier: "FREE",
      status: "ACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      mrr: 0,
      startedAt: daysAgo(33),
    },
    connectedIntegrations: ["apple_health"],
    flaggedLabsCount: 2,
    lastActivityAt: hoursAgo(20),
    avatarColor: "#2dd4bf",
  },
  {
    id: "usr_9c1a52",
    name: "Carlos Mendez",
    email: "carlos.mendez@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(218),
    lastLoginAt: hoursAgo(40),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (602) 555-0174",
    timezone: "America/Phoenix",
    location: "Phoenix, AZ",
    dateOfBirth: "1987-12-30",
    biologicalSex: "MALE",
    heightCm: 172,
    weightKg: 80,
    unitSystem: "IMPERIAL",
    primaryGoal: "REDUCE_INFLAMMATION",
    onboardingComplete: true,
    metabolicScore: 66,
    scoreDelta: -1,
    subscription: {
      tier: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk14Carlos",
      stripeSubscriptionId: "sub_1Pk14Carlos",
      currentPeriodEnd: daysAgo(-7),
      cancelAtPeriodEnd: false,
      mrr: 19,
      startedAt: daysAgo(200),
    },
    connectedIntegrations: ["google_fit", "apple_health"],
    flaggedLabsCount: 3,
    lastActivityAt: hoursAgo(40),
    avatarColor: "#0f766e",
  },
  {
    id: "usr_4e7b93",
    name: "Grace Liu",
    email: "grace.liu@gmail.com",
    role: "PATIENT",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(77),
    lastLoginAt: hoursAgo(5),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (408) 555-0151",
    timezone: "America/Los_Angeles",
    location: "San Jose, CA",
    dateOfBirth: "1993-06-04",
    biologicalSex: "FEMALE",
    heightCm: 162,
    weightKg: 56,
    unitSystem: "METRIC",
    primaryGoal: "IMPROVE_ENERGY",
    onboardingComplete: true,
    metabolicScore: 79,
    scoreDelta: 4,
    subscription: {
      tier: "PREMIUM",
      status: "ACTIVE",
      stripeCustomerId: "cus_Qk15Grace",
      stripeSubscriptionId: "sub_1Pk15Grace",
      currentPeriodEnd: daysAgo(-16),
      cancelAtPeriodEnd: false,
      mrr: 49,
      startedAt: daysAgo(70),
    },
    connectedIntegrations: ["oura", "apple_health"],
    flaggedLabsCount: 1,
    lastActivityAt: hoursAgo(5),
    avatarColor: "#14b8a6",
  },
  {
    id: "usr_admin01",
    name: "Dr. Alex Rivera",
    email: "alex.rivera@metaboai.com",
    role: "ADMIN",
    status: "active",
    emailVerified: true,
    createdAt: daysAgo(420),
    lastLoginAt: hoursAgo(1),
    lockedUntil: null,
    failedLoginAttempts: 0,
    phone: "+1 (415) 555-0100",
    timezone: "America/Los_Angeles",
    location: "San Francisco, CA",
    dateOfBirth: "1984-02-28",
    biologicalSex: "PREFER_NOT_TO_SAY",
    heightCm: 176,
    weightKg: 74,
    unitSystem: "METRIC",
    primaryGoal: "OPTIMIZE_PERFORMANCE",
    onboardingComplete: true,
    metabolicScore: 0,
    scoreDelta: 0,
    subscription: {
      tier: "PREMIUM",
      status: "ACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      mrr: 0,
      startedAt: daysAgo(420),
    },
    connectedIntegrations: [],
    flaggedLabsCount: 0,
    lastActivityAt: hoursAgo(1),
    avatarColor: "#0f766e",
  },
];

export function getPatient(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id);
}

export const PATIENTS_ONLY = PATIENTS.filter((p) => p.role === "PATIENT");

/* ------------------------------------------------------------------ */
/* Lab results — generated per patient                                */
/* ------------------------------------------------------------------ */

const LAB_TEMPLATES = [
  { marker: "Fasting Glucose", category: "Metabolic", unit: "mg/dL", cl: 65, ch: 99, fl: 75, fh: 86, base: 88, spread: 22 },
  { marker: "Hemoglobin A1c", category: "Metabolic", unit: "%", cl: 4.0, ch: 5.6, fl: 4.6, fh: 5.3, base: 5.3, spread: 1.0 },
  { marker: "Fasting Insulin", category: "Metabolic", unit: "uIU/mL", cl: 2.0, ch: 19.6, fl: 2.0, fh: 6.0, base: 7, spread: 9 },
  { marker: "Triglycerides", category: "Lipids", unit: "mg/dL", cl: 0, ch: 149, fl: 50, fh: 90, base: 110, spread: 90 },
  { marker: "HDL Cholesterol", category: "Lipids", unit: "mg/dL", cl: 40, ch: 100, fl: 55, fh: 90, base: 58, spread: 22 },
  { marker: "LDL Cholesterol", category: "Lipids", unit: "mg/dL", cl: 0, ch: 99, fl: 60, fh: 99, base: 108, spread: 50 },
  { marker: "hs-CRP", category: "Inflammation", unit: "mg/L", cl: 0, ch: 3.0, fl: 0, fh: 1.0, base: 1.4, spread: 2.6 },
  { marker: "Homocysteine", category: "Inflammation", unit: "umol/L", cl: 0, ch: 15, fl: 5, fh: 7, base: 8.5, spread: 6 },
  { marker: "TSH", category: "Thyroid", unit: "uIU/mL", cl: 0.45, ch: 4.5, fl: 1.0, fh: 2.0, base: 2.3, spread: 2.4 },
  { marker: "Free T3", category: "Thyroid", unit: "pg/mL", cl: 2.0, ch: 4.4, fl: 3.0, fh: 4.0, base: 3.1, spread: 1.0 },
  { marker: "Vitamin D, 25-OH", category: "Vitamins", unit: "ng/mL", cl: 30, ch: 100, fl: 50, fh: 80, base: 38, spread: 32 },
  { marker: "Ferritin", category: "Vitamins", unit: "ng/mL", cl: 15, ch: 150, fl: 50, fh: 125, base: 70, spread: 80 },
  { marker: "Vitamin B12", category: "Vitamins", unit: "pg/mL", cl: 232, ch: 1245, fl: 500, fh: 900, base: 540, spread: 400 },
  { marker: "Cortisol, AM", category: "Hormones", unit: "ug/dL", cl: 4, ch: 22, fl: 10, fh: 16, base: 14, spread: 8 },
  { marker: "Testosterone, Total", category: "Hormones", unit: "ng/dL", cl: 264, ch: 916, fl: 500, fh: 800, base: 480, spread: 320 },
];

export function labStatus(r: LabResult): LabStatus {
  if (r.value < r.conventionalLow || r.value > r.conventionalHigh)
    return "out_of_range";
  if (r.value < r.functionalLow || r.value > r.functionalHigh)
    return "suboptimal";
  return "optimal";
}

export function getLabs(patientId: string): LabResult[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "labs");
  const count = 9 + Math.floor(rng() * 7);
  return LAB_TEMPLATES.slice(0, count).map((t, i) => {
    const value = round(t.base + (rng() - 0.45) * t.spread, t.unit === "%" ? 1 : 1);
    const r: LabResult = {
      id: `${patientId}_lab_${i}`,
      marker: t.marker,
      category: t.category,
      value: Math.max(0, value),
      unit: t.unit,
      conventionalLow: t.cl,
      conventionalHigh: t.ch,
      functionalLow: t.fl,
      functionalHigh: t.fh,
      collectedDate: daysAgo(14 + Math.floor(rng() * 60)),
      flagged: false,
      source: pick(rng, ["Quest Diagnostics", "LabCorp", "Function Health", "Patient Upload"]),
    };
    r.flagged = labStatus(r) === "out_of_range";
    return r;
  });
}

/* ------------------------------------------------------------------ */
/* Sleep — last 14 nights                                             */
/* ------------------------------------------------------------------ */

export function getSleep(patientId: string): SleepData[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "sleep");
  const quality = p.metabolicScore / 100;
  return Array.from({ length: 14 }, (_, i) => {
    const total = round(5.8 + quality * 2.4 + (rng() - 0.5) * 1.2);
    const deep = round(total * (0.16 + rng() * 0.06));
    const rem = round(total * (0.2 + rng() * 0.06));
    const awake = round(0.2 + rng() * 0.5);
    const light = round(Math.max(0, total - deep - rem - awake));
    return {
      id: `${patientId}_sleep_${i}`,
      date: daysAgo(13 - i),
      totalHours: total,
      deepHours: deep,
      remHours: rem,
      lightHours: light,
      awakeHours: awake,
      hrv: Math.round(38 + quality * 45 + (rng() - 0.5) * 20),
      readiness: Math.round(55 + quality * 35 + (rng() - 0.5) * 15),
      breathingRate: round(13 + rng() * 3),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Symptoms                                                           */
/* ------------------------------------------------------------------ */

const SYMPTOM_POOL = [
  "Fatigue", "Brain fog", "Poor sleep", "Bloating", "Anxiety",
  "Joint pain", "Headaches", "Sugar cravings", "Low motivation",
  "Mood swings", "Cold hands or feet", "Digestive issues",
];

export function getSymptoms(patientId: string): SymptomLog[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "sym");
  const count = 4 + Math.floor(rng() * 6);
  return Array.from({ length: count }, (_, i) => {
    const n = 1 + Math.floor(rng() * 3);
    const symptoms = Array.from(
      new Set(Array.from({ length: n }, () => pick(rng, SYMPTOM_POOL))),
    );
    return {
      id: `${patientId}_sym_${i}`,
      date: daysAgo(Math.floor(rng() * 30)),
      symptoms,
      severity: pick(rng, ["mild", "moderate", "severe"] as const),
      notes: pick(rng, [
        "Worse in the afternoon.",
        "Better after morning walk.",
        "Noticed after high-carb dinner.",
        "Improved with more water.",
        "",
        "Flared up during a stressful work week.",
      ]),
    };
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/* ------------------------------------------------------------------ */
/* Food logs — last 4 days                                            */
/* ------------------------------------------------------------------ */

const FOODS: Record<string, { name: string; cal: number; p: number; c: number; f: number }[]> = {
  BREAKFAST: [
    { name: "Greek yogurt + berries", cal: 280, p: 22, c: 30, f: 8 },
    { name: "Veggie omelette", cal: 340, p: 24, c: 6, f: 24 },
    { name: "Overnight oats", cal: 390, p: 14, c: 58, f: 11 },
    { name: "Avocado toast + egg", cal: 420, p: 18, c: 34, f: 24 },
  ],
  LUNCH: [
    { name: "Grilled chicken salad", cal: 460, p: 42, c: 18, f: 24 },
    { name: "Salmon poke bowl", cal: 540, p: 34, c: 52, f: 20 },
    { name: "Turkey wrap", cal: 480, p: 30, c: 44, f: 18 },
    { name: "Lentil soup + bread", cal: 410, p: 20, c: 56, f: 10 },
  ],
  DINNER: [
    { name: "Steak + roasted veg", cal: 620, p: 48, c: 24, f: 36 },
    { name: "Baked cod + quinoa", cal: 510, p: 40, c: 44, f: 16 },
    { name: "Stir-fry tofu + rice", cal: 560, p: 26, c: 68, f: 18 },
    { name: "Chicken curry + rice", cal: 640, p: 38, c: 62, f: 24 },
  ],
  SNACK: [
    { name: "Apple + almond butter", cal: 210, p: 6, c: 24, f: 12 },
    { name: "Protein shake", cal: 180, p: 25, c: 8, f: 4 },
    { name: "Mixed nuts", cal: 200, p: 6, c: 8, f: 17 },
    { name: "Dark chocolate square", cal: 110, p: 2, c: 12, f: 7 },
  ],
};

export function getFood(patientId: string): FoodLog[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "food");
  const logs: FoodLog[] = [];
  for (let d = 0; d < 4; d++) {
    (["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const).forEach((meal) => {
      if (meal === "SNACK" && rng() < 0.4) return;
      const f = pick(rng, FOODS[meal]);
      logs.push({
        id: `${patientId}_food_${d}_${meal}`,
        date: daysAgo(d),
        mealType: meal,
        foodName: f.name,
        calories: f.cal,
        protein: f.p,
        carbs: f.c,
        fat: f.f,
      });
    });
  }
  return logs;
}

/* ------------------------------------------------------------------ */
/* Lifestyle logs                                                     */
/* ------------------------------------------------------------------ */

export function getLifestyle(patientId: string): LifestyleLog[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "life");
  return Array.from({ length: 7 }, (_, i) => ({
    id: `${patientId}_life_${i}`,
    date: daysAgo(6 - i),
    stressLevel: 1 + Math.floor(rng() * 5),
    waterMl: 1200 + Math.floor(rng() * 1800),
    alcoholDrinks: rng() < 0.7 ? 0 : 1 + Math.floor(rng() * 3),
    exerciseType: pick(rng, ["Walking", "Strength training", "Running", "Yoga", "Cycling", "Rest day"]),
    exerciseMinutes: Math.floor(rng() * 75),
    exerciseEffort: pick(rng, ["light", "moderate", "intense"] as const),
    supplementsTaken: ["Vitamin D", "Magnesium", "Omega-3"].filter(() => rng() < 0.6),
  }));
}

/* ------------------------------------------------------------------ */
/* Medications                                                        */
/* ------------------------------------------------------------------ */

const MED_POOL = [
  { name: "Metformin", dose: "500 mg", time: "8:00 AM", prescriber: "Dr. Patel" },
  { name: "Levothyroxine", dose: "75 mcg", time: "6:30 AM", prescriber: "Dr. Nguyen" },
  { name: "Atorvastatin", dose: "20 mg", time: "9:00 PM", prescriber: "Dr. Patel" },
  { name: "Lisinopril", dose: "10 mg", time: "8:00 AM", prescriber: "Dr. Brooks" },
  { name: "Vitamin D3", dose: "5000 IU", time: "8:00 AM", prescriber: "Self" },
  { name: "Magnesium glycinate", dose: "400 mg", time: "9:30 PM", prescriber: "Self" },
];

export function getMedications(patientId: string): Medication[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "med");
  const count = Math.floor(rng() * 4);
  return MED_POOL.slice(0, count).map((m, i) => ({
    id: `${patientId}_med_${i}`,
    ...m,
    taken: rng() < 0.6,
  }));
}

/* ------------------------------------------------------------------ */
/* Protocol                                                           */
/* ------------------------------------------------------------------ */

export function getProtocol(patientId: string): Protocol | null {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return null;
  const rng = seeded(patientId + "proto");
  const allSupps: import("./types").SupplementItem[] = [
    { name: "Vitamin D3 + K2", timing: "Morning, with fat", rationale: "25-OH vitamin D measured below the functional range of 50 ng/mL." },
    { name: "Magnesium Glycinate", timing: "Evening", rationale: "Supports sleep quality and helps regulate cortisol rhythm." },
    { name: "Omega-3 (EPA/DHA)", timing: "With meals", rationale: "hs-CRP and homocysteine indicate elevated systemic inflammation." },
    { name: "Berberine", timing: "Before carb-heavy meals", rationale: "Fasting glucose and A1c trending above optimal — supports insulin sensitivity." },
    { name: "Methylated B-Complex", timing: "Morning", rationale: "Homocysteine elevated; methylation support recommended." },
    { name: "Inositol", timing: "Morning + evening", rationale: "Supports hormone balance and ovulatory regularity." },
  ];
  const supplements = allSupps.filter(() => rng() < 0.6).slice(0, 4);
  return {
    supplements: supplements.length ? supplements : allSupps.slice(0, 2),
    dietary: [
      { title: "Front-load protein at breakfast", rationale: "Aim for 30g+ to blunt glucose variability through the morning." },
      { title: "Reduce refined carbohydrates", rationale: "Triglycerides and fasting insulin suggest carbohydrate sensitivity." },
      { title: "Add fermented foods daily", rationale: "Supports microbiome diversity and reduces reported bloating." },
    ].filter((_, i) => i < 2 + Math.floor(rng() * 2)),
    lifestyle: [
      { title: "10-minute post-meal walks", rationale: "Improves glucose disposal after the largest meals.", priority: "high" },
      { title: "Consistent sleep/wake window", rationale: "HRV trend indicates incomplete overnight recovery.", priority: "high" },
      { title: "Daily breathwork or sauna", rationale: "Down-regulates sympathetic tone; supports cortisol rhythm.", priority: "medium" },
      { title: "Strength training 3x/week", rationale: "Increases insulin-independent glucose uptake.", priority: "medium" },
    ].filter((_, i) => i < 2 + Math.floor(rng() * 3)),
    lastUpdated: daysAgo(Math.floor(rng() * 20)),
  };
}

/* ------------------------------------------------------------------ */
/* Conversations / coach chat                                         */
/* ------------------------------------------------------------------ */

export function getConversations(patientId: string): Conversation[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "chat");
  const topics = [
    {
      title: "Why is my morning glucose high?",
      msgs: [
        ["user", "My fasting glucose came back at 102. Should I be worried?"],
        ["assistant", "A fasting glucose of 102 mg/dL sits just above the conventional cutoff of 99 and well above the functional target of 86. It's not a diagnosis, but it's an early signal worth acting on. The most common driver at this level is the 'dawn phenomenon' combined with evening carbohydrate intake. A 10-minute walk after dinner and front-loading protein at breakfast are two high-leverage changes."],
        ["user", "I do tend to have pasta or rice most nights."],
        ["assistant", "That's likely a meaningful contributor. Try shifting the largest carbohydrate portion to earlier in the day and pairing evening carbs with protein, fat, and a short walk. We can re-check fasting glucose in 4-6 weeks to see the trend."],
      ],
    },
    {
      title: "Interpreting my thyroid panel",
      msgs: [
        ["user", "Can you explain my TSH and Free T3?"],
        ["assistant", "Your TSH is within the lab's normal range but in the upper functional zone, while Free T3 is toward the lower end. Together that pattern can correlate with the fatigue and cold hands you logged. It's worth a conversation with your physician about a fuller thyroid panel including Free T4 and antibodies."],
      ],
    },
    {
      title: "Sleep and HRV trends",
      msgs: [
        ["user", "My HRV has been dropping this week."],
        ["assistant", "Your 7-day HRV average is down about 12% versus your baseline, and your deep sleep is also slightly compressed. That combination usually points to accumulated stress or under-recovery. Given your logged stress levels, prioritizing a consistent wind-down routine and a fixed wake time for the next week should help it recover."],
      ],
    },
  ];
  const count = 1 + Math.floor(rng() * 3);
  return topics.slice(0, count).map((t, i) => ({
    id: `${patientId}_conv_${i}`,
    title: t.title,
    createdAt: daysAgo(2 + i * 5 + Math.floor(rng() * 4)),
    messages: t.msgs.map(([role, content], j) => ({
      id: `${patientId}_conv_${i}_msg_${j}`,
      role: role as ChatMessage["role"],
      content,
      createdAt: daysAgo(2 + i * 5),
    })),
  }));
}

/* ------------------------------------------------------------------ */
/* Documents                                                          */
/* ------------------------------------------------------------------ */

export function getDocuments(patientId: string): DocumentRecord[] {
  const p = getPatient(patientId);
  if (!p || !p.onboardingComplete) return [];
  const rng = seeded(patientId + "docs");
  const count = 1 + Math.floor(rng() * 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `${patientId}_doc_${i}`,
    docType: pick(rng, ["LAB_REPORT", "LAB_REPORT", "IMAGING", "PRESCRIPTION"] as const),
    originalFilename: pick(rng, [
      "quest_results_2026.pdf",
      "labcorp_panel.pdf",
      "annual_physical.pdf",
      "thyroid_panel_scan.jpg",
      "metabolic_panel.pdf",
    ]),
    mimeType: pick(rng, ["application/pdf", "image/jpeg"]),
    ocrStatus: pick(rng, ["COMPLETE", "COMPLETE", "COMPLETE", "PROCESSING", "FAILED"] as const),
    uploadedAt: daysAgo(Math.floor(rng() * 90)),
    sizeKb: 320 + Math.floor(rng() * 4200),
  }));
}

/* ------------------------------------------------------------------ */
/* Onboarding surveys                                                 */
/* ------------------------------------------------------------------ */

export function getOnboardingSurveys(): OnboardingSurvey[] {
  return PATIENTS_ONLY.map((p) => {
    const rng = seeded(p.id + "onb");
    const symptoms = Array.from(
      new Set(Array.from({ length: 1 + Math.floor(rng() * 4) }, () => pick(rng, SYMPTOM_POOL))),
    );
    return {
      patientId: p.id,
      dateOfBirth: p.dateOfBirth,
      biologicalSex: p.biologicalSex,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      unitSystem: p.unitSystem,
      primaryGoal: p.primaryGoal,
      symptoms,
      integrations: p.connectedIntegrations,
      labReportUploaded: p.onboardingComplete && rng() < 0.6,
      completedAt: p.onboardingComplete ? p.createdAt : null,
      startedAt: p.createdAt,
      stepReached: p.onboardingComplete ? 7 : 2 + Math.floor(rng() * 4),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Audit logs                                                         */
/* ------------------------------------------------------------------ */

const AUDIT_ACTIONS: { action: string; resourceType: string }[] = [
  { action: "LOGIN", resourceType: "session" },
  { action: "LOGIN_FAILED", resourceType: "session" },
  { action: "LOGOUT", resourceType: "session" },
  { action: "ADMIN_ACTION", resourceType: "user" },
  { action: "SUBSCRIPTION_CHANGE", resourceType: "subscription" },
  { action: "PASSWORD_RESET", resourceType: "user" },
  { action: "LAB_UPLOAD", resourceType: "document" },
  { action: "EMAIL_VERIFIED", resourceType: "user" },
  { action: "ACCOUNT_LOCKED", resourceType: "user" },
  { action: "PROTOCOL_GENERATED", resourceType: "protocol" },
];

export const AUDIT_LOGS: AuditLogEntry[] = (() => {
  const rng = seeded("audit-log-stream");
  return Array.from({ length: 48 }, (_, i) => {
    const a = pick(rng, AUDIT_ACTIONS);
    const actor = pick(rng, PATIENTS);
    const isAdmin = a.action === "ADMIN_ACTION";
    return {
      id: `audit_${1000 + i}`,
      createdAt: hoursAgo(i * 3 + rng() * 3),
      actorEmail: isAdmin ? "alex.rivera@metaboai.com" : actor.email,
      actorRole: isAdmin ? "ADMIN" : "PATIENT",
      action: a.action,
      resourceType: a.resourceType,
      resourceId: rng() < 0.8 ? actor.id : null,
      ipAddress: `${10 + Math.floor(rng() * 240)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`,
      userAgent: pick(rng, [
        "MetaboAI/1.1.0 (iPhone; iOS 18.2)",
        "MetaboAI/1.1.0 (Android 15)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ]),
      metadata: isAdmin
        ? pick(rng, ['{"field":"role"}', '{"field":"lockedUntil"}', '{"endpoint":"/users"}'])
        : "{}",
    };
  });
})();

/* ------------------------------------------------------------------ */
/* Integration catalog                                                */
/* ------------------------------------------------------------------ */

export const INTEGRATIONS: IntegrationProvider[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    category: "Health Platforms",
    description: "Syncs steps, heart rate, workouts, and sleep from HealthKit.",
    status: "available",
    connectedPatients: PATIENTS_ONLY.filter((p) => p.connectedIntegrations.includes("apple_health")).length,
    iconColor: "#0f172a",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    category: "Health Platforms",
    description: "Pulls activity, heart points, and sleep from Google Fit.",
    status: "available",
    connectedPatients: PATIENTS_ONLY.filter((p) => p.connectedIntegrations.includes("google_fit")).length,
    iconColor: "#2563eb",
  },
  {
    id: "oura",
    name: "Oura Ring",
    category: "Wearables",
    description: "Imports sleep stages, HRV, readiness, and body temperature.",
    status: "available",
    connectedPatients: PATIENTS_ONLY.filter((p) => p.connectedIntegrations.includes("oura")).length,
    iconColor: "#7c3aed",
  },
  {
    id: "whoop",
    name: "WHOOP",
    category: "Wearables",
    description: "Strain, recovery, and sleep performance metrics.",
    status: "beta",
    connectedPatients: 0,
    iconColor: "#dc2626",
  },
  {
    id: "function_health",
    name: "Function Health",
    category: "Labs",
    description: "Automatic import of comprehensive lab panels.",
    status: "beta",
    connectedPatients: 0,
    iconColor: "#0f766e",
  },
  {
    id: "quest",
    name: "Quest Diagnostics",
    category: "Labs",
    description: "Direct lab result delivery from Quest patient portal.",
    status: "coming_soon",
    connectedPatients: 0,
    iconColor: "#16a34a",
  },
  {
    id: "cronometer",
    name: "Cronometer",
    category: "Nutrition",
    description: "Detailed micronutrient and macro tracking sync.",
    status: "coming_soon",
    connectedPatients: 0,
    iconColor: "#d97706",
  },
  {
    id: "dexcom",
    name: "Dexcom CGM",
    category: "Wearables",
    description: "Continuous glucose monitoring data stream.",
    status: "beta",
    connectedPatients: 0,
    iconColor: "#059669",
  },
];

export function integrationName(id: string) {
  return INTEGRATIONS.find((i) => i.id === id)?.name ?? id;
}

/* ------------------------------------------------------------------ */
/* Analytics — derived + time series                                  */
/* ------------------------------------------------------------------ */

export function analyticsOverview() {
  const total = PATIENTS_ONLY.length;
  const active = PATIENTS_ONLY.filter((p) => p.status === "active").length;
  const paying = PATIENTS_ONLY.filter(
    (p) => p.subscription.tier !== "FREE" && p.subscription.status === "ACTIVE",
  );
  const mrr = PATIENTS_ONLY.reduce((s, p) => s + p.subscription.mrr, 0);
  const newThisWeek = PATIENTS_ONLY.filter(
    (p) => Date.now() - +new Date(p.createdAt) < 7 * 86400_000,
  ).length;
  const tierBreakdown = (["FREE", "PRO", "PREMIUM"] as const).map((tier) => ({
    tier,
    count: PATIENTS_ONLY.filter((p) => p.subscription.tier === tier).length,
  }));
  const statusBreakdown = (
    ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "INCOMPLETE"] as const
  ).map((status) => ({
    status,
    count: PATIENTS_ONLY.filter((p) => p.subscription.status === status).length,
  }));
  const avgScore = Math.round(
    PATIENTS_ONLY.filter((p) => p.onboardingComplete).reduce(
      (s, p) => s + p.metabolicScore,
      0,
    ) / PATIENTS_ONLY.filter((p) => p.onboardingComplete).length,
  );
  const flaggedLabsTotal = PATIENTS_ONLY.reduce(
    (s, p) => s + p.flaggedLabsCount,
    0,
  );
  const onboardingComplete = PATIENTS_ONLY.filter(
    (p) => p.onboardingComplete,
  ).length;
  return {
    total,
    active,
    payingCount: paying.length,
    mrr,
    arr: mrr * 12,
    newThisWeek,
    tierBreakdown,
    statusBreakdown,
    avgScore,
    flaggedLabsTotal,
    onboardingComplete,
    onboardingRate: Math.round((onboardingComplete / total) * 100),
    churnRate: 2.4,
  };
}

export function signupSeries() {
  const rng = seeded("signup-series");
  const months = [
    "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
    "Dec", "Jan", "Feb", "Mar", "Apr", "May",
  ];
  let cumulative = 180;
  return months.map((m, i) => {
    const signups = 14 + Math.floor(rng() * 26) + i * 2;
    cumulative += signups;
    return {
      month: m,
      signups,
      activeUsers: Math.round(cumulative * (0.62 + rng() * 0.12)),
      mrr: Math.round(cumulative * (8 + rng() * 6)),
    };
  });
}

export function engagementSeries() {
  const rng = seeded("engagement-series");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    labs: 8 + Math.floor(rng() * 22),
    foodLogs: 40 + Math.floor(rng() * 60),
    coachChats: 12 + Math.floor(rng() * 30),
    symptomLogs: 15 + Math.floor(rng() * 35),
  }));
}

export function scoreDistribution() {
  const buckets = [
    { range: "0-39", min: 0, max: 39, color: "var(--destructive)" },
    { range: "40-69", min: 40, max: 69, color: "var(--warning)" },
    { range: "70-100", min: 70, max: 100, color: "var(--success)" },
  ];
  return buckets.map((b) => ({
    range: b.range,
    color: b.color,
    count: PATIENTS_ONLY.filter(
      (p) =>
        p.onboardingComplete &&
        p.metabolicScore >= b.min &&
        p.metabolicScore <= b.max,
    ).length,
  }));
}

/* ------------------------------------------------------------------ */
/* Label maps                                                         */
/* ------------------------------------------------------------------ */

export const GOAL_LABELS: Record<string, string> = {
  IMPROVE_ENERGY: "Improve energy",
  LOSE_WEIGHT: "Lose weight",
  BALANCE_HORMONES: "Balance hormones",
  REDUCE_INFLAMMATION: "Reduce inflammation",
  OPTIMIZE_PERFORMANCE: "Optimize performance",
  UNDERSTAND_MY_LABS: "Understand my labs",
};

export const SEX_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  INTERSEX: "Intersex",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export function ageFromDob(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400_000));
}
