"use client";

import React from "react";
import Link from "next/link";
import { Badge, Button, IconArrowUpRight, IconSort } from "@/components/ui";
import { triggerHaptic } from "@/lib/haptics";

export type RiskLevelType = "tight" | "constrained" | "balanced";

export function RiskBadge({
  risk,
  size = "sm",
}: {
  risk: RiskLevelType;
  size?: "xs" | "sm" | "md";
}) {
  if (risk === "tight") {
    return (
      <Badge variant="error" size={size}>
        공급 부족
      </Badge>
    );
  }
  if (risk === "constrained") {
    return (
      <Badge variant="warning" size={size}>
        제한적
      </Badge>
    );
  }
  return (
    <Badge variant="success" size={size}>
      균형
    </Badge>
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
      <span aria-hidden="true" className="text-[10px] leading-none">
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
}: {
  points: SparklinePoint[];
  tone?: "primary" | "secondary" | "warning" | "error" | "success";
  label: string;
  width?: number;
  height?: number;
}) {
  const gradId = React.useId();

  if (points.length === 0) return null;

  const vals = points.map((p) => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const span = Math.max(1e-6, maxVal - minVal);
  const padX = 4;
  const padY = 4;
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
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className="overflow-visible shrink-0"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeVar} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeVar} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeVar}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.75" fill={strokeVar} />
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
      className={`whitespace-nowrap px-3 py-3 text-xs font-bold text-base-content ${
        align === "end" ? "text-end" : "text-start"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          onSort(columnKey);
        }}
        className={`pst-press inline-flex items-center gap-1 rounded-xl px-2 py-1 hover:bg-base-content/8 transition-colors ${
          align === "end" ? "flex-row-reverse" : ""
        } ${isSorted ? "text-accent-primary bg-primary/8" : "text-base-content"}`}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="inline-flex items-center">
          {isSorted ? (
            <span className="text-[10px] font-extrabold leading-none">
              {sortDirection === "ascending" ? "▲" : "▼"}
            </span>
          ) : (
            <IconSort className="w-3.5 h-3.5 opacity-45" />
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
  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <Button
        size="xs"
        variant="soft"
        opensModal
        onClick={onOpenModal}
        aria-label={`${entityLabel} 상세 모달 열기`}
      >
        {compact ? "요약" : "상세"}
      </Button>
      <Link
        href={`/preview/${slug}`}
        onClick={() => triggerHaptic("selection")}
        aria-label={`${entityLabel} 전용 라우트 미리보기 열기`}
        className="btn btn-xs btn-ghost rounded-2xl border border-base-content/20 pst-press font-semibold inline-flex items-center gap-1 text-base-content hover:border-primary/40 hover:text-accent-primary"
      >
        <span>{compact ? "페이지" : "프리뷰"}</span>
        <IconArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      </Link>
    </div>
  );
}
