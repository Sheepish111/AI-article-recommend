import type { SourceKind } from "@/lib/scoring";

export const sourceLabels: Record<SourceKind | "ALL", string> = {
  ALL: "全部来源",
  GITHUB: "GitHub Trending",
  X: "X",
  REDDIT: "Reddit"
};

export const sourceDescriptions: Record<SourceKind, string> = {
  GITHUB: "开源项目、工具与库",
  X: "高互动 AI 讨论与发布",
  REDDIT: "社区长帖与实战经验"
};
