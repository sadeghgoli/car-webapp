import { NextResponse } from "next/server";
import { sendLoginSms } from "@/lib/sms-gateway";
import { sendLoginOtp, SsoRequestError } from "@/lib/sso-login";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    melliCode?: string;
    phoneNumber?: string;
  } | null;
  try {
    const pending = await sendLoginOtp(body?.melliCode ?? "", body?.phoneNumber ?? "");
    if (pending) {
      await sendLoginSms(pending.phoneNumber, pending.otpCode);
    }
    return NextResponse.json({ message: "کد تایید ارسال شد" });
  } catch (error) {
    const status = error instanceof SsoRequestError ? error.status || 400 : 500;
    const message = error instanceof Error ? error.message : "ارسال کد تایید ناموفق بود";
    return NextResponse.json({ error: message }, { status });
  }
}
