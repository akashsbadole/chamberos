import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { getObject } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { key } = await params;
  const joined = (key as string[]).join("/");
  const data = await getObject(joined);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(data as unknown as BodyInit, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${joined.split("/").pop()}"` } });
}
