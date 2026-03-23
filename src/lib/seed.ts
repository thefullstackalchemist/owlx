import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function seedFirstUser() {
  const username = process.env.FIRST_USER;
  const password = process.env.FIRST_PASSWORD;

  if (!username || !password) return;

  await connectDB();

  const normalised = username.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ username: normalised });
  if (existing) {
    await User.updateOne({ username: normalised }, { $set: { passwordHash } });
    console.log(`[owl] First user password synced: ${normalised}`);
  } else {
    await User.create({ username: normalised, displayName: username, passwordHash });
    console.log(`[owl] First user created: ${normalised}`);
  }
}
