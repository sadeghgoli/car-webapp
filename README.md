# داشبورد موقعیت خودروهای شهرداری

وب‌اپلیکیشن پایش لحظه‌ای موقعیت خودروهای شهرداری با نقشه تعاملی، کنترل دسترسی مبتنی بر SSO و فیلتر لایه‌های خودرو.

## تکنولوژی‌ها

- **Next.js 16** — فریم‌ورک React با App Router
- **TypeScript** — تایپ‌سیفتی
- **Tailwind CSS 4** — استایل‌دهی
- **Leaflet / React-Leaflet** — نقشه تعاملی
- **NextAuth.js v5** — احراز هویت SSO
- **TanStack Query** — دریافت و به‌روزرسانی لحظه‌ای داده
- **Zustand** — مدیریت state داشبورد

## قابلیت‌ها

- ورود از طریق SSO (قابل اتصال به OIDC/SAML)
- کنترل دسترسی کاربر به دسته‌بندی‌های خودرو (Backend + Frontend)
- داشبورد نقشه‌محور با Marker خودروها
- پنل لایه‌ها برای فعال/غیرفعال کردن دسته‌ها
- Tooltip اطلاعات خودرو روی نقشه
- پنل جزئیات خودرو با کلیک
- به‌روزرسانی Near Real-Time موقعیت (Polling هر ۵ ثانیه)

## اجرا

```bash
npm install
npm run dev
```

سپس [http://localhost:3000](http://localhost:3000) را باز کنید.

## حساب‌های آزمایشی

| نام کاربری | رمز عبور | دسترسی |
|-----------|----------|--------|
| `ali` | `137` | فقط خودروهای سامانه ۱۳۷ |
| `zahra` | `multi` | ۱۳۷ + حمل و نقل |
| `admin` | `admin` | همه دسته‌ها (مدیر) |

## ساختار API

| Endpoint | توضیح |
|----------|-------|
| `GET /api/categories` | دسته‌بندی‌های مجاز کاربر |
| `GET /api/vehicles` | آخرین موقعیت خودروهای مجاز |
| `GET /api/vehicles/:id` | جزئیات یک خودرو (با کنترل دسترسی) |
| `GET /api/me` | اطلاعات کاربر جاری |

## نقشه محلی سبزوار

نقشه از سرویس **geo.sabzevar.ir** با MapLibre GL (همانند اپ windows) استفاده می‌کند.
فایل‌های نقشه در `public/js/` قرار دارند.

## مسیریابی

مسیر خودروها از **OSRM** محاسبه می‌شود تا روی خطوط واقعی خیابان‌ها کشیده شوند.
هر خودرو مبدا (سبز) و مقصد (قرمز) دارد و خودروهای در حال تردد مسیر را طی می‌کنند.

```
OSRM_BASE_URL=https://router.project-osrm.org
```

در `.env.local` آدرس API را تنظیم کنید:

```
VEHICLE_API_URL=https://your-vehicle-service/api
```

سپس route handlerهای `src/app/api/` را برای proxy به میکروسرویس واقعی تغییر دهید.

## SSO واقعی

برای اتصال SSO سازمانی، provider OIDC را در `src/auth.ts` اضافه کنید:

```typescript
import OIDC from "next-auth/providers/oidc";

OIDC({
  id: "municipality-sso",
  issuer: process.env.SSO_ISSUER,
  clientId: process.env.SSO_CLIENT_ID,
  clientSecret: process.env.SSO_CLIENT_SECRET,
})
```
