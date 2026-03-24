import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createAccount } from "@/services/accountService";
import { listCards } from "@/services/cardService";
import { listWallets } from "@/services/walletService";
import type { AccountData } from "@/services/accountService";

export async function GET() {
  // Merge all source collections so consumers (e.g. transaction modal) get everything in one call
  const [accounts, cards, wallets] = await Promise.all([
    listAccounts(),
    listCards(),
    listWallets(),
  ]);

  // Normalize wallets to look like accounts (add required fields)
  const normalizedWallets = wallets.map((w) => ({
    ...w,
    bank:     w.name,
    type:     "wallet" as const,
    isCredit: false,
  }));

  return NextResponse.json([...accounts, ...cards, ...normalizedWallets]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AccountData;
    const account = await createAccount(body);
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    console.error("[accounts POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
