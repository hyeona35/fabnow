import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Display";
import {
  IconLayers,
  IconChevronLeft,
  IconChart,
  IconTrendUp,
  IconTrendDown,
} from "@/components/ui/icons";
import {
  DATA_SYNC_LABEL,
  formatSignedPercent,
  getAllEntitySlugs,
  getEntityBySlug,
  type FabnowEntity,
  type FabnowSectionId,
  type RiskLevel,
} from "@/lib/data/fabnow";

export function generateStaticParams() {
  return getAllEntitySlugs().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entity = getEntityBySlug(id);

  if (!entity) {
    return {
      title: "엔티티를 찾을 수 없습니다",
      description: "요청하신 반도체·AI 수급 엔티티가 fabnow 데이터셋에 존재하지 않습니다.",
    };
  }

  return {
    title: `${entity.title} — 상세 수급 리포트`,
    description: `${entity.subtitle} · ${DATA_SYNC_LABEL} 기준 반도체 출하·AI 수요·병목 인텔리전스 상세 보기`,
  };
}

function getRiskMeta(risk: RiskLevel): {
  label: string;
  variant: "error" | "warning" | "success";
} {
  if (risk === "tight") {
    return {
      label: "고압 · 긴장 (Tight)",
      variant: "error",
    };
  }
  if (risk === "constrained") {
    return {
      label: "수급 제약 (Constrained)",
      variant: "warning",
    };
  }
  return {
    label: "안정 · 균형 (Balanced)",
    variant: "success",
  };
}

function getSectionDestination(entity: FabnowEntity): {
  sectionId: FabnowSectionId;
  sectionLabel: string;
} {
  if (entity.kind === "fab") {
    return { sectionId: "fabs", sectionLabel: "파운드리·메모리 출하" };
  }
  if (entity.kind === "customer") {
    return entity.record.segment === "frontier-lab"
      ? { sectionId: "labs", sectionLabel: "프론티어 랩 수요" }
      : { sectionId: "neoclouds", sectionLabel: "네오클라우드 수요" };
  }
  return { sectionId: "bottlenecks", sectionLabel: "병목·리드타임" };
}

function getDeltaBadgeVariant(
  value: number,
  isBottleneckPressure: boolean
): "success" | "warning" | "error" {
  if (isBottleneckPressure) {
    if (value >= 5) return "error";
    if (value > 0.05) return "warning";
    return "success";
  }
  if (value > 0.05) return "success";
  if (value < -0.05) return "error";
  return "warning";
}

interface MetricCardItem {
  label: string;
  value: string;
  hint: string;
  toneClass?: string;
}

function getEntityMetrics(entity: FabnowEntity): MetricCardItem[] {
  if (entity.kind === "fab") {
    const r = entity.record;
    return [
      {
        label: "월간 출하량",
        value: `${r.monthlyOutputValue.toLocaleString("ko-KR")} ${r.unitLabel}`,
        hint: `MoM ${formatSignedPercent(r.momDeltaPct)} · YoY ${formatSignedPercent(r.yoyDeltaPct)}`,
      },
      {
        label: "라인 가동률 / AI 할당",
        value: `${r.utilizationPct.toFixed(1)}% / ${r.aiAllocationPct.toFixed(0)}%`,
        hint: `수율 ${r.yieldPct.toFixed(1)}% (${r.yieldTrend === "improving" ? "개선" : r.yieldTrend === "ramping" ? "램프업" : "안정"})`,
      },
      {
        label: "공정 리드타임",
        value: `${r.leadTimeWeeks}주`,
        hint: `주요 거점: ${r.primarySites}`,
      },
      {
        label: "핵심 병목 단계",
        value: r.bottleneckStage,
        hint: `분기 대비 ${formatSignedPercent(r.qoqDeltaPct)}`,
      },
    ];
  }

  if (entity.kind === "customer") {
    const r = entity.record;
    const statusLabel =
      r.deploymentStatus === "backlog-capped"
        ? "백로그 제한"
        : r.deploymentStatus === "ramping"
        ? "클러스터 증설 중"
        : "규모 확장 중";
    return [
      {
        label: "월간 GPU 환산 수요",
        value: `${r.monthlyGpuEquivalentK.toLocaleString("ko-KR")}k GPUeq`,
        hint: `MoM ${formatSignedPercent(r.momDemandDeltaPct)} · QoQ ${formatSignedPercent(r.qoqDemandDeltaPct)}`,
      },
      {
        label: "월간 HBM 수요",
        value: `${r.monthlyHbmDemandTB.toLocaleString("ko-KR")} TB`,
        hint: `약정 전력 ${r.committedPowerMW.toLocaleString("ko-KR")} MW`,
      },
      {
        label: "미충족 수급 갭",
        value: formatSignedPercent(r.supplyGapPct),
        hint: `대기 백로그 ${r.backlogMonths}개월`,
        toneClass: r.supplyGapPct <= -20 ? "text-status-error" : "text-status-warning",
      },
      {
        label: "배포 상태",
        value: statusLabel,
        hint: r.focusCompute,
      },
    ];
  }

  const r = entity.record;
  return [
    {
      label: "공정 포화도",
      value: `${r.saturationPct.toFixed(1)}%`,
      hint: `도메인: ${r.domain.toUpperCase()}`,
      toneClass: r.saturationPct >= 95 ? "text-status-error" : "text-status-warning",
    },
    {
      label: "평균 리드타임",
      value: `${r.leadTimeWeeks}주`,
      hint: `월간 압력 변화 ${formatSignedPercent(r.momPressureDeltaPct)}`,
    },
    {
      label: "주요 공급 축",
      value: `${r.primarySuppliers.length}개 공급사`,
      hint: r.primarySuppliers.join(", "),
    },
    {
      label: "주요 수요 동인",
      value: `${r.primaryDrivers.length}개 가속기/노드`,
      hint: r.primaryDrivers.join(", "),
    },
  ];
}

function StandaloneFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl material-regular rounded-3xl p-6 sm:p-8 border border-base-content/15 space-y-6 animate-pulse shadow-lg">
        <div className="h-8 w-64 rounded-2xl bg-base-content/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-2xl bg-base-content/10" />
          ))}
        </div>
        <div className="h-44 rounded-3xl bg-base-content/10" />
      </div>
    </div>
  );
}

async function StandaloneEntityContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = getEntityBySlug(id);

  if (!entity) {
    notFound();
  }

  const riskMeta = getRiskMeta(entity.riskLevel);
  const { sectionId, sectionLabel } = getSectionDestination(entity);
  const metrics = getEntityMetrics(entity);

  const summaryText =
    entity.kind === "bottleneck"
      ? entity.record.mitigationKo
      : entity.record.summaryKo;

  const quarterlySeries =
    entity.kind === "fab"
      ? entity.record.quarterlyHistory
      : entity.kind === "customer"
      ? entity.record.quarterlyDemand
      : null;

  const quarterlyUnit =
    entity.kind === "fab"
      ? entity.record.unitLabel
      : entity.kind === "customer"
      ? "k GPUeq/mo"
      : "";

  const tagChips =
    entity.kind === "fab"
      ? entity.record.keyCustomers
      : entity.kind === "customer"
      ? [...entity.record.preferredNodes, ...entity.record.primarySuppliers]
      : [...entity.record.primarySuppliers, ...entity.record.primaryDrivers];

  const primaryDelta =
    entity.kind === "fab"
      ? entity.record.momDeltaPct
      : entity.kind === "customer"
      ? entity.record.momDemandDeltaPct
      : entity.record.momPressureDeltaPct;
  const deltaVariant = getDeltaBadgeVariant(
    primaryDelta,
    entity.kind === "bottleneck"
  );

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <article className="w-full max-w-4xl material-regular rounded-3xl p-5 sm:p-8 shadow-xl border border-base-content/15 space-y-6">
        {/* Header */}
        <header
          className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b"
          style={{ borderColor: "var(--separator)" }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href={`/?section=${sectionId}`}
              className="btn btn-sm btn-ghost rounded-2xl pst-press text-base-content shrink-0 mt-0.5"
              aria-label={`${sectionLabel} 뷰로 돌아가기`}
            >
              <IconChevronLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={riskMeta.variant} size="sm">
                  {riskMeta.label}
                </Badge>
                <Badge
                  variant={deltaVariant}
                  size="sm"
                  className="tabular-nums"
                >
                  {entity.kind === "bottleneck" ? "압력 MoM" : "월간 변동"}{" "}
                  {formatSignedPercent(primaryDelta)}
                </Badge>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {DATA_SYNC_LABEL}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content break-keep">
                {entity.title}
              </h1>
              <p
                className="text-xs sm:text-sm font-medium break-keep"
                style={{ color: "var(--label-secondary)" }}
              >
                {entity.subtitle}
              </p>
            </div>
          </div>

          <Badge variant="outline" size="sm" className="shrink-0">
            {sectionLabel}
          </Badge>
        </header>

        {/* Key Numeric Telemetry Grid (Standard Material surface) */}
        <section aria-label="핵심 수급 지표" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="material-regular rounded-2xl p-4 border border-base-content/10 space-y-1"
            >
              <p
                className="text-xs font-semibold tracking-wide break-keep"
                style={{ color: "var(--label-secondary)" }}
              >
                {metric.label}
              </p>
              <p
                className={`text-lg font-extrabold tracking-tight tabular-nums break-keep ${
                  metric.toneClass ?? "text-base-content"
                }`}
              >
                {metric.value}
              </p>
              <p
                className="text-xs font-medium tabular-nums break-keep"
                style={{ color: "var(--label-secondary)" }}
              >
                {metric.hint}
              </p>
            </div>
          ))}
        </section>

        {/* Intelligence Summary & Related Tags */}
        <section
          aria-label="인텔리전스 요약"
          className="material-regular rounded-3xl p-5 border border-base-content/10 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-accent-primary">
            <IconLayers className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>수급 · 공정 브리핑</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-base-content/90 break-keep">
            {summaryText}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagChips.map((chip) => (
              <Badge key={chip} variant="default" size="sm">
                {chip}
              </Badge>
            ))}
          </div>
        </section>

        {/* Quarterly Trajectory Table (Fabs & Customers) */}
        {quarterlySeries && quarterlySeries.length > 0 && (
          <section
            aria-label="분기별 추이"
            className="material-regular rounded-3xl p-5 border border-base-content/10 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-base-content">
                <IconChart className="w-4 h-4 text-accent-primary shrink-0" aria-hidden="true" />
                <span>분기별 수급 궤적 (2025 Q1 – 2026 Q2)</span>
              </div>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: "var(--label-secondary)" }}
              >
                단위: {quarterlyUnit}
              </span>
            </div>

            <div
              role="region"
              tabIndex={0}
              aria-label={`${entity.title} 분기별 수급 궤적 표`}
              className="fabnow-table-region overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100"
            >
              <table className="table table-sm fabnow-table w-full">
                <caption className="sr-only">
                  {entity.title} 분기별 출하/수요 및 가동률 추이
                </caption>
                <thead>
                  <tr className="text-xs font-semibold text-base-content/80 bg-base-200/70">
                    <th scope="col">분기</th>
                    <th scope="col" className="text-right">
                      {entity.kind === "fab" ? "월간 출하량" : "월간 수요량"}
                    </th>
                    <th scope="col" className="text-right">
                      {entity.kind === "fab" ? "라인 가동률" : "충족률 (Allocation)"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quarterlySeries.map((point) => (
                    <tr key={point.quarter} className="hover:bg-base-200/40">
                      <th scope="row" className="font-semibold tabular-nums">
                        {point.quarter}
                      </th>
                      <td className="text-right font-semibold tabular-nums">
                        {point.shipmentOrDemand.toLocaleString("ko-KR")} {quarterlyUnit}
                      </td>
                      <td className="text-right tabular-nums">
                        <span
                          className={
                            point.utilizationOrAllocationPct >= 95
                              ? "text-status-error font-bold"
                              : point.utilizationOrAllocationPct < 82
                              ? "text-status-warning font-bold"
                              : "text-status-success font-semibold"
                          }
                        >
                          {point.utilizationOrAllocationPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Linked Supply-Demand Commitments */}
        {entity.links.length > 0 && (
          <section
            aria-label="연계 공급·수요 매칭"
            className="material-regular rounded-3xl p-5 border border-base-content/10 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-base-content">
                {entity.kind === "customer" ? (
                  <IconTrendUp className="w-4 h-4 text-accent-primary shrink-0" aria-hidden="true" />
                ) : (
                  <IconTrendDown className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
                )}
                <span>주요 공급-수요 연결 ({entity.links.length}건)</span>
              </div>
            </div>

            <div
              role="region"
              tabIndex={0}
              aria-label={`${entity.title} 주요 공급-수요 연결 표`}
              className="fabnow-table-region overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100"
            >
              <table className="table table-sm fabnow-table w-full">
                <caption className="sr-only">
                  {entity.title} 관련 공급사·수요사 물량 약정 및 갭 현황
                </caption>
                <thead>
                  <tr className="text-xs font-semibold text-base-content/80 bg-base-200/70">
                    <th scope="col">공급 라인</th>
                    <th scope="col">수요 파트너</th>
                    <th scope="col" className="text-right">
                      월간 약정
                    </th>
                    <th scope="col" className="text-right">
                      실제 출하
                    </th>
                    <th scope="col" className="text-right">
                      공급 갭
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entity.links.map((link) => {
                    const gapVariant =
                      link.gapPct <= -18
                        ? "error"
                        : link.gapPct <= -10
                        ? "warning"
                        : "success";
                    return (
                      <tr key={link.id} className="hover:bg-base-200/40">
                        <td className="font-semibold break-keep">
                          {link.supplierLabel}
                          <span
                            className="block text-[11px] font-medium"
                            style={{ color: "var(--label-secondary)" }}
                          >
                            {link.technologyLabel}
                          </span>
                        </td>
                        <td className="font-medium break-keep">{link.customerLabel}</td>
                        <td className="text-right tabular-nums">
                          {link.monthlyCommittedUnits.toLocaleString("ko-KR")} {link.unitLabel}
                        </td>
                        <td className="text-right font-semibold tabular-nums">
                          {link.monthlyActualShippedUnits.toLocaleString("ko-KR")} {link.unitLabel}
                        </td>
                        <td className="text-right tabular-nums">
                          <Badge variant={gapVariant} size="xs">
                            {formatSignedPercent(link.gapPct)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Footer Navigation */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/"
            className="btn btn-ghost rounded-2xl pst-press font-semibold text-base-content"
          >
            통합 수급 현황
          </Link>
          <Link
            href={`/?section=${sectionId}`}
            className="btn btn-primary rounded-2xl pst-press font-semibold"
          >
            {sectionLabel} 대시보드 열기
          </Link>
        </footer>
      </article>
    </main>
  );
}

export default function StandalonePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<StandaloneFallback />}>
      <StandaloneEntityContent params={params} />
    </Suspense>
  );
}
