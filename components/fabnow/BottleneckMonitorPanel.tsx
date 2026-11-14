"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  IconPulse,
  Progress,
  RadialProgress,
  Tabs,
  type SearchToken,
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

export function BottleneckMonitorPanel({
  searchQuery = "",
  searchTokens = [],
  onResetSearch,
}: {
  searchQuery?: string;
  searchTokens?: SearchToken[];
  onResetSearch?: () => void;
}) {
  const { openModal, closeModal } = useModal();
  const [domainFilter, setDomainFilter] = useState<"all" | BottleneckDomain>("all");

  const filteredStages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokenValues = searchTokens.map((t) => t.value.toLowerCase());

    return BOTTLENECK_STAGES.filter((bn) => {
      if (domainFilter !== "all" && bn.domain !== domainFilter) return false;
      const haystack = [
        bn.stageName,
        bn.stageNameKo,
        bn.domain,
        bn.mitigationKo,
        ...bn.primarySuppliers,
        ...bn.primaryDrivers,
      ]
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (tokenValues.some((tv) => !haystack.includes(tv))) return false;
      return true;
    }).sort((a, b) => b.saturationPct - a.saturationPct);
  }, [domainFilter, searchQuery, searchTokens]);

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
      className="material-regular rounded-3xl p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-2xl bg-error/14 text-status-error shrink-0">
              <IconPulse className="w-5 h-5" />
            </span>
            <h2
              id="bottleneck-monitor-heading"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
            >
              공정 병목 포화도 & 리드타임 경보 모니터
            </h2>
            <Badge variant="error" size="sm">
              긴급 병목 {BOTTLENECK_STAGES.filter((b) => b.riskLevel === "tight").length}건
            </Badge>
          </div>
          <p
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--label-secondary)" }}
          >
            CoWoS-L, HBM3E 12-Hi, HBM4 베이스 다이, N2/N3P EUV 노광, ABF/글래스 기판 및 액체냉각 랙 전력 구간의 포화율과 월간 압력 변화를 점검합니다.
          </p>
        </div>

        <div className="max-w-full overflow-x-auto pb-0.5 xl:pb-0 shrink-0">
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
          description="공정 도메인 탭이나 검색어를 초기화하여 전체 6대 병목 구간을 확인하세요."
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setDomainFilter("all");
                onResetSearch?.();
              }}
            >
              병목 필터 초기화
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStages.map((bn) => {
            const colorVariant =
              bn.riskLevel === "tight"
                ? "error"
                : bn.riskLevel === "constrained"
                ? "warning"
                : "success";

            return (
              <Card
                key={bn.id}
                materialWeight="regular"
                title={bn.stageName}
                subtitle={bn.stageNameKo}
                badge={bn.domain.toUpperCase()}
                actions={
                  <div className="w-full flex items-center justify-between gap-2">
                    <RiskBadge risk={bn.riskLevel} size="xs" />
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
                      sizeRem={5}
                      thicknessPx={7}
                      color={colorVariant}
                      label="캐파 포화도"
                    />
                    <div className="flex-1 space-y-2.5">
                      <div className="bg-base-200/70 rounded-2xl p-2.5 border border-base-content/10">
                        <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
                          평균 리드타임
                        </span>
                        <strong className="text-base font-extrabold tabular-nums text-base-content">
                          {bn.leadTimeWeeks}주
                        </strong>
                      </div>
                      <div className="bg-base-200/70 rounded-2xl p-2.5 border border-base-content/10">
                        <span className="text-[11px] font-medium block" style={{ color: "var(--label-secondary)" }}>
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

                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-base-content">
                      {bn.mitigationKo}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bn.primarySuppliers.map((sup) => (
                        <Badge key={sup} variant="outline" size="xs">
                          {sup}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bn.primaryDrivers.map((drv) => (
                        <Badge key={drv} variant="secondary" size="xs">
                          {drv}
                        </Badge>
                      ))}
                    </div>
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
