"use client";

import { useMemo, useState } from "react";
import { Bookmark, ExternalLink, MessageSquareText, Star } from "lucide-react";
import { sourceDescriptions, sourceLabels } from "@/lib/sources";
import type { getItems } from "@/lib/items";

type Item = Awaited<ReturnType<typeof getItems>>[number];

export function ItemList({ items }: { items: Item[] }) {
  if (!items.length) {
    return (
      <section className="glass rounded-lg p-8 text-center">
        <p className="text-sm font-medium text-zinc-700">还没有内容</p>
        <p className="mt-2 text-sm text-zinc-500">运行 `npm.cmd run collect` 后会显示每日聚合结果。</p>
      </section>
    );
  }

  return (
    <section className="glass rounded-lg p-3 grid gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </section>
  );
}

function ItemCard({ item }: { item: Item }) {
  const [favorite, setFavorite] = useState(Boolean(item.favorite));
  const [note, setNote] = useState(item.annotation?.note ?? "");
  const [openNote, setOpenNote] = useState(Boolean(item.annotation?.note));
  const metrics = useMemo(() => JSON.parse(item.metricsJson) as Record<string, number>, [item.metricsJson]);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const response = await fetch(`/api/items/${item.id}/favorite`, { method: "POST" });
    if (!response.ok) setFavorite(!next);
  }

  async function saveNote() {
    await fetch(`/api/items/${item.id}/annotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note })
    });
  }

  return (
    <article className="min-w-0 rounded-lg border border-white/60 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white/85">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 break-words">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-medium text-teal">
              {sourceLabels[item.source.kind]}
            </span>
            <span className="text-xs text-zinc-500">{sourceDescriptions[item.source.kind]}</span>
            <span className="text-xs text-zinc-400">{new Date(item.publishedAt).toLocaleString("zh-CN")}</span>
          </div>
          <a href={item.url} target="_blank" rel="noreferrer" className="group mt-2 block">
            <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-ink group-hover:text-teal">
              {item.title}
            </h2>
          </a>
          {item.body ? <p className="line-clamp-3 mt-2 text-sm leading-6 text-zinc-600">{item.body}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {item.author ? <span>{item.author}</span> : null}
            {Object.entries(metrics).map(([key, value]) => (
              <span key={key} className="rounded-md bg-white/55 px-2 py-1">
                {metricLabel(key)} {value}
              </span>
            ))}
            {item.qualitySignals ? <span className="rounded-md bg-white/55 px-2 py-1">{item.qualitySignals}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:flex-col">
          <div className="flex h-10 min-w-16 items-center justify-center gap-1 rounded-md bg-ink px-3 text-sm font-semibold text-white">
            <Star className="h-4 w-4" />
            {item.score}
          </div>
          <button
            aria-label={favorite ? "取消收藏" : "收藏"}
            onClick={toggleFavorite}
            className={`flex h-10 w-10 items-center justify-center rounded-md border transition ${
              favorite ? "border-coral bg-coral text-white" : "border-white/70 bg-white/60 text-zinc-600 hover:bg-white"
            }`}
          >
            <Bookmark className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            aria-label="编辑备注"
            onClick={() => setOpenNote((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/70 bg-white/60 text-zinc-600 transition hover:bg-white"
          >
            <MessageSquareText className="h-4 w-4" />
          </button>
          <a
            aria-label="打开原文"
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/70 bg-white/60 text-zinc-600 transition hover:bg-white"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      {openNote ? (
        <div className="mt-4 rounded-lg border border-white/60 bg-white/45 p-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={saveNote}
            placeholder="写下为什么值得收藏、后续行动或你的判断..."
            className="min-h-24 w-full resize-y rounded-md border border-white/70 bg-white/70 p-3 text-sm outline-none ring-teal/20 transition focus:ring-4"
          />
          <div className="mt-2 text-xs text-zinc-500">离开输入框时自动保存</div>
        </div>
      ) : null}
    </article>
  );
}

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    stars: "Stars",
    forks: "Forks",
    likes: "Likes",
    reposts: "Reposts",
    replies: "Replies",
    upvotes: "Upvotes",
    comments: "Comments"
  };
  return labels[key] ?? key;
}
