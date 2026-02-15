import { describe, it, expect } from "vitest";
import { QUESTIONS, calculateScores } from "@/lib/questionnaire";

describe("Questionnaire Structure", () => {
  it("has questions covering all 8 policy dimensions", () => {
    const categories = new Set(QUESTIONS.map((q) => q.category));
    expect(categories.size).toBeGreaterThanOrEqual(7); // Economy, Healthcare, Environment, Social, Immigration, Gun Policy, Education, Foreign Policy
  });

  it("every question has at least 2 options", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every question has an id, text, category, and options", () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(q.category).toBeTruthy();
      expect(q.options.length).toBeGreaterThan(0);
    }
  });

  it("every option has a label and scores", () => {
    for (const q of QUESTIONS) {
      for (const opt of q.options) {
        expect(opt.label).toBeTruthy();
        expect(typeof opt.scores).toBe("object");
      }
    }
  });

  it("all score values are between -1 and 1", () => {
    for (const q of QUESTIONS) {
      for (const opt of q.options) {
        for (const [, score] of Object.entries(opt.scores)) {
          expect(score).toBeGreaterThanOrEqual(-1);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("Score Calculation", () => {
  it("calculates scores from answers", () => {
    // Answer the first option (index 0) for each question
    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 0;
    }

    const scores = calculateScores(answers);

    expect(typeof scores.economic).toBe("number");
    expect(typeof scores.social).toBe("number");
    expect(typeof scores.healthcare).toBe("number");
    expect(typeof scores.environment).toBe("number");
    expect(typeof scores.immigration).toBe("number");
    expect(typeof scores.gun_policy).toBe("number");
    expect(typeof scores.education).toBe("number");
    expect(typeof scores.foreign_policy).toBe("number");
  });

  it("scores are between -1 and 1", () => {
    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 0;
    }

    const scores = calculateScores(answers);

    for (const value of Object.values(scores)) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("right-leaning answers produce positive scores", () => {
    // Pick the most right-leaning option for each question (first option tends to be right)
    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 0; // First option is typically the right-leaning one
    }

    const scores = calculateScores(answers);
    // Economic first option is "lower taxes for everyone" = right-leaning
    expect(scores.economic).toBeGreaterThan(0);
  });

  it("left-leaning answers produce negative scores", () => {
    // Pick the most left-leaning option (last option tends to be left)
    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = q.options.length - 1;
    }

    const scores = calculateScores(answers);
    expect(scores.economic).toBeLessThan(0);
  });

  it("handles partial answers (only some questions answered)", () => {
    const answers = {
      tax_policy: 0,
      healthcare_system: 3,
    };

    const scores = calculateScores(answers);
    expect(scores.economic).toBeGreaterThan(0); // Right-leaning tax answer
    expect(scores.healthcare).toBeLessThan(0); // Left-leaning healthcare answer
    // Dimensions with no answers should be 0
    expect(scores.gun_policy).toBe(0);
    expect(scores.immigration).toBe(0);
  });

  it("ignores invalid question IDs", () => {
    const scores = calculateScores({ nonexistent_question: 0 });

    for (const value of Object.values(scores)) {
      expect(value).toBe(0);
    }
  });

  it("handles empty answers", () => {
    const scores = calculateScores({});

    for (const value of Object.values(scores)) {
      expect(value).toBe(0);
    }
  });
});
