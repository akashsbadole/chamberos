// Document template renderer — first-party, merges {{field}} placeholders.
// Env hook: if DOC_TEMPLATE_PROVIDER set, could swap to external template engine.
export type TemplateCategory = "contract" | "pleading" | "letter" | "other";

export function renderTemplate(body: string, data: Record<string, string>): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const v = data[key] ?? data[key.split(".").pop() ?? key] ?? "";
    return v || `{{${key}}}`;
  });
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "contract", label: "Contract" },
  { id: "pleading", label: "Pleading" },
  { id: "letter", label: "Letter" },
  { id: "other", label: "Other" },
];

export const DEFAULT_TEMPLATES: { name: string; category: TemplateCategory; body: string }[] = [
  {
    name: "Engagement Letter",
    category: "letter",
    body: `CHAMBERS — Engagement Letter

Date: {{date}}
Client: {{client.name}} ({{client.email}}, {{client.phone}})
Matter: {{case.title}} ({{case.practiceArea}})

Dear {{client.name}},

We are pleased to confirm engagement for {{case.title}}. Scope: {{matterType}}. Next steps and fee basis will be confirmed separately.

Regards,
{{firm.name}}`,
  },
  {
    name: "Vakalatnama",
    category: "pleading",
    body: `VAKALATNAMA

I, {{client.name}}, authorize {{firm.name}} to appear and act in {{case.title}} (Case No. {{case.caseNumber}}, {{case.courtName}}).

Date: {{date}}
Client signature: ___________________`,
  },
  {
    name: "Fee Agreement",
    category: "contract",
    body: `FEE AGREEMENT

Between {{firm.name}} and {{client.name}} for {{case.title}}.
Fee basis as per discussion. Retainer and billing terms per firm policy.

Date: {{date}}
Firm: {{firm.name}}
Client: {{client.name}}`,
  },
];
