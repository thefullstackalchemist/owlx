import { NextRequest, NextResponse } from "next/server";
import { updateWallet, deleteWallet } from "@/services/walletService";
import type { WalletData } from "@/services/walletService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Partial<WalletData>;
  const updated = await updateWallet(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteWallet(id);
  return NextResponse.json({ ok: true });
}
