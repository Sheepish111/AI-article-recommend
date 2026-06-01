import { prisma } from "@/lib/prisma";
import { normalizeUrl, stableExternalId } from "@/lib/dedupe";
import { providers } from "@/lib/providers";
import { scoreItem } from "@/lib/scoring";
import type { RawItem } from "@/lib/providers/types";

async function ensureSource(item: RawItem) {
  return prisma.source.upsert({
    where: {
      kind_name: {
        kind: item.sourceKind,
        name: item.sourceName
      }
    },
    update: { enabled: true },
    create: {
      kind: item.sourceKind,
      name: item.sourceName,
      homepageUrl:
        item.sourceKind === "GITHUB"
          ? "https://github.com/trending"
          : item.sourceKind === "X"
            ? "https://x.com"
            : "https://www.reddit.com"
    }
  });
}

async function upsertItem(item: RawItem) {
  const source = await ensureSource(item);
  const url = normalizeUrl(item.url);
  const scored = scoreItem({
    sourceKind: item.sourceKind,
    title: item.title,
    body: item.body,
    url,
    metrics: item.metrics
  });

  const externalId = item.externalId ?? stableExternalId(item.sourceKind, url);
  const existing = await prisma.item.findFirst({
    where: {
      OR: [{ url }, { sourceId: source.id, externalId }]
    }
  });

  if (existing) {
    await prisma.item.update({
      where: { id: existing.id },
      data: {
        title: item.title,
        body: item.body,
        author: item.author,
        publishedAt: item.publishedAt,
        metricsJson: JSON.stringify(item.metrics),
        score: scored.score,
        qualitySignals: scored.signals
      }
    });
    return "updated" as const;
  }

  await prisma.item.create({
    data: {
      sourceId: source.id,
      externalId,
      url,
      title: item.title,
      body: item.body,
      author: item.author,
      publishedAt: item.publishedAt,
      category: item.sourceKind,
      metricsJson: JSON.stringify(item.metrics),
      score: scored.score,
      qualitySignals: scored.signals
    }
  });
  return "inserted" as const;
}

async function main() {
  for (const provider of providers) {
    const source = await prisma.source.upsert({
      where: { kind_name: { kind: provider.sourceKind, name: provider.sourceName } },
      update: { enabled: true },
      create: {
        kind: provider.sourceKind,
        name: provider.sourceName,
        homepageUrl:
          provider.sourceKind === "GITHUB"
            ? "https://github.com/trending"
            : provider.sourceKind === "X"
              ? "https://x.com"
              : "https://www.reddit.com"
      }
    });
    const run = await prisma.dailyRun.create({
      data: { sourceId: source.id, status: "running" }
    });

    let inserted = 0;
    let updated = 0;
    try {
      const result = await provider.collect();
      for (const item of result.items) {
        const outcome = await upsertItem(item);
        if (outcome === "inserted") inserted += 1;
        if (outcome === "updated") updated += 1;
      }

      await prisma.dailyRun.update({
        where: { id: run.id },
        data: {
          status: result.errors.length ? "partial" : "success",
          inserted,
          updated,
          error: result.errors.join("\n") || null,
          finishedAt: new Date()
        }
      });
      console.log(`${provider.sourceName}: inserted ${inserted}, updated ${updated}`);
      if (result.errors.length) console.warn(result.errors.join("\n"));
    } catch (error) {
      await prisma.dailyRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          inserted,
          updated,
          error: error instanceof Error ? error.message : String(error),
          finishedAt: new Date()
        }
      });
      console.error(`${provider.sourceName}: failed`, error);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
