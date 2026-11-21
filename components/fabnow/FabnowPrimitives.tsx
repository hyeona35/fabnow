"use client";

import React from "react";
import Link from "next/link";
import { Button, IconArrowUpRight, IconSort } from "@/components/ui";
import { triggerHaptic } from "@/lib/haptics";

export type RiskLevelType = "tight" | "constrained" | "balanced";

export type MonogramTone = "blush" | "lilac" | "sage";

const ENTITY_MONOGRAM_MAP: Array<{
  match: string;
  code: string;
  tone: MonogramTone;
}> = [
  { match: "tsmc", code: "TS", tone: "blush" },
  { match: "sk hynix", code: "SK", tone: "lilac" },
  { match: "samsung", code: "SE", tone: "sage" },
  { match: "micron", code: "MU", tone: "sage" },
  { match: "intel", code: "IF", tone: "lilac" },
  { match: "openai", code: "OA", tone: "blush" },
  { match: "anthropic", code: "AN", tone: "lilac" },
  { match: "google", code: "GD", tone: "sage" },
  { match: "deepmind", code: "GD", tone: "sage" },
  { match: "xai", code: "xA", tone: "blush" },
  { match: "meta", code: "MA", tone: "lilac" },
  { match: "coreweave", code: "CW", tone: "blush" },
  { match: "nebius", code: "NB", tone: "lilac" },
  { match: "lambda", code: "LM", tone: "sage" },
  { match: "crusoe", code: "CR", tone: "sage" },
  { match: "tensorwave", code: "TW", tone: "lilac" },
  { match: "cowos", code: "CW", tone: "blush" },
  { match: "hbm", code: "HB", tone: "lilac" },
  { match: "euv", code: "EU", tone: "blush" },
  { match: "abf", code: "AB", tone: "sage" },
];

export function EntityMonogram({
  name,
  code,
  tone,
  size = "md",
  className = "",
}: {
  name: string;
  code?: string;
  tone?: MonogramTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const lower = name.toLowerCase();
  const matched = ENTITY_MONOGRAM_MAP.find((entry) => lower.includes(entry.match));
  const resolvedCode =
    code ??
    matched?.code ??
    name
      .replace(/[^A-Za-z0-9가-힣]/g, "")
      .slice(0, 2)
      .toUpperCase();
  const resolvedTone = tone ?? matched?.tone ?? "lilac";

  const surfaceClass =
    resolvedTone === "blush"
      ? "surface-pastel-blush text-accent-primary"
      : resolvedTone === "sage"
      ? "surface-pastel-sage text-status-success"
      : "surface-pastel-lilac text-accent-secondary";

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 rounded-xl text-xs"
      : size === "lg"
      ? "w-12 h-12 rounded-2xl text-sm"
      : "w-10 h-10 rounded-xl text-xs";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 font-extrabold tracking-tight border border-[var(--separator)] select-none ${surfaceClass} ${sizeClass} ${className}`}
    >
      {resolvedCode}
    </span>
  );
}

export function RiskBadge({
  risk,
  size = "sm",
}: {
  risk: RiskLevelType;
  size?: "xs" | "sm" | "md";
}) {
  const textSize = size === "md" ? "text-[13px]" : "text-xs";

  if (risk === "tight") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold whitespace-nowrap text-status-error ${textSize}`}
      >
        <span className="w-2 h-2 rounded-full bg-error shrink-0" aria-hidden="true" />
        <span>공급 부족</span>
      </span>
    );
  }
  if (risk === "constrained") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold whitespace-nowrap text-status-warning ${textSize}`}
      >
        <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
        <span>제한적</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold whitespace-nowrap text-status-success ${textSize}`}
    >
      <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden="true" />
      <span>균형</span>
    </span>
  );
}

export function SignedDelta({
  value,
  suffix = "%",
  invertPolarity = false,
  className = "",
}: {
  value: number;
  suffix?: string;
  /** When true, positive values represent pressure/risk increase (warning/error) and negative values represent relief (success). */
  invertPolarity?: boolean;
  className?: string;
}) {
  const isZero = Math.abs(value) < 0.05;
  const isPositive = value > 0;
  const absFormatted = Math.abs(value).toFixed(1);
  const signSymbol = isPositive ? "+" : value < 0 ? "−" : "";
  const arrow = isZero ? "•" : isPositive ? "▲" : "▼";

  let colorClass = "text-base-content";
  if (!isZero) {
    if (invertPolarity) {
      colorClass = isPositive ? "text-status-error" : "text-status-success";
    } else {
      colorClass = isPositive ? "text-status-success" : "text-status-error";
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums font-bold ${colorClass} ${className}`}
    >
      <span aria-hidden="true" className="text-xs leading-none">
        {arrow}
      </span>
      <span>
        {signSymbol}
        {absFormatted}
        {suffix}
      </span>
    </span>
  );
}

export interface SparklinePoint {
  quarter: string;
  value: number;
}

export function SparklineSvg({
  points,
  tone = "primary",
  label,
  width = 104,
  height = 30,
  fluid = false,
  className = "",
}: {
  points: SparklinePoint[];
  tone?: "primary" | "secondary" | "warning" | "error" | "success";
  label: string;
  width?: number;
  height?: number;
  fluid?: boolean;
  className?: string;
}) {
  const gradId = React.useId();

  if (points.length === 0) return null;

  const vals = points.map((p) => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const span = Math.max(1e-6, maxVal - minVal);
  const padX = 6;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * innerW;
    const norm = maxVal === minVal ? 0.5 : (p.value - minVal) / span;
    const y = padY + (1 - norm) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(
    height - 2
  ).toFixed(1)} L${coords[0].x.toFixed(1)},${(height - 2).toFixed(1)} Z`;

  const strokeVar =
    tone === "secondary"
      ? "var(--color-secondary)"
      : tone === "warning"
      ? "var(--status-warning-text)"
      : tone === "error"
      ? "var(--status-error-text)"
      : tone === "success"
      ? "var(--status-success-text)"
      : "var(--color-primary)";

  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={fluid ? undefined : width}
      height={fluid ? undefined : height}
      role="img"
      aria-label={label}
      className={`overflow-visible shrink-0 ${fluid ? "w-full h-auto" : ""} ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeVar} stopOpacity="0.26" />
          <stop offset="100%" stopColor={strokeVar} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeVar}
        strokeWidth={fluid ? "2.4" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {fluid && (
        <circle
          cx={last.x}
          cy={last.y}
          r="5.5"
          fill={strokeVar}
          fillOpacity="0.18"
        />
      )}
      <circle cx={last.x} cy={last.y} r={fluid ? "3.2" : "2.75"} fill={strokeVar} />
    </svg>
  );
}

export function SortableTh({
  label,
  columnKey,
  activeSortKey,
  sortDirection,
  onSort,
  align = "start",
}: {
  label: string;
  columnKey: string;
  activeSortKey: string;
  sortDirection: "ascending" | "descending";
  onSort: (key: string) => void;
  align?: "start" | "end";
}) {
  const isSorted = activeSortKey === columnKey;

  return (
    <th
      scope="col"
      aria-sort={isSorted ? sortDirection : undefined}
      className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold text-base-content ${
        align === "end" ? "text-end" : "text-start"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          onSort(columnKey);
        }}
        className={`pst-press inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 hover:bg-base-content/8 transition-colors ${
          align === "end" ? "flex-row-reverse" : ""
        } ${isSorted ? "text-accent-primary bg-primary/10" : "text-base-content"}`}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="inline-flex items-center">
          {isSorted ? (
            <span className="text-xs font-extrabold leading-none">
              {sortDirection === "ascending" ? "▲" : "▼"}
            </span>
          ) : (
            <IconSort className="w-3.5 h-3.5 opacity-65" />
          )}
        </span>
      </button>
    </th>
  );
}

export function EntityActionLinks({
  slug,
  entityLabel,
  onOpenModal,
  compact = false,
}: {
  slug: string;
  entityLabel: string;
  onOpenModal: () => void;
  compact?: boolean;
}) {
  const modalActionLabel = compact ? "요약" : "상세";
  const previewLinkLabel = compact ? "페이지" : "프리뷰";

  return (
    <div className="inline-flex items-center gap-2 shrink-0">
      <Button
        size="xs"
        variant="soft"
        opensModal
        onClick={onOpenModal}
        aria-label={`${entityLabel} ${modalActionLabel} 모달 열기`}
        className="rounded-full px-3"
      >
        {modalActionLabel}
      </Button>
      <Link
        href={`/preview/${slug}`}
        onClick={() => triggerHaptic("selection")}
        aria-label={`${entityLabel} 전용 ${previewLinkLabel} 열기`}
        className="btn btn-xs btn-ghost rounded-full border border-[var(--border-control,var(--separator))] control-border pst-press font-semibold inline-flex items-center gap-1 px-3 text-base-content hover:border-primary hover:text-accent-primary"
      >
        <span>{previewLinkLabel}</span>
        <IconArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      </Link>
    </div>
  );
}
