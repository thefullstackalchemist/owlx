import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SavingsBucket } from "@/models/SavingsBucket";

export async function GET() {
  await connectDB();
  const buckets = await SavingsBucket.find({ active: true })
    .populate("accountId", "name bank type balance color")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json(buckets);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json() as {
    name: string; description?: string; target: number; accountId: string; color?: string;
  };
  const bucket = await SavingsBucket.create(body);
  return NextResponse.json(bucket, { status: 201 });
}
