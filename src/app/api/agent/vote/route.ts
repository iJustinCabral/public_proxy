import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import {
  getBill,
  getPoliticalProfile,
  getUser,
  upsertVote,
  updateTally,
  getUserVoteOnBill,
} from "@/lib/db";
import { analyzeAndVote } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, bill_id } = body;

    if (!user_id || !bill_id) {
      return NextResponse.json(
        { error: "user_id and bill_id are required" },
        { status: 400 }
      );
    }

    const user = getUser(user_id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = getPoliticalProfile(user_id);
    if (!profile) {
      return NextResponse.json(
        { error: "Complete your political profile first" },
        { status: 400 }
      );
    }

    const bill = getBill(bill_id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Check if already voted
    const existing = getUserVoteOnBill(user_id, bill_id);
    if (existing) {
      return NextResponse.json({
        vote: existing,
        message: "Your agent has already voted on this bill.",
        already_voted: true,
      });
    }

    // Have the AI agent analyze and vote
    const result = await analyzeAndVote(bill, profile);

    const vote = {
      id: uuid(),
      user_id,
      bill_id,
      vote: result.vote,
      confidence: result.confidence,
      reasoning: result.reasoning,
      key_factors: result.key_factors,
      created_at: new Date().toISOString(),
    };

    upsertVote(vote);

    // Update the aggregate tally
    updateTally(bill_id);

    return NextResponse.json({
      vote,
      message: `Your AI agent voted "${result.vote}" on this bill with ${Math.round(result.confidence * 100)}% confidence.`,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}
