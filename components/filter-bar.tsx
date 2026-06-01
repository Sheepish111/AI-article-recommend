import { Search } from "lucide-react";
import type { SourceKind } from "@/lib/scoring";
import { sourceLabels } from "@/lib/sources";

type Props = {
  view: "today" | "history" | "favorites";
  source: SourceKind | "ALL";
  query?: string;
};

const views = [
  ["today", "今日最新"],
  ["history", "历史汇集"],
  ["favorites", "收藏"]
] as const;

const sources = ["ALL", "GITHUB", "X", "REDDIT"] as const;

export function FilterBar({ view, source, query }: Props) {
  return (
    <section className="glass rounded-lg p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-2">
          {views.map(([id, label]) => (
            <a
              key={id}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                view === id ? "bg-ink text-white" : "bg-white/55 text-zinc-600 hover:bg-white"
              }`}
              href={`/?view=${id}&source=${source}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <form className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <input type="hidden" name="view" value={view} />
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="搜索标题、作者、摘要"
              className="h-10 w-full rounded-md border border-white/70 bg-white/70 pl-9 pr-3 text-sm outline-none ring-teal/20 transition focus:ring-4"
            />
          </label>
          <select
            name="source"
            defaultValue={source}
            className="h-10 rounded-md border border-white/70 bg-white/70 px-3 text-sm outline-none ring-teal/20 transition focus:ring-4"
          >
            {sources.map((item) => (
              <option key={item} value={item}>
                {sourceLabels[item]}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-md bg-teal px-4 text-sm font-semibold text-white transition hover:brightness-95">
            筛选
          </button>
        </form>
      </div>
    </section>
  );
}
