import * as cheerio from "cheerio";
import { stableExternalId } from "@/lib/dedupe";
import { isLikelyAiContent } from "@/lib/scoring";
import type { Provider, ProviderResult, RawItem } from "@/lib/providers/types";

const trendingUrls = [
  "https://github.com/trending/typescript?since=daily",
  "https://github.com/trending/python?since=daily",
  "https://github.com/trending?since=daily"
];

function parseCount(text: string) {
  const normalized = text.trim().replace(/,/g, "").toLowerCase();
  if (normalized.endsWith("k")) return Math.round(Number.parseFloat(normalized) * 1000);
  return Number.parseInt(normalized, 10) || 0;
}

export const githubTrendingProvider: Provider = {
  sourceKind: "GITHUB",
  sourceName: "GitHub Trending",
  async collect(): Promise<ProviderResult> {
    const items: RawItem[] = [];
    const errors: string[] = [];

    for (const url of trendingUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "ai-signal-hub/0.1",
            Accept: "text/html"
          }
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        $("article.Box-row").each((_, element) => {
          const repoPath = $(element).find("h2 a").text().replace(/\s+/g, "").trim();
          if (!repoPath) return;
          const title = repoPath;
          const body = $(element).find("p").first().text().trim();
          if (!isLikelyAiContent(title, body)) return;

          const repoUrl = `https://github.com/${repoPath}`;
          const starText = $(element).find('a[href$="/stargazers"]').first().text();
          const forkText = $(element).find('a[href$="/forks"]').first().text();
          const todayStarsText = $(element).find("span.float-sm-right").text();
          const todayStars = parseCount(todayStarsText.replace(/stars today/i, ""));

          items.push({
            sourceKind: "GITHUB",
            sourceName: "GitHub Trending",
            externalId: stableExternalId("github", repoUrl),
            url: repoUrl,
            title,
            body,
            author: repoPath.split("/")[0],
            publishedAt: new Date(),
            metrics: {
              stars: Math.max(parseCount(starText), todayStars),
              forks: parseCount(forkText)
            }
          });
        });
      } catch (error) {
        errors.push(`GitHub Trending ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { items, errors };
  }
};
