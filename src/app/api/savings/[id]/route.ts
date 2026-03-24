import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SavingsBucket } from "@/models/SavingsBucket";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const updated = await SavingsBucket.findByIdAndUpdate(id, { $set: body }, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  await SavingsBucket.findByIdAndUpdate(id, { $set: { active: false } });
  return NextResponse.json({ ok: true });
}
