import Anthropic from "@anthropic-ai/sdk";
import type { Bill, PoliticalProfile } from "@/lib/db";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export function getClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "No Anthropic API key configured. Set ANTHROPIC_API_KEY in .env or provide your key in your profile settings."
    );
  }
  return new Anthropic({ apiKey: key });
}

// ─── Summarize a bill in plain English ───

export async function summarizeBill(bill: Bill, apiKey?: string): Promise<string> {
  const client = getClient(apiKey);

  const billContext = [
    `Title: ${bill.title}`,
    bill.short_title ? `Short Title: ${bill.short_title}` : "",
    bill.summary ? `Official Summary: ${bill.summary}` : "",
    bill.policy_area ? `Policy Area: ${bill.policy_area}` : "",
    bill.sponsor_name
      ? `Sponsor: ${bill.sponsor_name} (${bill.sponsor_party}-${bill.sponsor_state})`
      : "",
    bill.latest_action_text ? `Latest Action: ${bill.latest_action_text}` : "",
    bill.subjects ? `Subjects: ${bill.subjects}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a nonpartisan policy analyst. Summarize this bill in plain English that any citizen can understand. Focus on:
1. What the bill actually does (in 2-3 sentences)
2. Who it affects
3. Key provisions
4. Potential impact

Be factual and neutral. No political spin.

Bill information:
${billContext}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// ─── Have an AI agent analyze a bill and vote based on a user's political profile ───

export async function analyzeAndVote(
  bill: Bill,
  profile: PoliticalProfile,
  apiKey?: string
): Promise<{
  vote: "yea" | "nay" | "abstain";
  confidence: number;
  reasoning: string;
  key_factors: string[];
}> {
  const client = getClient(apiKey);

  const profileContext = `
VOTER POLITICAL PROFILE:
- Economic views: ${describeScore(profile.economic_score, "free-market/lower taxes", "government programs/higher taxes on wealthy")}
- Social views: ${describeScore(profile.social_score, "traditional values", "progressive social policies")}
- Foreign policy: ${describeScore(profile.foreign_policy_score, "strong military/interventionist", "diplomacy-first/non-interventionist")}
- Environment: ${describeScore(profile.environment_score, "deregulation/industry-friendly", "strong environmental protections")}
- Healthcare: ${describeScore(profile.healthcare_score, "market-based healthcare", "universal/government healthcare")}
- Immigration: ${describeScore(profile.immigration_score, "restrictive immigration", "open/welcoming immigration")}
- Gun policy: ${describeScore(profile.gun_policy_score, "strong gun rights", "strict gun regulations")}
- Education: ${describeScore(profile.education_score, "school choice/vouchers", "public school investment")}
${profile.core_values ? `\nCore values: ${profile.core_values}` : ""}
${profile.top_priorities ? `\nTop priorities: ${profile.top_priorities}` : ""}
  `.trim();

  const billContext = `
BILL INFORMATION:
- Title: ${bill.title}
${bill.short_title ? `- Short Title: ${bill.short_title}` : ""}
${bill.summary ? `- Official Summary: ${bill.summary}` : ""}
${bill.ai_summary ? `- Plain English Summary: ${bill.ai_summary}` : ""}
- Policy Area: ${bill.policy_area || "Not specified"}
- Sponsor: ${bill.sponsor_name || "Unknown"} (${bill.sponsor_party || "?"}-${bill.sponsor_state || "?"})
- Status: ${bill.status}
- Subjects: ${bill.subjects || "None listed"}
  `.trim();

  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are an AI agent voting on behalf of a citizen in a direct democracy platform. Your job is to faithfully represent this citizen's values and preferences when analyzing legislation.

${profileContext}

${billContext}

Based on this citizen's political profile and values, analyze how they would likely vote on this bill. You must respond in EXACTLY this JSON format and nothing else:

{
  "vote": "yea" | "nay" | "abstain",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<2-3 sentence explanation written TO the user explaining why you voted this way on their behalf, referencing their specific values>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}

Rules:
- Vote "yea" if the bill aligns with the citizen's values and priorities
- Vote "nay" if it conflicts with them
- Vote "abstain" only if the bill is truly unrelated to any of their stated views, or if their profile gives genuinely equal reasons for and against
- Be honest about confidence — 0.9+ means very clear alignment/conflict, 0.5 means uncertain
- In reasoning, speak directly to the user: "Based on your support for X, I voted..."`,
      },
    ],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "{}";

  return parseVoteResponse(text);
}

// Parse the AI vote response with robust JSON extraction
export function parseVoteResponse(text: string): {
  vote: "yea" | "nay" | "abstain";
  confidence: number;
  reasoning: string;
  key_factors: string[];
} {
  try {
    // Find the last complete JSON object (avoids partial matches)
    const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (!jsonMatch || jsonMatch.length === 0) throw new Error("No JSON found in response");

    const result = JSON.parse(jsonMatch[jsonMatch.length - 1]);

    // Validate vote value
    const validVotes = ["yea", "nay", "abstain"];
    const vote = validVotes.includes(result.vote) ? result.vote : "abstain";

    // Validate confidence is a number between 0 and 1
    const rawConfidence = Number(result.confidence);
    const confidence = Number.isFinite(rawConfidence)
      ? Math.min(1, Math.max(0, rawConfidence))
      : 0.5;

    return {
      vote,
      confidence,
      reasoning: typeof result.reasoning === "string" ? result.reasoning : "Unable to generate reasoning.",
      key_factors: Array.isArray(result.key_factors) ? result.key_factors : [],
    };
  } catch {
    return {
      vote: "abstain",
      confidence: 0.3,
      reasoning:
        "I was unable to fully analyze this bill. Please review it manually.",
      key_factors: ["analysis_error"],
    };
  }
}

// ─── Generate consensus reasoning from all agent votes ───

export async function generateConsensusReasoning(
  bill: Bill,
  votes: { vote: string; reasoning: string }[],
  apiKey?: string
): Promise<string> {
  if (votes.length === 0) return "";

  const client = getClient(apiKey);

  const yeas = votes.filter((v) => v.vote === "yea");
  const nays = votes.filter((v) => v.vote === "nay");

  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are summarizing the collective voice of citizens in a direct democracy platform.

Bill: ${bill.title}

Total votes: ${votes.length} (${yeas.length} yea, ${nays.length} nay, ${votes.length - yeas.length - nays.length} abstain)

Sample YEA reasoning:
${yeas.slice(0, 5).map((v) => `- ${v.reasoning}`).join("\n") || "None"}

Sample NAY reasoning:
${nays.slice(0, 5).map((v) => `- ${v.reasoning}`).join("\n") || "None"}

Write a 2-3 sentence summary of the collective sentiment. Be balanced and represent both sides fairly. This will be displayed as "The People's Position" on this bill.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// ─── Helper: describe a score as human-readable text ───

export function describeScore(
  score: number,
  rightLabel: string,
  leftLabel: string
): string {
  if (score > 0.5) return `Strongly favors ${rightLabel} (${score.toFixed(1)})`;
  if (score > 0.15) return `Leans toward ${rightLabel} (${score.toFixed(1)})`;
  if (score < -0.5) return `Strongly favors ${leftLabel} (${score.toFixed(1)})`;
  if (score < -0.15) return `Leans toward ${leftLabel} (${score.toFixed(1)})`;
  return `Moderate/centrist (${score.toFixed(1)})`;
}
