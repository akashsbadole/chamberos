"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Client,
  LegalCase,
  CalendarEvent,
  ChatMessage,
  CaseDocument,
  ComplianceItem,
  MeetingNote,
  TimeEntry,
  AuditEvent,
  Evidence,
  Grievance,
  ResearchQuestion,
} from "./types";

interface StoreState {
  clients: Client[];
  cases: LegalCase[];
  events: CalendarEvent[];
  chats: ChatMessage[];
  meetingNotes: MeetingNote[];
  timeEntries: TimeEntry[];
  auditLog: AuditEvent[];
  evidence: Evidence[];
  grievances: Grievance[];
  researchQuestions: ResearchQuestion[];
}

interface StoreContextValue extends StoreState {
  ready: boolean;
  addClient: (c: Client) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  addCase: (c: LegalCase) => Promise<void>;
  updateCase: (id: string, patch: Partial<LegalCase>) => Promise<void>;
  removeCase: (id: string) => Promise<void>;
  addDocument: (caseId: string, doc: CaseDocument) => Promise<void>;
  removeDocument: (caseId: string, docId: string) => Promise<void>;
  toggleCompliance: (caseId: string, itemId: string) => Promise<void>;
  addComplianceItem: (caseId: string, item: ComplianceItem) => Promise<void>;
  removeComplianceItem: (id: string) => Promise<void>;
  addEvent: (e: CalendarEvent) => Promise<void>;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  addChatMessage: (m: ChatMessage) => Promise<void>;
  addMeetingNote: (m: MeetingNote) => Promise<void>;
  addTimeEntry: (t: TimeEntry) => Promise<void>;
  toggleTimeEntryBilled: (id: string) => Promise<void>;
  removeTimeEntry: (id: string) => Promise<void>;
  addEvidence: (e: Evidence) => Promise<void>;
  removeEvidence: (caseId: string, evidenceId: string) => Promise<void>;
  addGrievance: (g: Grievance) => Promise<void>;
  updateGrievanceStatus: (id: string, status: Grievance["status"]) => Promise<void>;
  removeGrievance: (id: string) => Promise<void>;
  addResearchQuestions: (qs: ResearchQuestion[]) => Promise<void>;
  answerResearchQuestion: (id: string, answer: string) => Promise<void>;
  removeResearchQuestion: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const EMPTY_STATE: StoreState = {
  clients: [],
  cases: [],
  events: [],
  chats: [],
  meetingNotes: [],
  timeEntries: [],
  auditLog: [],
  evidence: [],
  grievances: [],
  researchQuestions: [],
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api<StoreState>("/api/bootstrap");
      setState(data);
    } catch {
      // Unauthenticated — login page will handle the redirect.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Every mutation calls the API, then refetches the whole bootstrap so the
  // UI reflects exactly what's in Postgres (including anything the audit
  // log or nested inserts changed) rather than hand-maintaining an
  // optimistic local merge that could drift from the server's truth.
  const addClient = useCallback(async (c: Client) => {
    await api("/api/clients", { method: "POST", body: JSON.stringify(c) });
    await refresh();
  }, [refresh]);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    await api(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await refresh();
  }, [refresh]);

  const removeClient = useCallback(async (id: string) => {
    await api(`/api/clients/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addCase = useCallback(async (c: LegalCase) => {
    await api("/api/cases", { method: "POST", body: JSON.stringify(c) });
    await refresh();
  }, [refresh]);

  const updateCase = useCallback(async (id: string, patch: Partial<LegalCase>) => {
    await api(`/api/cases/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await refresh();
  }, [refresh]);

  const removeCase = useCallback(async (id: string) => {
    await api(`/api/cases/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addDocument = useCallback(async (caseId: string, doc: CaseDocument) => {
    await api(`/api/cases/${caseId}/documents`, { method: "POST", body: JSON.stringify(doc) });
    await refresh();
  }, [refresh]);

  const removeDocument = useCallback(async (caseId: string, docId: string) => {
    await api(`/api/cases/${caseId}/documents/${docId}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const toggleCompliance = useCallback(async (_caseId: string, itemId: string) => {
    await api(`/api/compliance/${itemId}`, { method: "PATCH" });
    await refresh();
  }, [refresh]);

  const addComplianceItem = useCallback(async (caseId: string, item: ComplianceItem) => {
    await api(`/api/cases/${caseId}/compliance`, { method: "POST", body: JSON.stringify(item) });
    await refresh();
  }, [refresh]);

  const removeComplianceItem = useCallback(async (id: string) => {
    await api(`/api/compliance/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addEvent = useCallback(async (e: CalendarEvent) => {
    await api("/api/events", { method: "POST", body: JSON.stringify(e) });
    await refresh();
  }, [refresh]);

  const updateEvent = useCallback(async (id: string, patch: Partial<CalendarEvent>) => {
    await api(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await refresh();
  }, [refresh]);

  const removeEvent = useCallback(async (id: string) => {
    await api(`/api/events/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addChatMessage = useCallback(async (m: ChatMessage) => {
    await api(`/api/cases/${m.caseId}/chat`, { method: "POST", body: JSON.stringify(m) });
    await refresh();
  }, [refresh]);

  const addMeetingNote = useCallback(async (m: MeetingNote) => {
    await api(`/api/cases/${m.caseId}/meetings`, { method: "POST", body: JSON.stringify(m) });
    await refresh();
  }, [refresh]);

  const addTimeEntry = useCallback(async (t: TimeEntry) => {
    await api("/api/time-entries", { method: "POST", body: JSON.stringify(t) });
    await refresh();
  }, [refresh]);

  const toggleTimeEntryBilled = useCallback(async (id: string) => {
    await api(`/api/time-entries/${id}`, { method: "PATCH" });
    await refresh();
  }, [refresh]);

  const removeTimeEntry = useCallback(async (id: string) => {
    await api(`/api/time-entries/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addEvidence = useCallback(async (e: Evidence) => {
    await api(`/api/cases/${e.caseId}/evidence`, { method: "POST", body: JSON.stringify(e) });
    await refresh();
  }, [refresh]);

  const removeEvidence = useCallback(async (caseId: string, evidenceId: string) => {
    await api(`/api/cases/${caseId}/evidence/${evidenceId}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addGrievance = useCallback(async (g: Grievance) => {
    await api("/api/grievances", { method: "POST", body: JSON.stringify(g) });
    await refresh();
  }, [refresh]);

  const updateGrievanceStatus = useCallback(async (id: string, status: Grievance["status"]) => {
    await api(`/api/grievances/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await refresh();
  }, [refresh]);

  const removeGrievance = useCallback(async (id: string) => {
    await api(`/api/grievances/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const addResearchQuestions = useCallback(async (qs: ResearchQuestion[]) => {
    if (qs.length === 0) return;
    await api(`/api/cases/${qs[0].caseId}/research-questions`, { method: "POST", body: JSON.stringify({ questions: qs }) });
    await refresh();
  }, [refresh]);

  const answerResearchQuestion = useCallback(async (id: string, answer: string) => {
    await api(`/api/research-questions/${id}`, { method: "PATCH", body: JSON.stringify({ answer }) });
    await refresh();
  }, [refresh]);

  const removeResearchQuestion = useCallback(async (id: string) => {
    await api(`/api/research-questions/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  return (
    <StoreContext.Provider
      value={{
        ...state,
        ready,
        addClient,
        updateClient,
        removeClient,
        addCase,
        updateCase,
        removeCase,
        addDocument,
        removeDocument,
        toggleCompliance,
        addComplianceItem,
        removeComplianceItem,
        addEvent,
        updateEvent,
        removeEvent,
        addChatMessage,
        addMeetingNote,
        addTimeEntry,
        toggleTimeEntryBilled,
        removeTimeEntry,
        addEvidence,
        removeEvidence,
        addGrievance,
        updateGrievanceStatus,
        removeGrievance,
        addResearchQuestions,
        answerResearchQuestion,
        removeResearchQuestion,
        refresh,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
