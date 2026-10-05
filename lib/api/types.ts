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

/** DRAFT: created by an entrepreneur and not yet submitted - only they can publish it. */
export type OpportunityStatus = "DRAFT" | "PENDING" | "IN_REVIEW" | "APPROVED" | "DECLINED";

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

// ─── Competitions ───────────────────────────────────────────────────────────
export type CompetitionState = "DRAFT" | "PUBLISHED" | "SHORTLISTING" | "PITCH_VIDEO" | "FINALS" | "COMPLETED" | "CANCELLED";
export type ApplicationState =
  | "DRAFT" | "SUBMITTED" | "SHORTLISTED" | "NOT_SHORTLISTED" | "FINALIST" | "NOT_ADVANCED" | "WINNER" | "WITHDRAWN";
export type QuestionType = "SHORT_TEXT" | "LONG_TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO";

export interface CompetitionCriterion { id: string; name: string; description: string | null; weight: number }
export interface CompetitionQuestion {
  id: string; prompt: string; helpText: string | null; type: QuestionType; options: string[]; required: boolean;
}
export interface CompetitionFinalPitch {
  format: "PHYSICAL" | "VIRTUAL" | null; venue: string | null; meetingLink: string | null; scheduledAt: string | null;
}
export interface CompetitionPrize { rank: number; title: string; description: string | null }
export interface CompetitionStats { submitted: number; shortlisted: number; pitchVideos: number; finalists: number; winners: number }

export interface Competition {
  id: string;
  title: string;
  tagline: string | null;
  description: string;
  eligibilityRequirements: string;
  eligibleIdeaStages: string[];
  applicationOpensAt: string;
  applicationClosesAt: string;
  pitchVideoDeadline: string;
  totalFinalists: number;
  evaluationCriteria: CompetitionCriterion[];
  questions: CompetitionQuestion[];
  finalPitch: CompetitionFinalPitch | null;
  prizes: CompetitionPrize[];
  state: CompetitionState;
  cancelReason: string | null;
  stateTime: string | null;
  stats: CompetitionStats;
  pitchVideosPurged: boolean;
  createdBy: string;
  createTime: string;
  updateTime: string;
}

/** Body for creating or replacing a competition. Keep criterion/question ids to keep scores and answers attached. */
export interface CompetitionInput {
  title: string;
  tagline?: string;
  description: string;
  eligibilityRequirements: string;
  eligibleIdeaStages: string[];
  applicationOpensAt: string;
  applicationClosesAt: string;
  pitchVideoDeadline: string;
  totalFinalists: number;
  evaluationCriteria: { id?: string; name: string; description?: string; weight: number }[];
  questions: { id?: string; prompt: string; helpText?: string; type: QuestionType; options: string[]; required: boolean }[];
  finalPitch?: { format?: string; venue?: string; meetingLink?: string; scheduledAt?: string } | null;
  prizes: { rank: number; title: string; description?: string }[];
}

export interface StoredFile { id: string; fileName: string; contentType: string | null; size: number; uploadedAt: string | null }
export interface IdeaSnapshot {
  ideaName: string; oneLineDescription: string | null; stage: string | null; applicantName: string | null; applicantLocation: string | null;
}
export interface ScoreSheet {
  stage: "SHORTLISTING" | "PITCH_VIDEO" | "FINAL";
  scorerId: string;
  scorerName: string | null;
  scores: Record<string, number>;
  total: number;
  note: string | null;
  updateTime: string | null;
}

export interface CompetitionApplication {
  id: string;
  competitionId: string;
  ownerId: string;
  ideaId: string;
  idea: IdeaSnapshot;
  potentialStatement: string | null;
  expectedImpact: string | null;
  supportNeeded: string | null;
  answers: { questionId: string; text: string | null; choices: string[] }[];
  pitchDeck: StoredFile | null;
  pitchVideo: { link: string | null; file: StoredFile | null; submittedAt: string | null; filePurged: boolean } | null;
  state: ApplicationState;
  stateTime: string | null;
  pendingDecision: "ADVANCE" | "REJECT" | null;
  decisionNote: string | null;
  winnerRank: number | null;
  scoreSheets: ScoreSheet[];
  shortlistingScore: number | null;
  pitchVideoScore: number | null;
  finalScore: number | null;
  submitTime: string | null;
  createTime: string;
  updateTime: string;
}

export interface CompetitionEntrant { applicationId: string; ideaId: string; idea: IdeaSnapshot; state: ApplicationState; winnerRank: number | null }
export interface CompetitionEntrants { shortlisted: CompetitionEntrant[]; finalists: CompetitionEntrant[]; winners: CompetitionEntrant[] }
export interface CompetitionEvent { id: string; applicationId: string | null; actorId: string; action: string; detail: string | null; createTime: string }
