"use client";

import { useState } from "react";
import { QUESTIONS } from "@/lib/questionnaire";

export default function OnboardingPage() {
  const [step, setStep] = useState<"info" | "questions" | "values" | "done">(
    "info"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [coreValues, setCoreValues] = useState("");
  const [topPriorities, setTopPriorities] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  const question = QUESTIONS[currentQ];
  const progress = step === "questions" ? (currentQ / QUESTIONS.length) * 100 : 0;

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          answers,
          core_values: coreValues,
          top_priorities: topPriorities,
        }),
      });
      const data = await res.json();
      if (data.user_id) {
        setUserId(data.user_id);
        setScores(data.scores);
        // Store in localStorage for session persistence
        localStorage.setItem("democraic_user_id", data.user_id);
        localStorage.setItem("democraic_user_name", name);
        setStep("done");
      }
    } catch (err) {
      console.error("Onboarding failed:", err);
    }
    setLoading(false);
  }

  if (step === "info") {
    return (
      <main className="container page" style={{ maxWidth: "600px" }}>
        <div className="section-header" style={{ textAlign: "center" }}>
          <h2>Create Your AI Agent</h2>
          <p>
            Your agent will learn your political values and vote on bills in
            Congress on your behalf.
          </p>
        </div>

        <div className="question-card">
          <div style={{ marginBottom: "20px" }}>
            <label>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={!name || !email}
            onClick={() => setStep("questions")}
          >
            Start Questionnaire
          </button>
        </div>
      </main>
    );
  }

  if (step === "questions" && question) {
    return (
      <main className="container page" style={{ maxWidth: "650px" }}>
        <div className="progress-bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginBottom: "8px",
          }}
        >
          Question {currentQ + 1} of {QUESTIONS.length}
        </p>

        <div className="question-card">
          <div className="category">{question.category}</div>
          <h3>{question.text}</h3>

          <div style={{ marginTop: "20px" }}>
            {question.options.map((option, i) => (
              <button
                key={i}
                className={`option ${answers[question.id] === i ? "selected" : ""}`}
                onClick={() => {
                  const newAnswers = { ...answers, [question.id]: i };
                  setAnswers(newAnswers);

                  // Auto-advance after short delay
                  setTimeout(() => {
                    if (currentQ < QUESTIONS.length - 1) {
                      setCurrentQ(currentQ + 1);
                    } else {
                      setStep("values");
                    }
                  }, 300);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {currentQ > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "16px" }}
              onClick={() => setCurrentQ(currentQ - 1)}
            >
              Back
            </button>
          )}
        </div>
      </main>
    );
  }

  if (step === "values") {
    return (
      <main className="container page" style={{ maxWidth: "600px" }}>
        <div className="section-header" style={{ textAlign: "center" }}>
          <h2>Almost Done</h2>
          <p>
            Tell your agent what matters most to you in your own words. This
            helps it make better decisions on nuanced bills.
          </p>
        </div>

        <div className="question-card">
          <div style={{ marginBottom: "20px" }}>
            <label>
              What are your core values? (What principles should guide your
              agent?)
            </label>
            <textarea
              rows={3}
              value={coreValues}
              onChange={(e) => setCoreValues(e.target.value)}
              placeholder="e.g., Individual freedom, fiscal responsibility, protecting the environment for future generations..."
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label>
              What are your top political priorities right now?
            </label>
            <textarea
              rows={3}
              value={topPriorities}
              onChange={(e) => setTopPriorities(e.target.value)}
              placeholder="e.g., Lowering healthcare costs, addressing climate change, reducing the national debt..."
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Creating your AI agent..." : "Create My Agent"}
          </button>
        </div>
      </main>
    );
  }

  if (step === "done") {
    return (
      <main className="container page" style={{ maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "2rem",
              marginBottom: "12px",
              background: "var(--gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Agent Is Ready
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            Your AI agent now understands your political values and is ready to
            vote on bills on your behalf.
          </p>
        </div>

        {scores && (
          <div className="question-card">
            <h3 style={{ marginBottom: "20px" }}>Your Political Profile</h3>
            {Object.entries(scores).map(([key, value]) => (
              <div className="score-row" key={key}>
                <div className="score-label">
                  <span>{formatLabel(key)}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {value > 0 ? "+" : ""}
                    {value.toFixed(2)}
                  </span>
                </div>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${((value + 1) / 2) * 100}%`,
                      left: 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          <a href="/bills" className="btn btn-primary">
            Browse Bills
          </a>
          <a href="/dashboard" className="btn btn-secondary">
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return null;
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    economic: "Economic",
    social: "Social",
    foreign_policy: "Foreign Policy",
    environment: "Environment",
    healthcare: "Healthcare",
    immigration: "Immigration",
    gun_policy: "Gun Policy",
    education: "Education",
  };
  return labels[key] || key;
}
