import { NextResponse } from "next/server";
import { sendLoginOtp, SsoRequestError } from "@/lib/sso-login";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    melliCode?: string;
    phoneNumber?: string;
  } | null;
  try {
    await sendLoginOtp(body?.melliCode ?? "", body?.phoneNumber ?? "");
    return NextResponse.json({ message: "کد تایید ارسال شد" });
  } catch (error) {
    const status = error instanceof SsoRequestError ? error.status || 400 : 500;
    const message = error instanceof Error ? error.message : "ارسال کد تایید ناموفق بود";
    return NextResponse.json({ error: message }, { status });
  }
}
