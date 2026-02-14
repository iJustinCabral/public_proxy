"use client";

import { useEffect, useState } from "react";

interface Profile {
  economic_score: number;
  social_score: number;
  foreign_policy_score: number;
  environment_score: number;
  healthcare_score: number;
  immigration_score: number;
  gun_policy_score: number;
  education_score: number;
  core_values: string;
  top_priorities: string;
}

interface Vote {
  id: string;
  bill_id: string;
  bill_title: string;
  bill_short_title?: string;
  vote: "yea" | "nay" | "abstain";
  confidence: number;
  reasoning: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const SCORE_LABELS: Record<string, [string, string]> = {
  economic_score: ["Gov Programs", "Free Market"],
  social_score: ["Progressive", "Conservative"],
  foreign_policy_score: ["Non-Interventionist", "Interventionist"],
  environment_score: ["Strong Regulation", "Deregulation"],
  healthcare_score: ["Universal", "Market-Based"],
  immigration_score: ["Open", "Restrictive"],
  gun_policy_score: ["Strict Control", "Gun Rights"],
  education_score: ["Public Investment", "School Choice"],
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("democraic_user_id");
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`/api/profile?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
        setVotes(data.votes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container page">
        <div className="loading">
          <div className="spinner" />
          Loading your dashboard...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container page" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "16px" }}>No Agent Found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
          Create your AI agent first so it can represent you.
        </p>
        <a href="/onboarding" className="btn btn-primary">
          Create Your Agent
        </a>
      </main>
    );
  }

  return (
    <main className="container page">
      <div className="section-header">
        <h2>{user.name}&apos;s AI Agent</h2>
        <p>
          Your agent is ready to vote on bills based on your political profile
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Political Profile */}
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>Political Profile</h3>
          {profile &&
            Object.entries(SCORE_LABELS).map(([key, [leftLabel, rightLabel]]) => {
              const score = (profile as unknown as Record<string, number>)[key] || 0;
              return (
                <div className="score-row" key={key}>
                  <div className="score-label">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {leftLabel}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {rightLabel}
                    </span>
                  </div>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${((score + 1) / 2) * 100}%`,
                        left: 0,
                      }}
                    />
                  </div>
                </div>
              );
            })}

          {profile?.core_values && (
            <div style={{ marginTop: "16px" }}>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
              >
                Core Values:
              </span>
              <p style={{ fontSize: "0.9rem", marginTop: "4px" }}>
                {profile.core_values}
              </p>
            </div>
          )}
          {profile?.top_priorities && (
            <div style={{ marginTop: "12px" }}>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
              >
                Top Priorities:
              </span>
              <p style={{ fontSize: "0.9rem", marginTop: "4px" }}>
                {profile.top_priorities}
              </p>
            </div>
          )}
        </div>

        {/* Agent Stats */}
        <div>
          <div className="card" style={{ marginBottom: "16px" }}>
            <h3 style={{ marginBottom: "12px" }}>Agent Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--accent-light)",
                  }}
                >
                  {votes.length}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Bills Voted
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--yea)",
                  }}
                >
                  {votes.filter((v) => v.vote === "yea").length}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Yea
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--nay)",
                  }}
                >
                  {votes.filter((v) => v.vote === "nay").length}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Nay
                </div>
              </div>
            </div>
          </div>

          <a
            href="/bills"
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: "16px" }}
          >
            Vote on More Bills
          </a>
        </div>
      </div>

      {/* Voting History */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ marginBottom: "20px" }}>Voting History</h3>
        {votes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            <p>Your agent hasn&apos;t voted on any bills yet.</p>
            <a
              href="/bills"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "12px" }}
            >
              Browse Bills
            </a>
          </div>
        ) : (
          votes.map((vote) => (
            <a
              key={vote.id}
              href={`/bills/${vote.bill_id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="bill-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "0.95rem", marginBottom: "6px" }}>
                      {vote.bill_short_title || vote.bill_title}
                    </h4>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {vote.reasoning.slice(0, 150)}...
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`vote-badge vote-${vote.vote}`}>
                      {vote.vote.toUpperCase()}
                    </span>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {Math.round(vote.confidence * 100)}% confident
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </main>
  );
}
