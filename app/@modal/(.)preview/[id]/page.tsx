import React, { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Display";
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

function getRiskBadgeMeta(risk: RiskLevel): {
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
      },
      {
        label: "가동률 / 수율",
        value: `${r.utilizationPct.toFixed(1)}% / ${r.yieldPct.toFixed(1)}%`,
        sub: `AI 할당 ${r.aiAllocationPct.toFixed(0)}% · 리드타임 ${r.leadTimeWeeks}주`,
      },
      {
        label: "주요 병목 공정",
        value: r.bottleneckStage,
        sub: r.primarySites,
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
      },
      {
        label: "HBM 수요 / 백로그",
        value: `${r.monthlyHbmDemandTB.toLocaleString("ko-KR")} TB / ${r.backlogMonths}개월`,
        sub: r.focusCompute,
      },
      {
        label: "미충족 수급 갭",
        value: formatSignedPercent(r.supplyGapPct),
        sub: `주요 공급 축: ${r.primarySuppliers.slice(0, 2).join(", ")}`,
      },
    ];
  }

  const r = entity.record;
  return [
    {
      label: "공정 포화도",
      value: `${r.saturationPct.toFixed(1)}%`,
      sub: `도메인 ${r.domain.toUpperCase()} · 압력 ${formatSignedPercent(r.momPressureDeltaPct)}`,
    },
    {
      label: "리드타임",
      value: `${r.leadTimeWeeks}주`,
      sub: `공급 축 ${r.primarySuppliers.slice(0, 2).join(", ")}`,
    },
    {
      label: "핵심 수요 동인",
      value: r.primaryDrivers[0] ?? r.stageName,
      sub: r.primaryDrivers.slice(1).join(", ") || r.stageNameKo,
    },
  ];
}

function ModalSkeletonFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded-xl bg-base-content/10" />
          <div className="h-3.5 w-32 rounded-xl bg-base-content/10" />
        </div>
        <div className="h-11 w-11 rounded-2xl bg-base-content/10" />
      </div>
      <h2 id="modal-preview-title" className="sr-only">
        fabnow 엔티티 정보 불러오는 중
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="h-20 rounded-2xl bg-base-content/10" />
        <div className="h-20 rounded-2xl bg-base-content/10" />
        <div className="h-20 rounded-2xl bg-base-content/10" />
      </div>
      <div className="h-24 rounded-2xl bg-base-content/10" />
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
          <div>
            <h2
              id="modal-preview-title"
              className="text-lg font-extrabold tracking-tight text-base-content"
            >
              엔티티를 찾을 수 없습니다
            </h2>
            <p
              className="text-xs font-medium mt-0.5"
              style={{ color: "var(--label-secondary)" }}
            >
              요청한 식별자({id})에 해당하는 수급 데이터가 없습니다.
            </p>
          </div>
          <PreviewModalCloseButton
            ariaLabel="모달 닫기"
            className="btn btn-sm btn-ghost btn-circle rounded-2xl pst-press text-base-content"
          >
            <IconXMark className="w-5 h-5" aria-hidden="true" />
          </PreviewModalCloseButton>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <PreviewModalCloseButton className="btn btn-ghost rounded-2xl pst-press font-semibold text-base-content">
            닫기
          </PreviewModalCloseButton>
          <Link href="/" className="btn btn-primary rounded-2xl pst-press font-semibold">
            통합 수급 현황
          </Link>
        </div>
      </div>
    );
  }

  const riskMeta = getRiskBadgeMeta(entity.riskLevel);
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
    <div className="space-y-4">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 pb-3.5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={riskMeta.variant} size="xs">
              {riskMeta.label}
            </Badge>
            <Badge variant="outline" size="xs">
              {sectionLabel}
            </Badge>
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: "var(--label-secondary)" }}
            >
              {DATA_SYNC_LABEL}
            </span>
          </div>
          <h2
            id="modal-preview-title"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content break-keep"
          >
            {entity.title}
          </h2>
          <p
            className="text-xs font-medium break-keep"
            style={{ color: "var(--label-secondary)" }}
          >
            {entity.subtitle}
          </p>
        </div>

        <PreviewModalCloseButton
          ariaLabel="모달 닫기"
          className="btn btn-sm btn-ghost rounded-2xl pst-press text-base-content shrink-0"
        >
          <IconXMark className="w-5 h-5" aria-hidden="true" />
        </PreviewModalCloseButton>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="material-regular rounded-2xl p-3.5 border border-base-content/10 space-y-1"
          >
            <p
              className="text-[11px] font-semibold break-keep"
              style={{ color: "var(--label-secondary)" }}
            >
              {metric.label}
            </p>
            <p className="text-base font-extrabold tracking-tight text-base-content tabular-nums break-keep">
              {metric.value}
            </p>
            <p
              className="text-[11px] font-medium tabular-nums break-keep"
              style={{ color: "var(--label-secondary)" }}
            >
              {metric.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Intelligence Briefing */}
      <div className="material-regular rounded-2xl p-4 border border-base-content/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-accent-primary">
          <IconLayers className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>수급 인텔리전스 브리핑</span>
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-base-content/90 break-keep">
          {summaryText}
        </p>
      </div>

      {/* Recent Quarters Compact Strip */}
      {recentQuarters && recentQuarters.length > 0 && (
        <div className="material-regular rounded-2xl p-3.5 border border-base-content/10 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-base-content">
            <IconChart className="w-3.5 h-3.5 text-accent-primary shrink-0" aria-hidden="true" />
            <span>최근 4개 분기 추이</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {recentQuarters.map((q) => (
              <div
                key={q.quarter}
                className="rounded-xl bg-base-100 border border-base-content/10 px-2.5 py-2 space-y-0.5"
              >
                <p
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {q.quarter}
                </p>
                <p className="text-xs font-bold text-base-content tabular-nums">
                  {q.shipmentOrDemand.toLocaleString("ko-KR")}
                </p>
                <p className="text-[11px] font-semibold text-accent-primary tabular-nums">
                  {q.utilizationOrAllocationPct.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Commitments Summary */}
      {entity.links.length > 0 && (
        <div className="material-regular rounded-2xl p-3.5 border border-base-content/10 space-y-2">
          <p className="text-xs font-bold text-base-content">
            연계 공급-수요 약정 ({entity.links.length}건)
          </p>
          <ul className="space-y-1.5">
            {entity.links.slice(0, 3).map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs rounded-xl bg-base-100 border border-base-content/10 px-3 py-2"
              >
                <span className="font-semibold text-base-content break-keep">
                  {link.supplierLabel} → {link.customerLabel}
                </span>
                <span className="tabular-nums font-semibold">
                  {link.monthlyActualShippedUnits}/{link.monthlyCommittedUnits}{" "}
                  {link.unitLabel}{" "}
                  <Badge
                    variant={
                      link.gapPct <= -18
                        ? "error"
                        : link.gapPct <= -10
                        ? "warning"
                        : "success"
                    }
                    size="xs"
                  >
                    {formatSignedPercent(link.gapPct)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <Link
          href={`/?section=${sectionId}`}
          className="btn btn-ghost rounded-2xl pst-press font-semibold text-base-content"
        >
          {sectionLabel} 섹션으로 이동
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/preview/${entity.slug}`}
            className="btn btn-outline rounded-2xl pst-press font-semibold"
          >
            전체 리포트 열기
          </a>
          <PreviewModalCloseButton className="btn btn-primary rounded-2xl pst-press font-semibold">
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
