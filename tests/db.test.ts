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
  getBillByNumber,
  upsertVote,
  getUserVotes,
  getVotesForBill,
  getUserVoteOnBill,
  updateTally,
  getTally,
  getAllTallies,
} from "@/lib/db";
import type { PoliticalProfile, AgentVote } from "@/lib/db";

// Use in-memory database for each test
beforeEach(() => {
  initDb(":memory:");
});

afterEach(() => {
  closeDb();
});

// ─── User Tests ───

describe("User CRUD", () => {
  it("creates a user and retrieves by ID", () => {
    createUser("user-1", "Jane Doe", "jane@example.com");
    const user = getUser("user-1");

    expect(user).toBeDefined();
    expect(user!.id).toBe("user-1");
    expect(user!.name).toBe("Jane Doe");
    expect(user!.email).toBe("jane@example.com");
    expect(user!.created_at).toBeDefined();
  });

  it("retrieves user by email", () => {
    createUser("user-2", "John Doe", "john@example.com");
    const user = getUserByEmail("john@example.com");

    expect(user).toBeDefined();
    expect(user!.id).toBe("user-2");
    expect(user!.name).toBe("John Doe");
  });

  it("returns undefined for non-existent user", () => {
    const user = getUser("nonexistent");
    expect(user).toBeUndefined();
  });

  it("returns undefined for non-existent email", () => {
    const user = getUserByEmail("nobody@example.com");
    expect(user).toBeUndefined();
  });

  it("enforces unique email constraint", () => {
    createUser("user-1", "Jane", "same@example.com");
    expect(() => {
      createUser("user-2", "John", "same@example.com");
    }).toThrow();
  });

  it("persists user across multiple reads", () => {
    createUser("user-persist", "Persist Test", "persist@test.com");

    // Read multiple times — must return the same data
    const read1 = getUser("user-persist");
    const read2 = getUser("user-persist");
    const read3 = getUserByEmail("persist@test.com");

    expect(read1).toEqual(read2);
    expect(read1!.id).toBe(read3!.id);
  });
});

// ─── Political Profile Tests ───

describe("Political Profile", () => {
  const baseProfile: PoliticalProfile = {
    id: "profile-1",
    user_id: "user-1",
    economic_score: -0.5,
    social_score: -0.3,
    foreign_policy_score: 0.2,
    environment_score: -0.8,
    healthcare_score: -0.6,
    immigration_score: -0.4,
    gun_policy_score: -0.2,
    education_score: -0.7,
    questionnaire_answers: { tax_policy: 1, healthcare_system: 3 },
    core_values: "Individual freedom and environmental protection",
    top_priorities: "Healthcare costs, climate change",
    updated_at: "",
  };

  beforeEach(() => {
    createUser("user-1", "Jane Doe", "jane@example.com");
  });

  it("creates a political profile", () => {
    upsertPoliticalProfile(baseProfile);
    const profile = getPoliticalProfile("user-1");

    expect(profile).toBeDefined();
    expect(profile!.user_id).toBe("user-1");
    expect(profile!.economic_score).toBe(-0.5);
    expect(profile!.social_score).toBe(-0.3);
    expect(profile!.environment_score).toBe(-0.8);
    expect(profile!.core_values).toBe("Individual freedom and environmental protection");
    expect(profile!.top_priorities).toBe("Healthcare costs, climate change");
  });

  it("stores questionnaire answers as JSON", () => {
    upsertPoliticalProfile(baseProfile);
    const profile = getPoliticalProfile("user-1");

    // Comes back as string from SQLite — parse it
    const answers =
      typeof profile!.questionnaire_answers === "string"
        ? JSON.parse(profile!.questionnaire_answers as unknown as string)
        : profile!.questionnaire_answers;

    expect(answers.tax_policy).toBe(1);
    expect(answers.healthcare_system).toBe(3);
  });

  it("updates profile on conflict (upsert)", () => {
    upsertPoliticalProfile(baseProfile);

    // Update the same user's profile
    upsertPoliticalProfile({
      ...baseProfile,
      id: "profile-1-updated",
      economic_score: 0.9,
      core_values: "Updated values",
    });

    const profile = getPoliticalProfile("user-1");
    expect(profile!.economic_score).toBe(0.9);
    expect(profile!.core_values).toBe("Updated values");
  });

  it("returns undefined for user without profile", () => {
    const profile = getPoliticalProfile("user-1");
    expect(profile).toBeUndefined();
  });
});

// ─── Bill Tests ───

describe("Bill CRUD", () => {
  const testBill = {
    id: "118-hr-1",
    congress: 118,
    bill_type: "hr",
    bill_number: 1,
    title: "Test Bill Act of 2024",
    short_title: "Test Bill Act",
    summary: "This bill does test things.",
    ai_summary: "A bill for testing purposes.",
    latest_action_text: "Referred to committee",
    latest_action_date: "2024-01-15",
    introduced_date: "2024-01-10",
    sponsor_name: "Rep. Test Person",
    sponsor_party: "D",
    sponsor_state: "CA",
    policy_area: "Testing",
    subjects: ["Unit Testing", "Integration Testing"],
    full_text_url: "https://congress.gov/text/118/hr/1",
    congress_url: "https://congress.gov/bill/118th-congress/house-bill/1",
    status: "in_committee",
  };

  it("creates a bill and retrieves by ID", () => {
    upsertBill(testBill);
    const bill = getBill("118-hr-1");

    expect(bill).toBeDefined();
    expect(bill!.id).toBe("118-hr-1");
    expect(bill!.title).toBe("Test Bill Act of 2024");
    expect(bill!.congress).toBe(118);
    expect(bill!.sponsor_name).toBe("Rep. Test Person");
    expect(bill!.status).toBe("in_committee");
  });

  it("serializes subjects array to JSON string", () => {
    upsertBill(testBill);
    const bill = getBill("118-hr-1");

    // Subjects should be stored as JSON string
    const subjects = JSON.parse(bill!.subjects);
    expect(subjects).toEqual(["Unit Testing", "Integration Testing"]);
  });

  it("accepts subjects as pre-serialized string", () => {
    upsertBill({
      ...testBill,
      id: "118-hr-2",
      bill_number: 2,
      subjects: '["Already Serialized"]',
    });
    const bill = getBill("118-hr-2");
    const subjects = JSON.parse(bill!.subjects);
    expect(subjects).toEqual(["Already Serialized"]);
  });

  it("retrieves bills with pagination", () => {
    // Insert 5 bills
    for (let i = 1; i <= 5; i++) {
      upsertBill({
        ...testBill,
        id: `118-hr-${i}`,
        bill_number: i,
        title: `Bill ${i}`,
        introduced_date: `2024-01-${String(i).padStart(2, "0")}`,
      });
    }

    const page1 = getBills(2, 0);
    expect(page1.length).toBe(2);

    const page2 = getBills(2, 2);
    expect(page2.length).toBe(2);

    const page3 = getBills(2, 4);
    expect(page3.length).toBe(1);
  });

  it("counts bills correctly", () => {
    expect(getBillCount()).toBe(0);

    upsertBill(testBill);
    expect(getBillCount()).toBe(1);

    upsertBill({ ...testBill, id: "118-hr-99", bill_number: 99 });
    expect(getBillCount()).toBe(2);
  });

  it("looks up bill by congress/type/number", () => {
    upsertBill(testBill);
    const bill = getBillByNumber(118, "hr", 1);

    expect(bill).toBeDefined();
    expect(bill!.title).toBe("Test Bill Act of 2024");
  });

  it("upserts bill on conflict — preserves ai_summary if not provided", () => {
    upsertBill(testBill);

    // Update same bill without ai_summary
    upsertBill({
      ...testBill,
      title: "Updated Title",
      ai_summary: undefined,
    });

    const bill = getBill("118-hr-1");
    expect(bill!.title).toBe("Updated Title");
    // ai_summary should be preserved from first insert
    expect(bill!.ai_summary).toBe("A bill for testing purposes.");
  });
});

// ─── Vote Tests ───

describe("Agent Votes", () => {
  beforeEach(() => {
    createUser("user-1", "Jane Doe", "jane@example.com");
    createUser("user-2", "John Doe", "john@example.com");
    upsertBill({
      id: "118-hr-1",
      congress: 118,
      bill_type: "hr",
      bill_number: 1,
      title: "Test Bill",
      status: "introduced",
    });
  });

  it("casts a vote and retrieves it", () => {
    const vote: AgentVote = {
      id: "vote-1",
      user_id: "user-1",
      bill_id: "118-hr-1",
      vote: "yea",
      confidence: 0.85,
      reasoning: "Based on your support for X, I voted yea.",
      key_factors: ["economic policy", "healthcare"],
      created_at: "",
    };

    upsertVote(vote);
    const retrieved = getUserVoteOnBill("user-1", "118-hr-1");

    expect(retrieved).toBeDefined();
    expect(retrieved!.vote).toBe("yea");
    expect(retrieved!.confidence).toBe(0.85);
    expect(retrieved!.reasoning).toBe("Based on your support for X, I voted yea.");

    // key_factors stored as JSON string
    const factors = JSON.parse(retrieved!.key_factors as unknown as string);
    expect(factors).toEqual(["economic policy", "healthcare"]);
  });

  it("gets all votes for a bill", () => {
    upsertVote({
      id: "vote-1",
      user_id: "user-1",
      bill_id: "118-hr-1",
      vote: "yea",
      confidence: 0.9,
      reasoning: "Yea reasoning",
      key_factors: [],
      created_at: "",
    });
    upsertVote({
      id: "vote-2",
      user_id: "user-2",
      bill_id: "118-hr-1",
      vote: "nay",
      confidence: 0.7,
      reasoning: "Nay reasoning",
      key_factors: [],
      created_at: "",
    });

    const votes = getVotesForBill("118-hr-1");
    expect(votes.length).toBe(2);
  });

  it("gets user vote history with bill titles", () => {
    upsertVote({
      id: "vote-1",
      user_id: "user-1",
      bill_id: "118-hr-1",
      vote: "yea",
      confidence: 0.9,
      reasoning: "Reasoning",
      key_factors: [],
      created_at: "",
    });

    const votes = getUserVotes("user-1");
    expect(votes.length).toBe(1);
    expect(votes[0].bill_title).toBe("Test Bill");
  });

  it("enforces one vote per user per bill (upsert)", () => {
    upsertVote({
      id: "vote-1",
      user_id: "user-1",
      bill_id: "118-hr-1",
      vote: "yea",
      confidence: 0.9,
      reasoning: "First vote",
      key_factors: [],
      created_at: "",
    });

    // Update the same vote
    upsertVote({
      id: "vote-1-updated",
      user_id: "user-1",
      bill_id: "118-hr-1",
      vote: "nay",
      confidence: 0.6,
      reasoning: "Changed my mind",
      key_factors: [],
      created_at: "",
    });

    const votes = getVotesForBill("118-hr-1");
    expect(votes.length).toBe(1);
    expect(votes[0].vote).toBe("nay");
    expect(votes[0].reasoning).toBe("Changed my mind");
  });

  it("returns undefined for non-existent vote", () => {
    const vote = getUserVoteOnBill("user-1", "nonexistent");
    expect(vote).toBeUndefined();
  });
});

// ─── Tally Tests ───

describe("Representative Tallies", () => {
  beforeEach(() => {
    createUser("user-1", "Jane", "jane@test.com");
    createUser("user-2", "John", "john@test.com");
    createUser("user-3", "Bob", "bob@test.com");
    upsertBill({
      id: "118-hr-1",
      congress: 118,
      bill_type: "hr",
      bill_number: 1,
      title: "Tally Test Bill",
      status: "introduced",
    });
  });

  it("creates tally from votes", () => {
    upsertVote({
      id: "v1", user_id: "user-1", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.9, reasoning: "r1", key_factors: [], created_at: "",
    });
    upsertVote({
      id: "v2", user_id: "user-2", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.8, reasoning: "r2", key_factors: [], created_at: "",
    });
    upsertVote({
      id: "v3", user_id: "user-3", bill_id: "118-hr-1",
      vote: "nay", confidence: 0.7, reasoning: "r3", key_factors: [], created_at: "",
    });

    updateTally("118-hr-1");
    const tally = getTally("118-hr-1");

    expect(tally).toBeDefined();
    expect(tally!.total_yea).toBe(2);
    expect(tally!.total_nay).toBe(1);
    expect(tally!.total_abstain).toBe(0);
    expect(tally!.consensus_vote).toBe("yea");
    expect(tally!.id).toBe("tally-118-hr-1"); // Fixed: no longer using billId as tally ID
  });

  it("uses correct consensus for nay majority", () => {
    upsertVote({
      id: "v1", user_id: "user-1", bill_id: "118-hr-1",
      vote: "nay", confidence: 0.9, reasoning: "r1", key_factors: [], created_at: "",
    });
    upsertVote({
      id: "v2", user_id: "user-2", bill_id: "118-hr-1",
      vote: "nay", confidence: 0.8, reasoning: "r2", key_factors: [], created_at: "",
    });
    upsertVote({
      id: "v3", user_id: "user-3", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.5, reasoning: "r3", key_factors: [], created_at: "",
    });

    updateTally("118-hr-1");
    const tally = getTally("118-hr-1");

    expect(tally!.consensus_vote).toBe("nay");
  });

  it("stores consensus reasoning", () => {
    upsertVote({
      id: "v1", user_id: "user-1", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.9, reasoning: "r1", key_factors: [], created_at: "",
    });

    updateTally("118-hr-1", "The people have spoken in favor.");
    const tally = getTally("118-hr-1");

    expect(tally!.consensus_reasoning).toBe("The people have spoken in favor.");
  });

  it("updates tally when new votes arrive", () => {
    upsertVote({
      id: "v1", user_id: "user-1", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.9, reasoning: "r1", key_factors: [], created_at: "",
    });
    updateTally("118-hr-1");

    let tally = getTally("118-hr-1");
    expect(tally!.total_yea).toBe(1);
    expect(tally!.total_nay).toBe(0);

    upsertVote({
      id: "v2", user_id: "user-2", bill_id: "118-hr-1",
      vote: "nay", confidence: 0.8, reasoning: "r2", key_factors: [], created_at: "",
    });
    updateTally("118-hr-1");

    tally = getTally("118-hr-1");
    expect(tally!.total_yea).toBe(1);
    expect(tally!.total_nay).toBe(1);
  });

  it("lists all tallies with bill titles", () => {
    upsertVote({
      id: "v1", user_id: "user-1", bill_id: "118-hr-1",
      vote: "yea", confidence: 0.9, reasoning: "r1", key_factors: [], created_at: "",
    });
    updateTally("118-hr-1");

    const tallies = getAllTallies();
    expect(tallies.length).toBe(1);
    expect(tallies[0].bill_title).toBe("Tally Test Bill");
  });
});
