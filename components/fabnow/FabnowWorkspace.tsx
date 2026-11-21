"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Button,
  ErrorBoundary,
  IconArrowUpRight,
  RadialProgress,
} from "@/components/ui";
import {
  DATA_SYNC_LABEL,
  DEMAND_CUSTOMERS,
  FAB_SHIPMENTS,
  getSupplyDemandSummary,
  type FabnowSectionId,
} from "@/lib/data/fabnow";
import { useModal } from "@/context/OverlayContext";
import { triggerHaptic } from "@/lib/haptics";
import { BottleneckMonitorPanel } from "./BottleneckMonitorPanel";
import { DemandTrackersPanel } from "./DemandTrackersPanel";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import { FabShipmentsPanel } from "./FabShipmentsPanel";
import { LiveTelemetryPanel } from "./LiveTelemetryPanel";
import {
  EntityMonogram,
  RiskBadge,
  SignedDelta,
  SparklineSvg,
} from "./FabnowPrimitives";
import { SupplyDemandMatrix } from "./SupplyDemandMatrix";

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

  const summary = useMemo(() => getSupplyDemandSummary(), []);

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

  const fulfillmentPct = Math.min(
    100,
    Math.max(10, Math.round(100 + summary.weightedSupplyGapPct))
  );

  return (
    <div className="space-y-8 sm:space-y-10 pb-8">
      {/* 1. Server-Streamed Macro Supply/Demand Strip */}
      {streamingSlot && <ErrorBoundary>{streamingSlot}</ErrorBoundary>}

      {/* 2. Active Section View */}
      {normalizedSection === "overview" && (
        <div className="space-y-8 sm:space-y-10">
          {/* Interactive Supply-to-Demand Allocation Matrix */}
          <SupplyDemandMatrix onSelectSection={onSelectSection} />

          {/* Live Auto-Refreshing Market Quotes, News RSS & SEC Filings */}
          <ErrorBoundary>
            <LiveTelemetryPanel />
          </ErrorBoundary>

          {/* Visual-First Editorial Split: Supply Scale vs Demand Backlog vs Peak Chokepoint */}
          <section
            aria-labelledby="bento-telemetry-heading"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
          >
            <h2 id="bento-telemetry-heading" className="sr-only">
              공급 집중도 · 수요 백로그 · 최고 병목 요약
            </h2>

            {/* Left (5 cols): Supply Output Breakdown */}
            <article className="lg:col-span-5 material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs flex flex-col justify-between gap-6 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold text-base-content">
                  선단 팹 · HBM 월간 출하 집중도
                </h3>
                <p
                  className="text-xs sm:text-[13px] font-medium"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {summary.totalFabLines}개 핵심 라인 기준 가동률과 AI 전용 배정 비중
                </p>
              </div>

              {/* Visual Progress Bars before dense counts */}
              <div className="space-y-3 rounded-[22px] p-4 sm:p-5 surface-pastel-sage border border-[var(--separator)]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: "var(--label-secondary)" }}>평균 팹 가동률</span>
                    <span className="tabular-nums text-base-content">
                      {summary.avgFabUtilizationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${Math.min(100, summary.avgFabUtilizationPct)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: "var(--label-secondary)" }}>AI 가속기·HBM 배정률</span>
                    <span className="tabular-nums text-accent-primary">
                      {summary.avgAiAllocationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, summary.avgAiAllocationPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-[18px] p-3.5 bg-base-100 border border-[var(--separator)] space-y-1 min-w-0">
                  <dt
                    className="text-xs font-semibold truncate"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    파운드리 웨이퍼
                  </dt>
                  <dd className="text-lg sm:text-xl font-extrabold tabular-nums text-base-content">
                    {summary.totalMonthlyWaferKpm}
                  </dd>
                  <span
                    className="text-xs font-medium block"
                    style={{ color: "var(--label-tertiary)" }}
                  >
                    kWPM / 월
                  </span>
                </div>
                <div className="rounded-[18px] p-3.5 bg-base-100 border border-[var(--separator)] space-y-1 min-w-0">
                  <dt
                    className="text-xs font-semibold truncate"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    HBM3E·HBM4
                  </dt>
                  <dd className="text-lg sm:text-xl font-extrabold tabular-nums text-base-content">
                    {summary.totalMonthlyHbmKStacks}k
                  </dd>
                  <span
                    className="text-xs font-medium block"
                    style={{ color: "var(--label-tertiary)" }}
                  >
                    Stacks / 월
                  </span>
                </div>
                <div className="rounded-[18px] p-3.5 bg-base-100 border border-[var(--separator)] space-y-1 min-w-0">
                  <dt
                    className="text-xs font-semibold truncate"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    2.5D/3D 패키징
                  </dt>
                  <dd className="text-lg sm:text-xl font-extrabold tabular-nums text-base-content">
                    {summary.totalMonthlyPackagingK}k
                  </dd>
                  <span
                    className="text-xs font-medium block"
                    style={{ color: "var(--label-tertiary)" }}
                  >
                    Interposers / 월
                  </span>
                </div>
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: "var(--label-secondary)" }}
                >
                  약정 {summary.totalLinkCommittedUnits} → 실출하 {summary.totalLinkShippedUnits}
                </span>
                <Button
                  size="sm"
                  variant="soft"
                  className="rounded-full px-4"
                  onClick={() => onSelectSection("fabs")}
                >
                  출하표 보기
                </Button>
              </div>
            </article>

            {/* Middle (4 cols): AI Compute Demand & Power */}
            <article className="lg:col-span-4 surface-pastel-lilac rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs flex flex-col justify-between gap-6 min-w-0">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-base-content">
                    AI 연산 수요 · 전력 백로그
                  </h3>
                  <p
                    className="text-xs sm:text-[13px] font-medium"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    프론티어 {summary.frontierLabCount}곳 · 네오클라우드 {summary.neocloudCount}곳
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 bg-base-100 border border-[var(--separator)] shrink-0">
                  <SignedDelta value={summary.weightedSupplyGapPct} className="text-xs" />
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] p-4 bg-base-100 border border-[var(--separator)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: "var(--label-secondary)" }}>공급 충족률 vs 미충족 갭</span>
                    <span className="tabular-nums text-base-content">{fulfillmentPct}% 충족</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-secondary"
                      style={{ width: `${fulfillmentPct}%` }}
                    />
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-[18px] p-4 bg-base-100 border border-[var(--separator)] space-y-1 min-w-0">
                    <dt
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      총 GPU 환산 수요
                    </dt>
                    <dd className="text-lg sm:text-xl font-extrabold tabular-nums text-base-content">
                      {summary.totalMonthlyGpuEquivalentK.toLocaleString("en-US")}k
                      <span className="text-xs font-semibold ms-1">/ 월</span>
                    </dd>
                    <span
                      className="text-xs font-medium tabular-nums block"
                      style={{ color: "var(--label-tertiary)" }}
                    >
                      HBM {(summary.totalMonthlyHbmDemandTB / 1000).toFixed(1)} PB/월
                    </span>
                  </div>
                  <div className="rounded-[18px] p-4 bg-base-100 border border-[var(--separator)] space-y-1 min-w-0">
                    <dt
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      데이터센터 전력 · 잔고
                    </dt>
                    <dd className="text-lg sm:text-xl font-extrabold tabular-nums text-base-content">
                      {(summary.totalCommittedPowerMW / 1000).toFixed(2)} GW
                    </dd>
                    <span
                      className="text-xs font-medium tabular-nums block"
                      style={{ color: "var(--label-tertiary)" }}
                    >
                      Lab {summary.frontierLabAvgBacklogMonths}m · Cloud {summary.neocloudAvgBacklogMonths}m
                    </span>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full border border-[var(--border-control,var(--separator))] control-border px-4"
                  onClick={() => onSelectSection("labs")}
                >
                  프론티어 랩
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  className="rounded-full px-4"
                  onClick={() => onSelectSection("neoclouds")}
                >
                  네오클라우드
                </Button>
              </div>
            </article>

            {/* Right (3 cols): Peak Bottleneck Pulse */}
            <article className="lg:col-span-3 surface-pastel-blush rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs flex flex-col justify-between gap-6 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold text-base-content">
                  최고 공정 병목
                </h3>
                <p className="text-xs sm:text-[13px] font-bold text-status-error">
                  긴급 병목 {summary.criticalBottleneckCount}개 구간
                </p>
              </div>

              <div className="rounded-[22px] p-5 bg-base-100 border border-[var(--separator)] flex flex-col items-center text-center gap-3.5">
                <RadialProgress
                  value={summary.peakBottleneck.saturationPct}
                  sizeRem={5.5}
                  thicknessPx={8}
                  color="error"
                  label="최고 포화율"
                />
                <div className="min-w-0 w-full space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-base-content truncate">
                    {summary.peakBottleneck.stageName}
                  </p>
                  <p
                    className="text-xs sm:text-[13px] font-medium tabular-nums"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    리드타임 {summary.peakBottleneck.leadTimeWeeks}주
                  </p>
                  <p className="text-xs tabular-nums font-bold text-status-error">
                    평균 {summary.avgFabLeadTimeWeeks}주 (+{summary.avgLeadTimeMomDeltaWeeks}주)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/preview/${summary.peakBottleneck.slug}`}
                  onClick={() => triggerHaptic("selection")}
                  className="btn btn-sm btn-ghost rounded-full border border-[var(--border-control,var(--separator))] control-border pst-press font-semibold inline-flex items-center gap-1 px-3.5 text-base-content"
                >
                  <span>상세</span>
                  <IconArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-full px-4"
                  onClick={() => onSelectSection("bottlenecks")}
                >
                  병목 현황
                </Button>
              </div>
            </article>
          </section>

          {/* Visual-First Exploratory Collections: Top Supply Momentum & Unmet AI Demand */}
          <section aria-labelledby="variance-radar-heading" className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h2
                id="variance-radar-heading"
                className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
              >
                핵심 출하 모멘텀 · 미충족 AI 수요 탐색
              </h2>
              <p
                className="text-xs sm:text-[13px] font-medium"
                style={{ color: "var(--label-secondary)" }}
              >
                카드를 탭하면 분기별 궤적과 공급 약정 상세 시트를 바로 확인할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Collection: Top MoM Supply Expansions */}
              <div className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-base-content">
                      월간 출하 급증 라인 Top 4
                    </h3>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      전월 대비 출하 증가폭이 가장 높은 선단 노드
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-1 surface-pastel-sage border border-[var(--separator)] text-xs font-bold text-status-success shrink-0">
                    MoM 증가율 기준
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topSupplyMomentum.map((fab) => (
                    <button
                      key={fab.id}
                      type="button"
                      onClick={() =>
                        handleOpenEntityModal(
                          fab.slug,
                          `${fab.company} · ${fab.nodeOrProduct}`,
                          fab.lineName
                        )
                      }
                      aria-label={`${fab.company} ${fab.nodeOrProduct} 상세 분석 모달 열기`}
                      className="surface-pastel-sage rounded-[22px] p-4 sm:p-5 border border-[var(--border-control,var(--separator))] control-border hover:border-primary shadow-2xs text-start flex flex-col justify-between gap-4 transition-all pst-press group min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <EntityMonogram name={fab.company} size="md" />
                        <span className="rounded-full px-2.5 py-1 bg-base-100 border border-[var(--separator)] shrink-0">
                          <SignedDelta value={fab.momDeltaPct} className="text-xs" />
                        </span>
                      </div>

                      <div className="rounded-xl bg-base-100 border border-[var(--separator)] px-3 py-2.5">
                        <SparklineSvg
                          points={fab.quarterlyHistory.map((pt) => ({
                            quarter: pt.quarter,
                            value: pt.shipmentOrDemand,
                          }))}
                          tone="success"
                          label={`${fab.company} ${fab.nodeOrProduct} 6분기 추이`}
                          width={180}
                          height={44}
                          fluid
                        />
                      </div>

                      <div className="space-y-2.5 min-w-0">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm sm:text-[15px] font-extrabold text-base-content truncate">
                            {fab.company} · {fab.nodeOrProduct}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <RiskBadge risk={fab.riskLevel} size="sm" />
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{ color: "var(--label-secondary)" }}
                            >
                              월 {fab.monthlyOutputValue} {fab.unitLabel}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                            <span style={{ color: "var(--label-secondary)" }}>
                              수율 {fab.yieldPct.toFixed(1)}%
                            </span>
                            <span style={{ color: "var(--label-secondary)" }}>
                              납기 {fab.leadTimeWeeks}주
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-base-200 overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full rounded-full bg-success"
                              style={{ width: `${Math.min(100, fab.yieldPct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 text-xs font-bold text-accent-primary">
                        <span className="group-hover:underline">상세 분석 보기…</span>
                        <IconArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Collection: Sharpest Unmet AI Demand Gaps */}
              <div className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-base-content">
                      미충족 수급 갭 심화 Top 4
                    </h3>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      약정 물량 대비 가속기·HBM 인도 부족폭이 큰 AI 수요처
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-1 surface-pastel-blush border border-[var(--separator)] text-xs font-bold text-status-error shrink-0">
                    공급 부족 폭 기준
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topUnmetGapCustomers.map((cust) => {
                    const custFulfillPct = Math.min(
                      100,
                      Math.max(15, Math.round(100 + cust.supplyGapPct))
                    );
                    return (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() =>
                          handleOpenEntityModal(
                            cust.slug,
                            `${cust.name} (${cust.nameKo})`,
                            cust.focusCompute
                          )
                        }
                        aria-label={`${cust.name} 수요 상세 분석 모달 열기`}
                        className="surface-pastel-blush rounded-[22px] p-4 sm:p-5 border border-[var(--border-control,var(--separator))] control-border hover:border-primary shadow-2xs text-start flex flex-col justify-between gap-4 transition-all pst-press group min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <EntityMonogram name={cust.name} size="md" />
                          <span className="rounded-full px-2.5 py-1 bg-base-100 border border-[var(--separator)] shrink-0">
                            <SignedDelta value={cust.supplyGapPct} className="text-xs" />
                          </span>
                        </div>

                        <div className="rounded-xl bg-base-100 border border-[var(--separator)] px-3 py-2.5">
                          <SparklineSvg
                            points={cust.quarterlyDemand.map((pt) => ({
                              quarter: pt.quarter,
                              value: pt.shipmentOrDemand,
                            }))}
                            tone="error"
                            label={`${cust.name} 수요 6분기 추이`}
                            width={180}
                            height={44}
                            fluid
                          />
                        </div>

                        <div className="space-y-2.5 min-w-0">
                          <div className="space-y-1 min-w-0">
                            <p className="text-sm sm:text-[15px] font-extrabold text-base-content truncate">
                              {cust.name} ({cust.nameKo})
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="text-xs font-bold"
                                style={{ color: "var(--label-secondary)" }}
                              >
                                {cust.segment === "frontier-lab" ? "프론티어 랩" : "네오클라우드"}
                              </span>
                              <span
                                className="text-xs font-semibold tabular-nums"
                                style={{ color: "var(--label-secondary)" }}
                              >
                                월 {cust.monthlyGpuEquivalentK}k GPUeq
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                              <span style={{ color: "var(--label-secondary)" }}>
                                잔고 {cust.backlogMonths.toFixed(1)}개월
                              </span>
                              <span style={{ color: "var(--label-secondary)" }}>
                                {cust.committedPowerMW.toLocaleString("en-US")}MW
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-base-200 overflow-hidden" aria-hidden="true">
                              <div
                                className="h-full rounded-full bg-error"
                                style={{ width: `${custFulfillPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 text-xs font-bold text-accent-primary">
                          <span className="group-hover:underline">수요 상세 보기…</span>
                          <IconArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {normalizedSection === "fabs" && <FabShipmentsPanel />}

      {normalizedSection === "labs" && (
        <DemandTrackersPanel key="labs" initialSegment="frontier-lab" />
      )}

      {normalizedSection === "neoclouds" && (
        <DemandTrackersPanel key="neoclouds" initialSegment="neocloud" />
      )}

      {normalizedSection === "bottlenecks" && <BottleneckMonitorPanel />}
    </div>
  );
}
