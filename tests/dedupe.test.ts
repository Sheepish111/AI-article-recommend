import { describe, expect, it } from "vitest";
import { normalizeUrl, stableExternalId } from "@/lib/dedupe";

describe("normalizeUrl", () => {
  it("removes tracking params and hash", () => {
    expect(normalizeUrl("https://example.com/a/?utm_source=x&ref=y#section")).toBe("https://example.com/a");
  });
});

describe("stableExternalId", () => {
  it("is stable for the same input", () => {
    expect(stableExternalId("x", "123")).toBe(stableExternalId("x", "123"));
  });
});
