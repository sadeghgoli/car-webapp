import http from "node:http";
import https from "node:https";
import { SsoRequestError } from "@/lib/sso-login";

const SMS_PATH = "/SubSystems/SMS/webservices/sms_send.aspx";
const SMS_HOST = process.env.SMS_HOST ?? "erp.sabzevar.ir";
const SMS_TOKEN =
  process.env.SMS_TOKEN ?? "817CC3144B1C489A8860C8F093DC51AB";

const DEFAULT_TARGETS = [
  `http://192.168.1.30${SMS_PATH}`,
  `http://erp.sabzevar.ir${SMS_PATH}`,
];

export async function sendLoginSms(
  phoneNumber: string,
  otpCode: string,
): Promise<void> {
  const body = `کد ورود : ${otpCode}\nمدیریت فناوری اطلاعات شهرداری سبزوار`;
  const targets = [
    process.env.SMS_SEND_URL,
    ...DEFAULT_TARGETS,
  ].filter((url): url is string => Boolean(url));

  let lastError = "خطا در اتصال به سرویس پیامک";
  for (const target of targets) {
    try {
      await requestSmsGateway(target, phoneNumber, body);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }
  throw new SsoRequestError(502, lastError);
}

function requestSmsGateway(
  sendUrl: string,
  phoneNumber: string,
  body: string,
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
        headers: { Host: SMS_HOST },
        timeout: 20_000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", (error) => {
          if (isAbruptClose(error)) finish();
          else finish(new SsoRequestError(502, "خطا در اتصال به سرویس پیامک"));
        });
        response.on("end", () => {
          const status = response.statusCode ?? 502;
          if (status >= 400) {
            const text = Buffer.concat(chunks)
              .toString("utf8")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 180);
            finish(
              new SsoRequestError(
                status,
                text
                  ? `ارسال پیامک ناموفق بود (${status}: ${text})`
                  : `ارسال پیامک ناموفق بود (${status})`,
              ),
            );
            return;
          }
          finish();
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      finish(new SsoRequestError(504, "تایم‌اوت اتصال به سرویس پیامک"));
    });
    req.on("error", (error) => {
      if (isAbruptClose(error)) finish();
      else finish(new SsoRequestError(502, "خطا در اتصال به سرویس پیامک"));
    });
    req.end();
  });
}

function isAbruptClose(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("closed") ||
    message.includes("reset") ||
    message.includes("hang up") ||
    message.includes("unexpected") ||
    message.includes("premature")
  );
}
