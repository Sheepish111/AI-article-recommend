import { stableExternalId } from "@/lib/dedupe";
import { isLikelyAiContent } from "@/lib/scoring";
import type { Provider, ProviderResult, RawItem } from "@/lib/providers/types";
import * as cheerio from "cheerio";

const defaultSubreddits = ["LocalLLaMA", "MachineLearning", "OpenAI", "ArtificialInteligence", "singularity"];

type RedditChild = {
  data: {
    id: string;
    title: string;
    selftext?: string;
    author?: string;
    permalink: string;
    url?: string;
    created_utc: number;
    ups?: number;
    num_comments?: number;
  };
};

export const redditProvider: Provider = {
  sourceKind: "REDDIT",
  sourceName: "Reddit",
  async collect(): Promise<ProviderResult> {
    const items: RawItem[] = [];
    const errors: string[] = [];
    const subreddits = (process.env.REDDIT_SUBREDDITS ?? defaultSubreddits.join(","))
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    for (const subreddit of subreddits) {
      const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=25`;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": process.env.REDDIT_USER_AGENT ?? "ai-signal-hub/0.1",
            Accept: "application/json"
          }
        });
        if (!response.ok) {
          const fallback = await collectRedditRss(subreddit);
          items.push(...fallback.items);
          errors.push(...fallback.errors);
          continue;
        }
        const json = (await response.json()) as { data?: { children?: RedditChild[] } };

        for (const child of json.data?.children ?? []) {
          const post = child.data;
          if (!isLikelyAiContent(post.title, post.selftext)) continue;
          items.push({
            sourceKind: "REDDIT",
            sourceName: "Reddit",
            externalId: `reddit_${post.id}`,
            url: post.url || `https://www.reddit.com${post.permalink}`,
            title: post.title,
            body: post.selftext?.slice(0, 600) ?? null,
            author: post.author ? `u/${post.author}` : null,
            publishedAt: new Date(post.created_utc * 1000),
            metrics: {
              upvotes: post.ups ?? 0,
              comments: post.num_comments ?? 0
            }
          });
        }
      } catch (error) {
        errors.push(`Reddit r/${subreddit}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      items: items.map((item) => ({
        ...item,
        externalId: item.externalId ?? stableExternalId("reddit", item.url)
      })),
      errors
    };
  }
};

async function collectRedditRss(subreddit: string): Promise<ProviderResult> {
  const url = `https://www.reddit.com/r/${subreddit}/top.rss?t=day`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.REDDIT_USER_AGENT ?? "ai-signal-hub/0.1",
        Accept: "application/atom+xml, application/xml, text/xml"
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: RawItem[] = [];

    $("entry").each((_, entry) => {
      const title = $(entry).find("title").first().text().trim();
      const body = $(entry).find("content").first().text().replace(/\s+/g, " ").trim().slice(0, 600);
      if (!isLikelyAiContent(title, body)) return;
      const link = $(entry).find("link").first().attr("href") ?? `https://www.reddit.com/r/${subreddit}`;
      const id = $(entry).find("id").first().text().trim() || stableExternalId("reddit-rss", link);
      const author = $(entry).find("author name").first().text().trim();
      const updated = $(entry).find("updated").first().text().trim();

      items.push({
        sourceKind: "REDDIT",
        sourceName: "Reddit",
        externalId: stableExternalId("reddit-rss", id),
        url: link,
        title,
        body,
        author: author || `r/${subreddit}`,
        publishedAt: updated ? new Date(updated) : new Date(),
        metrics: {
          upvotes: 0,
          comments: 0
        }
      });
    });

    return { items, errors: [`Reddit r/${subreddit}: JSON blocked, used RSS fallback`] };
  } catch (error) {
    return {
      items: [],
      errors: [`Reddit r/${subreddit}: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}
