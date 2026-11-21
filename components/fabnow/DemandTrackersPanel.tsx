"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  Tabs,
} from "@/components/ui";
import {
  DEMAND_CUSTOMERS,
  type CustomerSegment,
  type DemandCustomerRecord,
  type DeploymentStatus,
} from "@/lib/data/fabnow";
import { useModal } from "@/context/OverlayContext";
import { useFabnowLive } from "@/context/FabnowLiveContext";
import { triggerHaptic } from "@/lib/haptics";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import {
  EntityActionLinks,
  EntityMonogram,
  SignedDelta,
  SortableTh,
} from "./FabnowPrimitives";

type DemandSortKey =
  | "name"
  | "monthlyGpuEquivalentK"
  | "monthlyHbmDemandTB"
  | "momDemandDeltaPct"
  | "backlogMonths"
  | "committedPowerMW"
  | "supplyGapPct";

const SORT_LABELS: Record<DemandSortKey, string> = {
  name: "수요처명",
  monthlyGpuEquivalentK: "GPU 환산 수요",
  monthlyHbmDemandTB: "HBM 월간 수요",
  momDemandDeltaPct: "MoM 수요 변동률",
  backlogMonths: "수주 잔고",
  committedPowerMW: "약정 전력",
  supplyGapPct: "미충족 수급 갭",
};

const SERIES_STYLES = [
  { color: "var(--color-primary)", dash: undefined },
  { color: "var(--color-secondary)", dash: "6 3" },
  { color: "var(--status-info-text)", dash: "2 3" },
  { color: "var(--status-success-text)", dash: "8 3 2 3" },
  { color: "var(--status-warning-text)", dash: "4 4" },
];

function DeploymentBadge({ status }: { status: DeploymentStatus }) {
  if (status === "backlog-capped") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-error whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-error shrink-0" aria-hidden="true" />
        수주 상한 제약
      </span>
    );
  }
  if (status === "ramping") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-warning whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
        급속 램프업
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-success whitespace-nowrap">
      <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden="true" />
      대규모 증설 중
    </span>
  );
}

export function DemandTrackersPanel({
  initialSegment = "all",
}: {
  initialSegment?: "all" | CustomerSegment;
}) {
  const { openModal, closeModal } = useModal();
  const { getQuoteForEntity } = useFabnowLive();

  const [segment, setSegment] = useState<"all" | CustomerSegment>(initialSegment);
  const [chartMetric, setChartMetric] = useState<"gpu" | "hbm">("gpu");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<DemandSortKey>("monthlyGpuEquivalentK");
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending">(
    "descending"
  );
  const [sortAnnouncement, setSortAnnouncement] = useState<string>("");

  const handleSort = (nextKeyRaw: string) => {
    const nextKey = nextKeyRaw as DemandSortKey;
    const nextDir: "ascending" | "descending" =
      sortKey === nextKey
        ? sortDirection === "descending"
          ? "ascending"
          : "descending"
        : nextKey === "name"
        ? "ascending"
        : "descending";
    setSortKey(nextKey);
    setSortDirection(nextDir);
    setSortAnnouncement(
      `${SORT_LABELS[nextKey]} 기준 ${
        nextDir === "ascending" ? "오름차순" : "내림차순"
      }으로 정렬됨`
    );
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = DEMAND_CUSTOMERS.filter((cust) => {
      if (segment !== "all" && cust.segment !== segment) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDirection === "ascending" ? cmp : -cmp;
    });
  }, [segment, sortKey, sortDirection]);

  const aggregateStats = useMemo(() => {
    const count = filteredAndSorted.length;
    const totalGpuK = filteredAndSorted.reduce(
      (s, c) => s + c.monthlyGpuEquivalentK,
      0
    );
    const totalHbmTB = filteredAndSorted.reduce(
      (s, c) => s + c.monthlyHbmDemandTB,
      0
    );
    const totalPowerMW = filteredAndSorted.reduce(
      (s, c) => s + c.committedPowerMW,
      0
    );
    const avgBacklog =
      count > 0
        ? filteredAndSorted.reduce((s, c) => s + c.backlogMonths, 0) / count
        : 0;
    const weightedGap =
      totalGpuK > 0
        ? filteredAndSorted.reduce(
            (s, c) => s + c.supplyGapPct * c.monthlyGpuEquivalentK,
            0
          ) / totalGpuK
        : 0;
    return {
      count,
      totalGpuK,
      totalHbmTB,
      totalPowerMW,
      avgBacklog,
      weightedGap,
    };
  }, [filteredAndSorted]);

  const chartSeries = useMemo(() => {
    const topFive = [...filteredAndSorted]
      .sort((a, b) => b.monthlyGpuEquivalentK - a.monthlyGpuEquivalentK)
      .slice(0, 5);

    return topFive.map((cust, idx) => {
      const hbmPerGpuRatio =
        cust.monthlyGpuEquivalentK > 0
          ? cust.monthlyHbmDemandTB / cust.monthlyGpuEquivalentK
          : 150;
      const points = cust.quarterlyDemand.map((q) => ({
        quarter: q.quarter,
        value:
          chartMetric === "gpu"
            ? q.shipmentOrDemand
            : Math.round(q.shipmentOrDemand * hbmPerGpuRatio),
      }));
      return {
        customer: cust,
        style: SERIES_STYLES[idx % SERIES_STYLES.length],
        points,
      };
    });
  }, [filteredAndSorted, chartMetric]);

  const chartBounds = useMemo(() => {
    const allVals = chartSeries.flatMap((s) => s.points.map((p) => p.value));
    const max = Math.max(10, ...allVals);
    return { min: 0, max };
  }, [chartSeries]);

  const quarters = chartSeries[0]?.points.map((p) => p.quarter) ?? [
    "2025 Q1",
    "2025 Q2",
    "2025 Q3",
    "2025 Q4",
    "2026 Q1",
    "2026 Q2",
  ];

  const openCustomerModal = (cust: DemandCustomerRecord) => {
    triggerHaptic("selection");
    openModal({
      id: `customer-${cust.slug}`,
      title: `${cust.name} (${cust.nameKo})`,
      description: `${
        cust.segment === "frontier-lab" ? "프론티어 AI 랩" : "네오클라우드"
      } · ${cust.focusCompute}`,
      size: "lg",
      content: (
        <EntityDetailModalContent
          slug={cust.slug}
          onClose={() => closeModal(true)}
        />
      ),
    });
  };

  const SVG_W = 680;
  const SVG_H = 232;
  const PAD_L = 58;
  const PAD_R = 24;
  const PAD_T = 18;
  const PAD_B = 38;
  const PLOT_W = SVG_W - PAD_L - PAD_R;
  const PLOT_H = SVG_H - PAD_T - PAD_B;

  const headingTitle =
    segment === "frontier-lab"
      ? "프론티어 AI 랩 컴퓨팅·HBM 수요 트래커"
      : segment === "neocloud"
      ? "네오클라우드 베어메탈 GPU 수요 트래커"
      : "AI 수요처 통합 트래커 (프론티어 랩 & 네오클라우드)";

  return (
    <section
      aria-labelledby="demand-trackers-heading"
      className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-6"
    >
      {/* Header */}
      <div
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2
              id="demand-trackers-heading"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
            >
              {headingTitle}
            </h2>
            <span
              className="rounded-full px-3 py-1 surface-pastel-lilac border border-[var(--separator)] text-xs font-bold tabular-nums"
              style={{ color: "var(--label-secondary)" }}
            >
              {aggregateStats.count}개 기관
            </span>
          </div>
          <p
            className="text-xs sm:text-sm font-medium leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            월간 GPU 환산 수요, HBM 탑재 대역폭, 데이터센터 약정 전력(MW), 수주 잔고 및 실리콘 인도 지연에 따른 미충족 수급 갭을 추적합니다.
          </p>
        </div>

        <div className="w-full xl:w-auto max-w-full overflow-x-auto pb-1 xl:pb-0 min-w-0 shrink-0">
          <Tabs
            variant="segmented"
            size="sm"
            activeId={segment}
            onChange={(id) => {
              triggerHaptic("light");
              setHighlightedId(null);
              setSegment(id as "all" | CustomerSegment);
            }}
            items={[
              { id: "all", label: "전체 (10)" },
              { id: "frontier-lab", label: "프론티어 랩 (5)" },
              { id: "neocloud", label: "네오클라우드 (5)" },
            ]}
            className="min-w-[360px] sm:min-w-0 sm:w-[400px] shrink-0"
          />
        </div>
      </div>

      {/* Aggregate Segment Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-pastel-blush rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-1 min-w-0">
          <span
            className="text-xs font-bold block"
            style={{ color: "var(--label-secondary)" }}
          >
            월간 GPU 환산 총수요
          </span>
          <strong className="text-xl sm:text-2xl font-extrabold tabular-nums text-base-content block">
            {aggregateStats.totalGpuK.toLocaleString("en-US")}k
          </strong>
          <span
            className="text-xs font-medium block"
            style={{ color: "var(--label-tertiary)" }}
          >
            GPU-eq units / month
          </span>
        </div>

        <div className="surface-pastel-lilac rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-1 min-w-0">
          <span
            className="text-xs font-bold block"
            style={{ color: "var(--label-secondary)" }}
          >
            월간 HBM 소요량
          </span>
          <strong className="text-xl sm:text-2xl font-extrabold tabular-nums text-base-content block">
            {(aggregateStats.totalHbmTB / 1000).toFixed(1)} PB
          </strong>
          <span
            className="text-xs tabular-nums font-medium block"
            style={{ color: "var(--label-tertiary)" }}
          >
            {aggregateStats.totalHbmTB.toLocaleString("en-US")} TB/mo
          </span>
        </div>

        <div className="surface-pastel-sage rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-1 min-w-0">
          <span
            className="text-xs font-bold block"
            style={{ color: "var(--label-secondary)" }}
          >
            약정 전력 · 평균 잔고
          </span>
          <strong className="text-xl sm:text-2xl font-extrabold tabular-nums text-base-content block">
            {(aggregateStats.totalPowerMW / 1000).toFixed(2)} GW
          </strong>
          <span
            className="text-xs tabular-nums font-medium block"
            style={{ color: "var(--label-tertiary)" }}
          >
            평균 {aggregateStats.avgBacklog.toFixed(1)}개월 백로그
          </span>
        </div>

        <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-1 min-w-0">
          <span
            className="text-xs font-bold block"
            style={{ color: "var(--label-secondary)" }}
          >
            가중 평균 수급 갭
          </span>
          <div className="text-xl sm:text-2xl pt-0.5">
            <SignedDelta value={aggregateStats.weightedGap} />
          </div>
          <span
            className="text-xs font-medium block"
            style={{ color: "var(--label-tertiary)" }}
          >
            공급 제약 미충족 비율
          </span>
        </div>
      </div>

      {/* Quarterly Ramp Multi-Series SVG Chart */}
      {chartSeries.length > 0 && (
        <div className="bg-base-100 rounded-[24px] p-5 sm:p-6 border border-[var(--separator)] space-y-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-base-content">
                2025 Q1 – 2026 Q2 분기별 수요 램프업 궤적 (상위 {chartSeries.length}개)
              </h3>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--label-secondary)" }}
              >
                범례를 클릭하면 해당 기관의 분기 추이선을 강조하여 비교할 수 있습니다.
              </p>
            </div>
            <div className="w-full sm:w-[340px] max-w-full shrink-0">
              <Tabs
                variant="segmented"
                size="xs"
                activeId={chartMetric}
                onChange={(id) => {
                  triggerHaptic("light");
                  setChartMetric(id as "gpu" | "hbm");
                }}
                items={[
                  { id: "gpu", label: "GPU 환산 (k-units)" },
                  { id: "hbm", label: "HBM 수요 (TB)" },
                ]}
                className="w-full"
              />
            </div>
          </div>

          {/* Legend Pills */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="차트 계열 선택">
            {chartSeries.map(({ customer, style }) => {
              const isSelected = highlightedId === customer.id;
              return (
                <button
                  key={customer.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    triggerHaptic("light");
                    setHighlightedId((prev) =>
                      prev === customer.id ? null : customer.id
                    );
                  }}
                  className={`btn btn-xs rounded-full px-3.5 pst-press font-semibold inline-flex items-center gap-2 border ${
                    isSelected
                      ? "bg-primary/14 text-accent-primary border-primary"
                      : "btn-ghost border-[var(--border-control,var(--separator))] control-border text-base-content"
                  }`}
                >
                  <svg width="16" height="6" viewBox="0 0 16 6" aria-hidden="true">
                    <line
                      x1="0"
                      y1="3"
                      x2="16"
                      y2="3"
                      stroke={style.color}
                      strokeWidth="2.5"
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  <span>{customer.name}</span>
                </button>
              );
            })}
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-auto max-h-[260px]"
              role="img"
              aria-label="분기별 AI 컴퓨팅 수요 램프업 다중 선형 차트"
            >
              {/* Horizontal Grid Lines + Y Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = PAD_T + (1 - ratio) * PLOT_H;
                const val = Math.round(chartBounds.max * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={SVG_W - PAD_R}
                      y2={y}
                      stroke="var(--separator)"
                      strokeDasharray={ratio === 0 ? undefined : "3 4"}
                      strokeWidth="1"
                    />
                    <text
                      x={PAD_L - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill="var(--label-secondary)"
                      className="tabular-nums"
                    >
                      {chartMetric === "gpu"
                        ? `${val}k`
                        : `${(val / 1000).toFixed(0)}PB`}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {quarters.map((q, idx) => {
                const x =
                  PAD_L +
                  (idx / Math.max(1, quarters.length - 1)) * PLOT_W;
                return (
                  <text
                    key={q}
                    x={x}
                    y={SVG_H - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="var(--label-secondary)"
                  >
                    {q}
                  </text>
                );
              })}

              {/* Series Polylines */}
              {chartSeries.map(({ customer, style, points }) => {
                const isActive =
                  highlightedId === null || highlightedId === customer.id;
                const coords = points.map((pt, idx) => {
                  const x =
                    PAD_L +
                    (idx / Math.max(1, points.length - 1)) * PLOT_W;
                  const y =
                    PAD_T +
                    (1 - pt.value / Math.max(1, chartBounds.max)) * PLOT_H;
                  return { x, y, ...pt };
                });

                const d = coords
                  .map(
                    (c, idx) =>
                      `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`
                  )
                  .join(" ");

                return (
                  <g
                    key={customer.id}
                    style={{
                      opacity: isActive ? 1 : 0.22,
                      transition: "opacity 200ms ease",
                    }}
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke={style.color}
                      strokeWidth={highlightedId === customer.id ? 3.2 : 2.3}
                      strokeDasharray={style.dash}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {coords.map((c) => (
                      <circle
                        key={`${customer.id}-${c.quarter}`}
                        cx={c.x}
                        cy={c.y}
                        r={highlightedId === customer.id ? 4.5 : 3.2}
                        fill={style.color}
                      >
                        <title>
                          {`${customer.name} (${c.quarter}): ${c.value.toLocaleString("en-US")} ${
                            chartMetric === "gpu" ? "k GPUeq" : "TB HBM"
                          }`}
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Single Polite Live Region for Sort Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {sortAnnouncement}
      </div>

      {/* Sortable Demand Comparison Table */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          size="md"
          title="조건에 일치하는 AI 수요처가 없습니다"
          description="세그먼트 필터를 초기화하여 프론티어 랩 및 네오클라우드 전체 목록을 확인하세요."
          action={
            <Button
              size="sm"
              variant="primary"
              className="rounded-full px-4"
              onClick={() => {
                setSegment("all");
              }}
            >
              전체 수요처 보기
            </Button>
          }
        />
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="demand-trackers-heading"
          className="fabnow-table-region overflow-x-auto rounded-[22px] border border-[var(--border-control,var(--separator))] control-border bg-base-100 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <table className="table table-sm sm:table-md fabnow-table w-full">
            <caption className="sr-only">
              프론티어 AI 랩 및 네오클라우드 기관별 GPU 환산 수요, HBM 수요량, MoM 변동률, 수주 잔고, 약정 전력 및 미충족 수급 갭 비교표
            </caption>
            <thead
              className="bg-base-200 border-b"
              style={{ borderColor: "var(--separator)" }}
            >
              <tr>
                <SortableTh
                  label="기관 / 기업"
                  columnKey="name"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content">
                  주력 클러스터 · 선호 노드
                </th>
                <SortableTh
                  label="GPU 환산 (k/월)"
                  columnKey="monthlyGpuEquivalentK"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="HBM (TB/월)"
                  columnKey="monthlyHbmDemandTB"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="MoM %"
                  columnKey="momDemandDeltaPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="수주 잔고"
                  columnKey="backlogMonths"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="약정 전력"
                  columnKey="committedPowerMW"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="미충족 수급 갭"
                  columnKey="supplyGapPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content text-end">
                  상세 보기
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-[var(--separator)]">
              {filteredAndSorted.map((cust) => {
                const quote = getQuoteForEntity(cust.name);
                return (
                  <tr
                    key={cust.id}
                    className="hover:bg-base-content/4 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-middle min-w-[205px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <EntityMonogram name={cust.name} size="sm" />
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                cust.segment === "frontier-lab"
                                  ? "bg-primary"
                                  : "bg-secondary"
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-extrabold text-sm text-base-content">
                              {cust.name}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--label-secondary)" }}
                            >
                              {cust.nameKo}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <DeploymentBadge status={cust.deploymentStatus} />
                            {quote && quote.status === "live" && quote.dayChangePct !== null && (
                              <span
                                className={`text-xs font-semibold tabular-nums ${
                                  quote.dayChangePct >= 0
                                    ? "text-status-success"
                                    : "text-status-error"
                                }`}
                                title={`${quote.symbol} 연동 시장 지표`}
                              >
                                {quote.symbol} {quote.dayChangePct >= 0 ? "+" : ""}
                                {quote.dayChangePct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle min-w-[225px]">
                      <p className="text-[13px] font-bold text-base-content">
                        {cust.focusCompute}
                      </p>
                      <p
                        className="text-xs font-medium mt-0.5"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        {cust.preferredNodes.slice(0, 3).join(" · ")} |{" "}
                        {cust.primarySuppliers.join(", ")}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-sm font-extrabold text-base-content">
                        {cust.monthlyGpuEquivalentK}k
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-[13px] font-bold text-base-content">
                        {cust.monthlyHbmDemandTB.toLocaleString("en-US")}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <SignedDelta value={cust.momDemandDeltaPct} className="text-xs" />
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-[13px] font-bold text-base-content">
                        {cust.backlogMonths.toFixed(1)}개월
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-[13px] font-bold text-base-content">
                        {cust.committedPowerMW.toLocaleString("en-US")} MW
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <SignedDelta value={cust.supplyGapPct} className="text-xs" />
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <EntityActionLinks
                        slug={cust.slug}
                        entityLabel={cust.name}
                        onOpenModal={() => openCustomerModal(cust)}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
