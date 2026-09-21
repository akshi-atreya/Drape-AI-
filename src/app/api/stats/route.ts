import { NextResponse } from "next/server";
import { countUsers } from "@/lib/users";

export const runtime = "nodejs";

/** Public, read-only: how many people have signed up. Shown on the auth pages. */
export async function GET() {
  return NextResponse.json({ userCount: await countUsers() });
}
