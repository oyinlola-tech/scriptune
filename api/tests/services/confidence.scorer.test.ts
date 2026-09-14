import { describe, expect, it } from "vitest";
import { coverageOf, scoreHits } from "../../src/services/recognition/index.js";

describe("coverageOf", () => {
  it("measures the share of transcript words present in the candidate", () => {
    expect(coverageOf("for god so loved the world", "For God so loved the world, that he gave")).toBe(1);
    expect(coverageOf("for god so loved the moon", "For God so loved the world")).toBeCloseTo(0.8);
    expect(coverageOf("", "anything")).toBe(0);
  });
});

describe("scoreHits", () => {
  const transcript = "for god so loved the world that he gave his only begotten son";

  it("gives an exact match high confidence and scales the runner-up down", () => {
    const scored = scoreHits(
      transcript,
      [
        { item: "john", score: 0.41, text: "For God so loved the world, that he gave his only begotten Son" },
        { item: "1john", score: 0.24, text: "In this was manifested the love of God toward us, because that God sent his only begotten Son" },
      ],
      { expectedMaxScore: 0.42 },
    );
    expect(scored[0]?.item).toBe("john");
    expect(scored[0]?.confidence).toBeGreaterThanOrEqual(90);
    expect(scored[1]?.confidence).toBeLessThan(60);
  });

  it("drops candidates below the minimum confidence", () => {
    const scored = scoreHits(transcript, [{ item: "x", score: 0.01, text: "unrelated words entirely" }], { expectedMaxScore: 0.42 });
    expect(scored).toEqual([]);
  });

  it("keeps ordering by confidence", () => {
    const scored = scoreHits(
      "amazing grace how sweet the sound",
      [
        { item: "b", score: 0.3, text: "amazing grace how sweet the sound that saved" },
        { item: "a", score: 0.6, text: "amazing grace how sweet the sound" },
      ],
      { expectedMaxScore: 0.6 },
    );
    expect(scored.map((hit) => hit.item)).toEqual(["a", "b"]);
  });
});
