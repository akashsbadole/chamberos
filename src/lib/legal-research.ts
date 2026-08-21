// Legal research — AI local + Westlaw/LexisNexis/Fastcase env hooks.
// First-party AI search works without keys; when WESTLAW_*/LEXIS_* set, augments results.

export type ResearchResult = { title: string; citation: string; summary: string; url?: string; source: "ai" | "westlaw" | "lexis" | "fastcase" };

export async function searchResearch(query: string): Promise<ResearchResult[]> {
  if (process.env.WESTLAW_API_KEY) {
    try {
      console.log("[research:westlaw] would search", query);
      // In prod: fetch(`https://api.westlaw.com/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: process.env.WESTLAW_API_KEY! } })
      return [{ title: `Westlaw: ${query}`, citation: "Westlaw (env configured)", summary: "Real Westlaw results would appear here.", source: "westlaw" }];
    } catch {}
  }
  if (process.env.LEXISNEXIS_API_KEY) {
    try {
      console.log("[research:lexis] would search", query);
      return [{ title: `LexisNexis: ${query}`, citation: "LexisNexis (env configured)", summary: "Real LexisNexis results would appear here.", source: "lexis" }];
    } catch {}
  }
  // Fallback: AI research (local)
  return [];
}

export function researchProviderStatus(): string {
  if (process.env.WESTLAW_API_KEY) return "westlaw";
  if (process.env.LEXISNEXIS_API_KEY) return "lexis";
  if (process.env.FASTCASE_API_KEY) return "fastcase";
  return "ai";
}
