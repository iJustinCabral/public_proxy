import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.resolve(process.cwd(), "democraic.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "src/lib/db/schema.sql");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);
  }
  return db;
}

// Close the current connection (for cleanup / testing)
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Initialize with a specific path (for testing with :memory: or temp files)
export function initDb(dbPath: string): Database.Database {
  closeDb();
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);
  return db;
}

// ─── User queries ───

export function createUser(id: string, name: string, email: string) {
  const d = getDb();
  return d
    .prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(id, name, email);
}

export function getUserByEmail(email: string) {
  const d = getDb();
  return d.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | User
    | undefined;
}

export function getUser(id: string) {
  const d = getDb();
  return d.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

// ─── Political Profile queries ───

export function upsertPoliticalProfile(profile: PoliticalProfile) {
  const d = getDb();
  return d
    .prepare(
      `INSERT INTO political_profiles (id, user_id, economic_score, social_score, foreign_policy_score, environment_score, healthcare_score, immigration_score, gun_policy_score, education_score, questionnaire_answers, core_values, top_priorities, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       economic_score=excluded.economic_score, social_score=excluded.social_score,
       foreign_policy_score=excluded.foreign_policy_score, environment_score=excluded.environment_score,
       healthcare_score=excluded.healthcare_score, immigration_score=excluded.immigration_score,
       gun_policy_score=excluded.gun_policy_score, education_score=excluded.education_score,
       questionnaire_answers=excluded.questionnaire_answers, core_values=excluded.core_values,
       top_priorities=excluded.top_priorities, updated_at=datetime('now')`
    )
    .run(
      profile.id,
      profile.user_id,
      profile.economic_score,
      profile.social_score,
      profile.foreign_policy_score,
      profile.environment_score,
      profile.healthcare_score,
      profile.immigration_score,
      profile.gun_policy_score,
      profile.education_score,
      JSON.stringify(profile.questionnaire_answers),
      profile.core_values,
      profile.top_priorities
    );
}

export function getPoliticalProfile(userId: string) {
  const d = getDb();
  return d
    .prepare("SELECT * FROM political_profiles WHERE user_id = ?")
    .get(userId) as PoliticalProfile | undefined;
}

// ─── Bill queries ───

export function upsertBill(bill: Partial<Omit<Bill, "subjects"> & { subjects?: string | string[] }>) {
  const d = getDb();
  // Handle subjects as either string[] from Congress sync or string from DB
  const subjectsStr =
    typeof bill.subjects === "string"
      ? bill.subjects
      : JSON.stringify(bill.subjects || []);

  return d
    .prepare(
      `INSERT INTO bills (id, congress, bill_type, bill_number, title, short_title, summary, ai_summary, latest_action_text, latest_action_date, introduced_date, sponsor_name, sponsor_party, sponsor_state, policy_area, subjects, full_text_url, congress_url, status, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(congress, bill_type, bill_number) DO UPDATE SET
       title=excluded.title, short_title=excluded.short_title, summary=excluded.summary,
       ai_summary=COALESCE(excluded.ai_summary, bills.ai_summary),
       latest_action_text=excluded.latest_action_text, latest_action_date=excluded.latest_action_date,
       sponsor_name=excluded.sponsor_name, sponsor_party=excluded.sponsor_party,
       sponsor_state=excluded.sponsor_state, policy_area=excluded.policy_area,
       subjects=excluded.subjects, full_text_url=excluded.full_text_url,
       congress_url=excluded.congress_url, status=excluded.status, synced_at=datetime('now')`
    )
    .run(
      bill.id,
      bill.congress,
      bill.bill_type,
      bill.bill_number,
      bill.title,
      bill.short_title,
      bill.summary,
      bill.ai_summary || null,
      bill.latest_action_text,
      bill.latest_action_date,
      bill.introduced_date,
      bill.sponsor_name,
      bill.sponsor_party,
      bill.sponsor_state,
      bill.policy_area,
      subjectsStr,
      bill.full_text_url,
      bill.congress_url,
      bill.status
    );
}

export function getBills(limit = 20, offset = 0) {
  const d = getDb();
  return d
    .prepare(
      "SELECT * FROM bills ORDER BY introduced_date DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset) as Bill[];
}

export function getBillCount(): number {
  const d = getDb();
  const row = d.prepare("SELECT COUNT(*) as count FROM bills").get() as { count: number };
  return row.count;
}

export function getBill(id: string) {
  const d = getDb();
  return d.prepare("SELECT * FROM bills WHERE id = ?").get(id) as
    | Bill
    | undefined;
}

export function getBillByNumber(
  congress: number,
  billType: string,
  billNumber: number
) {
  const d = getDb();
  return d
    .prepare(
      "SELECT * FROM bills WHERE congress = ? AND bill_type = ? AND bill_number = ?"
    )
    .get(congress, billType, billNumber) as Bill | undefined;
}

// ─── Vote queries ───

export function upsertVote(vote: AgentVote) {
  const d = getDb();
  return d
    .prepare(
      `INSERT INTO agent_votes (id, user_id, bill_id, vote, confidence, reasoning, key_factors, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, bill_id) DO UPDATE SET
       vote=excluded.vote, confidence=excluded.confidence,
       reasoning=excluded.reasoning, key_factors=excluded.key_factors`
    )
    .run(
      vote.id,
      vote.user_id,
      vote.bill_id,
      vote.vote,
      vote.confidence,
      vote.reasoning,
      JSON.stringify(vote.key_factors)
    );
}

export function getUserVotes(userId: string) {
  const d = getDb();
  return d
    .prepare(
      `SELECT av.*, b.title as bill_title, b.short_title as bill_short_title
     FROM agent_votes av JOIN bills b ON av.bill_id = b.id
     WHERE av.user_id = ? ORDER BY av.created_at DESC`
    )
    .all(userId) as (AgentVote & { bill_title: string })[];
}

export function getVotesForBill(billId: string) {
  const d = getDb();
  return d
    .prepare("SELECT * FROM agent_votes WHERE bill_id = ?")
    .all(billId) as AgentVote[];
}

export function getUserVoteOnBill(userId: string, billId: string) {
  const d = getDb();
  return d
    .prepare(
      "SELECT * FROM agent_votes WHERE user_id = ? AND bill_id = ?"
    )
    .get(userId, billId) as AgentVote | undefined;
}

// ─── Tally queries ───

export function updateTally(billId: string, consensusReasoning?: string) {
  const d = getDb();
  const votes = getVotesForBill(billId);
  const yea = votes.filter((v) => v.vote === "yea").length;
  const nay = votes.filter((v) => v.vote === "nay").length;
  const abstain = votes.filter((v) => v.vote === "abstain").length;
  const consensus = yea >= nay ? (yea > 0 ? "yea" : "abstain") : "nay";

  return d
    .prepare(
      `INSERT INTO representative_tallies (id, bill_id, total_yea, total_nay, total_abstain, consensus_vote, consensus_reasoning, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(bill_id) DO UPDATE SET
       total_yea=excluded.total_yea, total_nay=excluded.total_nay,
       total_abstain=excluded.total_abstain, consensus_vote=excluded.consensus_vote,
       consensus_reasoning=COALESCE(excluded.consensus_reasoning, representative_tallies.consensus_reasoning),
       updated_at=datetime('now')`
    )
    .run(`tally-${billId}`, billId, yea, nay, abstain, consensus, consensusReasoning || null);
}

export function getTally(billId: string) {
  const d = getDb();
  return d
    .prepare("SELECT * FROM representative_tallies WHERE bill_id = ?")
    .get(billId) as RepresentativeTally | undefined;
}

export function getAllTallies() {
  const d = getDb();
  return d
    .prepare(
      `SELECT rt.*, b.title as bill_title, b.short_title as bill_short_title
     FROM representative_tallies rt JOIN bills b ON rt.bill_id = b.id
     ORDER BY rt.updated_at DESC`
    )
    .all() as (RepresentativeTally & { bill_title: string })[];
}

// ─── Types ───

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface PoliticalProfile {
  id: string;
  user_id: string;
  economic_score: number;
  social_score: number;
  foreign_policy_score: number;
  environment_score: number;
  healthcare_score: number;
  immigration_score: number;
  gun_policy_score: number;
  education_score: number;
  questionnaire_answers: Record<string, unknown>;
  core_values: string;
  top_priorities: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  congress: number;
  bill_type: string;
  bill_number: number;
  title: string;
  short_title: string | null;
  summary: string | null;
  ai_summary: string | null;
  latest_action_text: string | null;
  latest_action_date: string | null;
  introduced_date: string | null;
  sponsor_name: string | null;
  sponsor_party: string | null;
  sponsor_state: string | null;
  policy_area: string | null;
  subjects: string;
  full_text_url: string | null;
  congress_url: string | null;
  status: string;
  synced_at: string;
}

export interface AgentVote {
  id: string;
  user_id: string;
  bill_id: string;
  vote: "yea" | "nay" | "abstain";
  confidence: number;
  reasoning: string;
  key_factors: string[];
  created_at: string;
}

export interface RepresentativeTally {
  id: string;
  bill_id: string;
  total_yea: number;
  total_nay: number;
  total_abstain: number;
  consensus_vote: string | null;
  consensus_reasoning: string | null;
  updated_at: string;
}
