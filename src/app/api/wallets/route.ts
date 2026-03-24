import { NextRequest, NextResponse } from "next/server";
import { listWallets, createWallet } from "@/services/walletService";
import type { WalletData } from "@/services/walletService";

export async function GET() {
  const wallets = await listWallets();
  return NextResponse.json(wallets);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WalletData;
    const wallet = await createWallet(body);
    return NextResponse.json(wallet, { status: 201 });
  } catch (err) {
    console.error("[wallets POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
