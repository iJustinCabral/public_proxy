"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Bill {
  id: string;
  title: string;
  short_title: string | null;
  summary: string | null;
  ai_summary: string | null;
  sponsor_name: string | null;
  sponsor_party: string | null;
  sponsor_state: string | null;
  policy_area: string | null;
  status: string;
  introduced_date: string | null;
  latest_action_text: string | null;
  congress_url: string | null;
  subjects: string;
}

interface Vote {
  id: string;
  vote: "yea" | "nay" | "abstain";
  confidence: number;
  reasoning: string;
  key_factors: string;
}

interface Tally {
  total_yea: number;
  total_nay: number;
  total_abstain: number;
  consensus_vote: string | null;
}

export default function BillDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [bill, setBill] = useState<Bill | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("democraic_user_id");
    setUserId(storedId);
    fetchBill();
  }, []);

  async function fetchBill() {
    try {
      const res = await fetch(`/api/bills/${id}`);
      const data = await res.json();
      setBill(data.bill);
      setTally(data.tally);

      // Check for existing vote
      const storedId = localStorage.getItem("democraic_user_id");
      if (storedId) {
        const voteRes = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: storedId, bill_id: id }),
        });
        const voteData = await voteRes.json();
        if (voteData.existing_vote) {
          setMyVote(voteData.existing_vote);
        }
      }
    } catch (err) {
      console.error("Failed to fetch bill:", err);
    }
    setLoading(false);
  }

  async function castVote() {
    if (!userId) return;
    setVoting(true);
    try {
      const res = await fetch("/api/agent/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, bill_id: id }),
      });
      const data = await res.json();
      if (data.vote) {
        setMyVote(data.vote);
        // Refresh tally
        const billRes = await fetch(`/api/bills/${id}`);
        const billData = await billRes.json();
        setTally(billData.tally);
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
    setVoting(false);
  }

  if (loading) {
    return (
      <main className="container page">
        <div className="loading">
          <div className="spinner" />
          Loading bill...
        </div>
      </main>
    );
  }

  if (!bill) {
    return (
      <main className="container page">
        <p>Bill not found.</p>
      </main>
    );
  }

  const totalVotes = tally
    ? tally.total_yea + tally.total_nay + tally.total_abstain
    : 0;
  const yeaPct =
    totalVotes > 0 ? Math.round((tally!.total_yea / totalVotes) * 100) : 0;
  const nayPct =
    totalVotes > 0 ? Math.round((tally!.total_nay / totalVotes) * 100) : 0;
  const abstainPct = totalVotes > 0 ? 100 - yeaPct - nayPct : 0;

  let subjects: string[] = [];
  try {
    subjects = JSON.parse(bill.subjects || "[]");
  } catch {
    subjects = [];
  }

  let keyFactors: string[] = [];
  if (myVote?.key_factors) {
    try {
      keyFactors =
        typeof myVote.key_factors === "string"
          ? JSON.parse(myVote.key_factors)
          : myVote.key_factors;
    } catch {
      keyFactors = [];
    }
  }

  return (
    <main className="container page" style={{ maxWidth: "800px" }}>
      <a
        href="/bills"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.9rem",
          display: "inline-block",
          marginBottom: "24px",
        }}
      >
        &larr; Back to Bills
      </a>

      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <span className={`status-badge status-${bill.status}`}>
            {bill.status.replace(/_/g, " ")}
          </span>
        </div>
        <h1 style={{ fontSize: "1.8rem", lineHeight: 1.3, marginBottom: "12px" }}>
          {bill.short_title || bill.title}
        </h1>
        {bill.short_title && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {bill.title}
          </p>
        )}
      </div>

      {/* Sponsor & Meta */}
      <div className="bill-meta" style={{ marginBottom: "32px" }}>
        {bill.sponsor_name && (
          <span>
            Sponsor: {bill.sponsor_name} ({bill.sponsor_party}-
            {bill.sponsor_state})
          </span>
        )}
        {bill.policy_area && <span>{bill.policy_area}</span>}
        {bill.introduced_date && (
          <span>Introduced {bill.introduced_date}</span>
        )}
      </div>

      {/* AI Summary */}
      {bill.ai_summary && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "var(--accent-light)", marginBottom: "12px" }}>
            Plain English Summary
          </h3>
          <p style={{ lineHeight: 1.7 }}>{bill.ai_summary}</p>
        </div>
      )}

      {/* Official Summary */}
      {bill.summary && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px" }}>Official Summary</h3>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
            }}
            dangerouslySetInnerHTML={{ __html: bill.summary }}
          />
        </div>
      )}

      {/* Subjects */}
      {subjects.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h4 style={{ marginBottom: "8px", fontSize: "0.9rem" }}>Subjects</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {subjects.map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: "0.8rem",
                  padding: "4px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  color: "var(--text-muted)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* People's Vote Tally */}
      {tally && totalVotes > 0 && (
        <div
          className="card"
          style={{ marginBottom: "24px", borderColor: "var(--accent)" }}
        >
          <h3 style={{ marginBottom: "16px" }}>
            The People&apos;s Vote ({totalVotes} agents voted)
          </h3>
          <div className="tally-bar">
            <div className="yea" style={{ width: `${yeaPct}%` }} />
            <div className="nay" style={{ width: `${nayPct}%` }} />
            <div className="abstain" style={{ width: `${abstainPct}%` }} />
          </div>
          <div className="tally-labels">
            <span style={{ color: "var(--yea)" }}>
              Yea {tally.total_yea} ({yeaPct}%)
            </span>
            <span style={{ color: "var(--nay)" }}>
              Nay {tally.total_nay} ({nayPct}%)
            </span>
            <span style={{ color: "var(--abstain)" }}>
              Abstain {tally.total_abstain}
            </span>
          </div>
        </div>
      )}

      {/* Your Agent's Vote */}
      {myVote ? (
        <div
          className="card"
          style={{
            marginBottom: "24px",
            borderColor:
              myVote.vote === "yea"
                ? "var(--yea)"
                : myVote.vote === "nay"
                  ? "var(--nay)"
                  : "var(--abstain)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3>Your Agent&apos;s Vote</h3>
            <span className={`vote-badge vote-${myVote.vote}`}>
              {myVote.vote.toUpperCase()}
            </span>
          </div>
          <p style={{ marginBottom: "12px", lineHeight: 1.7 }}>
            {myVote.reasoning}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            <span>
              Confidence: {Math.round(myVote.confidence * 100)}%
            </span>
          </div>
          {keyFactors.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                Key factors:
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                {keyFactors.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.78rem",
                      padding: "3px 10px",
                      border: "1px solid var(--border)",
                      borderRadius: "20px",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : userId ? (
        <div style={{ textAlign: "center", padding: "24px" }}>
          <button
            className="btn btn-primary"
            onClick={castVote}
            disabled={voting}
          >
            {voting
              ? "Your agent is analyzing this bill..."
              : "Have My Agent Vote on This Bill"}
          </button>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "8px",
            }}
          >
            Your AI agent will analyze this bill against your political profile
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            Create your AI agent to vote on this bill
          </p>
          <a href="/onboarding" className="btn btn-primary">
            Get Started
          </a>
        </div>
      )}

      {/* Congress.gov link */}
      {bill.congress_url && (
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <a
            href={bill.congress_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View on Congress.gov
          </a>
        </div>
      )}
    </main>
  );
}
