import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { filterCategoriesByAccess } from "@/lib/access-control";
import { CATEGORIES } from "@/lib/mock-data";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const categories = filterCategoriesByAccess(CATEGORIES, user!);
  return NextResponse.json(categories);
}
