export type SourceKind = "GITHUB" | "X" | "REDDIT";

export type ItemMetrics = {
  stars?: number;
  forks?: number;
  likes?: number;
  reposts?: number;
  replies?: number;
  upvotes?: number;
  comments?: number;
};

export type ScoredInput = {
  sourceKind: SourceKind;
  title: string;
  body?: string | null;
  url: string;
  metrics: ItemMetrics;
};

const aiKeywords = [
  "ai",
  "llm",
  "agent",
  "openai",
  "claude",
  "gemini",
  "模型",
  "人工智能",
  "rag",
  "inference",
  "benchmark",
  "transformer",
  "multimodal"
];

const lowValueWords = ["giveaway", "airdrop", "meme", "shitpost", "crypto pump"];

function logBoost(value = 0, weight = 1) {
  return Math.log10(Math.max(value, 0) + 1) * weight;
}

export function scoreItem(input: ScoredInput) {
  const haystack = `${input.title} ${input.body ?? ""} ${input.url}`.toLowerCase();
  const keywordHits = aiKeywords.filter((word) => haystack.includes(word.toLowerCase()));
  const lowValueHits = lowValueWords.filter((word) => haystack.includes(word));
  const m = input.metrics;

  let popularity = 0;
  if (input.sourceKind === "GITHUB") {
    popularity = logBoost(m.stars, 28) + logBoost(m.forks, 8);
  } else if (input.sourceKind === "X") {
    popularity = logBoost(m.likes, 16) + logBoost(m.reposts, 12) + logBoost(m.replies, 5);
  } else {
    popularity = logBoost(m.upvotes, 14) + logBoost(m.comments, 8);
  }

  const keywordBoost = Math.min(keywordHits.length * 7, 28);
  const linkBoost = /github\.com|arxiv\.org|huggingface\.co|openai\.com|anthropic\.com/i.test(input.url)
    ? 8
    : 0;
  const penalty = lowValueHits.length * 18;
  const score = Math.max(0, Math.round((popularity + keywordBoost + linkBoost - penalty) * 10) / 10);

  return {
    score,
    signals: [...keywordHits.map((word) => `keyword:${word}`), linkBoost ? "trusted-link" : ""]
      .filter(Boolean)
      .join(", ")
  };
}

export function isLikelyAiContent(title: string, body?: string | null) {
  const haystack = `${title} ${body ?? ""}`.toLowerCase();
  return aiKeywords.some((word) => haystack.includes(word.toLowerCase()));
}
