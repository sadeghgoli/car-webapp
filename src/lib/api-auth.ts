import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}
