import React from "react";
import { fetchServerTelemetry } from "@/lib/server/metrics";
import { DATA_SYNC_LABEL } from "@/lib/data/fabnow";
import {
  IconSparkles,
  IconCheckCircle,
  IconExclamationTriangle,
  IconInfoCircle,
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/Display";

export async function StreamingMetrics() {
  const metrics = await fetchServerTelemetry();

  return (
    <section
      aria-label="글로벌 반도체·AI 수급 텔레메트리"
      className="material-regular p-5 rounded-3xl shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="p-2 rounded-2xl bg-primary/14 text-accent-primary shrink-0"
            aria-hidden="true"
          >
            <IconSparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-base-content truncate">
              글로벌 반도체·AI 엣지 수급 텔레메트리 (RSC 스트리밍)
            </h2>
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--label-secondary)" }}
            >
              파운드리 가동률 · HBM/CoWoS 초과 수요 갭 · 프론티어/네오클라우드 잔고 실시간 집계
            </p>
          </div>
        </div>
        <Badge variant="primary" size="sm">
          {DATA_SYNC_LABEL}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {metrics.map((metric) => {
          const isOptimal = metric.status === "optimal";
          const isHealthy = metric.status === "healthy";
          return (
            <div
              key={metric.id}
              className="p-3.5 rounded-2xl bg-base-200/60 border border-base-content/10 space-y-1 transition-all hover:bg-base-200/90"
            >
              <p
                className="text-[11px] font-semibold truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                {metric.name}
              </p>
              <p className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content tabular-nums">
                {metric.value}
              </p>
              <p
                className={`text-[11px] font-semibold flex items-center gap-1 tabular-nums ${
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
                <span className="truncate">{metric.change}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
