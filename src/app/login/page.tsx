"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Shield, LogIn, AlertCircle } from "lucide-react";

const demoAccounts = [
  { username: "ali", password: "137", label: "فقط دسترسی ۱۳۷", name: "علی محمدی" },
  { username: "zahra", password: "multi", label: "دسترسی ۱۳۷ + حمل و نقل", name: "زهرا احمدی" },
  { username: "admin", password: "admin", label: "مدیر (همه دسته‌ها)", name: "رضا کریمی" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("نام کاربری یا رمز عبور اشتباه است");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function quickLogin(account: (typeof demoAccounts)[0]) {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      username: account.username,
      password: account.password,
      redirect: false,
    });
    if (result?.error) {
      setError("خطا در ورود");
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
          داشبورد لحظه‌ای موقعیت ناوگان شهری با کنترل دسترسی مبتنی بر SSO
        </p>
        <div className="mt-12 space-y-4">
          {["پایش لحظه‌ای موقعیت GPS", "کنترل دسترسی بر اساس دسته‌بندی", "نمایش تعاملی روی نقشه"].map(
            (feature) => (
              <div key={feature} className="flex items-center gap-3 text-blue-100">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                {feature}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 lg:hidden">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">ورود به سامانه</h2>
            <p className="mt-2 text-slate-500">از طریق SSO وارد شوید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                نام کاربری
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="نام کاربری SSO"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="رمز عبور"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" />
              {loading ? "در حال ورود..." : "ورود به داشبورد"}
            </button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-slate-500">حساب‌های آزمایشی:</p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => quickLogin(account)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-right transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="text-xs text-blue-600">{account.label}</span>
                  <span className="text-sm font-medium text-slate-700">{account.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
