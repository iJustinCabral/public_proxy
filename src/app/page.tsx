export default function Home() {
  return (
    <main className="container page">
      <section className="hero">
        <h1>Your Voice. Your Agent. Every Bill.</h1>
        <p>
          democraic gives you an AI agent that reads every bill in Congress,
          understands your values, and votes on your behalf. No more hoping your
          representative actually represents you.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <a href="/onboarding" className="btn btn-primary">
            Create Your AI Agent
          </a>
          <a href="/bills" className="btn btn-secondary">
            Browse Bills
          </a>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="icon">01</div>
          <h3>Tell Us What You Believe</h3>
          <p>
            Answer questions about the issues that matter to you. Economy,
            healthcare, environment, social policy — your agent needs to
            understand you to represent you.
          </p>
        </div>
        <div className="feature">
          <div className="icon">02</div>
          <h3>Bills Are Pulled from Congress</h3>
          <p>
            We sync directly with the official Congress.gov API. Real bills,
            real legislation — not summaries of summaries. Your agent reads
            the actual text.
          </p>
        </div>
        <div className="feature">
          <div className="icon">03</div>
          <h3>Your Agent Votes for You</h3>
          <p>
            Your AI agent analyzes each bill against your values and casts a
            vote on your behalf. It explains its reasoning so you always know
            why it voted the way it did.
          </p>
        </div>
      </section>

      <section style={{ textAlign: "center", padding: "40px 0 60px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>
          The People&apos;s Representative
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            maxWidth: "640px",
            margin: "0 auto 24px",
            fontSize: "1.1rem",
          }}
        >
          All agent votes are aggregated into a single &ldquo;People&apos;s
          Vote&rdquo; — what Congress would look like if every citizen had a
          direct say. This is what real representation looks like.
        </p>
        <a href="/representatives" className="btn btn-secondary">
          See The People&apos;s Vote
        </a>
      </section>

      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "48px",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>
          How It Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
            marginTop: "32px",
            textAlign: "left",
          }}
        >
          <div>
            <h4 style={{ color: "var(--accent-light)", marginBottom: "8px" }}>
              Real Bills
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Pulled directly from the Library of Congress via the official
              Congress.gov API. Every bill introduced in the House and Senate.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--accent-light)", marginBottom: "8px" }}>
              AI Analysis
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Each bill is summarized in plain English so you can understand
              it. No legalese, no spin — just what it actually does.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--accent-light)", marginBottom: "8px" }}>
              Faithful Voting
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Your agent maps each bill to your stated values and casts a vote
              with a confidence score and full reasoning.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--accent-light)", marginBottom: "8px" }}>
              Direct Democracy
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              All votes are aggregated. See what the people actually want —
              not what politicians decide for them.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
