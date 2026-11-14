import React, { Suspense } from "react";
import type { Metadata } from "next";
import { WorkbenchClient } from "@/components/layout/WorkbenchClient";
import { StreamingMetrics } from "@/components/streaming/StreamingMetrics";
import { StreamingSkeleton } from "@/components/streaming/StreamingSkeleton";
import { DATA_SYNC_LABEL, FABNOW_SECTIONS } from "@/lib/data/fabnow";

export const metadata: Metadata = {
  title: "통합 수급 현황 — fabnow",
  description:
    "TSMC·SK hynix·삼성전자·Micron의 파운드리·HBM 출하량과 프론티어 AI 랩·네오클라우드 수요 및 병목 공정을 실시간 추적합니다.",
};

const PAGE_CONFIG = {
  pageTitle: "fabnow",
  pageSubtitle: `반도체 출하 지표 · AI 수요 인텔리전스 · ${DATA_SYNC_LABEL}`,
  sections: FABNOW_SECTIONS,
};

/**
 * Pure React Server Component (RSC) HomePage.
 * Keeps all route pages strictly server-rendered; delegates interactivity to WorkbenchClient
 * and streams edge telemetry inside Suspense.
 */
export default function HomePage() {
  return (
    <WorkbenchClient
      pageTitle={PAGE_CONFIG.pageTitle}
      pageSubtitle={PAGE_CONFIG.pageSubtitle}
      sections={PAGE_CONFIG.sections}
      streamingSlot={
        <Suspense fallback={<StreamingSkeleton />}>
          <StreamingMetrics />
        </Suspense>
      }
    />
  );
}

