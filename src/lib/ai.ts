// Deterministic, local "AI" simulation layer.
// Everything here runs client-side with pattern-matching / templating so the
// demo works with zero external API keys. Swap these for real LLM calls
// (see README) when wiring up production inference.

import { LegalCase, CalendarEvent, Client } from "./types";

export interface DetectedClause {
  type: string;
  risk: "low" | "medium" | "high";
  snippet: string;
  note: string;
}

const CLAUSE_PATTERNS: { type: string; regex: RegExp; risk: DetectedClause["risk"]; note: string }[] = [
  {
    type: "Termination",
    regex: /Termination:[^.]*\./i,
    risk: "medium",
    note: "Confirm notice period aligns with client's operational runway.",
  },
  {
    type: "Indemnification",
    regex: /Indemnification:[^.]*\./i,
    risk: "high",
    note: "One-directional indemnity — check if mutual indemnity should be negotiated.",
  },
  {
    type: "Limitation of Liability",
    regex: /Limitation of Liability:[^.]*\./i,
    risk: "high",
    note: "Liability cap detected. Verify it excludes gross negligence / IP claims.",
  },
  {
    type: "Governing Law",
    regex: /Governing Law:[^.]*\./i,
    risk: "low",
    note: "Jurisdiction clause present — standard.",
  },
  {
    type: "Force Majeure",
    regex: /Force Majeure:[^.]*\./i,
    risk: "low",
    note: "Standard force majeure carve-out.",
  },
  {
    type: "Confidentiality",
    regex: /Confidentiality:[^.]*\./i,
    risk: "medium",
    note: "Check survival period is enforceable and mutual.",
  },
  {
    type: "Payment Terms",
    regex: /Payment Terms:[^.]*\./i,
    risk: "medium",
    note: "Late-payment interest rate should be checked against usury limits.",
  },
  {
    type: "Arbitration",
    regex: /Arbitration:[^.]*\./i,
    risk: "medium",
    note: "Arbitration seat and act cited — confirm compatibility with relief sought.",
  },
  {
    type: "Non-Compete",
    regex: /Non-Compete:[^.]*\./i,
    risk: "high",
    note: "Restraint of trade — enforceability varies significantly by jurisdiction.",
  },
];

export function findClauses(text: string): DetectedClause[] {
  const found: DetectedClause[] = [];
  for (const pattern of CLAUSE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      found.push({
        type: pattern.type,
        risk: pattern.risk,
        snippet: match[0].trim(),
        note: pattern.note,
      });
    }
  }
  return found;
}

const CLAUSE_TEMPLATES: Record<string, (party: string) => string> = {
  Termination: (party) =>
    `Termination: Either party may terminate this agreement upon thirty (30) days' prior written notice to ${party} in the event of an uncured material breach, or immediately upon insolvency of the other party.`,
  Indemnification: (party) =>
    `Indemnification: Each party shall indemnify, defend, and hold harmless ${party} and its officers from and against any third-party claims, losses, or damages arising out of the indemnifying party's breach of this agreement or negligent acts.`,
  "Limitation of Liability": (party) =>
    `Limitation of Liability: Except for breaches of confidentiality or indemnification obligations, neither party's aggregate liability to ${party} under this agreement shall exceed the total fees paid in the twelve (12) months preceding the claim.`,
  Confidentiality: (party) =>
    `Confidentiality: ${party} shall not disclose the other party's confidential information to any third party and shall use it solely for purposes of this engagement, for a period of three (3) years following termination.`,
  Arbitration: (party) =>
    `Arbitration: Any dispute arising out of or relating to this agreement that is not resolved by good-faith negotiation within thirty (30) days shall be referred to binding arbitration under the Arbitration and Conciliation Act, 1996, with the seat and venue at the city agreed by ${party} and the counterparty.`,
  "Force Majeure": (party) =>
    `Force Majeure: Neither ${party} nor the counterparty shall be liable for any failure or delay in performance resulting from causes beyond its reasonable control, including natural disaster, strike, or governmental action.`,
};

export function draftClause(type: string, party: string): string {
  const template = CLAUSE_TEMPLATES[type];
  if (!template) {
    return `${type}: [No template available yet for this clause type — draft manually or add a template in lib/ai.ts.]`;
  }
  return template(party);
}

export function chatWithCase(legalCase: LegalCase, question: string): string {
  const q = question.toLowerCase();
  const docText = legalCase.documents.map((d) => d.content).join(" ");
  const clauses = findClauses(docText);

  if (/liability|exposure|cap/.test(q)) {
    const c = clauses.find((c) => c.type === "Limitation of Liability");
    if (c) return `Per "${legalCase.documents[0]?.name ?? "the uploaded document"}": ${c.snippet} This caps exposure and should be cited alongside the indemnification clause where applicable.`;
  }
  if (/deadline|due|file|filing/.test(q)) {
    const upcoming = legalCase.compliance.filter((c) => !c.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (upcoming.length) {
      return `Nearest open compliance item: "${upcoming[0].label}" due ${new Date(upcoming[0].dueDate).toLocaleDateString()}. There ${upcoming.length === 1 ? "is" : "are"} ${upcoming.length} open item(s) total on this matter.`;
    }
    return "No open compliance items on this matter right now.";
  }
  if (/hearing|court|next/.test(q)) {
    return legalCase.nextHearing
      ? `Next hearing for ${legalCase.title} is scheduled at ${legalCase.courtName} on ${new Date(legalCase.nextHearing).toLocaleString()}.`
      : `No hearing date is currently on record for ${legalCase.title}.`;
  }
  if (/terminat/.test(q)) {
    const c = clauses.find((c) => c.type === "Termination");
    if (c) return `Termination clause on file: ${c.snippet}`;
  }
  if (/indemn/.test(q)) {
    const c = clauses.find((c) => c.type === "Indemnification");
    if (c) return `Indemnification clause on file: ${c.snippet}`;
  }
  if (clauses.length) {
    return `I found ${clauses.length} relevant clause(s) in the case documents (${clauses.map((c) => c.type).join(", ")}). Ask about a specific one — e.g. "what does the termination clause say" — or a filing deadline.`;
  }
  return `No documents are indexed for ${legalCase.title} yet. Upload a document on the Documents tab so I can ground answers in it.`;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictsWith: CalendarEvent[];
}

export function detectConflicts(
  existing: CalendarEvent[],
  candidate: { start: string; end: string; excludeId?: string }
): ConflictResult {
  const start = new Date(candidate.start).getTime();
  const end = new Date(candidate.end).getTime();
  const conflictsWith = existing.filter((e) => {
    if (candidate.excludeId && e.id === candidate.excludeId) return false;
    const eStart = new Date(e.start).getTime();
    const eEnd = new Date(e.end).getTime();
    return start < eEnd && eStart < end;
  });
  return { hasConflict: conflictsWith.length > 0, conflictsWith };
}

export interface SuggestedSlot {
  start: string;
  end: string;
}

// Suggest the next N free working-hour slots of a given duration, avoiding existing events.
export function suggestSlots(
  existing: CalendarEvent[],
  durationMinutes: number,
  count = 3,
  workingHours = { start: 9, end: 18 }
): SuggestedSlot[] {
  const slots: SuggestedSlot[] = [];
  const cursor = new Date();
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / 30) * 30, 0, 0);
  let dayOffset = 0;

  while (slots.length < count && dayOffset < 21) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + dayOffset);
    if (day.getDay() === 0 || day.getDay() === 6) {
      dayOffset++;
      continue;
    }
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (const minute of [0, 30]) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, minute, 0, 0);
        if (slotStart.getTime() < Date.now()) continue;
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        if (slotEnd.getHours() > workingHours.end || (slotEnd.getHours() === workingHours.end && slotEnd.getMinutes() > 0)) continue;
        const { hasConflict } = detectConflicts(existing, {
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
        if (!hasConflict && !slots.some((s) => s.start === slotStart.toISOString())) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }
        if (slots.length >= count) break;
      }
      if (slots.length >= count) break;
    }
    dayOffset++;
  }
  return slots;
}

export function conflictCheckClient(newClient: Pick<Client, "name">, existingClients: Client[], opposingPartyName?: string): string[] {
  const flags: string[] = [];
  const nameLower = newClient.name.toLowerCase();
  for (const c of existingClients) {
    if (c.name.toLowerCase() === nameLower) {
      flags.push(`Existing client record with the same name: "${c.name}".`);
    }
  }
  if (opposingPartyName) {
    for (const c of existingClients) {
      if (c.name.toLowerCase().includes(opposingPartyName.toLowerCase())) {
        flags.push(`Opposing party "${opposingPartyName}" matches an existing client "${c.name}" — potential conflict of interest.`);
      }
    }
  }
  return flags;
}

// --- Meeting transcription summarization -----------------------------------

const ACTION_PATTERNS = [
  /(?:^|\. )([A-Z][^.]*?\b(?:will|shall|to|needs to|must)\s+(?:send|file|draft|review|follow up|call|schedule|prepare|obtain|confirm|submit)[^.]*\.)/g,
  /(?:^|\. )(Action item[s]?:?[^.]*\.)/gi,
  /(?:^|\. )(Follow[- ]up:?[^.]*\.)/gi,
];

export function summarizeMeeting(transcript: string): { summary: string; actionItems: string[] } {
  const text = transcript.trim();
  if (!text) return { summary: "", actionItems: [] };

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ") || text.slice(0, 180);

  const actionItems = new Set<string>();
  for (const pattern of ACTION_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const cleaned = m[1]?.trim();
      if (cleaned) actionItems.add(cleaned);
    }
  }
  // Fallback: look for lines starting with a bullet-like dash
  text.split("\n").forEach((line) => {
    const t = line.trim();
    if (/^[-*]\s+/.test(t)) actionItems.add(t.replace(/^[-*]\s+/, ""));
  });

  return { summary, actionItems: Array.from(actionItems).slice(0, 8) };
}

// --- AI legal research -------------------------------------------------------

import { ResearchResult } from "./types";
import { LEGAL_CORPUS } from "./mock-data";

export function searchLegalResearch(query: string): ResearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2);

  return LEGAL_CORPUS.map((entry) => {
    const haystack = `${entry.title} ${entry.snippet} ${entry.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
      if (entry.tags.some((tag) => tag.toLowerCase() === term)) score += 2;
    }
    return { ...entry, relevance: score };
  })
    .filter((e) => e.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
}

// --- Billing ------------------------------------------------------------------

export function minutesToBillable(minutes: number, rate: number): number {
  return Math.round((minutes / 60) * rate * 100) / 100;
}

// --- Legal term glossary -------------------------------------------------

import { GlossaryTerm, ResearchQuestion } from "./types";
import { GLOSSARY } from "./mock-data";

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return GLOSSARY.filter(
    (t) => t.term.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)) || t.definition.toLowerCase().includes(q)
  );
}

// --- Full-document generation (beyond single clauses) --------------------

const DOCUMENT_TEMPLATES: Record<string, (c: LegalCase, clientName: string) => string> = {
  "Legal Notice": (c, clientName) =>
    `LEGAL NOTICE\n\nTo,\n[Opposing Party Name and Address]\n\nUnder instructions from and on behalf of my client, ${clientName || "[Client Name]"}, I hereby serve you with the following notice in connection with ${c.title}:\n\n1. My client engaged in dealings with you which are the subject matter of the above matter.\n2. Despite repeated requests, you have failed to fulfil your obligations, causing loss and inconvenience to my client.\n3. You are hereby called upon to remedy the breach and satisfy my client's claim within fifteen (15) days of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you before ${c.courtName || "the appropriate court"}, entirely at your risk as to costs and consequences.\n\nA copy of this notice is retained in my office for record and further necessary action.\n\nYours faithfully,\n[Advocate Name]\nCounsel for ${clientName || "the Client"}`,
  "Reply to Legal Notice": (c, clientName) =>
    `REPLY TO LEGAL NOTICE\n\nTo,\n[Sender's Advocate Name and Address]\n\nUnder instructions from my client, ${clientName || "[Client Name]"}, in reply to your notice dated [Date] concerning ${c.title}, I state as follows:\n\n1. The contents of your notice are denied save and except what is specifically admitted herein.\n2. My client has at all times acted in accordance with the terms agreed between the parties and denies any breach or liability as alleged.\n3. Without prejudice to the foregoing, my client remains open to an amicable resolution and invites your client to engage in good-faith discussions within fifteen (15) days.\n4. This reply is issued without prejudice to my client's rights and contentions, all of which are expressly reserved.\n\nYours faithfully,\n[Advocate Name]\nCounsel for ${clientName || "the Client"}`,
  "Vakalatnama": (c, clientName) =>
    `VAKALATNAMA\n\nIn the matter of: ${c.title}\nCase No.: ${c.caseNumber}\nBefore: ${c.courtName}\n\nI, ${clientName || "[Client Name]"}, the party above named, do hereby appoint and retain [Advocate Name], Advocate, to appear, act, and plead on my behalf in the above matter before the said Court and all courts of appeal, revision, or reference arising therefrom, and to sign, verify, file, and receive on my behalf all pleadings, applications, and other documents necessary in connection with the said matter.\n\nAccepted,\n[Advocate Name]                                    ${clientName || "[Client Name]"}\nAdvocate                                                   (Client's Signature)`,
  "Affidavit": (c, clientName) =>
    `AFFIDAVIT\n\nI, ${clientName || "[Deponent Name]"}, do hereby solemnly affirm and state as follows in connection with ${c.title}, Case No. ${c.caseNumber}, pending before ${c.courtName}:\n\n1. That I am the [party status] in the above matter and am well conversant with the facts and circumstances of the case, hence competent to depose to this affidavit.\n2. That the facts stated in the accompanying application/pleading are true and correct to the best of my knowledge, information, and belief.\n3. That no part of this affidavit is false, and nothing material has been concealed therefrom.\n\nVerified at [Place] on this [Date] that the contents of the above affidavit are true and correct to the best of my knowledge and belief.\n\nDEPONENT`,
};

export const DOCUMENT_TEMPLATE_TYPES = Object.keys(DOCUMENT_TEMPLATES);

export function generateDocument(type: string, legalCase: LegalCase, clientName: string): string {
  const template = DOCUMENT_TEMPLATES[type];
  if (!template) return `[No template available for "${type}" yet.]`;
  return template(legalCase, clientName);
}

// --- AI case-research assistant: flags missing info and drafts questions -

export function generateResearchQuestions(legalCase: LegalCase, client: Client | undefined): Omit<ResearchQuestion, "id" | "answered" | "answer">[] {
  const questions: Omit<ResearchQuestion, "id" | "answered" | "answer">[] = [];

  if (!client) {
    questions.push({
      caseId: legalCase.id,
      question: "This matter isn't linked to a client record yet — which client is it for?",
      reason: "No client is attached to this matter.",
    });
  }
  if (legalCase.caseNumber === "PENDING" || !legalCase.caseNumber) {
    questions.push({
      caseId: legalCase.id,
      question: "Has a case number / CNR been assigned yet? If so, what is it?",
      reason: "Case number is still marked as pending.",
    });
  }
  if (!legalCase.courtName || legalCase.courtName === "To be determined") {
    questions.push({
      caseId: legalCase.id,
      question: "Which court or tribunal will this matter be filed in?",
      reason: "No court is on record for this matter.",
    });
  }
  if (!legalCase.nextHearing) {
    questions.push({
      caseId: legalCase.id,
      question: "Is a hearing or filing date already fixed? If so, when?",
      reason: "No upcoming hearing date is scheduled.",
    });
  }
  if (legalCase.documents.length === 0) {
    questions.push({
      caseId: legalCase.id,
      question: "Do you have the underlying contract, notice, or petition to upload? I can run the clause finder on it once it's added.",
      reason: "No documents are attached to this matter yet.",
    });
  }
  if (legalCase.compliance.length === 0) {
    questions.push({
      caseId: legalCase.id,
      question: "What's the first filing deadline or procedural step for this matter?",
      reason: "No compliance / filing checklist items exist yet.",
    });
  }
  const docText = legalCase.documents.map((d) => d.content).join(" ");
  if (docText && !findClauses(docText).some((c) => c.type === "Governing Law")) {
    questions.push({
      caseId: legalCase.id,
      question: "The uploaded document doesn't specify a governing law / jurisdiction clause — do you know which applies?",
      reason: "No governing-law clause detected in the case documents.",
    });
  }

  return questions;
}
