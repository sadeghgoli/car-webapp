import { NextResponse } from "next/server";
import { lookupPhones, SsoRequestError } from "@/lib/sso-login";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { melliCode?: string } | null;
  try {
    const phones = await lookupPhones(body?.melliCode ?? "");
    return NextResponse.json({ phones });
  } catch (error) {
    const status = error instanceof SsoRequestError ? error.status || 400 : 500;
    const message = error instanceof Error ? error.message : "ورود با خطا مواجه شد";
    return NextResponse.json({ error: message }, { status });
  }
}
