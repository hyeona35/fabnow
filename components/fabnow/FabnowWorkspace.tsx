"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBoundary,
  IconArrowUpRight,
  IconChip,
  IconPulse,
  IconServer,
  IconTrendUp,
  RadialProgress,
  SearchField,
  type SearchToken,
} from "@/components/ui";
import {
  BOTTLENECK_STAGES,
  DATA_SYNC_LABEL,
  DEMAND_CUSTOMERS,
  FAB_SHIPMENTS,
  getSupplyDemandSummary,
  type FabnowSectionId,
  type RiskLevel,
} from "@/lib/data/fabnow";
import { useModal } from "@/context/OverlayContext";
import { triggerHaptic } from "@/lib/haptics";
import { BottleneckMonitorPanel } from "./BottleneckMonitorPanel";
import { DemandTrackersPanel } from "./DemandTrackersPanel";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import { FabShipmentsPanel } from "./FabShipmentsPanel";
import { LiveTelemetryPanel } from "./LiveTelemetryPanel";
import {
  RiskBadge,
  SignedDelta,
  SparklineSvg,
} from "./FabnowPrimitives";
import { SupplyDemandMatrix } from "./SupplyDemandMatrix";

const SEARCH_SCOPES = [
  "전체",
  "파운드리·메모리",
  "프론티어 랩",
  "네오클라우드",
  "병목 공정",
] as const;

type SearchScope = (typeof SEARCH_SCOPES)[number];

interface SearchMatchItem {
  id: string;
  slug: string;
  scope: Exclude<SearchScope, "전체">;
  title: string;
  subtitle: string;
  metricText: string;
  risk: RiskLevel;
  targetSection: FabnowSectionId;
  searchText: string;
}

export interface FabnowWorkspaceProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  streamingSlot?: React.ReactNode;
}

export function FabnowWorkspace({
  activeSection,
  onSelectSection,
  streamingSlot,
}: FabnowWorkspaceProps) {
  const { openModal, closeModal } = useModal();

  const [query, setQuery] = useState<string>("");
  const [activeScope, setActiveScope] = useState<SearchScope>("전체");
  const [tokens, setTokens] = useState<SearchToken[]>([]);

  const summary = useMemo(() => getSupplyDemandSummary(), []);

  const allSearchItems = useMemo<SearchMatchItem[]>(() => {
    const fabItems: SearchMatchItem[] = FAB_SHIPMENTS.map((fab) => ({
      id: fab.id,
      slug: fab.slug,
      scope: "파운드리·메모리",
      title: `${fab.company} · ${fab.nodeOrProduct}`,
      subtitle: `${fab.companyKo} · ${fab.lineName}`,
      metricText: `${fab.monthlyOutputValue} ${fab.unitLabel} (가동 ${fab.utilizationPct.toFixed(1)}%)`,
      risk: fab.riskLevel,
      targetSection: "fabs",
      searchText: [
        fab.company,
        fab.companyKo,
        fab.nodeOrProduct,
        fab.lineName,
        fab.primarySites,
        fab.category,
        ...fab.keyCustomers,
      ]
        .join(" ")
        .toLowerCase(),
    }));

    const demandItems: SearchMatchItem[] = DEMAND_CUSTOMERS.map((cust) => ({
      id: cust.id,
      slug: cust.slug,
      scope: cust.segment === "frontier-lab" ? "프론티어 랩" : "네오클라우드",
      title: `${cust.name} (${cust.nameKo})`,
      subtitle: cust.focusCompute,
      metricText: `${cust.monthlyGpuEquivalentK}k GPUeq · 잔고 ${cust.backlogMonths.toFixed(1)}개월`,
      risk:
        cust.supplyGapPct <= -20 || cust.deploymentStatus === "backlog-capped"
          ? "tight"
          : cust.supplyGapPct <= -12
          ? "constrained"
          : "balanced",
      targetSection: cust.segment === "frontier-lab" ? "labs" : "neoclouds",
      searchText: [
        cust.name,
        cust.nameKo,
        cust.focusCompute,
        cust.segment,
        ...cust.preferredNodes,
        ...cust.primarySuppliers,
      ]
        .join(" ")
        .toLowerCase(),
    }));

    const bottleneckItems: SearchMatchItem[] = BOTTLENECK_STAGES.map((bn) => ({
      id: bn.id,
      slug: bn.slug,
      scope: "병목 공정",
      title: `${bn.stageName} · ${bn.stageNameKo}`,
      subtitle: `${bn.primarySuppliers.join(", ")} · 리드타임 ${bn.leadTimeWeeks}주`,
      metricText: `포화도 ${bn.saturationPct.toFixed(1)}%`,
      risk: bn.riskLevel,
      targetSection: "bottlenecks",
      searchText: [
        bn.stageName,
        bn.stageNameKo,
        bn.domain,
        ...bn.primarySuppliers,
        ...bn.primaryDrivers,
      ]
        .join(" ")
        .toLowerCase(),
    }));

    return [...fabItems, ...demandItems, ...bottleneckItems];
  }, []);

  const isSearchActive =
    query.trim().length > 0 || tokens.length > 0 || activeScope !== "전체";

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    const q = query.trim().toLowerCase();
    const tokenVals = tokens.map((t) => t.value.toLowerCase());

    return allSearchItems.filter((item) => {
      if (activeScope !== "전체" && item.scope !== activeScope) return false;
      if (q && !item.searchText.includes(q)) return false;
      if (tokenVals.some((tv) => !item.searchText.includes(tv))) return false;
      return true;
    });
  }, [isSearchActive, query, tokens, activeScope, allSearchItems]);

  const topSupplyMomentum = useMemo(
    () =>
      [...FAB_SHIPMENTS]
        .sort((a, b) => b.momDeltaPct - a.momDeltaPct)
        .slice(0, 4),
    []
  );

  const topUnmetGapCustomers = useMemo(
    () =>
      [...DEMAND_CUSTOMERS]
        .sort((a, b) => a.supplyGapPct - b.supplyGapPct)
        .slice(0, 4),
    []
  );

  const resetSearch = () => {
    setQuery("");
    setActiveScope("전체");
    setTokens([]);
  };

  const handleOpenEntityModal = (slug: string, title: string, subtitle?: string) => {
    triggerHaptic("selection");
    openModal({
      id: `entity-${slug}`,
      title,
      description: subtitle ?? `${DATA_SYNC_LABEL} · 반도체 공급-AI 수요 세부 데이터`,
      size: "lg",
      content: (
        <EntityDetailModalContent
          slug={slug}
          onClose={() => closeModal(true)}
        />
      ),
    });
  };

  const normalizedSection: FabnowSectionId =
    activeSection === "fabs" ||
    activeSection === "labs" ||
    activeSection === "neoclouds" ||
    activeSection === "bottlenecks"
      ? activeSection
      : "overview";

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Single Domain Search & Scope Bar (NO Multi-Navigation Chrome) */}
      <section
        aria-label="반도체 수급 통합 검색"
        className="material-regular rounded-3xl p-4 sm:p-5 shadow-xs"
      >
        <SearchField
          label="반도체 공급망 · AI 수요 통합 검색"
          query={query}
          onQueryChange={setQuery}
          scopes={[...SEARCH_SCOPES]}
          activeScope={activeScope}
          onScopeChange={(scope) => {
            triggerHaptic("light");
            setActiveScope(scope as SearchScope);
          }}
          tokens={tokens}
          onRemoveToken={(id) =>
            setTokens((prev) => prev.filter((tok) => tok.id !== id))
          }
          recentSearches={["HBM4", "CoWoS-L", "OpenAI"]}
          suggestedQueries={["TSMC", "SK hynix", "CoreWeave", "18A"]}
          placeholder="제조사, 공정 노드(HBM4, CoWoS-L, N3P), 프론티어 랩 또는 네오클라우드 검색…"
        />

        {/* Instant Cross-Domain Search Results Drawer */}
        {isSearchActive && (
          <div
            className="mt-4 pt-4 border-t space-y-3"
            style={{ borderColor: "var(--separator)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-base-content">
                  필터링된 엔티티 ({searchResults.length}건)
                </span>
                <Badge variant="primary" size="xs">
                  {activeScope}
                </Badge>
              </div>
              <Button size="xs" variant="ghost" onClick={resetSearch}>
                검색 초기화
              </Button>
            </div>

            {searchResults.length === 0 ? (
              <EmptyState
                size="sm"
                title="일치하는 반도체 공급망·AI 수요 엔티티가 없습니다"
                description="다른 키워드(예: TSMC, HBM4, OpenAI, CoreWeave, CoWoS-L)를 입력하거나 범위 막대를 '전체'로 변경해 보세요."
                action={
                  <Button size="xs" variant="primary" onClick={resetSearch}>
                    검색 초기화
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {searchResults.slice(0, 9).map((item) => (
                  <div
                    key={item.id}
                    className="bg-base-100 rounded-2xl p-3 border border-base-content/14 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" size="xs">
                            {item.scope}
                          </Badge>
                          <p className="text-xs font-extrabold text-base-content truncate">
                            {item.title}
                          </p>
                        </div>
                        <p
                          className="text-[11px] font-medium truncate mt-1"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                      <RiskBadge risk={item.risk} size="xs" />
                    </div>

                    <div
                      className="flex items-center justify-between gap-2 pt-2 border-t text-[11px]"
                      style={{ borderColor: "var(--separator)" }}
                    >
                      <span className="tabular-nums font-bold text-base-content truncate">
                        {item.metricText}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="xs"
                          variant="soft"
                          opensModal
                          onClick={() =>
                            handleOpenEntityModal(
                              item.slug,
                              item.title,
                              item.subtitle
                            )
                          }
                        >
                          모달
                        </Button>
                        <Link
                          href={`/preview/${item.slug}`}
                          onClick={() => triggerHaptic("selection")}
                          className="btn btn-xs btn-ghost rounded-2xl border border-base-content/20 pst-press font-semibold inline-flex items-center gap-0.5 text-base-content"
                        >
                          <span>이동</span>
                          <IconArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Server-Streamed Edge Telemetry Slot wrapped in ErrorBoundary */}
      {streamingSlot && <ErrorBoundary>{streamingSlot}</ErrorBoundary>}

      {/* 3. Active Section View */}
      {normalizedSection === "overview" && (
        <div className="space-y-6">
          {/* Live Auto-Refreshing Market Quotes, News RSS & SEC Filings */}
          <ErrorBoundary>
            <LiveTelemetryPanel />
          </ErrorBoundary>

          {/* Signature Hero Visual: Interactive Supply-to-Demand Flow & Bottleneck Matrix */}
          <SupplyDemandMatrix onSelectSection={onSelectSection} />

          {/* Asymmetric Bento Telemetry Summary (5 : 4 : 3 editorial proportion) */}
          <section
            aria-labelledby="bento-telemetry-heading"
            className="space-y-3"
          >
            <h2 id="bento-telemetry-heading" className="sr-only">
              공급 집중도 · 수요 백로그 · 핵심 병목 요약 벤토
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Wide Left (5 cols): Supply Concentration */}
              <article className="lg:col-span-5 material-regular rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-primary/14 text-accent-primary shrink-0">
                      <IconChip className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                        글로벌 선단 팹 · HBM 출하 집중도
                      </h3>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        10개 핵심 라인 평균 가동률 {summary.avgFabUtilizationPct.toFixed(1)}% · AI 할당 {summary.avgAiAllocationPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" size="xs">
                    {summary.totalFabLines} 라인
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-base-100 rounded-2xl p-3 border border-base-content/10">
                    <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                      선단 파운드리
                    </span>
                    <strong className="text-base font-extrabold tabular-nums text-base-content">
                      {summary.totalMonthlyWaferKpm}
                    </strong>
                    <span className="text-[11px] block" style={{ color: "var(--label-secondary)" }}>
                      kWPM / 월
                    </span>
                  </div>
                  <div className="bg-base-100 rounded-2xl p-3 border border-base-content/10">
                    <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                      HBM3E·HBM4
                    </span>
                    <strong className="text-base font-extrabold tabular-nums text-base-content">
                      {summary.totalMonthlyHbmKStacks}k
                    </strong>
                    <span className="text-[11px] block" style={{ color: "var(--label-secondary)" }}>
                      Stacks / 월
                    </span>
                  </div>
                  <div className="bg-base-100 rounded-2xl p-3 border border-base-content/10">
                    <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                      2.5D/3D 패키징
                    </span>
                    <strong className="text-base font-extrabold tabular-nums text-base-content">
                      {summary.totalMonthlyPackagingK}k
                    </strong>
                    <span className="text-[11px] block" style={{ color: "var(--label-secondary)" }}>
                      Interposers / 월
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: "var(--separator)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--label-secondary)" }}>
                    월간 약정 {summary.totalLinkCommittedUnits} → 실출하 {summary.totalLinkShippedUnits}
                  </span>
                  <Button
                    size="xs"
                    variant="soft"
                    onClick={() => onSelectSection("fabs")}
                  >
                    팹 출하표 열기
                  </Button>
                </div>
              </article>

              {/* Middle (4 cols): AI Compute Demand & Power Backlog */}
              <article className="lg:col-span-4 material-regular rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-secondary/14 text-accent-secondary shrink-0">
                      <IconServer className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                        AI 수요처 백로그 · 전력
                      </h3>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        프론티어 {summary.frontierLabCount} + 네오클라우드 {summary.neocloudCount}
                      </p>
                    </div>
                  </div>
                  <SignedDelta value={summary.weightedSupplyGapPct} className="text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-base-100 rounded-2xl p-3 border border-base-content/10">
                    <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                      총 GPU 환산 수요
                    </span>
                    <strong className="text-base font-extrabold tabular-nums text-base-content">
                      {summary.totalMonthlyGpuEquivalentK.toLocaleString("en-US")}k/월
                    </strong>
                    <span className="text-[11px] tabular-nums block" style={{ color: "var(--label-secondary)" }}>
                      HBM {(summary.totalMonthlyHbmDemandTB / 1000).toFixed(1)} PB/월
                    </span>
                  </div>
                  <div className="bg-base-100 rounded-2xl p-3 border border-base-content/10">
                    <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                      데이터센터 전력 · 잔고
                    </span>
                    <strong className="text-base font-extrabold tabular-nums text-base-content">
                      {(summary.totalCommittedPowerMW / 1000).toFixed(2)} GW
                    </strong>
                    <span className="text-[11px] tabular-nums block" style={{ color: "var(--label-secondary)" }}>
                      Lab {summary.frontierLabAvgBacklogMonths}m · Cloud {summary.neocloudAvgBacklogMonths}m
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t" style={{ borderColor: "var(--separator)" }}>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="border border-base-content/20"
                    onClick={() => onSelectSection("labs")}
                  >
                    프론티어 랩
                  </Button>
                  <Button
                    size="xs"
                    variant="soft"
                    onClick={() => onSelectSection("neoclouds")}
                  >
                    네오클라우드
                  </Button>
                </div>
              </article>

              {/* Right (3 cols): Peak Bottleneck Pulse */}
              <article className="lg:col-span-3 material-regular rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-2xl bg-error/14 text-status-error shrink-0">
                      <IconPulse className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                        최고 병목 펄스
                      </h3>
                      <p className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                        긴급 병목 {summary.criticalBottleneckCount}개 구간
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-base-100 rounded-2xl p-3 border border-base-content/10">
                  <RadialProgress
                    value={summary.peakBottleneck.saturationPct}
                    sizeRem={4.25}
                    thicknessPx={6}
                    color="error"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-extrabold text-base-content truncate">
                      {summary.peakBottleneck.stageName}
                    </p>
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--label-secondary)" }}>
                      리드타임 {summary.peakBottleneck.leadTimeWeeks}주
                    </p>
                    <p className="text-[11px] tabular-nums font-bold text-status-error">
                      전체 평균 {summary.avgFabLeadTimeWeeks}주 (+{summary.avgLeadTimeMomDeltaWeeks}주)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: "var(--separator)" }}>
                  <Link
                    href={`/preview/${summary.peakBottleneck.slug}`}
                    onClick={() => triggerHaptic("selection")}
                    className="btn btn-xs btn-ghost rounded-2xl border border-base-content/20 pst-press font-semibold inline-flex items-center gap-1 text-base-content"
                  >
                    <span>프리뷰</span>
                    <IconArrowUpRight className="w-3 h-3" />
                  </Link>
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => onSelectSection("bottlenecks")}
                  >
                    병목 모니터
                  </Button>
                </div>
              </article>
            </div>
          </section>

          {/* Top Variance Radar */}
          <section aria-labelledby="variance-radar-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconTrendUp className="w-4 h-4 text-accent-primary" />
                <h2
                  id="variance-radar-heading"
                  className="text-base sm:text-lg font-extrabold tracking-tight text-base-content"
                >
                  Top Variance Radar — 급증 출하 · 최심 수급 갭 레이더
                </h2>
              </div>
              <Badge variant="outline" size="xs">
                클릭하여 모달 인스펙션
              </Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Left Radar: Top MoM Supply Expansions */}
              <div className="material-regular rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-base-content">
                    월간 출하 급증 라인 TOP 4 (MoM Expansion)
                  </h3>
                  <Badge variant="success" size="xs">
                    공급 확대 모멘텀
                  </Badge>
                </div>
                <div className="space-y-2">
                  {topSupplyMomentum.map((fab) => (
                    <div
                      key={fab.id}
                      className="bg-base-100 rounded-2xl p-3 border border-base-content/12 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-base-content truncate">
                            {fab.company} · {fab.nodeOrProduct}
                          </span>
                          <RiskBadge risk={fab.riskLevel} size="xs" />
                        </div>
                        <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: "var(--label-secondary)" }}>
                          월 {fab.monthlyOutputValue} {fab.unitLabel} · 수율 {fab.yieldPct.toFixed(1)}% · 리드타임 {fab.leadTimeWeeks}주
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <SparklineSvg
                          points={fab.quarterlyHistory.map((pt) => ({
                            quarter: pt.quarter,
                            value: pt.shipmentOrDemand,
                          }))}
                          tone="success"
                          label={`${fab.company} ${fab.nodeOrProduct} 6분기 추이`}
                          width={74}
                          height={24}
                        />
                        <SignedDelta value={fab.momDeltaPct} className="text-xs" />
                        <Button
                          size="xs"
                          variant="soft"
                          opensModal
                          onClick={() =>
                            handleOpenEntityModal(
                              fab.slug,
                              `${fab.company} · ${fab.nodeOrProduct}`,
                              fab.lineName
                            )
                          }
                        >
                          분석
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Radar: Sharpest Unmet AI Demand Gaps */}
              <div className="material-regular rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-base-content">
                    미충족 수급 갭 심화 TOP 4 (Unmet Supply Deficit)
                  </h3>
                  <Badge variant="error" size="xs">
                    수주 상한·지연 주의
                  </Badge>
                </div>
                <div className="space-y-2">
                  {topUnmetGapCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="bg-base-100 rounded-2xl p-3 border border-base-content/12 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-base-content truncate">
                            {cust.name} ({cust.nameKo})
                          </span>
                          <Badge variant="outline" size="xs">
                            {cust.segment === "frontier-lab"
                              ? "프론티어 랩"
                              : "네오클라우드"}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: "var(--label-secondary)" }}>
                          월 {cust.monthlyGpuEquivalentK}k GPUeq · 백로그 {cust.backlogMonths.toFixed(1)}개월 · 전력 {cust.committedPowerMW.toLocaleString("en-US")}MW
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <SparklineSvg
                          points={cust.quarterlyDemand.map((pt) => ({
                            quarter: pt.quarter,
                            value: pt.shipmentOrDemand,
                          }))}
                          tone="error"
                          label={`${cust.name} 수요 6분기 추이`}
                          width={74}
                          height={24}
                        />
                        <SignedDelta value={cust.supplyGapPct} className="text-xs" />
                        <Button
                          size="xs"
                          variant="soft"
                          opensModal
                          onClick={() =>
                            handleOpenEntityModal(
                              cust.slug,
                              `${cust.name} (${cust.nameKo})`,
                              cust.focusCompute
                            )
                          }
                        >
                          분석
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {normalizedSection === "fabs" && (
        <FabShipmentsPanel
          searchQuery={query}
          searchTokens={tokens}
          onResetSearch={resetSearch}
        />
      )}

      {normalizedSection === "labs" && (
        <DemandTrackersPanel
          key="labs"
          initialSegment="frontier-lab"
          searchQuery={query}
          searchTokens={tokens}
          onResetSearch={resetSearch}
        />
      )}

      {normalizedSection === "neoclouds" && (
        <DemandTrackersPanel
          key="neoclouds"
          initialSegment="neocloud"
          searchQuery={query}
          searchTokens={tokens}
          onResetSearch={resetSearch}
        />
      )}

      {normalizedSection === "bottlenecks" && (
        <BottleneckMonitorPanel
          searchQuery={query}
          searchTokens={tokens}
          onResetSearch={resetSearch}
        />
      )}
    </div>
  );
}
