import { NextRequest, NextResponse } from "next/server";
import { updateAccount, deleteAccount } from "@/services/accountService";
import type { AccountData } from "@/services/accountService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Partial<AccountData>;
  const updated = await updateAccount(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteAccount(id);
  return NextResponse.json({ ok: true });
}
