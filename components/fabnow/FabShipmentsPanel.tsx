"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  IconDownload,
  Tabs,
} from "@/components/ui";
import {
  DATA_SYNC_LABEL,
  FAB_SHIPMENTS,
  buildFabnowCsvReport,
  type FabCategory,
  type FabCompany,
  type FabShipmentRecord,
} from "@/lib/data/fabnow";
import { useModal, useToast } from "@/context/OverlayContext";
import { useFabnowLive } from "@/context/FabnowLiveContext";
import { triggerHaptic } from "@/lib/haptics";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import {
  EntityActionLinks,
  EntityMonogram,
  RiskBadge,
  SignedDelta,
  SortableTh,
  SparklineSvg,
} from "./FabnowPrimitives";

type FabSortKey =
  | "company"
  | "monthlyOutputValue"
  | "momDeltaPct"
  | "qoqDeltaPct"
  | "utilizationPct"
  | "yieldPct"
  | "leadTimeWeeks";

const SORT_LABELS: Record<FabSortKey, string> = {
  company: "공급사",
  monthlyOutputValue: "월간 출하량",
  momDeltaPct: "MoM 변동률",
  qoqDeltaPct: "QoQ 변동률",
  utilizationPct: "가동률",
  yieldPct: "수율",
  leadTimeWeeks: "리드타임",
};

const CATEGORY_LABELS: Record<"all" | FabCategory, string> = {
  all: "전체 공정",
  foundry: "파운드리",
  memory: "메모리 (HBM)",
  packaging: "패키징",
};

const COMPANY_OPTIONS: Array<"all" | FabCompany> = [
  "all",
  "TSMC",
  "SK hynix",
  "Samsung Electronics",
  "Micron",
  "Intel Foundry",
];

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function FabShipmentsPanel() {
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const { getQuoteForEntity, lastSyncedAt } = useFabnowLive();

  const [selectedCategory, setSelectedCategory] = useState<"all" | FabCategory>("all");
  const [selectedCompany, setSelectedCompany] = useState<"all" | FabCompany>("all");
  const [sortKey, setSortKey] = useState<FabSortKey>("monthlyOutputValue");
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending">(
    "descending"
  );
  const [sortAnnouncement, setSortAnnouncement] = useState<string>("");

  const handleSort = (nextKeyRaw: string) => {
    const nextKey = nextKeyRaw as FabSortKey;
    const nextDir: "ascending" | "descending" =
      sortKey === nextKey
        ? sortDirection === "descending"
          ? "ascending"
          : "descending"
        : nextKey === "company"
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
    const filtered = FAB_SHIPMENTS.filter((row) => {
      if (selectedCategory !== "all" && row.category !== selectedCategory) {
        return false;
      }
      if (selectedCompany !== "all" && row.company !== selectedCompany) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "company") {
        cmp = a.company.localeCompare(b.company);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDirection === "ascending" ? cmp : -cmp;
    });

    return sorted;
  }, [selectedCategory, selectedCompany, sortKey, sortDirection]);

  const handleDownloadCsv = () => {
    triggerHaptic("medium");
    const dateStamp = (lastSyncedAt ?? new Date().toISOString()).slice(0, 10);
    const csv = buildFabnowCsvReport();
    const filename = `fabnow-supply-demand-${dateStamp}.csv`;
    triggerFileDownload(filename, csv, "text/csv;charset=utf-8");
    showToast({
      title: "CSV 리포트 다운로드 완료",
      description: `${filename} (공급망·수요·병목 전체 26개 엔티티 포함)`,
      variant: "success",
    });
  };

  const handleDownloadJson = () => {
    triggerHaptic("medium");
    const syncedStamp = lastSyncedAt ?? new Date().toISOString();
    const dateStamp = syncedStamp.slice(0, 10);
    const payload = JSON.stringify(
      {
        asOf: DATA_SYNC_LABEL,
        syncedAt: syncedStamp,
        filters: { category: selectedCategory, company: selectedCompany },
        count: filteredAndSorted.length,
        shipments: filteredAndSorted,
      },
      null,
      2
    );
    const filename = `fabnow-fabs-${dateStamp}.json`;
    triggerFileDownload(filename, payload, "application/json;charset=utf-8");
    showToast({
      title: "JSON 팹 출하 리포트 저장됨",
      description: `${filename} (${filteredAndSorted.length}개 라인 데이터)`,
      variant: "success",
    });
  };

  const openFabModal = (fab: FabShipmentRecord) => {
    triggerHaptic("selection");
    openModal({
      id: `fab-${fab.slug}`,
      title: `${fab.company} · ${fab.nodeOrProduct}`,
      description: `${fab.companyKo} · ${fab.lineName}`,
      size: "lg",
      content: (
        <EntityDetailModalContent
          slug={fab.slug}
          onClose={() => closeModal(true)}
        />
      ),
    });
  };

  return (
    <section
      aria-labelledby="fab-shipments-heading"
      className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-6"
    >
      {/* Header + Export Actions */}
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2
              id="fab-shipments-heading"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
            >
              파운드리 · HBM 메모리 · 어드밴스드 패키징 출하 지표
            </h2>
            <span
              className="rounded-full px-3 py-1 surface-pastel-sage border border-[var(--separator)] text-xs font-bold tabular-nums"
              style={{ color: "var(--label-secondary)" }}
            >
              {filteredAndSorted.length}/{FAB_SHIPMENTS.length}개 라인
            </span>
          </div>
          <p
            className="text-xs sm:text-sm font-medium leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            글로벌 5대 제조사의 AI 핵심 라인별 월간 출하 규모, MoM/QoQ 증감, 팹 가동률, 양산 수율 및 납기(Lead Time)를 비교합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-4 border-[var(--border-control,var(--separator))] control-border"
            leadingIcon={<IconDownload className="w-4 h-4" />}
            onClick={handleDownloadCsv}
          >
            CSV 리포트
          </Button>
          <Button
            size="sm"
            variant="soft"
            className="rounded-full px-4"
            leadingIcon={<IconDownload className="w-4 h-4" />}
            onClick={handleDownloadJson}
          >
            JSON 내보내기
          </Button>
        </div>
      </div>

      {/* Category Segmented Switcher & Supplier Filter Pills */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="w-full xl:w-auto max-w-full overflow-x-auto pb-1 xl:pb-0 min-w-0 shrink-0">
          <Tabs
            variant="segmented"
            size="sm"
            activeId={selectedCategory}
            onChange={(id) => {
              triggerHaptic("light");
              setSelectedCategory(id as "all" | FabCategory);
            }}
            items={[
              { id: "all", label: CATEGORY_LABELS.all },
              { id: "foundry", label: CATEGORY_LABELS.foundry },
              { id: "memory", label: CATEGORY_LABELS.memory },
              { id: "packaging", label: CATEGORY_LABELS.packaging },
            ]}
            className="min-w-[420px] sm:min-w-0 sm:w-full xl:w-[480px] shrink-0"
          />
        </div>

        <div
          role="group"
          aria-label="반도체 제조사 필터"
          className="flex flex-wrap items-center gap-2"
        >
          {COMPANY_OPTIONS.map((comp) => {
            const isActive = selectedCompany === comp;
            return (
              <button
                key={comp}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedCompany(comp);
                }}
                className={`btn btn-xs rounded-full px-3.5 pst-press font-semibold ${
                  isActive
                    ? "btn-primary text-primary-content"
                    : "btn-ghost border border-[var(--border-control,var(--separator))] control-border text-base-content"
                }`}
              >
                {comp === "all" ? "전체 제조사" : comp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Polite Live Region for Sort Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {sortAnnouncement}
      </div>

      {/* Accessible Responsive Table */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          size="md"
          title="조건에 일치하는 팹 출하 라인이 없습니다"
          description="공급사·공정 필터를 초기화하여 전체 10개 핵심 라인을 확인해 보세요."
          action={
            <Button
              size="sm"
              variant="primary"
              className="rounded-full px-4"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCompany("all");
              }}
            >
              필터 초기화
            </Button>
          }
        />
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="fab-shipments-heading"
          className="fabnow-table-region overflow-x-auto rounded-[22px] border border-[var(--border-control,var(--separator))] control-border bg-base-100 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <table className="table table-sm sm:table-md fabnow-table w-full">
            <caption className="sr-only">
              글로벌 반도체 파운드리, HBM 메모리, 어드밴스드 패키징 라인별 월간 출하량, 변동률, 가동률, 수율, 리드타임 비교표
            </caption>
            <thead
              className="bg-base-200 border-b"
              style={{ borderColor: "var(--separator)" }}
            >
              <tr>
                <SortableTh
                  label="공급사 / 라인"
                  columnKey="company"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content">
                  공정 · 제품 노드
                </th>
                <SortableTh
                  label="월간 출하량"
                  columnKey="monthlyOutputValue"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="MoM %"
                  columnKey="momDeltaPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="QoQ %"
                  columnKey="qoqDeltaPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="가동률 %"
                  columnKey="utilizationPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="수율 %"
                  columnKey="yieldPct"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <SortableTh
                  label="리드타임"
                  columnKey="leadTimeWeeks"
                  activeSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  align="end"
                />
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content text-center">
                  분기 추이
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content text-end">
                  상태 · 상세
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-[var(--separator)]">
              {filteredAndSorted.map((fab) => {
                const quote = getQuoteForEntity(fab.company);
                const sparkTone =
                  fab.riskLevel === "tight"
                    ? "error"
                    : fab.riskLevel === "constrained"
                    ? "warning"
                    : "success";

                return (
                  <tr
                    key={fab.id}
                    className="hover:bg-base-content/4 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-middle min-w-[220px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <EntityMonogram name={fab.company} size="sm" />
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-sm text-base-content">
                              {fab.company}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--label-secondary)" }}
                            >
                              {fab.companyKo}
                            </span>
                            {quote && quote.status === "live" && quote.dayChangePct !== null && (
                              <span
                                className={`text-xs font-semibold tabular-nums ${
                                  quote.dayChangePct >= 0
                                    ? "text-status-success"
                                    : "text-status-error"
                                }`}
                                title={`${quote.symbol} 실시간 시세 변동`}
                              >
                                {quote.symbol} {quote.dayChangePct >= 0 ? "+" : ""}
                                {quote.dayChangePct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs font-medium truncate max-w-[220px]"
                            style={{ color: "var(--label-secondary)" }}
                          >
                            {fab.lineName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle min-w-[175px]">
                      <div className="space-y-1">
                        <span className="font-bold text-[13px] text-base-content block">
                          {fab.nodeOrProduct}
                        </span>
                        <span
                          className="text-xs font-medium block"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          AI 배정 {fab.aiAllocationPct}% · {fab.primarySites}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-sm font-extrabold text-base-content">
                        {fab.monthlyOutputValue.toLocaleString("en-US")}
                      </span>{" "}
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        {fab.unitLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <SignedDelta value={fab.momDeltaPct} className="text-xs" />
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <SignedDelta value={fab.qoqDeltaPct} className="text-xs" />
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-[13px] font-bold text-base-content">
                        {fab.utilizationPct.toFixed(1)}%
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <div className="inline-flex flex-col items-end gap-0.5">
                        <span className="text-[13px] font-bold text-base-content">
                          {fab.yieldPct.toFixed(1)}%
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          {fab.yieldTrend === "improving"
                            ? "개선 중"
                            : fab.yieldTrend === "ramping"
                            ? "램프업"
                            : "안정"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap tabular-nums">
                      <span className="text-[13px] font-bold text-base-content">
                        {fab.leadTimeWeeks}주
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-center">
                      <div className="inline-flex items-center justify-center">
                        <SparklineSvg
                          points={fab.quarterlyHistory.map((pt) => ({
                            quarter: pt.quarter,
                            value: pt.shipmentOrDemand,
                          }))}
                          tone={sparkTone}
                          label={`${fab.company} ${fab.nodeOrProduct} 분기별 출하 추이 (${fab.quarterlyHistory[0]?.shipmentOrDemand} → ${fab.quarterlyHistory[fab.quarterlyHistory.length - 1]?.shipmentOrDemand})`}
                          width={96}
                          height={28}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <RiskBadge risk={fab.riskLevel} size="xs" />
                        <EntityActionLinks
                          slug={fab.slug}
                          entityLabel={`${fab.company} ${fab.nodeOrProduct}`}
                          onOpenModal={() => openFabModal(fab)}
                          compact
                        />
                      </div>
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
