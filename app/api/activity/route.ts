import { NextResponse } from "next/server";
import { getLedger, getRuns } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [runs, ledger] = await Promise.all([getRuns(), getLedger()]);
  return NextResponse.json({
    runs,
    ledger: ledger.slice(-200).reverse(),
    totalDmed: ledger.filter((e) => e.ok).length,
  });
}
