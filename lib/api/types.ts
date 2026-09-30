// Response/request shapes of admin-api-gateway. Enum values arrive as SCREAMING_SNAKE_CASE.

export interface ApiErrorBody {
  message?: string;
  detail?: string;
  title?: string;
  status?: number;
}

// ─── Auth & admin users ─────────────────────────────────────────────────────

export type Permission =
  | "READ_ADMIN_USER"
  | "MANAGE_ADMIN_USER"
  | "READ_ENTREPRENEUR"
  | "MANAGE_ENTREPRENEUR"
  | "READ_BUSINESS"
  | "MANAGE_BUSINESS"
  | "READ_OPPORTUNITIES"
  | "MANAGE_OPPORTUNITIES"
  | "READ_RESOURCES"
  | "MANAGE_RESOURCES"
  | "READ_BIG_IDEAS"
  | "MANAGE_BIG_IDEAS"
  | "READ_BIG_IDEA_DONATIONS"
  | "READ_PAYOUTS"
  | "MANAGE_PAYOUTS"
  | "READ_AUDIT_LOGS"
  | "FULL_ACCESS";

export type AdminUserStatus = "PENDING" | "ACTIVE" | "DISABLED" | "DELETED";

/** GET /auth/me */
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  permissions: Permission[];
  status: AdminUserStatus;
}

/** /users responses */
export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: AdminUserStatus;
  permissions: Permission[];
  loginCount: number;
  lastLoginTime: string | null;
  createTime: string;
}

export interface Session {
  accessToken: string;
  user: AdminUser;
}

/** Offset-paged responses (users, audit logs). */
export interface OffsetPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Cursor-paged responses (every gRPC-backed listing). totalCount is filled on the first page. */
export interface CursorPage<T> {
  items: T[];
  pageSize: number;
  returnedCount: number;
  totalCount: number;
  hasNextPage: boolean;
  nextPageToken: string | null;
  hasPreviousPage: boolean;
  previousPageToken: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  message: string;
  metadata: Record<string, unknown> | null;
  /** Null on entries recorded before timestamps were stored. */
  createTime: string | null;
}

// ─── Big ideas ──────────────────────────────────────────────────────────────

export type IdeaStatus = "PENDING" | "PUBLISHED" | "IN_REVIEW" | "APPROVED" | "DECLINED";

export interface Idea {
  id: string;
  trackingId: string | null;
  applicant: {
    fullName: string;
    gender: string;
    age: number;
    email: string;
    phone: string;
    location: string;
    occupation: string;
    submissionType: string;
  };
  ideaName: string;
  oneLineDescription: string;
  description: string;
  problemStatement: string;
  problemAudience: string;
  currentSolution: string;
  proposedSolution: string;
  innovationDescription: string;
  inspiration: string;
  targetCustomers: string;
  customerLocation: string;
  marketSize: string;
  competitors: string;
  competitiveAdvantage: string;
  revenueModel: string;
  productOrService: string;
  pricingStrategy: string;
  mainCosts: string;
  startupCapitalNeeded: string;
  firstYearRevenueEstimate: string;
  potentialPartners: string;
  stage: string;
  testedWithCustomers: boolean;
  testingLearnings: string;
  existingResources: string;
  challengesAndRisks: string;
  riskMitigationPlan: string;
  socialImpact: string;
  environmentalImpact: string;
  estimatedJobsCreated: string;
  growthPlan: string;
  whySelected: string;
  supportingMaterials: { id: string; type: string; url: string; uploadedAt: string }[];
  status: IdeaStatus;
  declineReason: string | null;
  createTime: string;
  updateTime: string;
}

// ─── Opportunities ──────────────────────────────────────────────────────────

export type OpportunityStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "DECLINED";

export interface Opportunity {
  id: string;
  title: string;
  categories: string[];
  categoryOther: string | null;
  description: string;
  organizationName: string;
  organizationTypes: string[];
  organizationTypeOther: string | null;
  targetBeneficiaries: string[];
  targetBeneficiaryOther: string | null;
  eligibilityCriteria: string | null;
  deadline: string;
  applicationLink: string;
  contactInfo: { email: string; phone: string; additionalContact: string | null } | null;
  geographicScope: string;
  geographicScopeOther: string | null;
  flierUrl: string | null;
  status: OpportunityStatus;
  declineReason: string | null;
  createTime: string;
  updateTime: string;
}

export interface CategoryAnalysis {
  category: string;
  opportunityCount: number;
}

// ─── Businesses ─────────────────────────────────────────────────────────────

export type BusinessStatus = "PENDING" | "IN_REVIEW" | "PAYMENT_PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";

export interface Business {
  id: string;
  trackingId: string;
  ownerId: string | null;
  businessName: string;
  businessAddress: string;
  ownerName: string;
  businessCategory: string;
  otherCategory: string | null;
  businessEntityType: string;
  businessActivities: string;
  registrationNumber: string | null;
  registerDate: string | null;
  status: BusinessStatus;
  rejectionReason: string | null;
  documentUrl: string | null;
  createTime: string;
  updateTime: string;
}

// ─── Entrepreneurs ──────────────────────────────────────────────────────────

export type EntrepreneurStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface Entrepreneur {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  pronoun: string | null;
  profilePhotoUrl: string | null;
  gender: string;
  dateOfBirth: string | null;
  nationality: string;
  district: string;
  chiefdom: string | null;
  currentLocation: string;
  contactInfo: { email: string; phoneNumber: string; whatsappNumber: string } | null;
  socialLinks: Record<string, string> | null;
  status: { status: EntrepreneurStatus; stateTime: string | null; suspensionReason: string | null } | null;
  story: { aboutMe: string; yearStarted: number; successStory: string; impact: { jobs: number; customers: number; beneficiaries: number; communities: number } | null } | null;
  skills: string[];
  education: { type: string; institution: string; qualification: string; startYear: number; endYear: number }[];
  profileScore: number;
  vetted: boolean;
  featured: boolean;
  hasReceivedFunding: boolean;
  needFunding: boolean;
  createTime: string;
  updateTime: string;
}

export interface Venture {
  id: string;
  name: string;
  type: string;
  sector: string;
  stage: string;
  problem: string;
  solution: string;
  status: string;
  jobs: number;
  customersReached: number;
}

export interface Journey {
  id: string;
  title: string;
  year: number;
  desc: string;
}

// ─── Resources ──────────────────────────────────────────────────────────────

export type ResourceStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface Folder {
  id: string;
  name: string;
  totalFiles: number;
  byteSize: number;
  createdBy: string | null;
  createTime: string;
  updateTime: string;
}

export interface Resource {
  id: string;
  title: string;
  format: string;
  type: string;
  tags: string[];
  description: string;
  fileName: string;
  mimeType: string;
  fileFormat: string;
  fileSize: number;
  thumbnailUrl: string | null;
  downloadUrl: string;
  accessLevel: string;
  featured: boolean;
  averageRating: number;
  ratingCount: number;
  bookmarkCount: number;
  uploadedBy: string | null;
  folder: Folder | null;
  status: ResourceStatus;
  rejectionReason: string | null;
  statusTime: string | null;
  createTime: string;
  updateTime: string;
}

// ─── Background batch jobs ──────────────────────────────────────────────────

export type BatchJobArea = "big-ideas" | "opportunities" | "resources";
export type BatchJobStatus = "QUEUED" | "RUNNING" | "COMPLETED";

export interface BatchJobItem {
  id: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  /** On failure, what the single delete would have returned, e.g. NOT_FOUND. */
  errorCode: string | null;
  errorMessage: string | null;
}

/** A background batch deletion - GET /api/v1/batch-jobs. */
export interface BatchJob {
  id: string;
  area: BatchJobArea;
  status: BatchJobStatus;
  total: number;
  succeeded: number;
  failed: number;
  items: BatchJobItem[];
  createTime: string;
  completedTime: string | null;
}
