"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { Card, StatusBadge, RiskBadge, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { findClauses, draftClause, chatWithCase, summarizeMeeting, generateResearchQuestions, generateDocument, DOCUMENT_TEMPLATE_TYPES } from "@/lib/ai";
import { ChatMessage, CaseDocument, MeetingNote, Client, Evidence, ResearchQuestion } from "@/lib/types";
import { ArrowLeft, Upload, Sparkles, Send, CheckCircle2, Circle, Wand2, Mic, ListChecks, HelpCircle, Camera, FileSearch, Download } from "lucide-react";

type Tab = "overview" | "research" | "documents" | "evidence" | "chat" | "meetings" | "compliance";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    cases,
    clients,
    chats,
    meetingNotes,
    evidence,
    researchQuestions,
    addDocument,
    toggleCompliance,
    addComplianceItem,
    addChatMessage,
    addMeetingNote,
    addEvidence,
    addResearchQuestions,
    answerResearchQuestion,
    ready,
  } = useStore();
  const [tab, setTab] = useState<Tab>("overview");

  const legalCase = cases.find((c) => c.id === id);
  const client = clients.find((c) => c.id === legalCase?.clientId);

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;
  if (!legalCase) {
    return (
      <Shell>
        <div className="p-8">
          <EmptyState title="Case not found" description="This matter may have been removed." />
        </div>
      </Shell>
    );
  }

  const caseChats = chats.filter((m) => m.caseId === id);

  return (
    <Shell>
      <div className="px-8 pt-8 pb-4">
        <Link href="/cases" className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> All cases
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl text-ink-900 tracking-tight">{legalCase.title}</h1>
              <StatusBadge status={legalCase.status} />
            </div>
            <p className="text-sm text-ink-500 mt-1">
              {client?.name} · {legalCase.courtName} · <span className="font-mono">{legalCase.caseNumber}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 border-b border-ink-100 flex gap-1">
        {([
          ["overview", "Overview"],
          ["research", "AI Case Research"],
          ["documents", "Documents & Clause Finder"],
          ["evidence", "Evidence"],
          ["chat", "AI Chat"],
          ["meetings", "Meeting Transcription"],
          ["compliance", "Compliance & Filing"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`focus-ring px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-brass-500 text-ink-900" : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-8 py-6 pb-16">
        {tab === "overview" && <OverviewTab legalCase={legalCase} />}
        {tab === "research" && (
          <ResearchAssistantTab
            legalCase={legalCase}
            client={client}
            questions={researchQuestions.filter((q) => q.caseId === legalCase.id)}
            onGenerate={(qs) => addResearchQuestions(qs)}
            onAnswer={(id, answer) => answerResearchQuestion(id, answer)}
          />
        )}
        {tab === "evidence" && (
          <EvidenceTab
            legalCase={legalCase}
            items={evidence.filter((e) => e.caseId === legalCase.id)}
            onAdd={(item) => addEvidence(item)}
          />
        )}
        {tab === "documents" && (
          <DocumentsTab
            legalCase={legalCase}
            clientName={client?.name ?? "Counterparty"}
            onUpload={(doc) => addDocument(legalCase.id, doc)}
          />
        )}
        {tab === "chat" && (
          <ChatTab
            legalCase={legalCase}
            messages={caseChats}
            onSend={(m) => addChatMessage(m)}
          />
        )}
        {tab === "meetings" && (
          <MeetingsTab
            legalCase={legalCase}
            notes={meetingNotes.filter((m) => m.caseId === legalCase.id)}
            onSave={(note) => addMeetingNote(note)}
          />
        )}
        {tab === "compliance" && (
          <ComplianceTab
            legalCase={legalCase}
            onToggle={(itemId) => toggleCompliance(legalCase.id, itemId)}
            onAdd={(item) => addComplianceItem(legalCase.id, item)}
          />
        )}
      </div>
    </Shell>
  );
}

function OverviewTab({ legalCase }: { legalCase: ReturnType<typeof useStore>["cases"][number] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-1">Practice area</div>
        <div className="text-ink-900 font-display text-lg">{legalCase.practiceArea}</div>
      </Card>
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-1">Next hearing</div>
        <div className="text-ink-900 font-display text-lg">
          {legalCase.nextHearing ? new Date(legalCase.nextHearing).toLocaleString() : "Not scheduled"}
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-1">Filing deadline</div>
        <div className="text-ink-900 font-display text-lg">
          {legalCase.filingDeadline ? new Date(legalCase.filingDeadline).toLocaleDateString() : "None"}
        </div>
      </Card>
      <Card className="p-5 md:col-span-3">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Compliance snapshot</div>
        <ul className="space-y-2">
          {legalCase.compliance.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-moss-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-ink-300 shrink-0" />
              )}
              <span className={item.done ? "text-ink-400 line-through" : "text-ink-700"}>{item.label}</span>
              <span className="text-ink-300 ml-auto font-mono text-xs">{new Date(item.dueDate).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function DocumentsTab({
  legalCase,
  clientName,
  onUpload,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  clientName: string;
  onUpload: (doc: CaseDocument) => void;
}) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(legalCase.documents[0]?.id ?? null);
  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [draftFor, setDraftFor] = useState<string | null>(null);

  const selectedDoc = legalCase.documents.find((d) => d.id === selectedDocId) ?? null;
  const clauses = useMemo(() => (selectedDoc ? findClauses(selectedDoc.content) : []), [selectedDoc]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const doc: CaseDocument = {
        id: `doc_${Date.now()}`,
        name: file.name,
        uploadedAt: new Date().toISOString(),
        content: String(reader.result ?? ""),
      };
      onUpload(doc);
      setSelectedDocId(doc.id);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    const doc: CaseDocument = {
      id: `doc_${Date.now()}`,
      name: pasteName.trim() || "Pasted document.txt",
      uploadedAt: new Date().toISOString(),
      content: pasteText,
    };
    onUpload(doc);
    setSelectedDocId(doc.id);
    setPasteText("");
    setPasteName("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Documents</div>
          {legalCase.documents.length === 0 ? (
            <p className="text-sm text-ink-400">No documents yet.</p>
          ) : (
            <ul className="space-y-1">
              {legalCase.documents.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedDocId(d.id)}
                    className={`focus-ring w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedDocId === d.id ? "bg-brass-100 text-brass-700" : "hover:bg-ink-50 text-ink-700"
                    }`}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Add document
          </div>
          <input
            type="file"
            accept=".txt,.md"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="focus-ring block w-full text-xs text-ink-500 mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-ink-900 file:text-white file:text-xs"
          />
          <p className="text-[11px] text-ink-400 mb-2">— or paste text —</p>
          <input
            placeholder="Document name"
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-2.5 py-1.5 mb-2"
          />
          <textarea
            placeholder="Paste clause text here…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-2.5 py-1.5 mb-2"
          />
          <button
            onClick={handlePasteSubmit}
            className="focus-ring w-full text-sm bg-ink-900 text-white rounded-md py-1.5 hover:bg-ink-800 transition-colors"
          >
            Add to case
          </button>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {!selectedDoc ? (
          <EmptyState title="No document selected" description="Upload or paste a document to run the AI clause finder over it." />
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brass-500" />
                <h3 className="font-display text-lg text-ink-900">Clause finder — {selectedDoc.name}</h3>
              </div>
              {clauses.length === 0 ? (
                <p className="text-sm text-ink-400">No recognized clause patterns in this document.</p>
              ) : (
                <ul className="space-y-3">
                  {clauses.map((c) => (
                    <li key={c.type} className="border border-ink-100 rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-ink-800">{c.type}</span>
                        <RiskBadge risk={c.risk} />
                      </div>
                      <p className="text-xs text-ink-500 italic mb-1.5">&ldquo;{c.snippet}&rdquo;</p>
                      <p className="text-xs text-ink-400">{c.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-brass-500" />
                <h3 className="font-display text-lg text-ink-900">AI drafting</h3>
              </div>
              <p className="text-xs text-ink-500 mb-3">Generate first-draft clause language to insert or negotiate from.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {["Termination", "Indemnification", "Limitation of Liability", "Confidentiality", "Arbitration", "Force Majeure"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDraftFor(t)}
                    className={`focus-ring text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      draftFor === t ? "bg-ink-900 text-white border-ink-900" : "border-ink-200 text-ink-600 hover:border-brass-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {draftFor && (
                <div className="bg-ink-50 rounded-md p-4 text-sm text-ink-700 leading-relaxed font-mono">
                  {draftClause(draftFor, clientName)}
                </div>
              )}
            </Card>

            <DocumentGeneratorCard legalCase={legalCase} clientName={clientName} onSave={onUpload} />
          </>
        )}
      </div>
    </div>
  );
}

function DocumentGeneratorCard({
  legalCase,
  clientName,
  onSave,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  clientName: string;
  onSave: (doc: CaseDocument) => void;
}) {
  const [docType, setDocType] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const generate = (type: string) => {
    setDocType(type);
    setGenerated(generateDocument(type, legalCase, clientName));
  };

  const download = () => {
    if (!generated || !docType) return;
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToCase = () => {
    if (!generated || !docType) return;
    onSave({ id: `doc_gen_${Date.now()}`, name: `${docType} (generated).txt`, uploadedAt: new Date().toISOString(), content: generated });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileSearch className="w-4 h-4 text-brass-500" />
        <h3 className="font-display text-lg text-ink-900">Document generator</h3>
      </div>
      <p className="text-xs text-ink-500 mb-3">Generate a full first draft — Legal Notice, Reply, Vakalatnama, or Affidavit — filled with this matter&apos;s details.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {DOCUMENT_TEMPLATE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => generate(t)}
            className={`focus-ring text-xs px-3 py-1.5 rounded-full border transition-colors ${
              docType === t ? "bg-ink-900 text-white border-ink-900" : "border-ink-200 text-ink-600 hover:border-brass-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {generated && (
        <>
          <div className="bg-ink-50 rounded-md p-4 text-xs text-ink-700 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto mb-3">
            {generated}
          </div>
          <div className="flex gap-2">
            <button onClick={download} className="focus-ring flex-1 text-sm border border-ink-200 rounded-md py-2 hover:border-brass-300 transition-colors flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download .txt
            </button>
            <button onClick={saveToCase} className="focus-ring flex-1 bg-ink-900 text-white text-sm rounded-md py-2 hover:bg-ink-800 transition-colors">
              Save to matter
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function ChatTab({
  legalCase,
  messages,
  onSend,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  messages: ChatMessage[];
  onSend: (m: ChatMessage) => void;
}) {
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      caseId: legalCase.id,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    onSend(userMsg);
    const reply = chatWithCase(legalCase, input);
    setTimeout(() => {
      onSend({
        id: `msg_${Date.now() + 1}`,
        caseId: legalCase.id,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      });
    }, 350);
    setInput("");
  };

  return (
    <Card className="max-w-2xl p-0 overflow-hidden flex flex-col h-[560px]">
      <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brass-500" />
        <span className="text-sm font-medium text-ink-800">Chat grounded in this matter&apos;s documents</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-400">
            Ask about deadlines, hearing dates, or clauses in the uploaded documents — e.g. &ldquo;what&apos;s our liability exposure?&rdquo;
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-ink-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about this case…"
          className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2"
        />
        <button onClick={send} className="focus-ring bg-brass-500 hover:bg-brass-600 text-white rounded-md px-3.5 flex items-center justify-center transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

function MeetingsTab({
  legalCase,
  notes,
  onSave,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  notes: MeetingNote[];
  onSave: (note: MeetingNote) => void;
}) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [preview, setPreview] = useState<{ summary: string; actionItems: string[] } | null>(null);

  const generate = () => {
    if (!transcript.trim()) return;
    setPreview(summarizeMeeting(transcript));
  };

  const save = () => {
    if (!preview || !transcript.trim()) return;
    onSave({
      id: `meet_${Date.now()}`,
      caseId: legalCase.id,
      title: title.trim() || "Client meeting",
      recordedAt: new Date().toISOString(),
      transcript,
      summary: preview.summary,
      actionItems: preview.actionItems,
    });
    setTitle("");
    setTranscript("");
    setPreview(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-brass-500" />
            <h3 className="font-display text-lg text-ink-900">Log a meeting</h3>
          </div>
          <p className="text-xs text-ink-500 mb-3">
            Paste a meeting transcript (or dictate one — see the Voice Intake page for live recording) and generate an AI
            summary with action items.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title, e.g. Client status call"
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2 mb-2.5"
          />
          <textarea
            value={transcript}
            onChange={(e) => { setTranscript(e.target.value); setPreview(null); }}
            rows={8}
            placeholder="Paste the meeting transcript here…"
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2.5"
          />
          <button
            onClick={generate}
            disabled={!transcript.trim()}
            className="focus-ring mt-3 w-full text-sm bg-brass-500 hover:bg-brass-600 text-white rounded-md py-2 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Summarize
          </button>
        </Card>

        {preview && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-4 h-4 text-brass-500" />
              <h3 className="font-display text-base text-ink-900">Summary preview</h3>
            </div>
            <p className="text-sm text-ink-700 mb-3">{preview.summary || "No summary could be generated from this transcript."}</p>
            {preview.actionItems.length > 0 && (
              <>
                <div className="text-xs uppercase tracking-wide text-ink-400 mb-1.5">Action items</div>
                <ul className="space-y-1 mb-3">
                  {preview.actionItems.map((a, i) => (
                    <li key={i} className="text-sm text-ink-700 flex items-start gap-1.5">
                      <span className="text-brass-500 mt-0.5">·</span> {a}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={save} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 hover:bg-ink-800 transition-colors">
              Save to matter
            </button>
          </Card>
        )}
      </div>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Past meetings on this matter</div>
        {notes.length === 0 ? (
          <p className="text-sm text-ink-400">No meetings logged yet.</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((n) => (
              <li key={n.id} className="border border-ink-100 rounded-md p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink-800">{n.title}</span>
                  <span className="text-xs text-ink-400 font-mono">{new Date(n.recordedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-ink-600 mb-2">{n.summary}</p>
                {n.actionItems.length > 0 && (
                  <ul className="space-y-1">
                    {n.actionItems.map((a, i) => (
                      <li key={i} className="text-xs text-ink-500 flex items-start gap-1.5">
                        <span className="text-brass-500">·</span> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ResearchAssistantTab({
  legalCase,
  client,
  questions,
  onGenerate,
  onAnswer,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  client: Client | undefined;
  questions: ResearchQuestion[];
  onGenerate: (qs: ResearchQuestion[]) => void;
  onAnswer: (id: string, answer: string) => void;
}) {
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  const runResearch = () => {
    const generated = generateResearchQuestions(legalCase, client);
    onGenerate(
      generated.map((q, i) => ({
        ...q,
        id: `rq_${Date.now()}_${i}`,
        answered: false,
        answer: null,
      }))
    );
  };

  const open = questions.filter((q) => !q.answered);
  const answered = questions.filter((q) => q.answered);

  return (
    <div className="max-w-2xl space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brass-500" />
          <h3 className="font-display text-lg text-ink-900">AI case research</h3>
        </div>
        <p className="text-sm text-ink-500 mb-3">
          Reviews everything on record for this matter and flags gaps — missing court, case number, deadlines, or clauses —
          then asks you directly instead of guessing.
        </p>
        <button onClick={runResearch} className="focus-ring bg-brass-500 hover:bg-brass-600 text-white text-sm rounded-md px-4 py-2 transition-colors">
          Review this matter
        </button>
      </Card>

      {open.length > 0 && (
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Needs your input</div>
          <ul className="space-y-4">
            {open.map((q) => (
              <li key={q.id} className="border border-ink-100 rounded-md p-3.5">
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-brass-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-ink-800">{q.question}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{q.reason}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    value={answerDrafts[q.id] ?? ""}
                    onChange={(e) => setAnswerDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && answerDrafts[q.id]?.trim() && onAnswer(q.id, answerDrafts[q.id])}
                    placeholder="Your answer…"
                    className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-1.5"
                  />
                  <button
                    onClick={() => answerDrafts[q.id]?.trim() && onAnswer(q.id, answerDrafts[q.id])}
                    disabled={!answerDrafts[q.id]?.trim()}
                    className="focus-ring text-sm bg-ink-900 text-white rounded-md px-3 py-1.5 disabled:opacity-40 hover:bg-ink-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {answered.length > 0 && (
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Resolved</div>
          <ul className="space-y-2.5">
            {answered.map((q) => (
              <li key={q.id} className="text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-moss-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-ink-500">{q.question}</p>
                  <p className="text-ink-800">{q.answer}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {questions.length === 0 && (
        <EmptyState title="No review run yet" description="Click “Review this matter” to have the assistant flag anything missing." />
      )}
    </div>
  );
}

function EvidenceTab({
  legalCase,
  items,
  onAdd,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  items: Evidence[];
  onAdd: (item: Evidence) => void;
}) {
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [collectedDate, setCollectedDate] = useState("");
  const [kind, setKind] = useState<Evidence["kind"]>("document");
  const [fileNote, setFileNote] = useState("");

  const handleFile = (file: File) => {
    setFileNote(file.name);
    setKind(file.type.startsWith("image/") ? "photo" : "document");
    if (!label) setLabel(file.name);
  };

  const submit = () => {
    if (!label.trim()) return;
    onAdd({
      id: `ev_item_${Date.now()}`,
      caseId: legalCase.id,
      label,
      source,
      description,
      collectedDate: collectedDate ? new Date(collectedDate).toISOString() : new Date().toISOString(),
      addedAt: new Date().toISOString(),
      kind,
      content: fileNote ? `Attached file on record: ${fileNote}` : description,
    });
    setLabel("");
    setSource("");
    setDescription("");
    setCollectedDate("");
    setFileNote("");
    setKind("document");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-brass-500" />
          <h3 className="font-display text-lg text-ink-900">Log evidence</h3>
        </div>
        <p className="text-xs text-ink-500 mb-3">
          Record an evidence item with a chain-of-custody note. Attach a photo (use your device camera on mobile) or a
          document, or log it with a description alone.
        </p>
        <div className="space-y-2.5">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Delivery receipt dated 12 Mar" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
          <div className="grid grid-cols-2 gap-2.5">
            <select value={kind} onChange={(e) => setKind(e.target.value as Evidence["kind"])} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">
              <option value="document">Document</option>
              <option value="photo">Photo / scan</option>
              <option value="other">Other</option>
            </select>
            <input type="date" value={collectedDate} onChange={(e) => setCollectedDate(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
          </div>
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source / collected from" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description / notes" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
          <input
            type="file"
            accept="image/*,.pdf,.txt"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="focus-ring block w-full text-xs text-ink-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-ink-900 file:text-white file:text-xs"
          />
          {fileNote && <p className="text-xs text-moss-600">Attached: {fileNote}</p>}
          <button onClick={submit} disabled={!label.trim()} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 disabled:opacity-40 hover:bg-ink-800 transition-colors">
            Add to evidence log
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Evidence log ({items.length})</div>
        {items.length === 0 ? (
          <p className="text-sm text-ink-400">No evidence logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((e) => (
              <li key={e.id} className="border border-ink-100 rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-800">{e.label}</span>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-ink-50 text-ink-500 shrink-0">{e.kind}</span>
                </div>
                {e.description && <p className="text-xs text-ink-500 mb-1">{e.description}</p>}
                <p className="text-[11px] text-ink-400">
                  {e.source && <>Source: {e.source} · </>}
                  Collected {new Date(e.collectedDate).toLocaleDateString()} · Logged {new Date(e.addedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ComplianceTab({
  legalCase,
  onToggle,
  onAdd,
}: {
  legalCase: ReturnType<typeof useStore>["cases"][number];
  onToggle: (itemId: string) => void;
  onAdd: (item: { id: string; label: string; dueDate: string; done: boolean }) => void;
}) {
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState("");

  const add = () => {
    if (!label.trim() || !dueDate) return;
    onAdd({ id: `c_${Date.now()}`, label, dueDate: new Date(dueDate).toISOString(), done: false });
    setLabel("");
    setDueDate("");
  };

  const sorted = [...legalCase.compliance].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="max-w-2xl space-y-4">
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Filing compliance checklist</div>
        <ul className="space-y-2">
          {sorted.map((item) => {
            // eslint-disable-next-line react-hooks/purity -- demo checklist compares a due date to wall-clock time to flag overdue items
            const overdue = !item.done && new Date(item.dueDate).getTime() < Date.now();
            return (
              <li key={item.id} className="flex items-center gap-3 py-1.5">
                <button onClick={() => onToggle(item.id)} className="focus-ring shrink-0">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-moss-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${overdue ? "text-rust-500" : "text-ink-300"}`} />
                  )}
                </button>
                <span className={`text-sm flex-1 ${item.done ? "text-ink-400 line-through" : "text-ink-800"}`}>{item.label}</span>
                <span className={`text-xs font-mono ${overdue ? "text-rust-500 font-medium" : "text-ink-400"}`}>
                  {new Date(item.dueDate).toLocaleDateString()}
                  {overdue && " · overdue"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Add checklist item</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="e.g. File vakalatnama"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2"
          />
          <button onClick={add} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors">
            Add
          </button>
        </div>
      </Card>
    </div>
  );
}
