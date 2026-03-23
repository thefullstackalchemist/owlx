import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

/** Public — returns whether any user account exists. */
export async function GET() {
  await connectDB();
  const count = await User.countDocuments();
  return NextResponse.json({ hasUsers: count > 0 });
}
