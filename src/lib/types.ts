export type ClientStatus = "intake" | "conflict_check" | "kyc" | "engagement" | "active";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  matterType: string;
  status: ClientStatus;
  conflictChecked: boolean;
  conflictFlags: string[];
  kycVerified: boolean;
  engagementSigned: boolean;
  createdAt: string;
  notes: string;
}

export type CaseStatus = "open" | "pending_filing" | "in_court" | "closed";

export interface ComplianceItem {
  id: string;
  label: string;
  dueDate: string;
  done: boolean;
}

export interface CaseDocument {
  id: string;
  name: string;
  uploadedAt: string;
  content: string;
}

export interface LegalCase {
  id: string;
  title: string;
  clientId: string;
  practiceArea: string;
  status: CaseStatus;
  courtName: string;
  caseNumber: string;
  nextHearing: string | null;
  filingDeadline: string | null;
  createdAt: string;
  compliance: ComplianceItem[];
  documents: CaseDocument[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  caseId: string | null;
  start: string;
  end: string;
  type: "hearing" | "meeting" | "deadline" | "internal";
  location: string;
}

export interface ChatMessage {
  id: string;
  caseId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CauseListEntry {
  court: string;
  caseNumber: string;
  matchedCaseId: string | null;
  date: string;
  item: string;
  status: string;
}

export interface MeetingNote {
  id: string;
  caseId: string;
  title: string;
  recordedAt: string;
  transcript: string;
  summary: string;
  actionItems: string[];
}

export interface TimeEntry {
  id: string;
  caseId: string;
  description: string;
  minutes: number;
  rate: number; // per hour, in the firm's currency
  billed: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  caseId: string | null;
  clientId: string | null;
  detail: string;
}

export interface ResearchResult {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  snippet: string;
  tags: string[];
  relevance: number;
}

export interface Evidence {
  id: string;
  caseId: string;
  label: string;
  source: string;
  description: string;
  collectedDate: string;
  addedAt: string;
  kind: "document" | "photo" | "scan" | "other";
  content: string; // extracted/attached text (OCR output, notes, or the raw text file)
}

export interface Grievance {
  id: string;
  clientId: string;
  caseId: string | null;
  subject: string;
  message: string;
  status: "open" | "acknowledged" | "resolved";
  submittedAt: string;
}

export type AIProviderId = "local" | "anthropic" | "openai" | "google";

export interface AISettings {
  provider: AIProviderId;
  apiKey: string;
  model: string;
}

export interface ResearchQuestion {
  id: string;
  caseId: string;
  question: string;
  reason: string;
  answered: boolean;
  answer: string | null;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
}
