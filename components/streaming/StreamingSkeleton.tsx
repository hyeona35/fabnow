import React from "react";

export function StreamingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="fabnow 실시간 수급 텔레메트리 스트리밍 로딩 중"
      className="material-regular rounded-[32px] p-6 sm:p-8 border border-[var(--separator)] shadow-xs space-y-6 animate-pulse"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-5 w-52 rounded-xl bg-base-200" />
          <div className="h-4 w-80 max-w-full rounded-xl bg-base-200" />
        </div>
        <div className="h-8 w-36 rounded-full bg-base-200 shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[22px] p-5 bg-base-100 border border-[var(--separator)] space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-base-200" />
              <div className="h-6 w-16 rounded-full bg-base-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-28 rounded-lg bg-base-200" />
              <div className="h-7 w-24 rounded-lg bg-base-200" />
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-base-200" />
              <div className="h-3.5 w-36 rounded-lg bg-base-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
