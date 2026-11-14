export type AutoRefreshIntervalSec = 60 | 300 | 900 | 0;

export interface LiveTickerQuote {
  entityKey: string;
  symbol: string;
  displayNameKo: string;
  exchange: string;
  segment: "supplier" | "frontier-lab" | "neocloud" | "benchmark";
  price: number | null;
  currency: string;
  dayChangePct: number | null;
  monthChangePct: number | null;
  marketTimeIso: string | null;
  status: "live" | "fallback";
}

export interface LiveIntelItem {
  id: string;
  title: string;
  source: string;
  kind: "news" | "filing";
  url: string;
  publishedAtIso: string;
  matchedTags: string[];
}

export interface FabnowLivePayload {
  syncedAt: string;
  ttlSeconds: number;
  quotesStatus: "live" | "partial" | "fallback";
  newsStatus: "live" | "fallback";
  quotes: LiveTickerQuote[];
  headlines: LiveIntelItem[];
  liveStats: {
    liveQuotesCount: number;
    totalQuotesCount: number;
    liveHeadlinesCount: number;
  };
}
