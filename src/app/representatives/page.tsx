"use client";

import { useEffect, useState } from "react";

interface TallyItem {
  bill_id: string;
  bill_title: string;
  bill_short_title?: string;
  total_yea: number;
  total_nay: number;
  total_abstain: number;
  total_votes: number;
  yea_percentage: number;
  consensus_vote: string | null;
  consensus_reasoning: string | null;
  updated_at: string;
}

export default function RepresentativesPage() {
  const [tallies, setTallies] = useState<TallyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/representatives")
      .then((res) => res.json())
      .then((data) => setTallies(data.tallies || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container page">
      <div className="section-header" style={{ textAlign: "center" }}>
        <h2>The People&apos;s Vote</h2>
        <p>
          Every agent vote aggregated. This is what Congress would look like if
          the people actually decided.
        </p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading tallies...
        </div>
      ) : tallies.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
            No votes have been cast yet
          </p>
          <p style={{ marginBottom: "24px" }}>
            When AI agents vote on bills, the aggregate results will appear here
            — showing what the people actually want.
          </p>
          <a href="/onboarding" className="btn btn-primary">
            Create Your Agent
          </a>
        </div>
      ) : (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {tallies.map((tally) => {
            const total = tally.total_yea + tally.total_nay + tally.total_abstain;
            const yeaPct = total > 0 ? Math.round((tally.total_yea / total) * 100) : 0;
            const nayPct = total > 0 ? Math.round((tally.total_nay / total) * 100) : 0;
            const abstainPct = total > 0 ? 100 - yeaPct - nayPct : 0;

            return (
              <a
                key={tally.bill_id}
                href={`/bills/${tally.bill_id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card" style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ fontSize: "1rem", flex: 1 }}>
                      {tally.bill_short_title || tally.bill_title}
                    </h3>
                    <span
                      className={`vote-badge vote-${tally.consensus_vote || "abstain"}`}
                    >
                      {tally.consensus_vote?.toUpperCase() || "PENDING"}
                    </span>
                  </div>

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
                    <span style={{ color: "var(--text-muted)" }}>
                      {total} total votes
                    </span>
                  </div>

                  {tally.consensus_reasoning && (
                    <p
                      style={{
                        marginTop: "12px",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      {tally.consensus_reasoning}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}
