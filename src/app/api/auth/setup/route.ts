import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

/** Public — creates the first user. Fails if one already exists. */
export async function POST(req: NextRequest) {
  await connectDB();

  const count = await User.countDocuments();
  if (count > 0) {
    return NextResponse.json(
      { error: "Account already exists. Please log in." },
      { status: 403 }
    );
  }

  const { username, displayName, password } = await req.json() as {
    username:    string;
    displayName: string;
    password:    string;
  };

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username:    username.toLowerCase().trim(),
    displayName: (displayName || username).trim(),
    passwordHash,
  });

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
