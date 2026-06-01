import { describe, expect, it } from "vitest";
import { isLikelyAiContent, scoreItem } from "@/lib/scoring";

describe("scoreItem", () => {
  it("rewards AI keywords, trusted links, and popularity", () => {
    const scored = scoreItem({
      sourceKind: "GITHUB",
      title: "open-source LLM agent framework",
      body: "RAG and benchmark tooling",
      url: "https://github.com/example/agent",
      metrics: { stars: 2500, forks: 180 }
    });

    expect(scored.score).toBeGreaterThan(80);
    expect(scored.signals).toContain("keyword:llm");
    expect(scored.signals).toContain("trusted-link");
  });

  it("penalizes low value content", () => {
    const useful = scoreItem({
      sourceKind: "X",
      title: "AI inference benchmark with full notes",
      url: "https://x.com/a/status/1",
      metrics: { likes: 1000, reposts: 200, replies: 40 }
    });
    const noisy = scoreItem({
      sourceKind: "X",
      title: "AI crypto pump giveaway meme",
      url: "https://x.com/a/status/2",
      metrics: { likes: 1000, reposts: 200, replies: 40 }
    });

    expect(useful.score).toBeGreaterThan(noisy.score);
  });
});

describe("isLikelyAiContent", () => {
  it("keeps AI-related content", () => {
    expect(isLikelyAiContent("Claude agent release")).toBe(true);
  });

  it("filters unrelated content", () => {
    expect(isLikelyAiContent("New CSS layout trick")).toBe(false);
  });
});
