import { stableExternalId } from "@/lib/dedupe";
import { isLikelyAiContent } from "@/lib/scoring";
import type { Provider, ProviderResult, RawItem } from "@/lib/providers/types";

type ApifyTweet = {
  id?: string;
  url?: string;
  text?: string;
  fullText?: string;
  author?: { userName?: string; name?: string };
  username?: string;
  createdAt?: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
};

function parseInput() {
  const raw = process.env.APIFY_X_INPUT_JSON;
  if (!raw) {
    return {
      searchTerms: ["AI OR LLM OR OpenAI OR Claude OR agent lang:en"],
      maxItems: 30,
      sort: "Latest"
    };
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

export const xApifyProvider: Provider = {
  sourceKind: "X",
  sourceName: "X",
  async collect(): Promise<ProviderResult> {
    const token = process.env.APIFY_TOKEN;
    const actor = process.env.APIFY_X_ACTOR ?? "apidojo/tweet-scraper";
    if (!token) {
      return { items: [], errors: ["X Apify skipped: APIFY_TOKEN is not configured"] };
    }

    try {
      const actorId = actor.replace("/", "~");
      const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseInput())
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const tweets = (await response.json()) as ApifyTweet[];

      const items: RawItem[] = tweets
        .map((tweet) => {
          const text = tweet.fullText ?? tweet.text ?? "";
          const url =
            tweet.url ??
            (tweet.author?.userName && tweet.id ? `https://x.com/${tweet.author.userName}/status/${tweet.id}` : "");
          return {
            sourceKind: "X" as const,
            sourceName: "X",
            externalId: tweet.id ? `x_${tweet.id}` : stableExternalId("x", url || text),
            url,
            title: text.split("\n")[0].slice(0, 140) || "Untitled X post",
            body: text,
            author: tweet.author?.userName ? `@${tweet.author.userName}` : tweet.username ? `@${tweet.username}` : null,
            publishedAt: tweet.createdAt ? new Date(tweet.createdAt) : new Date(),
            metrics: {
              likes: tweet.likeCount ?? 0,
              reposts: (tweet.retweetCount ?? 0) + (tweet.quoteCount ?? 0),
              replies: tweet.replyCount ?? 0
            }
          };
        })
        .filter((item) => item.url && isLikelyAiContent(item.title, item.body));

      return { items, errors: [] };
    } catch (error) {
      return { items: [], errors: [`X Apify: ${error instanceof Error ? error.message : String(error)}`] };
    }
  }
};
