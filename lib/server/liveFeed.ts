import "server-only";
import { PUBLIC_TICKERS, type PublicTickerMeta } from "@/lib/data/fabnow";
import type {
  FabnowLivePayload,
  LiveIntelItem,
  LiveTickerQuote,
} from "@/lib/live/types";

const TTL_SECONDS = 300;
const FETCH_TIMEOUT_MS = 4500;

const TAG_MATCHERS: Array<{ tag: string; patterns: RegExp }> = [
  { tag: "TSMC", patterns: /\btsmc\b|\btaiwan semiconductor\b|\bn2\b|\bn3p\b|\bcowos\b/i },
  { tag: "SK hynix", patterns: /\bsk\s*hynix\b|\bhynix\b/i },
  { tag: "Samsung", patterns: /\bsamsung\b|\bsf2\b/i },
  { tag: "Micron", patterns: /\bmicron\b/i },
  { tag: "Intel", patterns: /\bintel\b|\b18a\b/i },
  { tag: "HBM", patterns: /\bhbm\b|\bhbm3e\b|\bhbm4\b/i },
  { tag: "CoWoS", patterns: /\bcowos\b|\bpackaging\b/i },
  { tag: "NVIDIA", patterns: /\bnvidia\b|\bblackwell\b|\brubin\b|\bb200\b|\bgb200\b|\bgb300\b/i },
  { tag: "OpenAI", patterns: /\bopenai\b|\bstargate\b/i },
  { tag: "Anthropic", patterns: /\banthropic\b|\bclaude\b/i },
  { tag: "Google", patterns: /\bgoogle\b|\bdeepmind\b|\btpu\b/i },
  { tag: "xAI", patterns: /\bxai\b|\bcolossus\b/i },
  { tag: "Meta", patterns: /\bmeta\b|\bllama\b/i },
  { tag: "CoreWeave", patterns: /\bcoreweave\b|\bcrwv\b/i },
  { tag: "Nebius", patterns: /\bnebius\b|\bnbis\b/i },
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeHttpsUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol === "https:" || u.protocol === "http:") {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function extractTagValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  return match ? decodeHtmlEntities(match[1]) : "";
}

function extractAtomLink(block: string): string {
  const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (hrefMatch?.[1]) return hrefMatch[1];
  return extractTagValue(block, "link");
}

function detectTags(text: string): string[] {
  const found: string[] = [];
  for (const m of TAG_MATCHERS) {
    if (m.patterns.test(text)) {
      found.push(m.tag);
    }
  }
  return found.slice(0, 4);
}

function roundPct(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Runtime-safe fetch wrapper compatible with both Node.js and Cloudflare Workers (`workerd`).
 * Avoids `RequestInit.cache` (which throws in workerd) and cleans up AbortController timers.
 */
async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYahooQuote(
  meta: PublicTickerMeta
): Promise<LiveTickerQuote> {
  const fallback: LiveTickerQuote = {
    ...meta,
    price: null,
    currency: meta.symbol.endsWith(".KS") ? "KRW" : "USD",
    dayChangePct: null,
    monthChangePct: null,
    marketTimeIso: null,
    status: "fallback",
  };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      meta.symbol
    )}?range=1mo&interval=1d`;

    const res = await fetchWithTimeout(url, {
      "User-Agent": "Mozilla/5.0 (compatible; fabnow-intel/1.0)",
      Accept: "application/json",
    });

    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            currency?: string;
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            regularMarketTime?: number;
          };
          indicators?: {
            quote?: Array<{ close?: Array<number | null> }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    const chartMeta = result?.meta;
    if (!chartMeta || typeof chartMeta.regularMarketPrice !== "number") {
      return fallback;
    }

    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0
    );

    const price = chartMeta.regularMarketPrice;
    const prevClose =
      closes.length >= 2
        ? closes[closes.length - 2]
        : typeof chartMeta.chartPreviousClose === "number" &&
          chartMeta.chartPreviousClose > 0
        ? chartMeta.chartPreviousClose
        : null;

    const firstClose = closes.length > 0 ? closes[0] : prevClose;

    const dayChangePct =
      prevClose && prevClose > 0
        ? roundPct(((price - prevClose) / prevClose) * 100)
        : null;
    const monthChangePct =
      firstClose && firstClose > 0
        ? roundPct(((price - firstClose) / firstClose) * 100)
        : null;

    const marketTimeIso =
      typeof chartMeta.regularMarketTime === "number"
        ? new Date(chartMeta.regularMarketTime * 1000).toISOString()
        : null;

    return {
      ...meta,
      price,
      currency: chartMeta.currency ?? fallback.currency,
      dayChangePct,
      monthChangePct,
      marketTimeIso,
      status: "live",
    };
  } catch {
    return fallback;
  }
}

function parseRssOrAtomItems(
  xml: string,
  defaultSource: string,
  kind: "news" | "filing"
): LiveIntelItem[] {
  const items: LiveIntelItem[] = [];
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const entryMatches = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = [...itemMatches, ...entryMatches];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const title = extractTagValue(block, "title");
    const rawLink =
      kind === "filing"
        ? extractAtomLink(block)
        : extractTagValue(block, "link") || extractAtomLink(block);
    const safeUrl = sanitizeHttpsUrl(rawLink);
    if (!title || !safeUrl) continue;

    const sourceTag = extractTagValue(block, "source") || defaultSource;
    const rawDate =
      extractTagValue(block, "pubDate") ||
      extractTagValue(block, "updated") ||
      extractTagValue(block, "published");
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const publishedAtIso = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    items.push({
      id: `${kind}-${i}-${safeUrl.slice(-24)}`,
      title,
      source: sourceTag,
      kind,
      url: safeUrl,
      publishedAtIso,
      matchedTags: detectTags(`${title} ${sourceTag}`),
    });
  }

  return items;
}

async function fetchHeadlineFeeds(): Promise<LiveIntelItem[]> {
  const sources: Array<{
    url: string;
    source: string;
    kind: "news" | "filing";
    headers?: Record<string, string>;
  }> = [
    {
      url: "https://news.google.com/rss/search?q=(TSMC+OR+%22SK+hynix%22+OR+HBM4+OR+CoWoS+OR+CoreWeave+OR+Anthropic+OR+OpenAI)+semiconductor&hl=en-US&gl=US&ceid=US:en",
      source: "Google News",
      kind: "news",
    },
    {
      url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=TSM,MU,NVDA,INTC,CRWV,NBIS&region=US&lang=en-US",
      source: "Yahoo Finance",
      kind: "news",
    },
    {
      // TSMC (0001046179) & Micron (0000723125) / NVIDIA (0001045810) recent filings via SEC EDGAR Atom
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K&dateb=&owner=include&count=5&output=atom",
      source: "SEC EDGAR (NVDA)",
      kind: "filing",
      headers: {
        "User-Agent": "fabnow-intel/1.0 (https://fabnow.workers.dev)",
        Accept: "application/atom+xml, application/xml",
      },
    },
    {
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001046179&type=6-K&dateb=&owner=include&count=5&output=atom",
      source: "SEC EDGAR (TSM)",
      kind: "filing",
      headers: {
        "User-Agent": "fabnow-intel/1.0 (https://fabnow.workers.dev)",
        Accept: "application/atom+xml, application/xml",
      },
    },
  ];

  const settled = await Promise.allSettled(
    sources.map(async (src) => {
      const res = await fetchWithTimeout(
        src.url,
        src.headers ?? {
          "User-Agent": "Mozilla/5.0 (compatible; fabnow-intel/1.0)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        }
      );
      if (!res.ok) return [] as LiveIntelItem[];
      const xml = await res.text();
      return parseRssOrAtomItems(xml, src.source, src.kind);
    })
  );

  const combined: LiveIntelItem[] = [];
  const seenTitles = new Set<string>();

  for (const res of settled) {
    if (res.status !== "fulfilled") continue;
    for (const item of res.value) {
      const norm = item.title.toLowerCase().slice(0, 72);
      if (seenTitles.has(norm)) continue;
      seenTitles.add(norm);
      combined.push(item);
    }
  }

  return combined
    .sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso))
    .slice(0, 12);
}

/**
 * Fetches live public semiconductor market quotes, news RSS, and SEC filings.
 * Gracefully degrades per source so Cloudflare Workers builds & airgapped previews remain stable.
 */
export async function fetchLiveFabnowTelemetry(options?: {
  forceRefresh?: boolean;
}): Promise<FabnowLivePayload> {
  void options?.forceRefresh;

  const [quotesSettled, headlines] = await Promise.all([
    Promise.all(PUBLIC_TICKERS.map((meta) => fetchYahooQuote(meta))),
    fetchHeadlineFeeds(),
  ]);

  const liveQuotesCount = quotesSettled.filter((q) => q.status === "live").length;
  const quotesStatus: FabnowLivePayload["quotesStatus"] =
    liveQuotesCount === quotesSettled.length
      ? "live"
      : liveQuotesCount > 0
      ? "partial"
      : "fallback";

  return {
    syncedAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
    quotesStatus,
    newsStatus: headlines.length > 0 ? "live" : "fallback",
    quotes: quotesSettled,
    headlines,
    liveStats: {
      liveQuotesCount,
      totalQuotesCount: quotesSettled.length,
      liveHeadlinesCount: headlines.length,
    },
  };
}
