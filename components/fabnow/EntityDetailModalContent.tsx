"use client";

import React from "react";
import Link from "next/link";
import {
  Button,
  EmptyState,
  IconArrowUpRight,
  Progress,
} from "@/components/ui";
import { getEntityBySlug } from "@/lib/data/fabnow";
import { triggerHaptic } from "@/lib/haptics";
import {
  EntityMonogram,
  RiskBadge,
  SignedDelta,
  SparklineSvg,
} from "./FabnowPrimitives";

export function EntityDetailModalContent({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const entity = getEntityBySlug(slug);

  if (!entity) {
    return (
      <EmptyState
        size="sm"
        title="엔티티 정보를 찾을 수 없습니다"
        description={`요청하신 식별자(${slug})에 해당하는 공급·수요 데이터가 없습니다.`}
        action={
          <Button
            size="sm"
            variant="primary"
            className="rounded-full px-4"
            onClick={onClose}
          >
            닫기
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5 text-base-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <EntityMonogram name={entity.title} size="sm" />
          <span
            className="text-xs sm:text-[13px] font-bold truncate"
            style={{ color: "var(--label-secondary)" }}
          >
            {entity.subtitle}
          </span>
        </div>
        <RiskBadge risk={entity.riskLevel} size="md" />
      </div>

      {entity.kind === "fab" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="surface-pastel-blush rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                월간 출하량
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.monthlyOutputValue} {entity.record.unitLabel}
              </strong>
            </div>
            <div className="surface-pastel-lilac rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                MoM / QoQ
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <SignedDelta value={entity.record.momDeltaPct} />
                <span style={{ color: "var(--label-tertiary)" }}>/</span>
                <SignedDelta value={entity.record.qoqDeltaPct} />
              </div>
            </div>
            <div className="surface-pastel-sage rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                가동률 · 수율
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.utilizationPct.toFixed(1)}% · {entity.record.yieldPct.toFixed(1)}%
              </strong>
            </div>
            <div className="bg-base-100 rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                리드타임 · AI 배정
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.leadTimeWeeks}주 · {entity.record.aiAllocationPct}%
              </strong>
            </div>
          </div>

          <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold">2025 Q1 – 2026 Q2 분기 출하 궤적</span>
              <SparklineSvg
                points={entity.record.quarterlyHistory.map((pt) => ({
                  quarter: pt.quarter,
                  value: pt.shipmentOrDemand,
                }))}
                label={`${entity.record.company} 분기별 출하 추이`}
                width={148}
                height={36}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {entity.record.quarterlyHistory.map((pt) => (
                <div
                  key={pt.quarter}
                  className="rounded-xl px-2.5 py-2 bg-base-200 border border-[var(--separator)] space-y-0.5"
                >
                  <span
                    className="text-xs block font-semibold"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {pt.quarter}
                  </span>
                  <strong className="text-[13px] tabular-nums font-extrabold">
                    {pt.shipmentOrDemand}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-pastel-lilac rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-2.5">
            <p className="text-[13px] font-bold">핵심 병목 공정 및 거점</p>
            <p
              className="text-xs sm:text-[13px] font-medium leading-relaxed"
              style={{ color: "var(--label-secondary)" }}
            >
              {entity.record.bottleneckStage} · 거점: {entity.record.primarySites}
            </p>
            <p className="text-[13px] leading-relaxed text-base-content">
              {entity.record.summaryKo}
            </p>
            <p
              className="text-xs font-medium pt-2 border-t"
              style={{ color: "var(--label-secondary)", borderColor: "var(--separator)" }}
            >
              <strong className="font-bold text-base-content">주요 고객</strong>{" "}
              {entity.record.keyCustomers.join(" · ")}
            </p>
          </div>
        </>
      )}

      {entity.kind === "customer" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="surface-pastel-blush rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                GPU 환산 수요
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.monthlyGpuEquivalentK}k /월
              </strong>
            </div>
            <div className="surface-pastel-lilac rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                HBM 월간 수요
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.monthlyHbmDemandTB.toLocaleString("en-US")} TB
              </strong>
            </div>
            <div className="surface-pastel-sage rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                수주 잔고 · 전력
              </span>
              <strong className="text-sm sm:text-base font-extrabold tabular-nums block">
                {entity.record.backlogMonths.toFixed(1)}개월 · {entity.record.committedPowerMW.toLocaleString("en-US")}MW
              </strong>
            </div>
            <div className="bg-base-100 rounded-[20px] p-3.5 border border-[var(--separator)] space-y-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                미충족 수급 갭
              </span>
              <div className="text-sm sm:text-base pt-0.5">
                <SignedDelta value={entity.record.supplyGapPct} />
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold">분기별 GPU 환산 수요 램프업</span>
              <SparklineSvg
                points={entity.record.quarterlyDemand.map((pt) => ({
                  quarter: pt.quarter,
                  value: pt.shipmentOrDemand,
                }))}
                tone="secondary"
                label={`${entity.record.name} 분기별 수요 추이`}
                width={148}
                height={36}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {entity.record.quarterlyDemand.map((pt) => (
                <div
                  key={pt.quarter}
                  className="rounded-xl px-2.5 py-2 bg-base-200 border border-[var(--separator)] space-y-0.5"
                >
                  <span
                    className="text-xs block font-semibold"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {pt.quarter}
                  </span>
                  <strong className="text-[13px] tabular-nums font-extrabold">
                    {pt.shipmentOrDemand}k
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-pastel-lilac rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3">
            <p className="text-[13px] leading-relaxed text-base-content">
              {entity.record.summaryKo}
            </p>
            <dl
              className="pt-2.5 border-t space-y-1.5 text-xs"
              style={{ borderColor: "var(--separator)" }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <dt
                  className="font-semibold shrink-0"
                  style={{ color: "var(--label-secondary)" }}
                >
                  선호 공정
                </dt>
                <dd className="font-bold text-base-content text-end">
                  {entity.record.preferredNodes.join(" · ")}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt
                  className="font-semibold shrink-0"
                  style={{ color: "var(--label-secondary)" }}
                >
                  주요 공급사
                </dt>
                <dd
                  className="font-medium text-end"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {entity.record.primarySuppliers.join(" · ")}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}

      {entity.kind === "bottleneck" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="surface-pastel-blush rounded-[20px] p-4 border border-[var(--separator)] space-y-1">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                공정 포화도
              </span>
              <strong className="text-lg font-extrabold tabular-nums block">
                {entity.record.saturationPct.toFixed(1)}%
              </strong>
            </div>
            <div className="surface-pastel-lilac rounded-[20px] p-4 border border-[var(--separator)] space-y-1">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                평균 리드타임
              </span>
              <strong className="text-lg font-extrabold tabular-nums block">
                {entity.record.leadTimeWeeks}주
              </strong>
            </div>
            <div className="surface-pastel-sage rounded-[20px] p-4 border border-[var(--separator)] space-y-1">
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--label-secondary)" }}
              >
                MoM 압력 변동
              </span>
              <div className="text-base pt-0.5">
                <SignedDelta value={entity.record.momPressureDeltaPct} invertPolarity />
              </div>
            </div>
          </div>

          <Progress
            value={entity.record.saturationPct}
            max={100}
            taskDescription={`${entity.record.stageName} 캐파 포화도`}
            color={
              entity.record.riskLevel === "tight"
                ? "error"
                : entity.record.riskLevel === "constrained"
                ? "warning"
                : "success"
            }
          />

          <div className="surface-pastel-lilac rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3">
            <p className="text-[13px] font-bold">병목 완화 전략 (Mitigation)</p>
            <p className="text-[13px] leading-relaxed text-base-content">
              {entity.record.mitigationKo}
            </p>
            <dl
              className="pt-2.5 border-t space-y-1.5 text-xs"
              style={{ borderColor: "var(--separator)" }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <dt
                  className="font-semibold shrink-0"
                  style={{ color: "var(--label-secondary)" }}
                >
                  공급 축
                </dt>
                <dd className="font-bold text-base-content text-end">
                  {entity.record.primarySuppliers.join(" · ")}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt
                  className="font-semibold shrink-0"
                  style={{ color: "var(--label-secondary)" }}
                >
                  수요 동인
                </dt>
                <dd
                  className="font-medium text-end"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {entity.record.primaryDrivers.join(" · ")}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}

      {entity.links.length > 0 && (
        <div className="bg-base-100 rounded-[22px] p-4 sm:p-5 border border-[var(--separator)] space-y-3">
          <p className="text-[13px] font-bold">
            연결된 공급-수요 할당 링크 ({entity.links.length}건)
          </p>
          <ul className="space-y-2.5">
            {entity.links.map((link) => (
              <li
                key={link.id}
                className="rounded-xl p-3.5 bg-base-200 border border-[var(--separator)] flex flex-wrap items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-bold text-[13px] truncate">
                    {link.supplierLabel} → {link.customerLabel}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {link.technologyLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="tabular-nums font-semibold">
                    {link.monthlyActualShippedUnits}/{link.monthlyCommittedUnits} {link.unitLabel}
                  </span>
                  <SignedDelta value={link.gapPct} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t"
        style={{ borderColor: "var(--separator)" }}
      >
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full border border-[var(--border-control,var(--separator))] control-border px-4"
          onClick={onClose}
        >
          닫기
        </Button>
        <Link
          href={`/preview/${entity.slug}`}
          onClick={() => {
            triggerHaptic("selection");
            onClose();
          }}
          className="btn btn-sm btn-primary text-primary-content rounded-full px-4 pst-press font-semibold inline-flex items-center gap-1.5"
        >
          <span>전용 프리뷰 페이지 열기</span>
          <IconArrowUpRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
