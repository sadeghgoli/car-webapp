import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns-jalali";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJalaliDate(date: string | Date): string {
  return format(new Date(date), "yyyy/MM/dd HH:mm:ss");
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    moving: "در حال تردد",
    stopped: "متوقف",
    offline: "بدون ارتباط",
    online: "متصل",
  };
  return labels[status] ?? status;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
