"use client";

import { useEffect, useState } from "react";

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
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  async function fetchBills() {
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      setBills(data.bills || []);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
    }
    setLoading(false);
  }

  async function syncBills() {
    setSyncing(true);
    try {
      const res = await fetch("/api/bills/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ congress: 118, bill_type: "hr", limit: 10 }),
      });
      const data = await res.json();
      if (data.synced > 0) {
        await fetchBills();
      }
    } catch (err) {
      console.error("Sync failed:", err);
    }
    setSyncing(false);
  }

  return (
    <main className="container page">
      <div className="section-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <div>
            <h2>Congressional Bills</h2>
            <p>Real legislation pulled from Congress.gov</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={syncBills}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync from Congress.gov"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading bills...
        </div>
      ) : bills.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
            No bills synced yet
          </p>
          <p style={{ marginBottom: "24px" }}>
            Click &ldquo;Sync from Congress.gov&rdquo; to pull the latest bills
            from the official Congressional API.
          </p>
          <button
            className="btn btn-primary"
            onClick={syncBills}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Bills Now"}
          </button>
        </div>
      ) : (
        <div>
          {bills.map((bill) => (
            <a
              key={bill.id}
              href={`/bills/${bill.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="bill-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.05rem", marginBottom: "8px" }}>
                      {bill.short_title || bill.title}
                    </h3>
                    {bill.ai_summary && (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                          marginBottom: "8px",
                        }}
                      >
                        {bill.ai_summary.slice(0, 200)}...
                      </p>
                    )}
                  </div>
                  <span className={`status-badge status-${bill.status}`}>
                    {bill.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="bill-meta">
                  {bill.sponsor_name && (
                    <span>
                      {bill.sponsor_name} ({bill.sponsor_party}-
                      {bill.sponsor_state})
                    </span>
                  )}
                  {bill.policy_area && <span>{bill.policy_area}</span>}
                  {bill.introduced_date && (
                    <span>Introduced {bill.introduced_date}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
