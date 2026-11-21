"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Progress,
  RadialProgress,
  Tabs,
} from "@/components/ui";
import {
  BOTTLENECK_STAGES,
  type BottleneckDomain,
  type BottleneckStageRecord,
} from "@/lib/data/fabnow";
import { useModal } from "@/context/OverlayContext";
import { triggerHaptic } from "@/lib/haptics";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import {
  EntityActionLinks,
  RiskBadge,
  SignedDelta,
} from "./FabnowPrimitives";

const DOMAIN_LABELS: Record<"all" | BottleneckDomain, string> = {
  all: "전체 (6)",
  packaging: "패키징·전력",
  memory: "HBM",
  wafer: "웨이퍼",
  substrate: "기판",
};

export function BottleneckMonitorPanel() {
  const { openModal, closeModal } = useModal();
  const [domainFilter, setDomainFilter] = useState<"all" | BottleneckDomain>("all");

  const filteredStages = useMemo(() => {
    return BOTTLENECK_STAGES.filter((bn) => {
      if (domainFilter !== "all" && bn.domain !== domainFilter) return false;
      return true;
    }).sort((a, b) => b.saturationPct - a.saturationPct);
  }, [domainFilter]);

  const peakStage = useMemo(
    () => [...BOTTLENECK_STAGES].sort((a, b) => b.saturationPct - a.saturationPct)[0],
    []
  );

  const openBottleneckModal = (bn: BottleneckStageRecord) => {
    triggerHaptic("selection");
    openModal({
      id: `bottleneck-${bn.slug}`,
      title: `${bn.stageName} · ${bn.stageNameKo}`,
      description: `포화도 ${bn.saturationPct.toFixed(1)}% · 평균 리드타임 ${bn.leadTimeWeeks}주`,
      size: "lg",
      content: (
        <EntityDetailModalContent
          slug={bn.slug}
          onClose={() => closeModal(true)}
        />
      ),
    });
  };

  return (
    <section
      aria-labelledby="bottleneck-monitor-heading"
      className="bg-base-100 rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-6"
    >
      {/* Header */}
      <div
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2
              id="bottleneck-monitor-heading"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
            >
              공정 병목 포화도 · 리드타임 모니터
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 surface-pastel-blush border border-[var(--separator)] text-xs font-bold text-status-error tabular-nums">
              <span className="w-2 h-2 rounded-full bg-error shrink-0" aria-hidden="true" />
              긴급 병목 {BOTTLENECK_STAGES.filter((b) => b.riskLevel === "tight").length}건
            </span>
          </div>
          <p
            className="text-xs sm:text-sm font-medium leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            CoWoS-L, HBM3E 12-Hi, HBM4 베이스 다이, N2/N3P EUV 노광, ABF/글래스 기판 및 액체냉각 랙 전력 구간의 포화율과 월간 압력 변화를 점검합니다.
          </p>
        </div>

        <div className="w-full xl:w-auto max-w-full overflow-x-auto pb-1 xl:pb-0 min-w-0 shrink-0">
          <Tabs
            variant="segmented"
            size="sm"
            activeId={domainFilter}
            onChange={(id) => {
              triggerHaptic("light");
              setDomainFilter(id as "all" | BottleneckDomain);
            }}
            items={[
              { id: "all", label: DOMAIN_LABELS.all },
              { id: "packaging", label: DOMAIN_LABELS.packaging },
              { id: "memory", label: DOMAIN_LABELS.memory },
              { id: "wafer", label: DOMAIN_LABELS.wafer },
              { id: "substrate", label: DOMAIN_LABELS.substrate },
            ]}
            className="min-w-[480px] sm:min-w-0 sm:w-full xl:w-[540px] shrink-0"
          />
        </div>
      </div>

      {/* Lead-Time Alert Callout */}
      {peakStage && (
        <Alert
          variant="warning"
          title={`최고 포화 경보: ${peakStage.stageName} (${peakStage.saturationPct.toFixed(1)}% 포화 · 리드타임 ${peakStage.leadTimeWeeks}주)`}
          description={`${peakStage.stageNameKo} 공정은 MoM +${peakStage.momPressureDeltaPct.toFixed(1)}% 압력 상승이 관측되었으며, OSAT 외주 패키징 및 듀얼 소싱 병행이 필수적입니다.`}
          actionLabel="완화 전략 보기"
          onAction={() => openBottleneckModal(peakStage)}
        />
      )}

      {/* Chokepoint Cards Grid */}
      {filteredStages.length === 0 ? (
        <EmptyState
          size="md"
          title="조건에 일치하는 병목 공정이 없습니다"
          description="공정 도메인 탭을 초기화하여 전체 6대 병목 구간을 확인하세요."
          action={
            <Button
              size="sm"
              variant="primary"
              className="rounded-full px-4"
              onClick={() => {
                setDomainFilter("all");
              }}
            >
              병목 필터 초기화
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStages.map((bn) => {
            const colorVariant =
              bn.riskLevel === "tight"
                ? "error"
                : bn.riskLevel === "constrained"
                ? "warning"
                : "success";

            const pastelTintClass =
              bn.riskLevel === "tight"
                ? "surface-pastel-blush"
                : bn.riskLevel === "constrained"
                ? "surface-pastel-lilac"
                : "surface-pastel-sage";

            return (
              <Card
                key={bn.id}
                materialWeight="regular"
                title={bn.stageName}
                subtitle={`${DOMAIN_LABELS[bn.domain]} · ${bn.stageNameKo}`}
                actions={
                  <div className="w-full flex items-center justify-between gap-2">
                    <RiskBadge risk={bn.riskLevel} size="sm" />
                    <EntityActionLinks
                      slug={bn.slug}
                      entityLabel={bn.stageName}
                      onOpenModal={() => openBottleneckModal(bn)}
                      compact
                    />
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <RadialProgress
                      value={bn.saturationPct}
                      sizeRem={5.25}
                      thicknessPx={7.5}
                      color={colorVariant}
                      label="캐파 포화도"
                    />
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div
                        className={`${pastelTintClass} rounded-[18px] p-3 border border-[var(--separator)]`}
                      >
                        <span
                          className="text-xs font-semibold block"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          평균 리드타임
                        </span>
                        <strong className="text-base font-extrabold tabular-nums text-base-content">
                          {bn.leadTimeWeeks}주
                        </strong>
                      </div>
                      <div
                        className={`${pastelTintClass} rounded-[18px] p-3 border border-[var(--separator)]`}
                      >
                        <span
                          className="text-xs font-semibold block"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          MoM 병목 압력
                        </span>
                        <SignedDelta
                          value={bn.momPressureDeltaPct}
                          invertPolarity
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Progress
                    value={bn.saturationPct}
                    max={100}
                    taskDescription={`${bn.stageName} 가동 부하율`}
                    color={colorVariant}
                  />

                  <div className="space-y-3">
                    <p className="text-[13px] leading-relaxed text-base-content">
                      {bn.mitigationKo}
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
                          핵심 공급
                        </dt>
                        <dd className="font-semibold text-base-content text-end truncate">
                          {bn.primarySuppliers.join(" · ")}
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
                          className="font-medium text-end truncate"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          {bn.primaryDrivers.join(" · ")}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
