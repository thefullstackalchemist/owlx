import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createAccount } from "@/services/accountService";
import type { AccountData } from "@/services/accountService";

export async function GET() {
  const accounts = await listAccounts();
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as AccountData;
  const account = await createAccount(body);
  return NextResponse.json(account, { status: 201 });
}
