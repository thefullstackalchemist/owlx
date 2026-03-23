import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUser, signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

/** GET — returns current user info. */
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ username: auth.username, displayName: auth.displayName });
}

/** PATCH — update display name and/or password. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { displayName, currentPassword, newPassword } = await req.json() as {
    displayName?:    string;
    currentPassword?: string;
    newPassword?:    string;
  };

  const user = await User.findById(auth.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (displayName) user.displayName = displayName.trim();

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await user.save();

  // Re-issue token with updated displayName
  const token = await signToken({
    userId:      user._id.toString(),
    username:    user.username,
    displayName: user.displayName,
  });

  const res = NextResponse.json({ ok: true, displayName: user.displayName });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  });
  return res;
}
