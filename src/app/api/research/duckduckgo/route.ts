import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";

// DuckDuckGo law search proxy — first-party API that merges DDG results with local corpus.
// No API key needed (DDG Instant Answer is free). Env DDG_LAW_PREFIX biases to Indian law.
export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [], source: "none" });
  const prefix = process.env.DDG_LAW_PREFIX || "Indian law";
  const query = `${prefix} ${q}`;
  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  try {
    const res = await fetch(ddgUrl, {
      headers: { "User-Agent": "Chambers-Practice-OS/1.0", Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`DDG ${res.status}`);
    const data = await res.json() as {
      AbstractText?: string; AbstractURL?: string; AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string } | { Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };

    const results: { id: string; title: string; citation: string; court: string; year: number; snippet: string; tags: string[]; relevance: number; url?: string; source: "duckduckgo" }[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({
        id: `ddg_abs_${Date.now()}`,
        title: data.AbstractText.slice(0, 90),
        citation: data.AbstractURL,
        court: data.AbstractSource || "DuckDuckGo",
        year: new Date().getFullYear(),
        snippet: data.AbstractText.slice(0, 400),
        tags: [q],
        relevance: 0.95,
        url: data.AbstractURL,
        source: "duckduckgo",
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const t of data.RelatedTopics) {
        // RelatedTopics can be flat or grouped under Name/Topics
        if ((t as { Topics?: unknown[] }).Topics) {
          const g = t as { Topics: { Text?: string; FirstURL?: string }[] };
          for (const sub of g.Topics.slice(0, 3)) {
            if (sub.Text && sub.FirstURL) {
              results.push({
                id: `ddg_rel_${Math.random().toString(36).slice(2,8)}`,
                title: sub.Text.split(" - ")[0]?.slice(0, 90) || sub.Text.slice(0, 90),
                citation: sub.FirstURL,
                court: "DuckDuckGo Related",
                year: new Date().getFullYear(),
                snippet: sub.Text.slice(0, 300),
                tags: [q],
                relevance: 0.8,
                url: sub.FirstURL,
                source: "duckduckgo",
              });
            }
          }
        } else {
          const f = t as { Text?: string; FirstURL?: string };
          if (f.Text && f.FirstURL) {
            results.push({
              id: `ddg_rel_${Math.random().toString(36).slice(2,8)}`,
              title: f.Text.split(" - ")[0]?.slice(0, 90) || f.Text.slice(0, 90),
              citation: f.FirstURL,
              court: "DuckDuckGo",
              year: new Date().getFullYear(),
              snippet: f.Text.slice(0, 300),
              tags: [q],
              relevance: 0.75,
              url: f.FirstURL,
              source: "duckduckgo",
            });
          }
        }
        if (results.length >= 5) break;
      }
    }

    // If DDG returned nothing useful, at least return a searchable link fallback so UI is never empty
    if (results.length === 0) {
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      results.push({
        id: `ddg_fallback_${Date.now()}`,
        title: `Search DuckDuckGo for "${q}"`,
        citation: searchUrl,
        court: "DuckDuckGo Search",
        year: new Date().getFullYear(),
        snippet: `No Instant Answer for "${q}". Open DuckDuckGo to see law-related results for Indian law. The local corpus (below) still provides Indian case law.`,
        tags: [q],
        relevance: 0.5,
        url: searchUrl,
        source: "duckduckgo",
      });
    }

    return NextResponse.json({ results: results.slice(0, 6), source: "duckduckgo", query: q });
  } catch (e) {
    console.error("[research:ddg] fetch failed", e);
    // Fallback to empty — caller will merge local corpus
    return NextResponse.json({ results: [], source: "duckduckgo-error", error: e instanceof Error ? e.message : "fetch failed", query: q });
  }
}
