import { Clock3, Database, Heart, Sparkles } from "lucide-react";
import type { getStats } from "@/lib/items";

type Props = {
  children: React.ReactNode;
  stats: Awaited<ReturnType<typeof getStats>>;
};

export function Shell({ children, stats }: Props) {
  const lastRun = stats.lastRuns[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="glass rounded-lg px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-teal">
              <Sparkles className="h-4 w-4" />
              AI Signal Hub
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
              每日 AI 高价值内容流
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat icon={<Clock3 className="h-4 w-4" />} label="今日" value={stats.todayCount.toString()} />
            <Stat icon={<Database className="h-4 w-4" />} label="历史" value={stats.total.toString()} />
            <Stat icon={<Heart className="h-4 w-4" />} label="收藏" value={stats.favoriteCount.toString()} />
            <Stat
              icon={<Clock3 className="h-4 w-4" />}
              label="最近采集"
              value={lastRun?.finishedAt ? new Date(lastRun.finishedAt).toLocaleDateString("zh-CN") : "未运行"}
            />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/60 bg-white/50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
