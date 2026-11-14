"use client";

import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  IconArrowPath,
  IconExternalLink,
  IconPulse,
  IconTrendDown,
  IconTrendUp,
} from "@/components/ui";
import { useFabnowLive } from "@/context/FabnowLiveContext";
import type { AutoRefreshIntervalSec, LiveTickerQuote } from "@/lib/live/types";
import { triggerHaptic } from "@/lib/haptics";

const INTERVAL_OPTIONS: Array<{ value: AutoRefreshIntervalSec; label: string }> = [
  { value: 60, label: "1분" },
  { value: 300, label: "5분" },
  { value: 900, label: "15분" },
  { value: 0, label: "일시정지" },
];

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatLocalTime(iso: string | null): string {
  if (!iso) return "동기화 대기 중";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "동기화 완료";
  return d.toLocaleTimeString("ko-KR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatPublishedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatQuotePrice(q: LiveTickerQuote): string {
  if (q.price === null) return "대기 중";
  if (q.currency === "KRW") {
    return `₩${Math.round(q.price).toLocaleString("en-US")}`;
  }
  return `$${q.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function LiveTelemetryPanel() {
  const {
    liveData,
    isRefreshing,
    lastSyncedAt,
    intervalSec,
    nextRefreshInSec,
    setIntervalSec,
    refreshNow,
  } = useFabnowLive();

  const [feedFilter, setFeedFilter] = useState<"all" | "news" | "filing">("all");
  const [showAllQuotes, setShowAllQuotes] = useState<boolean>(false);

  const visibleQuotes = useMemo(() => {
    const quotes = liveData?.quotes ?? [];
    if (showAllQuotes) return quotes;
    return quotes.slice(0, 6);
  }, [liveData?.quotes, showAllQuotes]);

  const filteredHeadlines = useMemo(() => {
    const items = liveData?.headlines ?? [];
    if (feedFilter === "all") return items.slice(0, 6);
    return items.filter((item) => item.kind === feedFilter).slice(0, 6);
  }, [liveData?.headlines, feedFilter]);

  const statusBadge = useMemo(() => {
    if (isRefreshing && !liveData) {
      return { variant: "info" as const, label: "실시간 피드 연결 중…" };
    }
    if (!liveData) {
      return { variant: "warning" as const, label: "피드 초기화 대기" };
    }
    if (liveData.quotesStatus === "live" && liveData.newsStatus === "live") {
      return {
        variant: "success" as const,
        label: `LIVE · 시세 ${liveData.liveStats.liveQuotesCount}/${liveData.liveStats.totalQuotesCount} · 피드 ${liveData.liveStats.liveHeadlinesCount}건`,
      };
    }
    if (liveData.quotesStatus === "partial" || liveData.liveStats.liveQuotesCount > 0 || liveData.newsStatus === "live") {
      return {
        variant: "info" as const,
        label: `부분 동기화 · 시세 ${liveData.liveStats.liveQuotesCount}/${liveData.liveStats.totalQuotesCount} · 피드 ${liveData.liveStats.liveHeadlinesCount}건`,
      };
    }
    return {
      variant: "warning" as const,
      label: "기준 지표 폴백 (오프라인/제한 네트워크)",
    };
  }, [isRefreshing, liveData]);

  return (
    <section
      aria-label="실시간 시장 시세 및 공시·뉴스 자동 동기화"
      className="material-regular rounded-3xl p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Top Auto-Refresh Sync Header */}
      <div
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-2xl bg-primary/14 text-accent-primary shrink-0">
              <IconPulse className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-base-content">
              실시간 시장 지표 · 공시·뉴스 자동 동기화
            </h2>
            <Badge variant={statusBadge.variant} size="xs">
              {statusBadge.label}
            </Badge>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tabular-nums"
            style={{ color: "var(--label-secondary)" }}
          >
            <span>마지막 동기화: {formatLocalTime(lastSyncedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {intervalSec > 0
                ? `다음 자동 갱신: ${formatCountdown(nextRefreshInSec)} (${intervalSec / 60}분 주기 · 탭 전환 시 절전)`
                : "자동 갱신 일시정지됨"}
            </span>
          </div>
        </div>

        {/* Cadence Controls + Instant Manual Sync */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center rounded-2xl p-1 bg-base-200/75 border border-base-content/10"
            role="group"
            aria-label="자동 갱신 주기 선택"
          >
            {INTERVAL_OPTIONS.map((opt) => {
              const active = intervalSec === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIntervalSec(opt.value);
                  }}
                  aria-pressed={active}
                  className={`min-h-[44px] px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                    active
                      ? "bg-primary text-primary-content shadow-xs"
                      : "text-base-content/75 hover:text-base-content hover:bg-base-content/5"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="soft"
            leadingIcon={<IconArrowPath className="w-4 h-4" />}
            isLoading={isRefreshing}
            loadingLabel="갱신 중…"
            onClick={() => {
              triggerHaptic("selection");
              void refreshNow({ manual: true });
            }}
          >
            지금 갱신
          </Button>
        </div>
      </div>

      {/* Live Equity & Benchmark Signals Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-base-content">
            공급사·AI 인프라 실시간 시장 지표 (1일 / 1개월 변동)
          </p>
          {(liveData?.quotes.length ?? 0) > 6 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setShowAllQuotes((prev) => !prev);
              }}
              className="min-h-[44px] text-xs font-bold text-accent-primary hover:underline cursor-pointer px-2.5 inline-flex items-center"
            >
              {showAllQuotes ? "주요 6종만 보기" : `전체 ${liveData?.quotes.length ?? 0}종 보기`}
            </button>
          )}
        </div>

        {visibleQuotes.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-3 bg-base-200/50 border border-base-content/8 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {visibleQuotes.map((q) => {
              const dayUp = typeof q.dayChangePct === "number" && q.dayChangePct >= 0;
              const monthUp = typeof q.monthChangePct === "number" && q.monthChangePct >= 0;
              return (
                <div
                  key={q.symbol}
                  className="bg-base-100 rounded-2xl p-3 border border-base-content/12 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-xs font-extrabold text-base-content truncate">
                      {q.displayNameKo}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-base-200 text-base-content/75 shrink-0 tabular-nums"
                    >
                      {q.symbol}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-base-content tabular-nums">
                    {formatQuotePrice(q)}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 text-[10.5px] sm:text-[11px] font-bold tabular-nums whitespace-nowrap">
                    {q.dayChangePct !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 shrink-0 ${
                          dayUp ? "text-status-success" : "text-status-error"
                        }`}
                      >
                        {dayUp ? (
                          <IconTrendUp className="w-3 h-3 shrink-0" />
                        ) : (
                          <IconTrendDown className="w-3 h-3 shrink-0" />
                        )}
                        {dayUp ? "+" : ""}
                        {q.dayChangePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="shrink-0" style={{ color: "var(--label-secondary)" }}>대기</span>
                    )}

                    {q.monthChangePct !== null && (
                      <span
                        className="shrink-0 whitespace-nowrap"
                        style={{ color: monthUp ? "var(--status-success-text)" : "var(--label-secondary)" }}
                      >
                        1M {monthUp ? "+" : ""}
                        {q.monthChangePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Industry RSS News & SEC Filings */}
      <div
        className="pt-3 border-t space-y-2.5"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-base-content">
            최신 반도체·AI 인프라 뉴스 및 SEC 공시 피드
          </p>
          <div className="flex items-center gap-1" role="group" aria-label="피드 유형 필터">
            {[
              { id: "all" as const, label: "전체" },
              { id: "news" as const, label: "뉴스 RSS" },
              { id: "filing" as const, label: "SEC 공시" },
            ].map((tab) => {
              const active = feedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setFeedFilter(tab.id);
                  }}
                  aria-pressed={active}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center ${
                    active
                      ? "bg-primary/14 text-accent-primary"
                      : "text-base-content/70 hover:bg-base-content/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredHeadlines.length === 0 ? (
          <EmptyState
            size="sm"
            title={isRefreshing ? "실시간 뉴스·공시 피드를 불러오는 중입니다" : "표시할 외부 피드 항목이 없습니다"}
            description="오프라인 상태이거나 외부 RSS 응답이 지연된 경우에도 기준 수급 데이터는 계속 유지됩니다."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredHeadlines.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-base-100 rounded-2xl p-3 border border-base-content/10 hover:border-primary/45 transition-all flex items-start justify-between gap-2.5 group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={item.kind === "filing" ? "secondary" : "outline"}
                      size="xs"
                    >
                      {item.source}
                    </Badge>
                    {item.matchedTags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="primary" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-base-content group-hover:text-primary transition-colors line-clamp-2 break-keep">
                    {item.title}
                  </p>
                  <p
                    className="text-[11px] font-medium tabular-nums"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {formatPublishedLabel(item.publishedAtIso)}
                  </p>
                </div>
                <IconExternalLink
                  className="w-3.5 h-3.5 shrink-0 mt-1 opacity-60 group-hover:opacity-100 text-primary"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
