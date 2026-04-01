import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";

/** GET — fetch last 30 messages (oldest first for display) */
export async function GET() {
  await connectDB();
  const messages = await ChatMessage.find()
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return NextResponse.json(
    messages.reverse().map((m) => ({ _id: m._id, role: m.role, content: m.content, source: m.source ?? "web" }))
  );
}

/** POST — save a message */
export async function POST(req: NextRequest) {
  await connectDB();
  const { role, content, source } = await req.json() as { role: "user" | "assistant"; content: string; source?: string };
  const msg = await ChatMessage.create({ role, content, source: source ?? "web" });
  return NextResponse.json(msg, { status: 201 });
}
