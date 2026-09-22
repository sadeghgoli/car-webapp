"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">داشبورد موقعیت خودروهای شهرداری</h1>
          <p className="text-xs text-slate-500">سامانه پایش لحظه‌ای ناوگان شهری</p>
        </div>
      </div>

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
              {initials ?? <User className="h-5 w-5" />}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.isAdmin ? "مدیر سیستم" : "کاربر"}
              </p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                خروج از سامانه
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
