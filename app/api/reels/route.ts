import { NextResponse } from "next/server";
import { getProvider, dataSource } from "@/lib/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getProvider();
    const [self, reels] = await Promise.all([
      provider.getSelf(),
      provider.listReels(25),
    ]);
    return NextResponse.json({ self, reels, dataSource: dataSource() });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load reels" },
      { status: 500 }
    );
  }
}
