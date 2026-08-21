import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";

function esc(s: string): string {
  return s.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
}
function toICSDate(d: string): string {
  return new Date(d).toISOString().replace(/[-:]/g,"").replace(/\.\d+Z/,"Z");
}

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const events = await query(`SELECT * FROM "CalendarEvent" WHERE "firmId"=$1 ORDER BY "start" ASC LIMIT 500`, [auth.session.firmId]) as { title:string; start:string; end:string; location?:string; description?:string; meetingLink?:string }[];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chambers//Practice OS//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${esc(e.title)}-${e.start}@chambers.local`);
    lines.push(`DTSTAMP:${toICSDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${toICSDate(e.start)}`);
    lines.push(`DTEND:${toICSDate(e.end)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    const desc = [e.description, e.meetingLink ? `Join: ${e.meetingLink}` : ""].filter(Boolean).join("\\n");
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="chambers-${auth.session.firmId}.ics"`,
    },
  });
}
