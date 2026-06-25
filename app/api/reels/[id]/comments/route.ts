import { NextResponse } from "next/server";
import { getProvider } from "@/lib/provider";
import { analyzeComments } from "@/lib/analysis";
import { getConfig, getDmedCommentIds } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const provider = getProvider();
    const [comments, config, dmed] = await Promise.all([
      provider.getComments(params.id),
      getConfig(),
      getDmedCommentIds(),
    ]);
    const analyzed = analyzeComments(comments, config, dmed);
    const eligible = analyzed.filter((c) => c.status === "unanswered").length;
    return NextResponse.json({ comments: analyzed, eligible });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load comments" },
      { status: 500 }
    );
  }
}
