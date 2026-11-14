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

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Server-Streamed Macro Supply/Demand Strip */}
      {streamingSlot && <ErrorBoundary>{streamingSlot}</ErrorBoundary>}

      {/* 2. Active Section View */}
      {normalizedSection === "overview" && (
        <div className="space-y-6">
          {/* Interactive Supply-to-Demand Allocation Matrix */}
          <SupplyDemandMatrix onSelectSection={onSelectSection} />

          {/* Live Auto-Refreshing Market Quotes, News RSS & SEC Filings */}
          <ErrorBoundary>
            <LiveTelemetryPanel />
          </ErrorBoundary>

          {/* Editorial Split: Supply Scale vs Demand Backlog vs Peak Chokepoint */}
          <section
            aria-labelledby="bento-telemetry-heading"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            <h2 id="bento-telemetry-heading" className="sr-only">
              공급 집중도 · 수요 백로그 · 최고 병목 요약
            </h2>

            {/* Left (5 cols): Supply Output Breakdown */}
            <article className="lg:col-span-5 material-regular rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                    선단 팹 · HBM 월간 출하 집중도
                  </h3>
                  <p className="text-xs font-medium" style={{ color: "var(--label-secondary)" }}>
                    {summary.totalFabLines}개 핵심 라인 · 가동률 {summary.avgFabUtilizationPct.toFixed(1)}% · AI 배정 {summary.avgAiAllocationPct.toFixed(1)}%
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-base-content/10 border-y py-3" style={{ borderColor: "var(--separator)" }}>
                <div className="pe-3">
                  <dt className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                    파운드리 웨이퍼
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-base-content mt-0.5">
                    {summary.totalMonthlyWaferKpm}
                  </dd>
                  <span className="text-[11px]" style={{ color: "var(--label-secondary)" }}>
                    kWPM / 월
                  </span>
                </div>
                <div className="px-3">
                  <dt className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                    HBM3E·HBM4
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-base-content mt-0.5">
                    {summary.totalMonthlyHbmKStacks}k
                  </dd>
                  <span className="text-[11px]" style={{ color: "var(--label-secondary)" }}>
                    Stacks / 월
                  </span>
                </div>
                <div className="ps-3">
                  <dt className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                    2.5D/3D 패키징
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-base-content mt-0.5">
                    {summary.totalMonthlyPackagingK}k
                  </dd>
                  <span className="text-[11px]" style={{ color: "var(--label-secondary)" }}>
                    Interposers / 월
                  </span>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium tabular-nums" style={{ color: "var(--label-secondary)" }}>
                  월간 약정 {summary.totalLinkCommittedUnits} → 실출하 {summary.totalLinkShippedUnits}
                </span>
                <Button
                  size="xs"
                  variant="soft"
                  onClick={() => onSelectSection("fabs")}
                >
                  출하표 보기
                </Button>
              </div>
            </article>

            {/* Middle (4 cols): AI Compute Demand & Power */}
            <article className="lg:col-span-4 material-regular rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                    AI 연산 수요 · 전력 백로그
                  </h3>
                  <p className="text-xs font-medium" style={{ color: "var(--label-secondary)" }}>
                    프론티어 {summary.frontierLabCount}곳 · 네오클라우드 {summary.neocloudCount}곳
                  </p>
                </div>
                <SignedDelta value={summary.weightedSupplyGapPct} className="text-xs pt-0.5" />
              </div>

              <dl className="grid grid-cols-2 divide-x divide-base-content/10 border-y py-3" style={{ borderColor: "var(--separator)" }}>
                <div className="pe-3">
                  <dt className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                    총 GPU 환산 수요
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-base-content mt-0.5">
                    {summary.totalMonthlyGpuEquivalentK.toLocaleString("en-US")}k
                    <span className="text-xs font-semibold ms-1">/ 월</span>
                  </dd>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--label-secondary)" }}>
                    HBM {(summary.totalMonthlyHbmDemandTB / 1000).toFixed(1)} PB/월
                  </span>
                </div>
                <div className="ps-3">
                  <dt className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                    데이터센터 전력 · 잔고
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-base-content mt-0.5">
                    {(summary.totalCommittedPowerMW / 1000).toFixed(2)} GW
                  </dd>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--label-secondary)" }}>
                    Lab {summary.frontierLabAvgBacklogMonths}m · Cloud {summary.neocloudAvgBacklogMonths}m
                  </span>
                </div>
              </dl>

              <div className="flex items-center justify-end gap-1.5">
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
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                  최고 공정 병목
                </h3>
                <p className="text-xs font-medium text-status-error">
                  긴급 병목 {summary.criticalBottleneckCount}개 구간
                </p>
              </div>

              <div className="flex items-center gap-3.5 py-2 border-y" style={{ borderColor: "var(--separator)" }}>
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
                  <p className="text-xs font-medium tabular-nums" style={{ color: "var(--label-secondary)" }}>
                    리드타임 {summary.peakBottleneck.leadTimeWeeks}주
                  </p>
                  <p className="text-[11px] tabular-nums font-bold text-status-error">
                    평균 {summary.avgFabLeadTimeWeeks}주 (+{summary.avgLeadTimeMomDeltaWeeks}주)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/preview/${summary.peakBottleneck.slug}`}
                  onClick={() => triggerHaptic("selection")}
                  className="btn btn-xs btn-ghost rounded-2xl border border-base-content/20 pst-press font-semibold inline-flex items-center gap-1 text-base-content"
                >
                  <span>상세</span>
                  <IconArrowUpRight className="w-3 h-3" />
                </Link>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => onSelectSection("bottlenecks")}
                >
                  병목 현황
                </Button>
              </div>
            </article>
          </section>

          {/* Editorial Split Ledger: Top Supply Momentum & Unmet Demand Gaps */}
          <section aria-labelledby="variance-radar-heading" className="space-y-3">
            <h2
              id="variance-radar-heading"
              className="text-base sm:text-lg font-extrabold tracking-tight text-base-content px-1"
            >
              월간 출하 변동 상위 · 미충족 수요 갭 품목
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Left Ledger: Top MoM Supply Expansions */}
              <div className="material-regular rounded-3xl overflow-hidden shadow-xs">
                <div
                  className="flex items-center justify-between gap-2 px-5 py-3.5 border-b"
                  style={{ borderColor: "var(--separator)" }}
                >
                  <h3 className="text-sm font-extrabold text-base-content">
                    월간 출하 급증 라인 Top 4
                  </h3>
                  <span className="text-xs font-semibold text-status-success">
                    MoM 증가율 기준
                  </span>
                </div>
                <div className="divide-y divide-base-content/10 bg-base-100/60">
                  {topSupplyMomentum.map((fab) => (
                    <div
                      key={fab.id}
                      className="px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors hover:bg-base-content/[0.025]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-extrabold text-base-content truncate">
                            {fab.company} · {fab.nodeOrProduct}
                          </span>
                          <RiskBadge risk={fab.riskLevel} size="xs" />
                        </div>
                        <p className="text-xs font-medium truncate mt-0.5 tabular-nums" style={{ color: "var(--label-secondary)" }}>
                          월 {fab.monthlyOutputValue} {fab.unitLabel} · 수율 {fab.yieldPct.toFixed(1)}% · 납기 {fab.leadTimeWeeks}주
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
                          width={72}
                          height={24}
                        />
                        <SignedDelta value={fab.momDeltaPct} className="text-xs" />
                        <Button
                          size="xs"
                          variant="ghost"
                          className="border border-base-content/18"
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

              {/* Right Ledger: Sharpest Unmet AI Demand Gaps */}
              <div className="material-regular rounded-3xl overflow-hidden shadow-xs">
                <div
                  className="flex items-center justify-between gap-2 px-5 py-3.5 border-b"
                  style={{ borderColor: "var(--separator)" }}
                >
                  <h3 className="text-sm font-extrabold text-base-content">
                    미충족 수급 갭 심화 Top 4
                  </h3>
                  <span className="text-xs font-semibold text-status-error">
                    공급 부족 폭 기준
                  </span>
                </div>
                <div className="divide-y divide-base-content/10 bg-base-100/60">
                  {topUnmetGapCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors hover:bg-base-content/[0.025]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-extrabold text-base-content truncate">
                            {cust.name} ({cust.nameKo})
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: "var(--label-secondary)" }}>
                            {cust.segment === "frontier-lab" ? "프론티어 랩" : "네오클라우드"}
                          </span>
                        </div>
                        <p className="text-xs font-medium truncate mt-0.5 tabular-nums" style={{ color: "var(--label-secondary)" }}>
                          월 {cust.monthlyGpuEquivalentK}k GPUeq · 잔고 {cust.backlogMonths.toFixed(1)}개월 · 전력 {cust.committedPowerMW.toLocaleString("en-US")}MW
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
                          width={72}
                          height={24}
                        />
                        <SignedDelta value={cust.supplyGapPct} className="text-xs" />
                        <Button
                          size="xs"
                          variant="ghost"
                          className="border border-base-content/18"
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
