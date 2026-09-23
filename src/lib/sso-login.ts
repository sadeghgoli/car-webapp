import http from "node:http";
import https from "node:https";
import { CATEGORIES } from "@/lib/mock-data";
import type { AuthUser } from "@/types";

const SSO_API_URL = (
  process.env.SSO_API_URL ?? "https://apiweb-loginsso.sabzevar.ir"
).replace(/\/$/, "");

const SSO_WEB_URL = (
  process.env.SSO_WEB_URL ?? "https://auth.sabzevar.ir"
).replace(/\/$/, "");

const ALLOWED_MELLI_CODES = new Set(["0781123641","0794872786", "0795032307"]);

export type PhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
  errors?: unknown;
};

export class SsoRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SsoRequestError";
    this.status = status;
  }
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

export function assertAllowedMelli(melliCode: string): string {
  const normalized = normalizeDigits(melliCode);
  if (normalized.length !== 10) {
    throw new SsoRequestError(400, "کد ملی باید ۱۰ رقم باشد");
  }
  if (!ALLOWED_MELLI_CODES.has(normalized)) {
    throw new SsoRequestError(403, "این کد ملی مجاز به ورود نیست");
  }
  return normalized;
}

function normalizePhoneOption(raw: Record<string, unknown>): PhoneOption | null {
  const phoneNumber = String(
    raw.phoneNumber ??
      raw.value ??
      raw.mobile ??
      raw.maskedPhoneNumber ??
      raw.display ??
      "",
  ).trim();
  if (!phoneNumber) return null;
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id ?? 0) || 0;
  return {
    id,
    phoneNumber: normalizeDigits(phoneNumber) || phoneNumber,
    isPrimary: Boolean(raw.isPrimary),
  };
}

function extractPhones(data: unknown): PhoneOption[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of ["phones", "phoneNumbers", "mobileNumbers", "mobiles"]) {
    const arr = record[key];
    if (!Array.isArray(arr)) continue;
    const mapped = arr
      .map((item) =>
        typeof item === "string"
          ? ({ id: 0, phoneNumber: item, isPrimary: false } satisfies PhoneOption)
          : normalizePhoneOption(item as Record<string, unknown>),
      )
      .filter((item): item is PhoneOption => item != null && !!item.phoneNumber);
    if (mapped.length > 0) return mapped;
  }
  return [];
}

async function ssoFetch<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new SsoRequestError(0, "خطا در ارتباط با سرویس احراز هویت");
  }

  const text = await response.text();
  let envelope: ApiEnvelope<T> = { success: response.ok };
  if (text) {
    try {
      envelope = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new SsoRequestError(response.status, "پاسخ نامعتبر از سرویس احراز هویت");
    }
  }

  if (!response.ok || envelope.success === false) {
    const detail =
      envelope.message?.trim() ||
      (typeof envelope.errors === "string" ? envelope.errors : "") ||
      "خطا در سرویس احراز هویت";
    throw new SsoRequestError(response.status || 400, detail);
  }

  return envelope;
}

export async function lookupPhones(melliCode: string): Promise<PhoneOption[]> {
  const normalized = assertAllowedMelli(melliCode);
  const envelope = await ssoFetch<Record<string, unknown>>(
    SSO_API_URL,
    "/api/auth/second-login",
    { melliCode: normalized },
  );
  const phones = extractPhones(envelope.data);
  if (phones.length === 0) {
    throw new SsoRequestError(
      404,
      envelope.message?.trim() || "شماره تلفنی برای این کد ملی یافت نشد",
    );
  }
  return phones;
}

export async function sendLoginOtp(
  melliCode: string,
  phoneNumber: string,
): Promise<void> {
  const normalizedMelli = assertAllowedMelli(melliCode);
  const normalizedPhone = normalizeDigits(phoneNumber);
  if (normalizedPhone.length < 10) {
    throw new SsoRequestError(400, "شماره تلفن نامعتبر است");
  }

  try {
    await ssoFetch(
      SSO_WEB_URL,
      "/api/citizen/send-login-otp",
      { phoneNumber: normalizedPhone, melliCode: normalizedMelli },
    );
    return;
  } catch (error) {
    if (!(error instanceof SsoRequestError) || error.status !== 0) {
      throw error;
    }
  }

  // auth.sabzevar.ir is unreachable from this host (TLS handshake fails).
  // Register the code on the login API, then send the same SMS the portal sends.
  const otpCode = String(Math.floor(Math.random() * 100_000)).padStart(5, "0");
  await ssoFetch(SSO_API_URL, "/api/auth/second-login/send-otp", {
    phoneNumber: normalizedPhone,
    melliCode: normalizedMelli,
    otpCode,
  });
  await sendLoginSms(normalizedPhone, otpCode);
}

const SMS_TOKEN =
  process.env.SMS_TOKEN ?? "817CC3144B1C489A8860C8F093DC51AB";

function sendLoginSms(phoneNumber: string, otpCode: string): Promise<void> {
  const body = `کد ورود : ${otpCode}\nمدیریت فناوری اطلاعات شهرداری سبزوار`;
  const targets: Array<{ url: string; host?: string }> = [];
  if (process.env.SMS_SEND_URL) {
    targets.push({ url: process.env.SMS_SEND_URL, host: process.env.SMS_HOST });
  }
  targets.push(
    {
      url: "http://192.168.1.30/SubSystems/SMS/webservices/sms_send.aspx",
      host: "erp.sabzevar.ir",
    },
    {
      url: "http://erp.sabzevar.ir/SubSystems/SMS/webservices/sms_send.aspx",
    },
  );

  return (async () => {
    let lastError = "خطا در اتصال به سرویس پیامک";
    for (const target of targets) {
      try {
        await requestSmsGateway(target.url, phoneNumber, body, target.host);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError;
      }
    }
    throw new SsoRequestError(502, lastError);
  })();
}

function requestSmsGateway(
  sendUrl: string,
  phoneNumber: string,
  body: string,
  hostHeader?: string,
): Promise<void> {
  const url = new URL(sendUrl);
  url.searchParams.set("Token", SMS_TOKEN);
  url.searchParams.set("Num", phoneNumber);
  url.searchParams.set("Body", body);
  const lib = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: SsoRequestError) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve();
    };

    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: hostHeader ? { Host: hostHeader } : undefined,
        timeout: 20_000,
      },
      (response) => {
        response.resume();
        const status = response.statusCode ?? 502;
        if (status >= 400) {
          finish(new SsoRequestError(status, "ارسال پیامک ناموفق بود"));
          return;
        }
        finish();
      },
    );
    req.on("timeout", () => {
      req.destroy();
      finish(new SsoRequestError(504, "تایم‌اوت اتصال به سرویس پیامک"));
    });
    req.on("error", (error) => {
      const message = error.message.toLowerCase();
      if (
        message.includes("closed") ||
        message.includes("reset") ||
        message.includes("hang up")
      ) {
        finish();
        return;
      }
      finish(new SsoRequestError(502, "خطا در اتصال به سرویس پیامک"));
    });
    req.end();
  });
}

export async function verifyLoginOtp(
  melliCode: string,
  phoneNumber: string,
  otpCode: string,
): Promise<AuthUser & { isAdmin: true }> {
  const normalizedMelli = assertAllowedMelli(melliCode);
  const normalizedPhone = normalizeDigits(phoneNumber);
  const normalizedOtp = normalizeDigits(otpCode);
  if (normalizedOtp.length !== 5) {
    throw new SsoRequestError(400, "کد تایید باید ۵ رقم باشد");
  }

  await ssoFetch(SSO_API_URL, "/api/auth/second-login/verify-otp", {
    phoneNumber: normalizedPhone,
    otpCode: normalizedOtp,
    melliCode: normalizedMelli,
  });

  return {
    id: normalizedMelli,
    name: normalizedMelli,
    email: normalizedPhone,
    role: "admin",
    categoryIds: CATEGORIES.map((category) => category.id),
    isAdmin: true,
  };
}
