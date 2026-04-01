import { NextRequest, NextResponse } from "next/server";
import { processBankSms, type BankSmsPayload } from "@/services/bankMessageService";

export async function POST(req: NextRequest) {
  let body: BankSmsPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sender || !body.message || !body.receivedAt) {
    return NextResponse.json(
      { error: "Required fields: sender, message, receivedAt" },
      { status: 400 }
    );
  }

  const result = await processBankSms(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ status: "ok", txnId: result.txnId }, { status: 201 });
}
