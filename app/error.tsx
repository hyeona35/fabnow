"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconErrorCircle, IconArrowPath } from "@/components/ui/icons";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isChunkError =
    error.message?.includes("ChunkLoadError") ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module");

  useEffect(() => {
    // Automatically attempt a clean reload once if chunk load fails
    if (isChunkError) {
      let lastRetry: string | null = null;
      try {
        lastRetry = sessionStorage.getItem("fabnow_chunk_retry");
      } catch {
        // Storage restricted
      }
      const now = Date.now();
      if (!lastRetry || now - Number(lastRetry) > 15000) {
        try {
          sessionStorage.setItem("fabnow_chunk_retry", now.toString());
        } catch {
          // Ignore
        }
        window.location.reload();
      }
    }
  }, [isChunkError]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-base-200">
      <div className="liquid-glass max-w-md w-full rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error/14 text-status-error border border-error/25">
          <IconErrorCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="badge badge-sm badge-error badge-soft font-semibold">
            {isChunkError ? "버전 업데이트 감지" : "오류 발생"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            {isChunkError
              ? "새 데이터 버전이 배포되었습니다"
              : "일시적인 오류가 발생했습니다"}
          </h1>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            {isChunkError
              ? "fabnow의 최신 엣지 빌드가 반영되었습니다. 페이지를 새로고침하면 최신 지표를 확인할 수 있습니다."
              : error.message || "수급 데이터를 불러오는 도중 예상치 못한 오류가 발생했습니다."}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {isChunkError ? (
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem("fabnow_chunk_retry");
                } catch {
                  // Ignore
                }
                window.location.reload();
              }}
              className="btn btn-primary w-full rounded-2xl pst-press font-bold shadow-md inline-flex items-center justify-center gap-2"
            >
              <IconArrowPath className="w-4 h-4" />
              <span>최신 버전으로 새로고침</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-primary w-full rounded-2xl pst-press font-bold shadow-md inline-flex items-center justify-center gap-2"
            >
              <IconArrowPath className="w-4 h-4" />
              <span>다시 시도</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="btn btn-ghost btn-sm w-full rounded-xl pst-press text-xs font-semibold"
            style={{ color: "var(--label-secondary)" }}
          >
            fabnow 통합 수급 현황으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
