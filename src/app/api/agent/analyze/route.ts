import { NextRequest, NextResponse } from "next/server";
import { getBill, getPoliticalProfile, getUser, getUserVoteOnBill } from "@/lib/db";
import { summarizeBill } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, bill_id } = body;

    if (!bill_id) {
      return NextResponse.json(
        { error: "bill_id is required" },
        { status: 400 }
      );
    }

    const bill = getBill(bill_id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Generate a plain-English summary if we don't have one
    let aiSummary = bill.ai_summary;
    if (!aiSummary && bill.summary) {
      aiSummary = await summarizeBill(bill);
    }

    // Get user's existing vote if they have one
    let existingVote = null;
    if (user_id) {
      existingVote = getUserVoteOnBill(user_id, bill_id);
    }

    return NextResponse.json({
      bill: {
        ...bill,
        ai_summary: aiSummary,
      },
      existing_vote: existingVote,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze bill" },
      { status: 500 }
    );
  }
}
