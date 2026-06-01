import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { ItemList } from "@/components/item-list";
import { Shell } from "@/components/shell";
import { getItems, getStats } from "@/lib/items";
import type { SourceKind } from "@/lib/scoring";

type PageProps = {
  searchParams?: Promise<{
    view?: "today" | "history" | "favorites";
    source?: SourceKind | "ALL";
    q?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const view = params.view ?? "today";
  const source = params.source ?? "ALL";
  const query = params.q?.trim();
  const [items, stats] = await Promise.all([getItems({ view, source, query }), getStats()]);

  return (
    <Shell stats={stats}>
      <FilterBar view={view} source={source} query={query} />
      <Suspense fallback={<div className="glass rounded-lg p-6 text-sm text-zinc-500">正在加载内容...</div>}>
        <ItemList items={items} />
      </Suspense>
    </Shell>
  );
}
