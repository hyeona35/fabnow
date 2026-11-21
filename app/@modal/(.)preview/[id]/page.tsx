import React, { Suspense } from "react";
import Link from "next/link";
import {
  IconXMark,
  IconLayers,
  IconChart,
} from "@/components/ui/icons";
import {
  PreviewModalShell,
  PreviewModalCloseButton,
} from "@/components/ui/NavigationClient";
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

function getRiskStatusMeta(risk: RiskLevel): {
  label: string;
  dotClass: string;
  textClass: string;
} {
  if (risk === "tight") {
    return {
      label: "고압 · 긴장 (Tight)",
      dotClass: "bg-error",
      textClass: "text-status-error",
    };
  }
  if (risk === "constrained") {
    return {
      label: "수급 제약 (Constrained)",
      dotClass: "bg-warning",
      textClass: "text-status-warning",
    };
  }
  return {
    label: "안정 · 균형 (Balanced)",
    dotClass: "bg-success",
    textClass: "text-status-success",
  };
}

function resolveSectionInfo(entity: FabnowEntity): {
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

function buildModalMetrics(entity: FabnowEntity) {
  if (entity.kind === "fab") {
    const r = entity.record;
    return [
      {
        label: "월간 출하량",
        value: `${r.monthlyOutputValue.toLocaleString("ko-KR")} ${r.unitLabel}`,
        sub: `MoM ${formatSignedPercent(r.momDeltaPct)} · YoY ${formatSignedPercent(r.yoyDeltaPct)}`,
        surfaceClass: "surface-pastel-blush",
      },
      {
        label: "가동률 / 수율",
        value: `${r.utilizationPct.toFixed(1)}% / ${r.yieldPct.toFixed(1)}%`,
        sub: `AI 할당 ${r.aiAllocationPct.toFixed(0)}% · 리드타임 ${r.leadTimeWeeks}주`,
        surfaceClass: "surface-pastel-lilac",
      },
      {
        label: "주요 병목 공정",
        value: r.bottleneckStage,
        sub: r.primarySites,
        surfaceClass: "surface-pastel-sage",
      },
    ];
  }

  if (entity.kind === "customer") {
    const r = entity.record;
    return [
      {
        label: "월간 GPU 환산 수요",
        value: `${r.monthlyGpuEquivalentK.toLocaleString("ko-KR")}k GPUeq`,
        sub: `MoM ${formatSignedPercent(r.momDemandDeltaPct)} · 전력 ${r.committedPowerMW.toLocaleString("ko-KR")} MW`,
        surfaceClass: "surface-pastel-blush",
      },
      {
        label: "HBM 수요 / 백로그",
        value: `${r.monthlyHbmDemandTB.toLocaleString("ko-KR")} TB / ${r.backlogMonths}개월`,
        sub: r.focusCompute,
        surfaceClass: "surface-pastel-lilac",
      },
      {
        label: "미충족 수급 갭",
        value: formatSignedPercent(r.supplyGapPct),
        sub: `주요 공급 축: ${r.primarySuppliers.slice(0, 2).join(", ")}`,
        surfaceClass: "surface-pastel-sage",
      },
    ];
  }

  const r = entity.record;
  return [
    {
      label: "공정 포화도",
      value: `${r.saturationPct.toFixed(1)}%`,
      sub: `도메인 ${r.domain.toUpperCase()} · 압력 ${formatSignedPercent(r.momPressureDeltaPct)}`,
      surfaceClass: "surface-pastel-blush",
    },
    {
      label: "리드타임",
      value: `${r.leadTimeWeeks}주`,
      sub: `공급 축 ${r.primarySuppliers.slice(0, 2).join(", ")}`,
      surfaceClass: "surface-pastel-lilac",
    },
    {
      label: "핵심 수요 동인",
      value: r.primaryDrivers[0] ?? r.stageName,
      sub: r.primaryDrivers.slice(1).join(", ") || r.stageNameKo,
      surfaceClass: "surface-pastel-sage",
    },
  ];
}

function ModalSkeletonFallback() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-5 w-48 max-w-full rounded-xl bg-base-200" />
          <div className="h-4 w-32 rounded-xl bg-base-200" />
        </div>
        <div className="h-11 w-11 rounded-full bg-base-200 shrink-0" />
      </div>
      <h2 id="modal-preview-title" className="sr-only">
        fabnow 엔티티 정보 불러오는 중
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="h-24 rounded-[22px] bg-base-200" />
        <div className="h-24 rounded-[22px] bg-base-200" />
        <div className="h-24 rounded-[22px] bg-base-200" />
      </div>
      <div className="h-28 rounded-[22px] bg-base-200" />
    </div>
  );
}

async function ModalEntityContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = getEntityBySlug(id);

  if (!entity) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="modal-preview-title"
              className="text-lg font-extrabold tracking-tight text-base-content"
            >
              엔티티를 찾을 수 없습니다
            </h2>
            <p
              className="text-xs sm:text-[13px] font-medium mt-1"
              style={{ color: "var(--label-secondary)" }}
            >
              요청한 식별자({id})에 해당하는 수급 데이터가 없습니다.
            </p>
          </div>
          <PreviewModalCloseButton
            ariaLabel="모달 닫기"
            className="btn btn-sm btn-ghost btn-circle rounded-full border border-[var(--border-control,var(--separator))] control-border pst-press text-base-content shrink-0"
          >
            <IconXMark className="w-5 h-5" aria-hidden="true" />
          </PreviewModalCloseButton>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <PreviewModalCloseButton className="btn btn-sm btn-ghost rounded-full border border-[var(--border-control,var(--separator))] control-border px-4 pst-press font-semibold text-base-content">
            닫기
          </PreviewModalCloseButton>
          <Link
            href="/"
            className="btn btn-sm btn-primary text-primary-content rounded-full px-5 pst-press font-semibold"
          >
            통합 수급 현황
          </Link>
        </div>
      </div>
    );
  }

  const riskMeta = getRiskStatusMeta(entity.riskLevel);
  const { sectionId, sectionLabel } = resolveSectionInfo(entity);
  const metrics = buildModalMetrics(entity);
  const summaryText =
    entity.kind === "bottleneck"
      ? entity.record.mitigationKo
      : entity.record.summaryKo;

  const recentQuarters =
    entity.kind === "fab"
      ? entity.record.quarterlyHistory.slice(-4)
      : entity.kind === "customer"
      ? entity.record.quarterlyDemand.slice(-4)
      : null;

  return (
    <div className="space-y-5">
      {/* Sticky Sheet Header (stays pinned while scrolling inside PreviewModalShell) */}
      <div
        className="sticky top-0 z-10 -mx-5 -mt-1 px-5 pt-2 pb-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 flex items-start justify-between gap-3 border-b bg-base-100/95 backdrop-blur-md"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="min-w-0 space-y-2 flex-1">
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold"
            style={{ color: "var(--label-secondary)" }}
          >
            <span className={`inline-flex items-center gap-1.5 font-bold ${riskMeta.textClass}`}>
              <span className={`w-2 h-2 rounded-full ${riskMeta.dotClass} shrink-0`} aria-hidden="true" />
              {riskMeta.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>{sectionLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{DATA_SYNC_LABEL}</span>
          </div>
          <h2
            id="modal-preview-title"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content break-keep leading-snug"
          >
            {entity.title}
          </h2>
          <p
            className="text-xs sm:text-[13px] font-medium break-keep leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            {entity.subtitle}
          </p>
        </div>

        <PreviewModalCloseButton
          ariaLabel="모달 닫기"
          className="btn btn-sm btn-ghost btn-square rounded-full border border-[var(--border-control,var(--separator))] control-border pst-press text-base-content shrink-0"
        >
          <IconXMark className="w-5 h-5" aria-hidden="true" />
        </PreviewModalCloseButton>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`${metric.surfaceClass} rounded-[22px] p-4 border border-[var(--separator)] space-y-1.5 min-w-0`}
          >
            <p
              className="text-xs font-bold break-keep"
              style={{ color: "var(--label-secondary)" }}
            >
              {metric.label}
            </p>
            <p className="text-base sm:text-lg font-extrabold tracking-tight text-base-content tabular-nums break-keep">
              {metric.value}
            </p>
            <p
              className="text-xs font-medium tabular-nums break-keep"
              style={{ color: "var(--label-secondary)" }}
            >
              {metric.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Intelligence Briefing */}
      <div className="surface-pastel-lilac rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-accent-primary">
          <IconLayers className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>수급 인텔리전스 브리핑</span>
        </div>
        <p className="text-[13px] sm:text-sm font-medium leading-relaxed text-base-content break-keep">
          {summaryText}
        </p>
      </div>

      {/* Recent Quarters Compact Strip */}
      {recentQuarters && recentQuarters.length > 0 && (
        <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-base-content">
            <IconChart className="w-4 h-4 text-accent-primary shrink-0" aria-hidden="true" />
            <span>최근 4개 분기 추이</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {recentQuarters.map((q) => (
              <div
                key={q.quarter}
                className="rounded-xl bg-base-200 border border-[var(--separator)] px-3 py-2.5 space-y-1"
              >
                <p
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {q.quarter}
                </p>
                <p className="text-sm font-extrabold text-base-content tabular-nums">
                  {q.shipmentOrDemand.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs font-bold text-accent-primary tabular-nums">
                  {q.utilizationOrAllocationPct.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Commitments Summary */}
      {entity.links.length > 0 && (
        <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3">
          <p className="text-xs sm:text-[13px] font-bold text-base-content">
            연계 공급-수요 약정 ({entity.links.length}건)
          </p>
          <ul className="space-y-2">
            {entity.links.slice(0, 3).map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] rounded-xl bg-base-200 border border-[var(--separator)] px-3.5 py-2.5"
              >
                <span className="font-bold text-base-content break-keep">
                  {link.supplierLabel} → {link.customerLabel}
                </span>
                <span className="tabular-nums font-semibold">
                  {link.monthlyActualShippedUnits}/{link.monthlyCommittedUnits}{" "}
                  {link.unitLabel}{" "}
                  <span
                    className={`font-bold ${
                      link.gapPct <= -18
                        ? "text-status-error"
                        : link.gapPct <= -10
                        ? "text-status-warning"
                        : "text-status-success"
                    }`}
                  >
                    {formatSignedPercent(link.gapPct)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t"
        style={{ borderColor: "var(--separator)" }}
      >
        <Link
          href={`/?section=${sectionId}`}
          className="btn btn-sm btn-ghost rounded-full px-3.5 pst-press font-semibold text-base-content"
        >
          {sectionLabel} 섹션으로 이동
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/preview/${entity.slug}`}
            className="btn btn-sm btn-outline rounded-full px-4 border-[var(--border-control,var(--separator))] control-border pst-press font-semibold text-base-content"
          >
            전체 리포트 열기
          </a>
          <PreviewModalCloseButton className="btn btn-sm btn-primary text-primary-content rounded-full px-5 pst-press font-semibold">
            닫기
          </PreviewModalCloseButton>
        </div>
      </div>
    </div>
  );
}

export default function InterceptedPreviewModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <PreviewModalShell ariaLabelledBy="modal-preview-title">
      <Suspense fallback={<ModalSkeletonFallback />}>
        <ModalEntityContent params={params} />
      </Suspense>
    </PreviewModalShell>
  );
}
