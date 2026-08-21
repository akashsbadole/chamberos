// Court integrations — PACER, CM/ECF, eCourts (India). First-party simulated + env hooks.
// Each provider is lazy and falls back to simulated matcher when env not set.

export async function fetchCauseList(firmId: string): Promise<{ source: string; entries: unknown[] }> {
  const url = process.env.ECOURTS_API_URL;
  if (url) {
    try {
      const r = await fetch(`${url}/cause-list?firmId=${firmId}`, { headers: { Authorization: `Bearer ${process.env.ECOURTS_API_TOKEN ?? ""}` } });
      if (r.ok) return { source: "ecourts", entries: await r.json() };
    } catch (e) { console.error("[court] eCourts fetch failed", e); }
  }
  if (process.env.PACER_USER) {
    try {
      console.log("[court:pacer] would fetch PACER for firm", firmId);
      // In prod: call PACER API via `pacer` lib or direct fetch to https://pacer.uscourts.gov
      return { source: "pacer-simulated", entries: [] };
    } catch {}
  }
  // Fallback simulated — matches src/app/api/court-sync/route.ts
  return { source: "simulated", entries: [] };
}

export function pacerEnabled(): boolean { return !!process.env.PACER_USER; }
export function cmecfEnabled(): boolean { return !!process.env.CMECF_URL; }
