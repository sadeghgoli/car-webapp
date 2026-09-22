import type { AuthUser, MapCoordinate, Vehicle, VehicleCategory } from "@/types";

export const CATEGORIES: VehicleCategory[] = [
  { id: "137", name: "خودروهای سامانه ۱۳۷", color: "#2563eb", icon: "137" },
  { id: "transport", name: "حمل و نقل", color: "#059669", icon: "transport" },
  { id: "city-services", name: "خدمات شهری", color: "#d97706", icon: "city" },
  { id: "green-space", name: "فضای سبز", color: "#16a34a", icon: "green" },
  { id: "fire", name: "آتش‌نشانی", color: "#dc2626", icon: "fire" },
];

export const MOCK_USERS: AuthUser[] = [
  {
    id: "user-137",
    name: "علی محمدی",
    email: "ali.mohammadi@municipality.ir",
    role: "viewer",
    categoryIds: ["137"],
  },
  {
    id: "user-multi",
    name: "زهرا احمدی",
    email: "zahra.ahmadi@municipality.ir",
    role: "viewer",
    categoryIds: ["137", "transport"],
  },
  {
    id: "user-admin",
    name: "رضا کریمی",
    email: "admin@municipality.ir",
    role: "admin",
    categoryIds: CATEGORIES.map((c) => c.id),
  },
];

const ROUTE_PAIRS: Array<{
  id: string;
  title: string;
  plate: string;
  categoryId: string;
  status: Vehicle["status"];
  origin: MapCoordinate;
  destination: MapCoordinate;
  description: string;
}> = [
  {
    id: "v-001",
    title: "خودرو ۱۳۷ - منطقه ۱",
    plate: "۱۲ ب ۳۴۵ - ۱۱",
    categoryId: "137",
    status: "moving",
    origin: { lat: 36.2152, lng: 57.6798 },
    destination: { lat: 36.2088, lng: 57.6925 },
    description: "درخواست ۱۳۷: نشست آسفالت مقابل شهرداری",
  },
  {
    id: "v-002",
    title: "خودرو ۱۳۷ - منطقه ۳",
    plate: "۲۳ ج ۴۵۶ - ۱۱",
    categoryId: "137",
    status: "stopped",
    origin: { lat: 36.2135, lng: 57.6755 },
    destination: { lat: 36.2102, lng: 57.6880 },
    description: "درخواست ۱۳۷: انسداد کانال آب در خیابان امام",
  },
  {
    id: "v-003",
    title: "خودرو ۱۳۷ - منطقه ۵",
    plate: "۳۴ د ۵۶۷ - ۱۱",
    categoryId: "137",
    status: "moving",
    origin: { lat: 36.2095, lng: 57.6702 },
    destination: { lat: 36.2178, lng: 57.6855 },
    description: "درخواست ۱۳۷: شکستگی جدول معبر منطقه ۵",
  },
  {
    id: "v-004",
    title: "اتوبوس خط ۱",
    plate: "۴۵ س ۶۷۸ - ۱۱",
    categoryId: "transport",
    status: "moving",
    origin: { lat: 36.2120, lng: 57.6780 },
    destination: { lat: 36.2055, lng: 57.6950 },
    description: "سرویس خط ۱ — مسیر صبحگاهی",
  },
  {
    id: "v-005",
    title: "اتوبوس خط ۵",
    plate: "۵۶ ص ۷۸۹ - ۱۱",
    categoryId: "transport",
    status: "moving",
    origin: { lat: 36.2180, lng: 57.6820 },
    destination: { lat: 36.2070, lng: 57.6760 },
    description: "سرویس خط ۵ — جابه‌جایی مسافر",
  },
  {
    id: "v-006",
    title: "مینی‌بوس شهری",
    plate: "۶۷ ط ۸۹۰ - ۱۱",
    categoryId: "transport",
    status: "offline",
    origin: { lat: 36.2110, lng: 57.6740 },
    destination: { lat: 36.2145, lng: 57.6900 },
    description: "خارج از سرویس — بدون مأموریت فعال",
  },
  {
    id: "v-007",
    title: "جاروب شهری",
    plate: "۷۸ ق ۹۰۱ - ۱۱",
    categoryId: "city-services",
    status: "moving",
    origin: { lat: 36.2165, lng: 57.6870 },
    destination: { lat: 36.2090, lng: 57.6800 },
    description: "نظافت معابر — منطقه ۲",
  },
  {
    id: "v-008",
    title: "کامیون زباله",
    plate: "۸۹ ل ۰۱۲ - ۱۱",
    categoryId: "city-services",
    status: "stopped",
    origin: { lat: 36.2048, lng: 57.6835 },
    destination: { lat: 36.2130, lng: 57.6970 },
    description: "جمع‌آوری زباله — توقف در ایستگاه تخلیه",
  },
  {
    id: "v-009",
    title: "ماشین‌آلات فضای سبز",
    plate: "۹۰ م ۱۲۳ - ۱۱",
    categoryId: "green-space",
    status: "moving",
    origin: { lat: 36.2200, lng: 57.6785 },
    destination: { lat: 36.2065, lng: 57.6895 },
    description: "هرس درختان پارک شهید مطهری",
  },
  {
    id: "v-010",
    title: "آبیاری پارک",
    plate: "۰۱ ن ۲۳۴ - ۱۱",
    categoryId: "green-space",
    status: "stopped",
    origin: { lat: 36.2105, lng: 57.6910 },
    destination: { lat: 36.2172, lng: 57.6735 },
    description: "آبیاری فضای سبز — توقف در مخزن آب",
  },
  {
    id: "v-011",
    title: "خودرو آتش‌نشانی ۱",
    plate: "۱۱ الف ۲۴۵ - ۱۱",
    categoryId: "fire",
    status: "moving",
    origin: { lat: 36.2148, lng: 57.6718 },
    destination: { lat: 36.2080, lng: 57.6865 },
    description: "توسط مامور احمدی — اعزام به آتش‌سوزی ضایعات",
  },
  {
    id: "v-012",
    title: "خودرو آتش‌نشانی ۲",
    plate: "۲۲ پ ۳۵۶ - ۱۱",
    categoryId: "fire",
    status: "stopped",
    origin: { lat: 36.2072, lng: 57.6938 },
    destination: { lat: 36.2190, lng: 57.6810 },
    description: "توسط مامور رضایی — نشت گاز در خیابان امام",
  },
];

function createVehicle(def: (typeof ROUTE_PAIRS)[number]): Vehicle {
  const now = new Date();
  const speed = def.status === "moving" ? Math.floor(Math.random() * 40) + 20 : 0;

  return {
    id: def.id,
    title: def.title,
    plate: def.plate,
    categoryId: def.categoryId,
    status: def.status,
    origin: def.origin,
    destination: def.destination,
    connectionStatus: def.status === "offline" ? "offline" : "online",
    lastMovementAt: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
    position: {
      lat: def.origin.lat,
      lng: def.origin.lng,
      speed,
      heading: 0,
      timestamp: now.toISOString(),
      description: def.description,
    },
  };
}

export const MOCK_VEHICLES: Vehicle[] = ROUTE_PAIRS.map(createVehicle);

export function findUserByCredentials(username: string, password: string): AuthUser | null {
  const userMap: Record<string, { password: string; userId: string }> = {
    ali: { password: "137", userId: "user-137" },
    zahra: { password: "multi", userId: "user-multi" },
    admin: { password: "admin", userId: "user-admin" },
  };

  const entry = userMap[username];
  if (!entry || entry.password !== password) return null;

  return MOCK_USERS.find((u) => u.id === entry.userId) ?? null;
}
