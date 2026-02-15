import { describe, it, expect } from "vitest";
import { parseVoteResponse, describeScore, getClient } from "@/lib/ai";

describe("Vote Response Parsing", () => {
  it("parses valid JSON vote response", () => {
    const text = JSON.stringify({
      vote: "yea",
      confidence: 0.85,
      reasoning: "Based on your support for healthcare reform, I voted yea.",
      key_factors: ["healthcare", "government spending"],
    });

    const result = parseVoteResponse(text);
    expect(result.vote).toBe("yea");
    expect(result.confidence).toBe(0.85);
    expect(result.reasoning).toContain("healthcare reform");
    expect(result.key_factors).toEqual(["healthcare", "government spending"]);
  });

  it("parses JSON wrapped in markdown code block", () => {
    const text = `Here's my analysis:
\`\`\`json
{
  "vote": "nay",
  "confidence": 0.72,
  "reasoning": "This conflicts with your values.",
  "key_factors": ["taxes"]
}
\`\`\``;

    const result = parseVoteResponse(text);
    expect(result.vote).toBe("nay");
    expect(result.confidence).toBe(0.72);
  });

  it("handles invalid vote value — defaults to abstain", () => {
    const text = JSON.stringify({
      vote: "maybe",
      confidence: 0.5,
      reasoning: "Not sure.",
      key_factors: [],
    });

    const result = parseVoteResponse(text);
    expect(result.vote).toBe("abstain");
  });

  it("clamps confidence to 0-1 range", () => {
    const text = JSON.stringify({
      vote: "yea",
      confidence: 1.5,
      reasoning: "Very confident",
      key_factors: [],
    });

    const result = parseVoteResponse(text);
    expect(result.confidence).toBe(1);

    const text2 = JSON.stringify({
      vote: "yea",
      confidence: -0.3,
      reasoning: "Negative confidence",
      key_factors: [],
    });

    const result2 = parseVoteResponse(text2);
    expect(result2.confidence).toBe(0);
  });

  it("handles non-numeric confidence — defaults to 0.5", () => {
    const text = JSON.stringify({
      vote: "yea",
      confidence: "high",
      reasoning: "Sure",
      key_factors: [],
    });

    const result = parseVoteResponse(text);
    expect(result.confidence).toBe(0.5);
  });

  it("handles missing reasoning — provides default", () => {
    const text = JSON.stringify({
      vote: "nay",
      confidence: 0.6,
    });

    const result = parseVoteResponse(text);
    expect(result.reasoning).toBeTruthy();
    expect(result.key_factors).toEqual([]);
  });

  it("handles non-array key_factors — defaults to empty array", () => {
    const text = JSON.stringify({
      vote: "yea",
      confidence: 0.8,
      reasoning: "Reasoning",
      key_factors: "not an array",
    });

    const result = parseVoteResponse(text);
    expect(result.key_factors).toEqual([]);
  });

  it("handles completely invalid text — returns safe defaults", () => {
    const result = parseVoteResponse("This is not JSON at all.");
    expect(result.vote).toBe("abstain");
    expect(result.confidence).toBe(0.3);
    expect(result.key_factors).toEqual(["analysis_error"]);
  });

  it("handles empty string", () => {
    const result = parseVoteResponse("");
    expect(result.vote).toBe("abstain");
    expect(result.confidence).toBe(0.3);
  });

  it("extracts JSON from mixed text response", () => {
    const text = `Let me analyze this bill for you.

After careful consideration: {"vote": "yea", "confidence": 0.91, "reasoning": "This aligns with your values.", "key_factors": ["economy", "taxes"]}

I hope this helps!`;

    const result = parseVoteResponse(text);
    expect(result.vote).toBe("yea");
    expect(result.confidence).toBe(0.91);
  });
});

describe("Score Description", () => {
  it("describes strong right-leaning score", () => {
    const desc = describeScore(0.8, "free market", "regulation");
    expect(desc).toContain("Strongly favors");
    expect(desc).toContain("free market");
  });

  it("describes leaning right score", () => {
    const desc = describeScore(0.3, "free market", "regulation");
    expect(desc).toContain("Leans toward");
    expect(desc).toContain("free market");
  });

  it("describes strong left-leaning score", () => {
    const desc = describeScore(-0.8, "free market", "regulation");
    expect(desc).toContain("Strongly favors");
    expect(desc).toContain("regulation");
  });

  it("describes leaning left score", () => {
    const desc = describeScore(-0.3, "free market", "regulation");
    expect(desc).toContain("Leans toward");
    expect(desc).toContain("regulation");
  });

  it("describes centrist score", () => {
    const desc = describeScore(0.05, "free market", "regulation");
    expect(desc).toContain("Moderate/centrist");
  });
});

describe("API Key Validation", () => {
  it("throws when no API key is available", () => {
    // Clear any env key
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => getClient()).toThrow("No Anthropic API key configured");

    // Restore
    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it("accepts explicit API key parameter", () => {
    // This should not throw — it creates the client with the given key
    const client = getClient("sk-test-key-12345");
    expect(client).toBeDefined();
  });
});
