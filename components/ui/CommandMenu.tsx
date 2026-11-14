"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconGrid,
  IconCompass,
  IconLayers,
  IconBellShield,
  IconChart,
  IconMoon,
  IconSun,
  IconXMark,
  IconExternalLink,
} from "./icons";
import { triggerHaptic } from "@/lib/haptics";
import {
  BOTTLENECK_STAGES,
  DEMAND_CUSTOMERS,
  FAB_SHIPMENTS,
  formatSignedPercent,
} from "@/lib/data/fabnow";

export interface CommandMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  category:
    | "섹션 바로가기"
    | "파운드리·메모리 엔티티"
    | "AI 랩·네오클라우드 엔티티"
    | "병목 공정"
    | "테마 및 설정";
  icon: React.ReactNode;
  isEntityRoute?: boolean;
  onSelect: () => void;
  keywords?: string[];
}

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: string) => void;
  theme: "light" | "dark";
  onToggleTheme: (isDark: boolean) => void;
}

function CommandMenuDialog({
  onClose,
  onSelectSection,
  theme,
  onToggleTheme,
}: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  const sectionItems: CommandMenuItem[] = [
    {
      id: "sec-overview",
      title: "통합 수급 현황 (Supply-Demand Matrix)",
      subtitle: "전체 팹 출하 vs AI 컴퓨팅 수요 갭 요약",
      category: "섹션 바로가기",
      icon: <IconGrid className="w-4 h-4" />,
      onSelect: () => onSelectSection("overview"),
      keywords: ["overview", "matrix", "통합", "수급", "현황", "메인"],
    },
    {
      id: "sec-fabs",
      title: "파운드리·메모리 출하 (10개 핵심 라인)",
      subtitle: "TSMC · SK hynix · 삼성전자 DS · Micron · Intel Foundry",
      category: "섹션 바로가기",
      icon: <IconLayers className="w-4 h-4" />,
      onSelect: () => onSelectSection("fabs"),
      keywords: ["fabs", "foundry", "memory", "hbm", "파운드리", "메모리", "출하"],
    },
    {
      id: "sec-labs",
      title: "프론티어 랩 수요 (5대 AI 랩)",
      subtitle: "OpenAI · Anthropic · Google DeepMind · xAI · Meta AI",
      category: "섹션 바로가기",
      icon: <IconCompass className="w-4 h-4" />,
      onSelect: () => onSelectSection("labs"),
      keywords: ["labs", "frontier", "openai", "anthropic", "deepmind", "프론티어", "랩"],
    },
    {
      id: "sec-neoclouds",
      title: "네오클라우드 수요 (5대 GPU 클라우드)",
      subtitle: "CoreWeave · Nebius · Lambda · Crusoe · TensorWave",
      category: "섹션 바로가기",
      icon: <IconChart className="w-4 h-4" />,
      onSelect: () => onSelectSection("neoclouds"),
      keywords: ["neocloud", "gpu", "cloud", "coreweave", "nebius", "네오클라우드"],
    },
    {
      id: "sec-bottlenecks",
      title: "병목·리드타임 (6대 병목 공정)",
      subtitle: "CoWoS-L · HBM3E 12-Hi · HBM4 Base Die · EUV · 기판 · 랙 전력",
      category: "섹션 바로가기",
      icon: <IconBellShield className="w-4 h-4" />,
      onSelect: () => onSelectSection("bottlenecks"),
      keywords: ["bottleneck", "leadtime", "cowos", "euv", "병목", "리드타임"],
    },
  ];

  const fabItems: CommandMenuItem[] = FAB_SHIPMENTS.map((fab) => ({
    id: `entity-${fab.slug}`,
    title: `${fab.company} · ${fab.nodeOrProduct}`,
    subtitle: `${fab.monthlyOutputValue} ${fab.unitLabel} · 가동률 ${fab.utilizationPct}% · MoM ${formatSignedPercent(fab.momDeltaPct)}`,
    category: "파운드리·메모리 엔티티",
    icon: <IconLayers className="w-4 h-4" />,
    isEntityRoute: true,
    onSelect: () => router.push(`/preview/${fab.slug}`),
    keywords: [
      fab.slug,
      fab.company,
      fab.companyKo,
      fab.nodeOrProduct,
      fab.lineName,
      fab.category,
      ...fab.keyCustomers,
    ],
  }));

  const customerItems: CommandMenuItem[] = DEMAND_CUSTOMERS.map((cust) => ({
    id: `entity-${cust.slug}`,
    title: `${cust.name} (${cust.nameKo})`,
    subtitle: `${cust.monthlyGpuEquivalentK}k GPUeq/mo · 수급 갭 ${formatSignedPercent(cust.supplyGapPct)} · 백로그 ${cust.backlogMonths}개월`,
    category: "AI 랩·네오클라우드 엔티티",
    icon:
      cust.segment === "frontier-lab" ? (
        <IconCompass className="w-4 h-4" />
      ) : (
        <IconChart className="w-4 h-4" />
      ),
    isEntityRoute: true,
    onSelect: () => router.push(`/preview/${cust.slug}`),
    keywords: [
      cust.slug,
      cust.name,
      cust.nameKo,
      cust.segment,
      cust.focusCompute,
      ...cust.preferredNodes,
      ...cust.primarySuppliers,
    ],
  }));

  const bottleneckItems: CommandMenuItem[] = BOTTLENECK_STAGES.map((bn) => ({
    id: `entity-${bn.slug}`,
    title: `${bn.stageName} (${bn.stageNameKo})`,
    subtitle: `포화도 ${bn.saturationPct}% · 리드타임 ${bn.leadTimeWeeks}주 · 압력 ${formatSignedPercent(bn.momPressureDeltaPct)}`,
    category: "병목 공정",
    icon: <IconBellShield className="w-4 h-4" />,
    isEntityRoute: true,
    onSelect: () => router.push(`/preview/${bn.slug}`),
    keywords: [
      bn.slug,
      bn.stageName,
      bn.stageNameKo,
      bn.domain,
      ...bn.primarySuppliers,
      ...bn.primaryDrivers,
    ],
  }));

  const themeItem: CommandMenuItem = {
    id: "theme-toggle",
    title: theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환",
    subtitle: "Soft Pastel Surface / Elevated Pastel Depth 테마 변경",
    category: "테마 및 설정",
    icon:
      theme === "dark" ? (
        <IconSun className="w-4 h-4" />
      ) : (
        <IconMoon className="w-4 h-4" />
      ),
    onSelect: () => onToggleTheme(theme !== "dark"),
    keywords: ["theme", "dark", "light", "테마", "다크", "라이트", "모드"],
  };

  const items: CommandMenuItem[] = [
    ...sectionItems,
    ...fabItems,
    ...customerItems,
    ...bottleneckItems,
    themeItem,
  ];

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
      item.category.toLowerCase().includes(lower) ||
      item.keywords?.some((k) => k.toLowerCase().includes(lower))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filtered[selectedIndex];
      if (current) {
        triggerHaptic("selection");
        current.onSelect();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="fabnow 빠른 이동 커맨드 메뉴"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 select-none"
    >
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-xl liquid-glass-elevated rounded-3xl shadow-2xl border border-base-content/15 overflow-hidden flex flex-col z-10"
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--separator)" }}
        >
          <IconSearch className="w-5 h-5 text-base-content/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="TSMC, SK hynix, OpenAI, CoreWeave, CoWoS-L, HBM4 검색… (ESC 닫기)"
            aria-label="fabnow 섹션 및 엔티티 빠른 검색"
            className="w-full bg-transparent border-0 outline-none p-0 text-sm font-semibold text-base-content placeholder:text-base-content/45 focus:ring-0"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="커맨드 메뉴 닫기"
            className="btn btn-ghost btn-circle btn-xs rounded-xl pst-press text-base-content/70 hover:text-base-content"
          >
            <IconXMark className="w-4 h-4" />
          </button>
        </div>

        {/* Command Menu Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs font-medium text-base-content/60">
              검색된 섹션 또는 반도체·AI 엔티티가 없습니다
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full pst-press flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-start transition-all duration-150 ${
                    isSelected
                      ? "bg-primary/14 text-accent-primary ring-1 ring-primary/30"
                      : "text-base-content hover:bg-base-content/6"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span
                          className="text-[11px] font-medium truncate tabular-nums"
                          style={{ color: "var(--label-secondary)" }}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium opacity-75 shrink-0 ps-2">
                    <span>{item.category}</span>
                    {item.isEntityRoute && (
                      <IconExternalLink className="w-3 h-3 shrink-0" />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div
          className="px-4 py-2 border-t flex items-center justify-between text-[11px] font-medium"
          style={{
            borderColor: "var(--separator)",
            color: "var(--label-secondary)",
          }}
        >
          <span>↑↓ 탐색 · Enter 선택 (엔티티 클릭 시 상세 모달 열림)</span>
          <span>ESC 닫기</span>
        </div>
      </div>
    </div>
  );
}

export function CommandMenu(props: CommandMenuProps) {
  if (!props.isOpen) return null;
  return <CommandMenuDialog {...props} />;
}
