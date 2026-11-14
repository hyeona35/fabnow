"use client";

import React, { useCallback } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { AppShell, type SectionMeta } from "@/components/layout/AppShell";
import { FabnowWorkspace } from "@/components/fabnow/FabnowWorkspace";
import type { FabnowSectionId } from "@/lib/data/fabnow";

const VALID_SECTIONS = new Set<FabnowSectionId>([
  "overview",
  "fabs",
  "labs",
  "neoclouds",
  "bottlenecks",
]);

function normalizeSectionId(value: string): FabnowSectionId {
  return VALID_SECTIONS.has(value as FabnowSectionId)
    ? (value as FabnowSectionId)
    : "overview";
}

export interface WorkbenchClientProps {
  pageTitle?: string;
  pageSubtitle?: string;
  sections?: Record<string, SectionMeta>;
  streamingSlot?: React.ReactNode;
}

export function WorkbenchClient({
  pageTitle,
  pageSubtitle,
  sections,
  streamingSlot,
}: WorkbenchClientProps) {
  // Sync active section state with URLSearchParams via nuqs
  const [rawSection, setRawSection] = useQueryState(
    "section",
    parseAsString.withDefault("overview")
  );

  const activeSection = normalizeSectionId(rawSection);

  const handleSelectSection = useCallback(
    (sectionId: string) => {
      void setRawSection(normalizeSectionId(sectionId));
    },
    [setRawSection]
  );

  return (
    <AppShell
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      title={pageTitle}
      subtitle={pageSubtitle}
      sectionTitles={sections}
    >
      <FabnowWorkspace
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        streamingSlot={streamingSlot}
      />
    </AppShell>
  );
}

