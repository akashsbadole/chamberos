"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { conflictCheckClient } from "@/lib/ai";
import { Client } from "@/lib/types";
import { CheckCircle2, ShieldAlert, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const STEPS = ["Basic details", "Conflict check", "KYC", "Engagement letter", "Done"];

export default function OnboardingPage() {
  const { clients, addClient } = useStore();
  const { dict } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matterType, setMatterType] = useState("Commercial Contract");
  const [opposingParty, setOpposingParty] = useState("");
  const [conflictFlags, setConflictFlags] = useState<string[] | null>(null);
  const [kycDocName, setKycDocName] = useState<string | null>(null);
  const [engagementSigned, setEngagementSigned] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const runConflictCheck = () => {
    const flags = conflictCheckClient({ name }, clients, opposingParty || undefined);
    setConflictFlags(flags);
  };

  const finish = () => {
    const id = `cl_${Date.now()}`;
    const client: Client = {
      id,
      name,
      email,
      phone,
      matterType,
      status: engagementSigned ? "active" : "engagement",
      conflictChecked: true,
      conflictFlags: conflictFlags ?? [],
      kycVerified: !!kycDocName,
      engagementSigned,
      createdAt: new Date().toISOString(),
      notes: opposingParty ? `Opposing party on record: ${opposingParty}` : "",
    };
    addClient(client);
    setCreatedId(id);
    setStep(4);
  };

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.onboarding.eyebrow}
        title={dict.pages.onboarding.title}
        description={dict.pages.onboarding.description}
      />

      <div className="px-8 pb-16 max-w-2xl">
        <ol className="flex items-center gap-2 mb-8 text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${i > 0 ? "flex-1" : ""}`}>
              {i > 0 && <div className={`h-px flex-1 ${i <= step ? "bg-brass-400" : "bg-ink-200"}`} />}
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono ${
                  i < step ? "bg-brass-500 text-white" : i === step ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg text-ink-900">Basic details</h2>
            <Field label="Client / entity name">
              <input value={name} onChange={(e) => setName(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" placeholder="e.g. Aarav Enterprises" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" placeholder="name@example.com" />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" placeholder="+91 …" />
              </Field>
            </div>
            <Field label="Matter type">
              <select value={matterType} onChange={(e) => setMatterType(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2">
                {["Commercial Contract", "Property Dispute", "Employment", "Family", "Criminal Defense", "IP & Technology"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end pt-2">
              <button disabled={!name || !email} onClick={() => setStep(1)} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40 flex items-center gap-1.5 hover:bg-ink-800 transition-colors">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brass-500" />
              <h2 className="font-display text-lg text-ink-900">AI conflict check</h2>
            </div>
            <p className="text-sm text-ink-500">
              Checks the new client and any named opposing party against existing client records for name matches or prior adverse representation.
            </p>
            <Field label="Opposing party (if known)">
              <input value={opposingParty} onChange={(e) => setOpposingParty(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" placeholder="e.g. Kalyan Dyeworks" />
            </Field>
            <button onClick={runConflictCheck} className="focus-ring text-sm bg-brass-500 hover:bg-brass-600 text-white rounded-md px-4 py-2 transition-colors">
              Run conflict check
            </button>
            {conflictFlags !== null && (
              <div className={`rounded-md p-4 text-sm flex items-start gap-2.5 ${conflictFlags.length ? "bg-rust-500/10 text-rust-700" : "bg-moss-500/10 text-moss-700"}`}>
                {conflictFlags.length ? <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> : <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />}
                <div>
                  {conflictFlags.length === 0 ? (
                    "No conflicts detected against existing client records."
                  ) : (
                    <ul className="space-y-1">
                      {conflictFlags.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(0)} className="focus-ring text-sm text-ink-500 px-4 py-2">Back</button>
              <button disabled={conflictFlags === null} onClick={() => setStep(2)} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40 flex items-center gap-1.5 hover:bg-ink-800 transition-colors">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg text-ink-900">KYC verification</h2>
            <p className="text-sm text-ink-500">Upload an identity or incorporation document. In production this routes to a verification provider; here it&apos;s recorded on file.</p>
            <input
              type="file"
              onChange={(e) => setKycDocName(e.target.files?.[0]?.name ?? null)}
              className="focus-ring block w-full text-xs text-ink-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-ink-900 file:text-white file:text-xs"
            />
            {kycDocName && (
              <div className="text-sm text-moss-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {kycDocName} recorded
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="focus-ring text-sm text-ink-500 px-4 py-2">Back</button>
              <button onClick={() => setStep(3)} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 flex items-center gap-1.5 hover:bg-ink-800 transition-colors">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg text-ink-900">Engagement letter</h2>
            <div className="bg-ink-50 rounded-md p-4 text-xs text-ink-600 leading-relaxed max-h-40 overflow-y-auto">
              This Engagement Letter confirms the retention of the Firm by {name || "the Client"} for matters relating to {matterType}.
              Fees are billed per the Firm&apos;s standard schedule. The Client authorizes the Firm to represent its interests in connection
              with this matter, including all associated filings and correspondence. This letter is governed by the laws of India.
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={engagementSigned} onChange={(e) => setEngagementSigned(e.target.checked)} className="focus-ring" />
              Client has signed the engagement letter
            </label>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="focus-ring text-sm text-ink-500 px-4 py-2">Back</button>
              <button onClick={finish} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 flex items-center gap-1.5 hover:bg-ink-800 transition-colors">
                Complete onboarding <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        )}

        {step === 4 && createdId && (
          <Card className="p-6 text-center py-10">
            <CheckCircle2 className="w-10 h-10 text-moss-500 mx-auto mb-3" />
            <h2 className="font-display text-xl text-ink-900 mb-1">{name} is onboarded</h2>
            <p className="text-sm text-ink-500 mb-6">Client record created. You can open a matter for them now.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => router.push("/clients")} className="focus-ring text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-brass-300 transition-colors">
                View clients
              </button>
              <button onClick={() => router.push("/cases")} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors">
                Go to cases
              </button>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
