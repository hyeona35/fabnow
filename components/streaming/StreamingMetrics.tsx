import React from "react";
import { fetchServerTelemetry } from "@/lib/server/metrics";
import { DATA_SYNC_LABEL } from "@/lib/data/fabnow";
import {
  IconCheckCircle,
  IconChip,
  IconExclamationTriangle,
  IconInfoCircle,
  IconLayers,
  IconPulse,
  IconServer,
} from "@/components/ui/icons";

const CARD_VISUAL_META = [
  {
    surfaceClass: "surface-pastel-blush",
    iconBgClass: "bg-primary/14 text-accent-primary",
    barClass: "bg-primary",
    fillPct: 92,
    Icon: IconChip,
  },
  {
    surfaceClass: "surface-pastel-lilac",
    iconBgClass: "bg-warning/15 text-status-warning",
    barClass: "bg-warning",
    fillPct: 78,
    Icon: IconLayers,
  },
  {
    surfaceClass: "surface-pastel-sage",
    iconBgClass: "bg-success/15 text-status-success",
    barClass: "bg-success",
    fillPct: 84,
    Icon: IconServer,
  },
  {
    surfaceClass: "bg-base-100",
    iconBgClass: "bg-secondary/14 text-accent-secondary",
    barClass: "bg-secondary",
    fillPct: 72,
    Icon: IconPulse,
  },
] as const;

function resolveNumericMeter(value: string, fallbackPct: number): number {
  const num = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return fallbackPct;
  if (value.includes("%")) {
    return Math.min(100, Math.max(12, Math.abs(num)));
  }
  return fallbackPct;
}

export async function StreamingMetrics() {
  const metrics = await fetchServerTelemetry();

  return (
    <section
      aria-label="글로벌 반도체·AI 수급 핵심 지표"
      className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-base-content">
            글로벌 반도체·AI 수급 밸런스
          </h2>
          <p
            className="text-xs sm:text-[13px] font-medium"
            style={{ color: "var(--label-secondary)" }}
          >
            핵심 파운드리 가동률, 패키징·HBM 초과 수요, AI 연산 백로그 및 평균 리드타임을 한눈에 확인합니다.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 surface-pastel-sage border border-[var(--separator)] text-xs font-semibold shrink-0"
          style={{ color: "var(--label-secondary)" }}
        >
          <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden="true" />
          <span>{DATA_SYNC_LABEL}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {metrics.map((metric, idx) => {
          const isOptimal = metric.status === "optimal";
          const isHealthy = metric.status === "healthy";
          const visual = CARD_VISUAL_META[idx % CARD_VISUAL_META.length];
          const MetricIcon = visual.Icon;
          const meterPct = resolveNumericMeter(metric.value, visual.fillPct);

          return (
            <div
              key={metric.id}
              className={`${visual.surfaceClass} rounded-[22px] p-5 border border-[var(--separator)] flex flex-col justify-between gap-4 min-w-0 transition-transform duration-200`}
            >
              <div className="flex items-start justify-between gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 border border-[var(--separator)] ${visual.iconBgClass}`}
                >
                  <MetricIcon className="w-5 h-5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 bg-base-100/80 border border-[var(--separator)] ${
                    isOptimal
                      ? "text-accent-primary"
                      : isHealthy
                      ? "text-status-success"
                      : "text-status-warning"
                  }`}
                >
                  {isOptimal ? (
                    <IconCheckCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : isHealthy ? (
                    <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <IconExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{isOptimal ? "고부하" : isHealthy ? "확장" : "주의"}</span>
                </span>
              </div>

              <div className="space-y-1.5 min-w-0">
                <p
                  className="text-[13px] font-bold truncate"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {metric.name}
                </p>
                <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-base-content tabular-nums leading-tight">
                  {metric.value}
                </p>
              </div>

              <div className="space-y-2 min-w-0">
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden bg-base-200"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full ${visual.barClass}`}
                    style={{ width: `${meterPct}%` }}
                  />
                </div>
                <p
                  className="text-xs font-semibold truncate tabular-nums"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {metric.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
