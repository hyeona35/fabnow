import React from "react";

export function StreamingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="fabnow 실시간 수급 텔레메트리 스트리밍 로딩 중"
      className="p-5 rounded-3xl bg-base-100 border border-base-content/10 shadow-xs space-y-4 animate-pulse"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-4 w-52 rounded-lg bg-base-content/15" />
          <div className="h-3 w-72 max-w-full rounded-lg bg-base-content/10" />
        </div>
        <div className="h-6 w-24 rounded-full bg-base-content/15 shrink-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-base-200/60 border border-base-content/5 space-y-2"
          >
            <div className="h-3 w-20 rounded bg-base-content/15" />
            <div className="h-6 w-16 rounded bg-base-content/20" />
            <div className="h-3 w-24 rounded bg-base-content/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
