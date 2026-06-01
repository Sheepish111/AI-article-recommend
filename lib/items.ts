import { prisma } from "@/lib/prisma";
import type { SourceKind } from "@/lib/scoring";

export type ItemFilter = {
  view?: "today" | "history" | "favorites";
  source?: SourceKind | "ALL";
  query?: string;
};

export async function getItems(filter: ItemFilter = {}) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  return prisma.item.findMany({
    where: {
      ...(filter.view === "today" ? { collectedAt: { gte: since } } : {}),
      ...(filter.view === "favorites" ? { favorite: { isNot: null } } : {}),
      ...(filter.source && filter.source !== "ALL" ? { source: { kind: filter.source } } : {}),
      ...(filter.query
        ? {
            OR: [
              { title: { contains: filter.query } },
              { body: { contains: filter.query } },
              { author: { contains: filter.query } }
            ]
          }
        : {})
    },
    include: {
      source: true,
      favorite: true,
      annotation: true
    },
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
    take: 200
  });
}

export async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [total, todayCount, favoriteCount, lastRuns] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { collectedAt: { gte: today } } }),
    prisma.favorite.count(),
    prisma.dailyRun.findMany({
      include: { source: true },
      orderBy: { startedAt: "desc" },
      take: 3
    })
  ]);

  return { total, todayCount, favoriteCount, lastRuns };
}
