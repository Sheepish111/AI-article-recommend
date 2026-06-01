import type { ItemMetrics, SourceKind } from "@/lib/scoring";

export type RawItem = {
  sourceKind: SourceKind;
  sourceName: string;
  externalId?: string;
  url: string;
  title: string;
  body?: string | null;
  author?: string | null;
  publishedAt: Date;
  metrics: ItemMetrics;
};

export type ProviderResult = {
  items: RawItem[];
  errors: string[];
};

export type Provider = {
  sourceKind: SourceKind;
  sourceName: string;
  collect(): Promise<ProviderResult>;
};
