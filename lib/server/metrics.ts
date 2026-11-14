import "server-only";
import { cache } from "react";
import {
  formatSignedPercent,
  getSupplyDemandSummary,
} from "@/lib/data/fabnow";

export interface TelemetryMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  status: "healthy" | "optimal" | "active";
}

/**
 * Server-only fabnow edge telemetry metric provider with React.cache() memoization.
 * Deduplicates repeated calls across the same RSC render pass and derives KPIs
 * directly from the authoritative dataset in lib/data/fabnow.ts.
 */
export const fetchServerTelemetry = cache(async (): Promise<TelemetryMetric[]> => {
  const summary = getSupplyDemandSummary();

  return [
    {
      id: "global-fab-utilization",
      name: "글로벌 AI 팹 평균 가동률",
      value: `${summary.avgFabUtilizationPct.toFixed(1)}%`,
      change: `AI 공정 배정 ${summary.avgAiAllocationPct.toFixed(1)}% · ${summary.totalFabLines}개 라인`,
      status: "optimal",
    },
    {
      id: "hbm-cowos-demand-gap",
      name: "HBM·CoWoS 초과 수요 갭",
      value: formatSignedPercent(summary.unmetPackagingAndHbmGapPct),
      change: `최대 병목 ${summary.peakBottleneck.stageName} (${summary.peakBottleneck.saturationPct.toFixed(1)}%)`,
      status: "active",
    },
    {
      id: "ai-compute-backlog",
      name: "프론티어·네오클라우드 수주 잔고",
      value: `${summary.avgBacklogMonths.toFixed(1)}개월`,
      change: `월 ${summary.totalMonthlyGpuEquivalentK.toLocaleString("en-US")}k GPUeq 수요`,
      status: "healthy",
    },
    {
      id: "leadtime-momentum",
      name: "핵심 공정 평균 리드타임 변동",
      value: `${summary.avgFabLeadTimeWeeks.toFixed(1)}주`,
      change: `MoM +${summary.avgLeadTimeMomDeltaWeeks.toFixed(1)}주 · 위험 병목 ${summary.criticalBottleneckCount}건`,
      status: "active",
    },
  ];
});
