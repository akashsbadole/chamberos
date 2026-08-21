"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { LegalCase } from "@/lib/types";
import { Mic, Square, Sparkles, CheckCircle2 } from "lucide-react";

// Minimal ambient types for the Web Speech API (not in default lib.dom.d.ts)
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function detectPracticeArea(text: string): string {
  const t = text.toLowerCase();
  if (/employ|termination|wrongful/.test(t)) return "Employment";
  if (/propert|partition|tenant|lease/.test(t)) return "Property";
  if (/contract|supply|breach|vendor/.test(t)) return "Commercial";
  if (/divorce|custody|family/.test(t)) return "Family";
  if (/patent|trademark|copyright/.test(t)) return "IP & Technology";
  return "General";
}

function extractField(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim().replace(/[.,]$/, "");
  }
  return null;
}

export default function VoiceIntakePage() {
  const { addCase } = useStore();
  const { dict } = useLocale();
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<Partial<LegalCase> | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike };
    const Impl = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Impl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time feature detection of a browser API unavailable during SSR
      setSupported(false);
      return;
    }
    const recognition = new Impl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (ev: SpeechRecognitionEventLike) => {
      let finalChunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalChunk += ev.results[i][0].transcript + " ";
      }
      if (finalChunk) setTranscript((prev) => (prev + " " + finalChunk).trim());
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      recognitionRef.current.start();
      setRecording(true);
    }
  };

  const generateDraft = () => {
    const text = transcript.trim();
    if (!text) return;
    const clientName = extractField(text, [
      /client is ([^.,]+)/i,
      /client'?s? name is ([^.,]+)/i,
      /representing ([^.,]+)/i,
      /for ([A-Z][a-zA-Z& ]+?)(?: against| vs)/,
    ]);
    const opposing = extractField(text, [/(?:against|vs\.?) ([^.,]+)/i]);
    const court = extractField(text, [/at the ([^.,]+court[^.,]*)/i, /in the ([^.,]+court[^.,]*)/i]);
    const title =
      clientName && opposing
        ? `${clientName} vs. ${opposing}`
        : clientName
        ? `${clientName} — New Matter`
        : text.slice(0, 60);

    setDraft({
      title,
      practiceArea: detectPracticeArea(text),
      courtName: court ?? "To be determined",
      status: "open",
    });
  };

  const confirmCase = () => {
    if (!draft) return;
    const id = `case_${Date.now()}`;
    addCase({
      id,
      title: draft.title ?? "Untitled matter",
      clientId: "",
      practiceArea: draft.practiceArea ?? "General",
      status: "open",
      courtName: draft.courtName ?? "To be determined",
      caseNumber: "PENDING",
      nextHearing: null,
      filingDeadline: null,
      createdAt: new Date().toISOString(),
      compliance: [{ id: `c_${Date.now()}`, label: "Link client record and assign case number", dueDate: new Date().toISOString(), done: false }],
      documents: [
        {
          id: `doc_${Date.now()}`,
          name: "Voice intake transcript.txt",
          uploadedAt: new Date().toISOString(),
          content: transcript,
        },
      ],
    });
    setCreatedId(id);
  };

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.voiceIntake.eyebrow}
        title={dict.pages.voiceIntake.title}
        description={dict.pages.voiceIntake.description}
      />

      <div className="px-8 pb-16 max-w-2xl space-y-5">
        {!supported && (
          <Card className="p-4 bg-brass-50 border-brass-200 text-sm text-brass-700">
            Speech recognition isn&apos;t available in this browser. Type or paste the dictation below instead — the parsing works the same either way.
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide text-ink-400">Transcript</div>
            {supported && (
              <button
                onClick={toggleRecording}
                className={`focus-ring flex items-center gap-2 text-sm rounded-full px-4 py-1.5 transition-colors ${
                  recording ? "bg-rust-500 text-white" : "bg-ink-900 text-white hover:bg-ink-800"
                }`}
              >
                {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {recording ? "Stop" : "Record"}
              </button>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            placeholder='Try: "New client is Aarav Enterprises, filing a commercial dispute against Meridian Logistics at the Nagpur District Court."'
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2.5"
          />
          {recording && <p className="text-xs text-rust-500 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rust-500 animate-pulse" /> Listening…</p>}
          <button
            onClick={generateDraft}
            disabled={!transcript.trim()}
            className="focus-ring mt-4 w-full text-sm bg-brass-500 hover:bg-brass-600 text-white rounded-md py-2 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate case draft
          </button>
        </Card>

        {draft && !createdId && (
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Draft — review before saving</div>
            <dl className="space-y-2 text-sm mb-4">
              <div className="flex gap-2"><dt className="text-ink-400 w-28 shrink-0">Title</dt><dd className="text-ink-800">{draft.title}</dd></div>
              <div className="flex gap-2"><dt className="text-ink-400 w-28 shrink-0">Practice area</dt><dd className="text-ink-800">{draft.practiceArea}</dd></div>
              <div className="flex gap-2"><dt className="text-ink-400 w-28 shrink-0">Court</dt><dd className="text-ink-800">{draft.courtName}</dd></div>
            </dl>
            <p className="text-xs text-ink-400 mb-4">Client record isn&apos;t linked yet — you can attach one from the case page after saving.</p>
            <button onClick={confirmCase} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 hover:bg-ink-800 transition-colors">
              Save as new matter
            </button>
          </Card>
        )}

        {createdId && (
          <Card className="p-6 text-center py-10">
            <CheckCircle2 className="w-9 h-9 text-moss-500 mx-auto mb-3" />
            <p className="font-display text-lg text-ink-900 mb-1">Matter created</p>
            <p className="text-sm text-ink-500 mb-5">Open the case to link a client and assign a case number.</p>
            <button onClick={() => router.push(`/cases/${createdId}`)} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors">
              Open matter
            </button>
          </Card>
        )}
      </div>
    </Shell>
  );
}
