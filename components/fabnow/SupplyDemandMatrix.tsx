"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  IconArrowUpRight,
  IconChip,
  IconPulse,
  IconServer,
  Tabs,
} from "@/components/ui";
import {
  DATA_SYNC_LABEL,
  DEMAND_CUSTOMERS,
  FAB_SHIPMENTS,
  SUPPLY_DEMAND_LINKS,
  formatSignedPercent,
  type DemandCustomerRecord,
  type FabCompany,
  type FabShipmentRecord,
  type RiskLevel,
  type SupplyDemandLink,
} from "@/lib/data/fabnow";
import { useModal } from "@/context/OverlayContext";
import { triggerHaptic } from "@/lib/haptics";
import { EntityDetailModalContent } from "./EntityDetailModalContent";
import { RiskBadge, SignedDelta } from "./FabnowPrimitives";

type MatrixMode = "flow" | "mom" | "gap";

interface SupplierCompanyNode {
  company: FabCompany;
  companyKo: string;
  primarySlug: string;
  lines: FabShipmentRecord[];
  techSummary: string;
  weightedUtilPct: number;
  avgMomPct: number;
  totalOutputText: string;
  worstRisk: RiskLevel;
  outboundLinks: SupplyDemandLink[];
  totalCommitted: number;
  totalShipped: number;
  netGapPct: number;
}

const COMPANY_ORDER: FabCompany[] = [
  "TSMC",
  "SK hynix",
  "Samsung Electronics",
  "Micron",
  "Intel Foundry",
];

function getWorstRisk(risks: RiskLevel[]): RiskLevel {
  if (risks.includes("tight")) return "tight";
  if (risks.includes("constrained")) return "constrained";
  return "balanced";
}

function getCustomerRisk(c: DemandCustomerRecord): RiskLevel {
  if (c.supplyGapPct <= -20 || c.deploymentStatus === "backlog-capped") {
    return "tight";
  }
  if (c.supplyGapPct <= -12 || c.deploymentStatus === "ramping") {
    return "constrained";
  }
  return "balanced";
}

function getLinkStrokeColor(
  link: SupplyDemandLink,
  mode: MatrixMode,
  isHighlighted: boolean
): string {
  if (mode === "gap") {
    if (link.bottleneckRisk === "tight") return "var(--status-error-text)";
    if (link.bottleneckRisk === "constrained") return "var(--status-warning-text)";
    return "var(--status-success-text)";
  }
  if (mode === "mom") {
    return link.customerSegment === "frontier-lab"
      ? "var(--color-primary)"
      : "var(--color-secondary)";
  }
  return isHighlighted
    ? "var(--color-primary)"
    : link.customerSegment === "frontier-lab"
    ? "var(--color-primary)"
    : "var(--color-secondary)";
}

export function SupplyDemandMatrix({
  onSelectSection,
}: {
  onSelectSection?: (sectionId: string) => void;
}) {
  const { openModal, closeModal } = useModal();
  const [mode, setMode] = useState<MatrixMode>("flow");
  const [selectedSupplier, setSelectedSupplier] = useState<FabCompany | null>("TSMC");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<"all" | "frontier-lab" | "neocloud">("all");

  const supplierNodes = useMemo<SupplierCompanyNode[]>(() => {
    return COMPANY_ORDER.map((company) => {
      const lines = FAB_SHIPMENTS.filter((f) => f.company === company);
      const lineIds = new Set(lines.map((l) => l.id));
      const outboundLinks = SUPPLY_DEMAND_LINKS.filter((link) =>
        lineIds.has(link.supplierId)
      );
      const totalCommitted = outboundLinks.reduce(
        (acc, l) => acc + l.monthlyCommittedUnits,
        0
      );
      const totalShipped = outboundLinks.reduce(
        (acc, l) => acc + l.monthlyActualShippedUnits,
        0
      );
      const netGapPct =
        totalCommitted > 0
          ? ((totalShipped - totalCommitted) / totalCommitted) * 100
          : 0;

      const weightedUtilPct =
        lines.reduce((acc, l) => acc + l.utilizationPct, 0) / Math.max(1, lines.length);
      const avgMomPct =
        lines.reduce((acc, l) => acc + l.momDeltaPct, 0) / Math.max(1, lines.length);

      const techSummary =
        company === "TSMC"
          ? "N3P / N2 · CoWoS-L/S"
          : company === "SK hynix"
          ? "HBM3E 12-Hi · HBM4"
          : company === "Samsung Electronics"
          ? "HBM3E/4 · SF4X/SF2 GAA"
          : company === "Micron"
          ? "HBM3E 12-Hi · HBM4"
          : "18A · Foveros/EMIB-T";

      const waferSum = lines
        .filter((l) => l.unitLabel === "kWPM")
        .reduce((a, b) => a + b.monthlyOutputValue, 0);
      const stackSum = lines
        .filter((l) => l.unitLabel === "k Stacks/mo")
        .reduce((a, b) => a + b.monthlyOutputValue, 0);
      const pkgSum = lines
        .filter((l) => l.unitLabel === "k Interposers/mo")
        .reduce((a, b) => a + b.monthlyOutputValue, 0);

      const outputParts: string[] = [];
      if (waferSum > 0) outputParts.push(`${waferSum} kWPM`);
      if (stackSum > 0) outputParts.push(`${stackSum}k HBM`);
      if (pkgSum > 0) outputParts.push(`${pkgSum}k Pkg`);

      return {
        company,
        companyKo: lines[0]?.companyKo ?? company,
        primarySlug: lines[0]?.slug ?? "tsmc-n3p-logic",
        lines,
        techSummary,
        weightedUtilPct,
        avgMomPct,
        totalOutputText: outputParts.join(" + "),
        worstRisk: getWorstRisk(lines.map((l) => l.riskLevel)),
        outboundLinks,
        totalCommitted,
        totalShipped,
        netGapPct,
      };
    });
  }, []);

  const supplierIdToCompany = useMemo(() => {
    const map = new Map<string, FabCompany>();
    for (const fab of FAB_SHIPMENTS) {
      map.set(fab.id, fab.company);
    }
    return map;
  }, []);

  const visibleCustomers = useMemo(() => {
    if (segmentFilter === "all") return DEMAND_CUSTOMERS;
    return DEMAND_CUSTOMERS.filter((c) => c.segment === segmentFilter);
  }, [segmentFilter]);

  const activeLinks = useMemo(() => {
    const visibleCustomerIds = new Set(visibleCustomers.map((c) => c.id));
    return SUPPLY_DEMAND_LINKS.filter((link) => {
      if (!visibleCustomerIds.has(link.customerId)) return false;
      if (hoveredLinkId) return link.id === hoveredLinkId;
      if (selectedCustomerId) return link.customerId === selectedCustomerId;
      if (selectedSupplier) {
        return supplierIdToCompany.get(link.supplierId) === selectedSupplier;
      }
      return true;
    });
  }, [
    visibleCustomers,
    hoveredLinkId,
    selectedCustomerId,
    selectedSupplier,
    supplierIdToCompany,
  ]);

  const activeLinkSet = useMemo(
    () => new Set(activeLinks.map((l) => l.id)),
    [activeLinks]
  );

  const connectedCustomerIds = useMemo(
    () => new Set(activeLinks.map((l) => l.customerId)),
    [activeLinks]
  );

  const connectedSupplierCompanies = useMemo(() => {
    const set = new Set<FabCompany>();
    for (const link of activeLinks) {
      const comp = supplierIdToCompany.get(link.supplierId);
      if (comp) set.add(comp);
    }
    return set;
  }, [activeLinks, supplierIdToCompany]);

  const selectedSupplierNode = useMemo(
    () => supplierNodes.find((s) => s.company === selectedSupplier) ?? null,
    [supplierNodes, selectedSupplier]
  );

  const selectedCustomerNode = useMemo(
    () => DEMAND_CUSTOMERS.find((c) => c.id === selectedCustomerId) ?? null,
    [selectedCustomerId]
  );

  const hoveredLinkObj = useMemo(
    () => SUPPLY_DEMAND_LINKS.find((l) => l.id === hoveredLinkId) ?? null,
    [hoveredLinkId]
  );

  const handleOpenEntityModal = (slug: string, title: string) => {
    triggerHaptic("selection");
    openModal({
      id: `entity-${slug}`,
      title,
      description: `${DATA_SYNC_LABEL} · 반도체 공급-AI 수요 세부 텔레메트리`,
      size: "lg",
      content: (
        <EntityDetailModalContent
          slug={slug}
          onClose={() => closeModal(true)}
        />
      ),
    });
  };

  // Fixed SVG coordinate system matching desktop rails (height: 560px)
  const SVG_W = 320;
  const SVG_H = 560;
  const getSupplierY = (idx: number) => 52 + idx * 114;
  const getCustomerY = (idx: number, total: number) => {
    if (total <= 1) return SVG_H / 2;
    const rowH = total <= 5 ? 98 : 50;
    const gap = (SVG_H - total * rowH) / Math.max(1, total - 1);
    return rowH / 2 + idx * (rowH + gap);
  };

  const inspectedTitle = hoveredLinkObj
    ? `${hoveredLinkObj.supplierLabel} → ${hoveredLinkObj.customerLabel}`
    : selectedCustomerNode
    ? `${selectedCustomerNode.name} (${selectedCustomerNode.nameKo})`
    : selectedSupplierNode
    ? `${selectedSupplierNode.company} (${selectedSupplierNode.companyKo})`
    : "글로벌 AI 반도체 수급 전체 네트워크";

  const inspectedSlug = hoveredLinkObj
    ? DEMAND_CUSTOMERS.find((c) => c.id === hoveredLinkObj.customerId)?.slug ??
      "openai"
    : selectedCustomerNode
    ? selectedCustomerNode.slug
    : selectedSupplierNode
    ? selectedSupplierNode.primarySlug
    : "tsmc-cowos-l";

  return (
    <section
      aria-labelledby="supply-demand-matrix-heading"
      className="material-regular rounded-3xl p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Matrix Header + Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--separator)" }}>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-2xl bg-primary/14 text-accent-primary shrink-0">
              <IconPulse className="w-5 h-5" />
            </span>
            <h2
              id="supply-demand-matrix-heading"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content"
            >
              글로벌 공급망 ↔ AI 수요 할당 매트릭스
            </h2>
            <Badge variant="primary" size="sm">
              {DATA_SYNC_LABEL}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--label-secondary)" }}>
            5대 파운드리·메모리 공급사(TSMC·SK하이닉스·삼성전자·마이크론·인텔)의 선단 노드 출하량과 10대 AI 수요처(프론티어 랩·네오클라우드) 간 할당 갭을 교차 추적합니다.
          </p>
        </div>

        <div className="max-w-full overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
          <Tabs
            variant="segmented"
            size="sm"
            activeId={mode}
            onChange={(id) => {
              triggerHaptic("light");
              setMode(id as MatrixMode);
            }}
            items={[
              { id: "flow", label: "할당 흐름 (Flow)" },
              { id: "mom", label: "MoM 변동률 (%)" },
              { id: "gap", label: "수급 갭 (Gap)" },
            ]}
            className="min-w-[430px] sm:min-w-0 sm:w-[440px] shrink-0"
          />
        </div>
      </div>

      {/* Customer Segment Filter & Selection Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="수요 세그먼트 필터">
          {[
            { id: "all" as const, label: "전체 10대 수요처" },
            { id: "frontier-lab" as const, label: "프론티어 랩 (5)" },
            { id: "neocloud" as const, label: "네오클라우드 (5)" },
          ].map((seg) => {
            const isActive = segmentFilter === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  triggerHaptic("light");
                  setSegmentFilter(seg.id);
                  setSelectedCustomerId(null);
                  setHoveredLinkId(null);
                }}
                className={`btn btn-xs rounded-2xl pst-press font-semibold ${
                  isActive
                    ? "btn-primary"
                    : "btn-ghost border border-base-content/20 text-base-content"
                }`}
              >
                {seg.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--label-secondary)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" aria-hidden="true" />
            <span>프론티어 랩</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--label-secondary)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" aria-hidden="true" />
            <span>네오클라우드</span>
          </span>
          {(selectedSupplier || selectedCustomerId || hoveredLinkId) && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setSelectedSupplier(null);
                setSelectedCustomerId(null);
                setHoveredLinkId(null);
              }}
              className="btn btn-xs btn-ghost rounded-2xl border border-base-content/20 pst-press font-semibold text-base-content"
            >
              전체 경로 보기
            </button>
          )}
        </div>
      </div>

      {/* Desktop Interactive 3-Column Topology (Suppliers | SVG Bezier Flow | Customers) */}
      <div className="hidden lg:grid lg:grid-cols-[276px_minmax(180px,1fr)_296px] gap-0 items-stretch">
        {/* Left Rail: 5 Semiconductor Supply Companies */}
        <div className="h-[560px] flex flex-col justify-between">
          {supplierNodes.map((sup) => {
            const isSelected = selectedSupplier === sup.company && !selectedCustomerId;
            const isConnected =
              connectedSupplierCompanies.has(sup.company) ||
              (!selectedSupplier && !selectedCustomerId && !hoveredLinkId);
            const dimmed =
              Boolean(selectedCustomerId || hoveredLinkId || selectedSupplier) &&
              !isSelected &&
              !connectedSupplierCompanies.has(sup.company);

            return (
              <button
                key={sup.company}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedCustomerId(null);
                  setHoveredLinkId(null);
                  setSelectedSupplier((prev) =>
                    prev === sup.company ? null : sup.company
                  );
                }}
                className={`h-[104px] w-full text-start rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between pst-press ${
                  isSelected
                    ? "bg-primary/12 border-primary shadow-sm ring-1 ring-primary/35"
                    : isConnected
                    ? "bg-base-100 border-base-content/18 hover:border-primary/45"
                    : "bg-base-100 border-base-content/12"
                } ${dimmed ? "opacity-45" : "opacity-100"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold tracking-tight text-base-content truncate">
                      {sup.company}
                    </p>
                    <p className="text-[11px] font-semibold truncate" style={{ color: "var(--label-secondary)" }}>
                      {sup.techSummary}
                    </p>
                  </div>
                  <RiskBadge risk={sup.worstRisk} size="xs" />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t" style={{ borderColor: "var(--separator)" }}>
                  {mode === "flow" && (
                    <>
                      <span className="tabular-nums font-bold text-base-content truncate">
                        {sup.totalOutputText}
                      </span>
                      <span className="tabular-nums text-[11px] font-semibold" style={{ color: "var(--label-secondary)" }}>
                        가동 {sup.weightedUtilPct.toFixed(1)}%
                      </span>
                    </>
                  )}
                  {mode === "mom" && (
                    <>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--label-secondary)" }}>
                        평균 MoM
                      </span>
                      <SignedDelta value={sup.avgMomPct} className="text-xs" />
                    </>
                  )}
                  {mode === "gap" && (
                    <>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--label-secondary)" }}>
                        {sup.outboundLinks.length > 0 ? "할당 충족 갭" : "다이버시피케이션"}
                      </span>
                      {sup.outboundLinks.length > 0 ? (
                        <SignedDelta value={sup.netGapPct} className="text-xs" />
                      ) : (
                        <Badge variant="info" size="xs">
                          18A 램프업
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Center Rail: Crisp Responsive SVG Bezier Ribbon Canvas */}
        <div className="relative h-[560px] select-none">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="공급사에서 AI 수요처로 연결되는 할당 흐름 및 병목 갭 SVG 다이어그램"
          >
            {/* Subtle vertical guide lines */}
            <line
              x1="0"
              y1="16"
              x2="0"
              y2={SVG_H - 16}
              stroke="var(--separator)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <line
              x1={SVG_W}
              y1="16"
              x2={SVG_W}
              y2={SVG_H - 16}
              stroke="var(--separator)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />

            {SUPPLY_DEMAND_LINKS.map((link) => {
              const custIdx = visibleCustomers.findIndex(
                (c) => c.id === link.customerId
              );
              if (custIdx === -1) return null;

              const comp = supplierIdToCompany.get(link.supplierId);
              const supIdx = supplierNodes.findIndex((s) => s.company === comp);
              if (supIdx === -1) return null;

              const sy = getSupplierY(supIdx);
              const cy = getCustomerY(custIdx, visibleCustomers.length);
              const isHighlighted = activeLinkSet.has(link.id);
              const hasSelection = Boolean(
                selectedSupplier || selectedCustomerId || hoveredLinkId
              );
              const strokeColor = getLinkStrokeColor(link, mode, isHighlighted);

              // Scale ribbon stroke width smoothly by committed volume (2.5px to 9px)
              const strokeW = Math.max(
                2.5,
                Math.min(9.5, link.monthlyCommittedUnits / 4.2)
              );

              const cp1x = SVG_W * 0.42;
              const cp2x = SVG_W * 0.58;
              const pathD = `M 2 ${sy} C ${cp1x} ${sy}, ${cp2x} ${cy}, ${
                SVG_W - 2
              } ${cy}`;

              return (
                <g
                  key={link.id}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{
                    opacity: isHighlighted ? 0.92 : hasSelection ? 0.14 : 0.45,
                  }}
                  onMouseEnter={() => setHoveredLinkId(link.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                  onClick={() => {
                    triggerHaptic("light");
                    setHoveredLinkId((prev) =>
                      prev === link.id ? null : link.id
                    );
                  }}
                >
                  <title>
                    {`${link.supplierLabel} → ${link.customerLabel}: ${link.monthlyActualShippedUnits}/${link.monthlyCommittedUnits} ${link.unitLabel} (${formatSignedPercent(link.gapPct)})`}
                  </title>
                  {/* Wide invisible hit target for easy hover/click */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                  />
                  {/* Primary Bezier ribbon */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? strokeW + 1.5 : strokeW}
                    strokeLinecap="round"
                    strokeDasharray={
                      mode === "gap" && link.bottleneckRisk === "tight"
                        ? "7 4"
                        : undefined
                    }
                  />
                  {isHighlighted && (
                    <>
                      <circle cx="4" cy={sy} r="4" fill={strokeColor} />
                      <circle
                        cx={SVG_W - 4}
                        cy={cy}
                        r="4"
                        fill={strokeColor}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Rail: Demand Customers (Frontier Labs & Neoclouds) */}
        <div
          className="h-[560px] flex flex-col justify-between"
        >
          {visibleCustomers.map((cust) => {
            const isSelected = selectedCustomerId === cust.id;
            const isConnected =
              connectedCustomerIds.has(cust.id) ||
              (!selectedSupplier && !selectedCustomerId && !hoveredLinkId);
            const dimmed =
              Boolean(selectedCustomerId || hoveredLinkId || selectedSupplier) &&
              !isSelected &&
              !connectedCustomerIds.has(cust.id);
            const rowHeightClass =
              visibleCustomers.length <= 5 ? "h-[98px]" : "h-[50px]";

            return (
              <button
                key={cust.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  triggerHaptic("selection");
                  setHoveredLinkId(null);
                  setSelectedSupplier(null);
                  setSelectedCustomerId((prev) =>
                    prev === cust.id ? null : cust.id
                  );
                }}
                className={`${rowHeightClass} w-full text-start rounded-2xl px-3 py-1.5 border transition-all duration-200 flex items-center justify-between gap-2 pst-press ${
                  isSelected
                    ? "bg-secondary/14 border-secondary shadow-sm ring-1 ring-secondary/40"
                    : isConnected
                    ? "bg-base-100 border-base-content/18 hover:border-secondary/45"
                    : "bg-base-100 border-base-content/12"
                } ${dimmed ? "opacity-45" : "opacity-100"}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        cust.segment === "frontier-lab"
                          ? "bg-primary"
                          : "bg-secondary"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-extrabold text-base-content truncate">
                      {cust.name}
                    </span>
                    <span className="text-[11px] font-medium truncate hidden xl:inline" style={{ color: "var(--label-secondary)" }}>
                      {cust.nameKo}
                    </span>
                  </div>
                  {visibleCustomers.length <= 5 && (
                    <p className="text-[11px] font-medium truncate mt-1" style={{ color: "var(--label-secondary)" }}>
                      {cust.focusCompute}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-end">
                  {mode === "flow" && (
                    <span className="text-xs tabular-nums font-bold text-base-content">
                      {cust.monthlyGpuEquivalentK}k GPU
                    </span>
                  )}
                  {mode === "mom" && (
                    <SignedDelta value={cust.momDemandDeltaPct} className="text-xs" />
                  )}
                  {mode === "gap" && (
                    <SignedDelta value={cust.supplyGapPct} className="text-xs" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile & Tablet (< lg) Responsive Matrix (Zero Horizontal Overflow) */}
      <div className="lg:hidden space-y-4">
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--label-secondary)" }}>
            1. 반도체 공급사 선택
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {supplierNodes.map((sup) => {
              const isSelected = selectedSupplier === sup.company && !selectedCustomerId;
              return (
                <button
                  key={sup.company}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedCustomerId(null);
                    setHoveredLinkId(null);
                    setSelectedSupplier((prev) =>
                      prev === sup.company ? null : sup.company
                    );
                  }}
                  className={`text-start rounded-2xl p-3 border transition-all pst-press flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-primary/12 border-primary ring-1 ring-primary/35"
                      : "bg-base-100 border-base-content/15"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-base-content truncate">
                      {sup.company}
                    </p>
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--label-secondary)" }}>
                      {sup.techSummary}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    {mode === "mom" ? (
                      <SignedDelta value={sup.avgMomPct} className="text-xs" />
                    ) : mode === "gap" && sup.outboundLinks.length > 0 ? (
                      <SignedDelta value={sup.netGapPct} className="text-xs" />
                    ) : (
                      <span className="text-xs tabular-nums font-bold">
                        {sup.weightedUtilPct.toFixed(0)}% 가동
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--label-secondary)" }}>
            2. AI 수요처 선택 ({visibleCustomers.length}곳)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {visibleCustomers.map((cust) => {
              const isSelected = selectedCustomerId === cust.id;
              return (
                <button
                  key={cust.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    triggerHaptic("selection");
                    setHoveredLinkId(null);
                    setSelectedSupplier(null);
                    setSelectedCustomerId((prev) =>
                      prev === cust.id ? null : cust.id
                    );
                  }}
                  className={`text-start rounded-2xl p-2.5 border transition-all pst-press flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? "bg-secondary/14 border-secondary ring-1 ring-secondary/40"
                      : "bg-base-100 border-base-content/15"
                  }`}
                >
                  <span className="text-xs font-bold text-base-content truncate">
                    {cust.name}
                  </span>
                  {mode === "gap" ? (
                    <SignedDelta value={cust.supplyGapPct} className="text-[11px]" />
                  ) : mode === "mom" ? (
                    <SignedDelta value={cust.momDemandDeltaPct} className="text-[11px]" />
                  ) : (
                    <span className="text-[11px] tabular-nums font-bold">
                      {cust.monthlyGpuEquivalentK}k
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Inspector Card */}
      <div className="bg-base-100 rounded-3xl p-4 sm:p-5 border border-base-content/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="p-2.5 rounded-2xl bg-primary/14 text-accent-primary shrink-0">
              {selectedCustomerNode ? (
                <IconServer className="w-5 h-5" />
              ) : (
                <IconChip className="w-5 h-5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-base-content truncate">
                  {inspectedTitle}
                </h3>
                {hoveredLinkObj && (
                  <RiskBadge risk={hoveredLinkObj.bottleneckRisk} size="xs" />
                )}
                {!hoveredLinkObj && selectedCustomerNode && (
                  <RiskBadge risk={getCustomerRisk(selectedCustomerNode)} size="xs" />
                )}
                {!hoveredLinkObj && !selectedCustomerNode && selectedSupplierNode && (
                  <RiskBadge risk={selectedSupplierNode.worstRisk} size="xs" />
                )}
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--label-secondary)" }}>
                {hoveredLinkObj
                  ? `${hoveredLinkObj.technologyLabel} · 약정 ${hoveredLinkObj.monthlyCommittedUnits} → 실제 출하 ${hoveredLinkObj.monthlyActualShippedUnits} ${hoveredLinkObj.unitLabel}`
                  : selectedCustomerNode
                  ? `${selectedCustomerNode.focusCompute} · 수주 잔고 ${selectedCustomerNode.backlogMonths.toFixed(1)}개월 · 약정 전력 ${selectedCustomerNode.committedPowerMW.toLocaleString("en-US")}MW`
                  : selectedSupplierNode
                  ? `${selectedSupplierNode.lines.length}개 핵심 팹 라인 (${selectedSupplierNode.techSummary}) · ${activeLinks.length}건 AI 고객 할당 연결`
                  : `총 ${activeLinks.length}개 주요 공급-수요 연결 경로가 활성화되어 있습니다.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="soft"
              opensModal
              onClick={() => handleOpenEntityModal(inspectedSlug, inspectedTitle)}
            >
              상세 인스펙터
            </Button>
            <Link
              href={`/preview/${inspectedSlug}`}
              onClick={() => triggerHaptic("selection")}
              className="btn btn-sm btn-primary rounded-2xl pst-press font-semibold inline-flex items-center gap-1"
            >
              <span>전체 프리뷰</span>
              <IconArrowUpRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Active Links Mini Grid */}
        {activeLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {activeLinks.slice(0, 6).map((link) => {
              const fulfillmentPct = Math.min(
                100,
                Math.round(
                  (link.monthlyActualShippedUnits /
                    Math.max(0.1, link.monthlyCommittedUnits)) *
                    100
                )
              );
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    const customer = DEMAND_CUSTOMERS.find(
                      (c) => c.id === link.customerId
                    );
                    if (customer) {
                      handleOpenEntityModal(
                        customer.slug,
                        `${link.supplierLabel} → ${customer.name}`
                      );
                    }
                  }}
                  className="text-start rounded-2xl p-3 bg-base-200/70 hover:bg-base-200 border border-base-content/10 hover:border-primary/35 transition-all pst-press space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-base-content truncate">
                      {link.supplierLabel} → {link.customerLabel}
                    </span>
                    <SignedDelta value={link.gapPct} className="text-xs" />
                  </div>
                  <p className="text-[11px] font-medium truncate" style={{ color: "var(--label-secondary)" }}>
                    {link.technologyLabel}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                    <span>
                      실출하 {link.monthlyActualShippedUnits} / 약정 {link.monthlyCommittedUnits} {link.unitLabel}
                    </span>
                    <span className="font-bold">{fulfillmentPct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl p-3.5 bg-base-200/60 border border-base-content/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-medium" style={{ color: "var(--label-secondary)" }}>
              Intel Foundry(18A · Foveros/EMIB-T)는 현재 AWS Custom Fabric, Microsoft Maia-Next 등 하이퍼스케일러 다이버시피케이션 물량으로 램프업 중입니다.
            </span>
            {onSelectSection && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onSelectSection("fabs")}
              >
                팹 출하표에서 확인
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
