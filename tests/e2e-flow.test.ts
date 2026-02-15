import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDb,
  closeDb,
  createUser,
  getUser,
  getUserByEmail,
  upsertPoliticalProfile,
  getPoliticalProfile,
  upsertBill,
  getBill,
  getBills,
  getBillCount,
  upsertVote,
  getUserVotes,
  getUserVoteOnBill,
  getVotesForBill,
  updateTally,
  getTally,
  getAllTallies,
} from "@/lib/db";
import { calculateScores, QUESTIONS } from "@/lib/questionnaire";
import { parseVoteResponse } from "@/lib/ai";

beforeEach(() => {
  initDb(":memory:");
});

afterEach(() => {
  closeDb();
});

describe("End-to-End Flow: Signup → Profile → Bills → Vote → Tally", () => {
  it("complete user journey works", () => {
    // ─── STEP 1: User signs up ───
    const userId = "e2e-user-1";
    createUser(userId, "Alice Voter", "alice@democracy.org");

    const user = getUser(userId);
    expect(user).toBeDefined();
    expect(user!.name).toBe("Alice Voter");

    // Also findable by email
    const byEmail = getUserByEmail("alice@democracy.org");
    expect(byEmail!.id).toBe(userId);

    // ─── STEP 2: User completes political questionnaire ───
    const answers: Record<string, number> = {
      tax_policy: 3,         // Raise taxes on wealthy
      govt_spending: 2,      // Increase spending
      minimum_wage: 2,       // Raise to $15
      healthcare_system: 3,  // Universal single-payer
      drug_pricing: 2,       // Government negotiate all
      climate_action: 3,     // Aggressive action
      energy_policy: 2,      // Rapidly transition
      social_issues: 3,      // Bold progressive change
      criminal_justice: 2,   // Major reform
      immigration_policy: 2, // Path to citizenship
      gun_rights: 2,         // Ban assault weapons
      education_policy: 3,   // Free college
      foreign_policy: 2,     // Prioritize diplomacy
      military_spending: 2,  // Cut military spending
    };

    const scores = calculateScores(answers);

    // This user answered all progressive — scores should be negative (left-leaning)
    expect(scores.economic).toBeLessThan(0);
    expect(scores.healthcare).toBeLessThan(0);
    expect(scores.environment).toBeLessThan(0);
    expect(scores.social).toBeLessThan(0);

    // Save the profile
    upsertPoliticalProfile({
      id: "profile-e2e-1",
      user_id: userId,
      economic_score: scores.economic,
      social_score: scores.social,
      foreign_policy_score: scores.foreign_policy,
      environment_score: scores.environment,
      healthcare_score: scores.healthcare,
      immigration_score: scores.immigration,
      gun_policy_score: scores.gun_policy,
      education_score: scores.education,
      questionnaire_answers: answers,
      core_values: "Equality, environmental justice, healthcare for all",
      top_priorities: "Climate change, healthcare costs, education access",
      updated_at: "",
    });

    const profile = getPoliticalProfile(userId);
    expect(profile).toBeDefined();
    expect(profile!.economic_score).toBe(scores.economic);
    expect(profile!.core_values).toBe("Equality, environmental justice, healthcare for all");

    // ─── STEP 3: Bills are synced from Congress ───
    const healthcareBill = {
      id: "118-hr-100",
      congress: 118,
      bill_type: "hr",
      bill_number: 100,
      title: "Medicare for All Act of 2024",
      short_title: "Medicare for All Act",
      summary: "Establishes a national health insurance program for all US residents.",
      ai_summary: "This bill would create a government-run healthcare system covering all Americans.",
      latest_action_text: "Referred to the Committee on Energy and Commerce",
      latest_action_date: "2024-03-15",
      introduced_date: "2024-03-01",
      sponsor_name: "Rep. Progressive Leader",
      sponsor_party: "D",
      sponsor_state: "NY",
      policy_area: "Health",
      subjects: ["Health Care Coverage", "Medicare", "National Health Insurance"],
      full_text_url: "https://congress.gov/text/118/hr/100",
      congress_url: "https://congress.gov/bill/118th-congress/house-bill/100",
      status: "in_committee",
    };

    const taxCutBill = {
      id: "118-hr-200",
      congress: 118,
      bill_type: "hr",
      bill_number: 200,
      title: "Tax Cuts and Deregulation Act",
      short_title: "Tax Cuts Act",
      summary: "Reduces corporate tax rate to 15% and eliminates estate tax.",
      ai_summary: "Cuts corporate taxes significantly and removes inheritance tax.",
      latest_action_text: "Passed House by roll call vote",
      latest_action_date: "2024-04-01",
      introduced_date: "2024-02-15",
      sponsor_name: "Rep. Conservative Leader",
      sponsor_party: "R",
      sponsor_state: "TX",
      policy_area: "Taxation",
      subjects: ["Tax Reform", "Corporate Tax", "Estate Tax"],
      full_text_url: null,
      congress_url: "https://congress.gov/bill/118th-congress/house-bill/200",
      status: "passed_house",
    };

    upsertBill(healthcareBill);
    upsertBill(taxCutBill);

    expect(getBillCount()).toBe(2);
    expect(getBill("118-hr-100")!.title).toBe("Medicare for All Act of 2024");
    expect(getBill("118-hr-200")!.status).toBe("passed_house");

    // ─── STEP 4: AI agent votes on behalf of user ───
    // Simulate what analyzeAndVote would return for a progressive user on these bills

    // Vote YEA on Medicare for All (aligns with progressive values)
    const healthcareVoteResponse = parseVoteResponse(JSON.stringify({
      vote: "yea",
      confidence: 0.95,
      reasoning: "Based on your strong support for universal healthcare and your priority of lowering healthcare costs, I voted yea on this bill.",
      key_factors: ["universal healthcare", "healthcare costs", "progressive values"],
    }));

    upsertVote({
      id: "vote-e2e-1",
      user_id: userId,
      bill_id: "118-hr-100",
      ...healthcareVoteResponse,
      created_at: "",
    });

    // Vote NAY on Tax Cuts (conflicts with progressive values)
    const taxVoteResponse = parseVoteResponse(JSON.stringify({
      vote: "nay",
      confidence: 0.88,
      reasoning: "Based on your belief in higher taxes on the wealthy and increased social spending, this corporate tax cut conflicts with your values.",
      key_factors: ["tax policy", "wealth inequality", "corporate taxes"],
    }));

    upsertVote({
      id: "vote-e2e-2",
      user_id: userId,
      bill_id: "118-hr-200",
      ...taxVoteResponse,
      created_at: "",
    });

    // Verify votes were stored
    const storedVote1 = getUserVoteOnBill(userId, "118-hr-100");
    expect(storedVote1).toBeDefined();
    expect(storedVote1!.vote).toBe("yea");
    expect(storedVote1!.confidence).toBe(0.95);

    const storedVote2 = getUserVoteOnBill(userId, "118-hr-200");
    expect(storedVote2).toBeDefined();
    expect(storedVote2!.vote).toBe("nay");

    // User's vote history
    const voteHistory = getUserVotes(userId);
    expect(voteHistory.length).toBe(2);
    expect(voteHistory.some((v) => v.bill_title === "Medicare for All Act of 2024")).toBe(true);

    // ─── STEP 5: Tally is updated ───
    updateTally("118-hr-100");
    updateTally("118-hr-200");

    const tally1 = getTally("118-hr-100");
    expect(tally1!.total_yea).toBe(1);
    expect(tally1!.total_nay).toBe(0);
    expect(tally1!.consensus_vote).toBe("yea");

    const tally2 = getTally("118-hr-200");
    expect(tally2!.total_nay).toBe(1);
    expect(tally2!.consensus_vote).toBe("nay");

    // All tallies view
    const allTallies = getAllTallies();
    expect(allTallies.length).toBe(2);
  });

  it("multiple users create accurate aggregate tallies", () => {
    // Create 5 users with different leanings
    const users = [
      { id: "u1", name: "Progressive Pete", email: "pete@test.com" },
      { id: "u2", name: "Progressive Pam", email: "pam@test.com" },
      { id: "u3", name: "Moderate Mike", email: "mike@test.com" },
      { id: "u4", name: "Conservative Carl", email: "carl@test.com" },
      { id: "u5", name: "Conservative Carol", email: "carol@test.com" },
    ];

    for (const u of users) {
      createUser(u.id, u.name, u.email);
    }

    // Create a bill
    upsertBill({
      id: "118-hr-999",
      congress: 118,
      bill_type: "hr",
      bill_number: 999,
      title: "Contested Bill",
      status: "introduced",
    });

    // 2 yea, 2 nay, 1 abstain
    const votes = [
      { userId: "u1", vote: "yea" as const, confidence: 0.9 },
      { userId: "u2", vote: "yea" as const, confidence: 0.8 },
      { userId: "u3", vote: "abstain" as const, confidence: 0.4 },
      { userId: "u4", vote: "nay" as const, confidence: 0.85 },
      { userId: "u5", vote: "nay" as const, confidence: 0.75 },
    ];

    for (let i = 0; i < votes.length; i++) {
      const v = votes[i];
      upsertVote({
        id: `vote-multi-${i}`,
        user_id: v.userId,
        bill_id: "118-hr-999",
        vote: v.vote,
        confidence: v.confidence,
        reasoning: `${v.vote} reasoning`,
        key_factors: [],
        created_at: "",
      });
    }

    // Verify all votes stored
    const allVotes = getVotesForBill("118-hr-999");
    expect(allVotes.length).toBe(5);

    // Update tally
    updateTally("118-hr-999");
    const tally = getTally("118-hr-999");

    expect(tally!.total_yea).toBe(2);
    expect(tally!.total_nay).toBe(2);
    expect(tally!.total_abstain).toBe(1);
    // yea >= nay (2 >= 2) and yea > 0, so consensus is "yea"
    expect(tally!.consensus_vote).toBe("yea");
  });

  it("user re-onboarding updates profile without creating duplicate", () => {
    createUser("u-reup", "Reup User", "reup@test.com");

    // Initial profile
    upsertPoliticalProfile({
      id: "p1",
      user_id: "u-reup",
      economic_score: -0.5,
      social_score: -0.3,
      foreign_policy_score: 0,
      environment_score: -0.8,
      healthcare_score: -0.6,
      immigration_score: 0,
      gun_policy_score: 0,
      education_score: -0.7,
      questionnaire_answers: { tax_policy: 1 },
      core_values: "Old values",
      top_priorities: "Old priorities",
      updated_at: "",
    });

    // Re-onboard with different answers
    upsertPoliticalProfile({
      id: "p2",
      user_id: "u-reup",
      economic_score: 0.8,
      social_score: 0.5,
      foreign_policy_score: 0.7,
      environment_score: 0.3,
      healthcare_score: 0.6,
      immigration_score: 0.4,
      gun_policy_score: 0.9,
      education_score: 0.5,
      questionnaire_answers: { tax_policy: 0 },
      core_values: "New values",
      top_priorities: "New priorities",
      updated_at: "",
    });

    const profile = getPoliticalProfile("u-reup");
    expect(profile!.economic_score).toBe(0.8); // Updated
    expect(profile!.core_values).toBe("New values"); // Updated
  });

  it("bill upsert preserves AI summary when re-syncing", () => {
    upsertBill({
      id: "118-hr-50",
      congress: 118,
      bill_type: "hr",
      bill_number: 50,
      title: "First sync",
      ai_summary: "AI generated this summary",
      status: "introduced",
    });

    // Re-sync without AI summary (simulating Congress.gov sync)
    upsertBill({
      id: "118-hr-50",
      congress: 118,
      bill_type: "hr",
      bill_number: 50,
      title: "Updated sync title",
      status: "in_committee",
    });

    const bill = getBill("118-hr-50");
    expect(bill!.title).toBe("Updated sync title");
    expect(bill!.status).toBe("in_committee");
    // AI summary preserved via COALESCE
    expect(bill!.ai_summary).toBe("AI generated this summary");
  });
});
