import { NextRequest, NextResponse } from "next/server";
import { getAllTallies } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tallies = getAllTallies();

    return NextResponse.json({
      tallies: tallies.map((t) => ({
        ...t,
        total_votes: t.total_yea + t.total_nay + t.total_abstain,
        yea_percentage:
          t.total_yea + t.total_nay > 0
            ? Math.round(
                (t.total_yea / (t.total_yea + t.total_nay)) * 100
              )
            : 0,
      })),
    });
  } catch (error) {
    console.error("Representatives error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tallies" },
      { status: 500 }
    );
  }
}
