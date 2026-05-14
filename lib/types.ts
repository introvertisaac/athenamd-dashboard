export type UserRole = "PATIENT" | "ADMIN";
export type AccountStatus = "active" | "locked" | "deleted" | "pending";
export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM";
export type SubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "TRIALING"
  | "INCOMPLETE";
export type BiologicalSex = "MALE" | "FEMALE" | "INTERSEX" | "PREFER_NOT_TO_SAY";
export type UnitSystem = "METRIC" | "IMPERIAL";
export type PrimaryHealthGoal =
  | "IMPROVE_ENERGY"
  | "LOSE_WEIGHT"
  | "BALANCE_HORMONES"
  | "REDUCE_INFLAMMATION"
  | "OPTIMIZE_PERFORMANCE"
  | "UNDERSTAND_MY_LABS";
export type LabStatus = "optimal" | "suboptimal" | "out_of_range";
export type OcrStatus = "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  mrr: number;
  startedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  phone: string;
  timezone: string;
  location: string;
  dateOfBirth: string;
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  unitSystem: UnitSystem;
  primaryGoal: PrimaryHealthGoal;
  onboardingComplete: boolean;
  metabolicScore: number;
  scoreDelta: number;
  subscription: Subscription;
  connectedIntegrations: string[];
  flaggedLabsCount: number;
  lastActivityAt: string;
  avatarColor: string;
}

export interface LabResult {
  id: string;
  marker: string;
  category: string;
  value: number;
  unit: string;
  conventionalLow: number;
  conventionalHigh: number;
  functionalLow: number;
  functionalHigh: number;
  collectedDate: string;
  flagged: boolean;
  source: string;
}

export interface SymptomLog {
  id: string;
  date: string;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  notes: string;
}

export interface FoodLog {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SleepData {
  id: string;
  date: string;
  totalHours: number;
  deepHours: number;
  remHours: number;
  lightHours: number;
  awakeHours: number;
  hrv: number;
  readiness: number;
  breathingRate: number;
}

export interface LifestyleLog {
  id: string;
  date: string;
  stressLevel: number;
  waterMl: number;
  alcoholDrinks: number;
  exerciseType: string;
  exerciseMinutes: number;
  exerciseEffort: "light" | "moderate" | "intense";
  supplementsTaken: string[];
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
  prescriber: string;
}

export interface SupplementItem {
  name: string;
  timing: string;
  rationale: string;
}

export interface ProtocolItem {
  title: string;
  rationale: string;
  priority?: "high" | "medium" | "low";
}

export interface Protocol {
  supplements: SupplementItem[];
  dietary: ProtocolItem[];
  lifestyle: ProtocolItem[];
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface DocumentRecord {
  id: string;
  docType: "LAB_REPORT" | "IMAGING" | "PRESCRIPTION" | "OTHER";
  originalFilename: string;
  mimeType: string;
  ocrStatus: OcrStatus;
  uploadedAt: string;
  sizeKb: number;
}

export interface OnboardingSurvey {
  patientId: string;
  dateOfBirth: string;
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  unitSystem: UnitSystem;
  primaryGoal: PrimaryHealthGoal;
  symptoms: string[];
  integrations: string[];
  labReportUploaded: boolean;
  completedAt: string | null;
  startedAt: string;
  stepReached: number;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  category: "Wearables" | "Health Platforms" | "Labs" | "Nutrition";
  description: string;
  status: "available" | "beta" | "coming_soon";
  connectedPatients: number;
  iconColor: string;
}
