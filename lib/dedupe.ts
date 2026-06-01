import crypto from "node:crypto";

export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|ref$|s$|t$|fbclid$|gclid$)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

export function stableExternalId(source: string, candidate: string) {
  return crypto.createHash("sha256").update(`${source}:${candidate}`).digest("hex").slice(0, 24);
}
