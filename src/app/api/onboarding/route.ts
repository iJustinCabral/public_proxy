import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { createUser, getUserByEmail, upsertPoliticalProfile } from "@/lib/db";
import { calculateScores } from "@/lib/questionnaire";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, answers, core_values, top_priorities } = body;

    if (!name || !email || !answers) {
      return NextResponse.json(
        { error: "name, email, and answers are required" },
        { status: 400 }
      );
    }

    // Create or find user
    let user = getUserByEmail(email);
    if (!user) {
      const userId = uuid();
      createUser(userId, name, email);
      user = { id: userId, name, email, created_at: new Date().toISOString() };
    }

    // Calculate political scores from answers
    const scores = calculateScores(answers);

    // Save profile
    upsertPoliticalProfile({
      id: uuid(),
      user_id: user.id,
      economic_score: scores.economic,
      social_score: scores.social,
      foreign_policy_score: scores.foreign_policy,
      environment_score: scores.environment,
      healthcare_score: scores.healthcare,
      immigration_score: scores.immigration,
      gun_policy_score: scores.gun_policy,
      education_score: scores.education,
      questionnaire_answers: answers,
      core_values: core_values || "",
      top_priorities: top_priorities || "",
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      user_id: user.id,
      scores,
      message: "Profile created. Your AI agent is ready to represent you.",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
