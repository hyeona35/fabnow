import React from "react";
import { fetchServerTelemetry } from "@/lib/server/metrics";
import { DATA_SYNC_LABEL } from "@/lib/data/fabnow";
import {
  IconCheckCircle,
  IconExclamationTriangle,
  IconInfoCircle,
} from "@/components/ui/icons";

export async function StreamingMetrics() {
  const metrics = await fetchServerTelemetry();

  return (
    <section
      aria-label="글로벌 반도체·AI 수급 핵심 지표"
      className="material-regular rounded-3xl shadow-xs overflow-hidden"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold tracking-tight text-base-content">
            글로벌 반도체·AI 수급 밸런스
          </h2>
        </div>
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold shrink-0"
          style={{ color: "var(--label-secondary)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
          <span>{DATA_SYNC_LABEL}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-base-content/10 bg-base-100/55">
        {metrics.map((metric) => {
          const isOptimal = metric.status === "optimal";
          const isHealthy = metric.status === "healthy";
          return (
            <div
              key={metric.id}
              className="px-5 py-4 space-y-1.5 transition-colors hover:bg-base-content/[0.02]"
            >
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                {metric.name}
              </p>
              <p className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-base-content tabular-nums leading-tight">
                {metric.value}
              </p>
              <p
                className={`text-xs font-semibold flex items-center gap-1.5 tabular-nums ${
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
