"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Shield, LogIn, AlertCircle, ArrowRight } from "lucide-react";

type PhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

type Step = "melli" | "phone" | "otp";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 11) {
    return `${digits.slice(0, 4)}xxxx${digits.slice(-3)}`;
  }
  return phone;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error || "درخواست ناموفق بود");
  }
  return payload as T;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("melli");
  const [melliCode, setMelliCode] = useState("");
  const [phones, setPhones] = useState<PhoneOption[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMelli(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await postJson<{ phones: PhoneOption[] }>("/api/auth/phones", {
        melliCode,
      });
      const nextPhones = result.phones ?? [];
      if (nextPhones.length === 0) {
        setError("شماره تلفنی برای این کد ملی یافت نشد");
        return;
      }
      setPhones(nextPhones);
      setPhoneNumber(nextPhones[0]?.phoneNumber ?? "");
      setStep("phone");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود با خطا مواجه شد");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    if (!phoneNumber) {
      setError("یک شماره انتخاب کنید");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/send-otp", { melliCode, phoneNumber });
      setOtpCode("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارسال کد تایید ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    await sendOtp();
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      melliCode,
      phoneNumber,
      otpCode,
      redirect: false,
    });
    if (result?.error) {
      setError(result.code && result.code !== "credentials" ? result.code : "کد تایید نامعتبر است");
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          سامانه پایش خودروهای شهرداری
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-blue-100">
          ورود با کد ملی و کد تایید پیامکی، همان سرویس احراز هویت شهرداری
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 lg:hidden">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">ورود به سامانه</h2>
            <p className="mt-2 text-slate-500">
              {step === "melli" && "کد ملی ۱۰ رقمی را وارد کنید"}
              {step === "phone" && "شماره‌ای که کد تایید به آن ارسال شود را انتخاب کنید"}
              {step === "otp" && `کد ارسال‌شده به ${maskPhone(phoneNumber)} را وارد کنید`}
            </p>
          </div>

          {step === "melli" && (
            <form onSubmit={handleMelli} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  کد ملی
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={melliCode}
                  onChange={(event) => setMelliCode(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="کد ملی ۱۰ رقمی"
                  maxLength={10}
                  required
                />
              </div>
              <ErrorBanner message={error} />
              <SubmitButton loading={loading} label="ادامه با کد ملی" />
            </form>
          )}

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                {phones.map((phone) => {
                  const active = phone.phoneNumber === phoneNumber;
                  return (
                    <button
                      key={`${phone.id}-${phone.phoneNumber}`}
                      type="button"
                      onClick={() => setPhoneNumber(phone.phoneNumber)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right transition-colors ${
                        active
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-100 bg-slate-50 hover:border-blue-200"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-700" dir="ltr">
                        {maskPhone(phone.phoneNumber)}
                      </span>
                      {phone.isPrimary ? (
                        <span className="text-xs text-blue-600">اصلی</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <ErrorBanner message={error} />
              <SubmitButton loading={loading} label="ارسال کد تایید" />
              <BackButton
                onClick={() => {
                  setError("");
                  setStep("melli");
                }}
              />
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  کد تایید
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="کد ۵ رقمی"
                  maxLength={5}
                  required
                />
              </div>
              <ErrorBanner message={error} />
              <SubmitButton loading={loading} label="تایید و ورود" />
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  void sendOtp();
                }}
                className="w-full text-sm text-blue-600 disabled:opacity-50"
              >
                ارسال مجدد کد
              </button>
              <BackButton
                onClick={() => {
                  setError("");
                  setStep("phone");
                }}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
    >
      <LogIn className="h-5 w-5" />
      {loading ? "در حال بررسی..." : label}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 text-sm text-slate-500"
    >
      <ArrowRight className="h-4 w-4" />
      بازگشت
    </button>
  );
}
