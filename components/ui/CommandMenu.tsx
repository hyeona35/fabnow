"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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

type MenuPhase = "closed" | "entering" | "open" | "closing";

const CLOSE_DURATION_MS = 200;

export function CommandMenu({
  isOpen,
  onClose,
  onSelectSection,
  theme,
  onToggleTheme,
}: CommandMenuProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<MenuPhase>(isOpen ? "entering" : "closed");
  const [restoreFocusOnClose, setRestoreFocusOnClose] = useState<boolean>(true);
  const [shouldNotifyClose, setShouldNotifyClose] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const closeMenu = useCallback((restoreFocus = true) => {
    setRestoreFocusOnClose(restoreFocus);
    setShouldNotifyClose(true);
    setPhase((prev) => (prev === "closed" || prev === "closing" ? prev : "closing"));
  }, []);

  // Synchronize external isOpen prop with menu phase transitions
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      if (isOpen) {
        if (
          !previousFocusRef.current &&
          document.activeElement instanceof HTMLElement
        ) {
          previousFocusRef.current = document.activeElement;
        }
        setShouldNotifyClose(false);
        setRestoreFocusOnClose(true);
        setPhase((prev) => (prev === "open" ? "open" : "entering"));
      } else {
        setPhase((prev) =>
          prev === "entering" || prev === "open" ? "closing" : prev
        );
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  // Drive entering -> open and closing -> closed lifecycle inside effects
  useEffect(() => {
    if (phase === "entering") {
      if (
        !previousFocusRef.current &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== inputRef.current
      ) {
        previousFocusRef.current = document.activeElement;
      }
      inputRef.current?.focus();
      let nestedRaf = 0;
      const raf = window.requestAnimationFrame(() => {
        nestedRaf = window.requestAnimationFrame(() => {
          setPhase("open");
          inputRef.current?.focus();
        });
      });
      return () => {
        window.cancelAnimationFrame(raf);
        if (nestedRaf) {
          window.cancelAnimationFrame(nestedRaf);
        }
      };
    }

    if (phase === "closing") {
      const timer = window.setTimeout(() => {
        setPhase("closed");
        setQuery("");
        setSelectedIndex(0);
        const prevEl = previousFocusRef.current;
        previousFocusRef.current = null;
        if (restoreFocusOnClose && prevEl && prevEl.isConnected) {
          prevEl.focus();
        }
        if (shouldNotifyClose) {
          setShouldNotifyClose(false);
          onCloseRef.current();
        }
      }, CLOSE_DURATION_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase, restoreFocusOnClose, shouldNotifyClose]);

  // Global ESC & Tab focus trap while CommandMenu is mounted
  useEffect(() => {
    if (phase === "closed") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
        return;
      }

      if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active || !container.contains(active)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [phase, closeMenu]);

  if (phase === "closed") return null;

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
    subtitle: "Warm Ivory Silk / Deep Plum Indigo 테마 변경",
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
        closeMenu(!current.isEntityRoute);
      }
    }
  };

  const isOpenVisual = phase === "open";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="fabnow 빠른 이동 커맨드 메뉴"
      className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[10vh] px-3 sm:px-4 pb-[env(safe-area-inset-bottom,0px)] select-none overscroll-contain"
    >
      <div
        className={`fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-[200ms] ease-out motion-reduce:transition-opacity ${
          isOpenVisual
            ? "opacity-100 backdrop-blur-[4px]"
            : "opacity-0 backdrop-blur-none"
        }`}
        style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
        onClick={() => closeMenu(true)}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className={`relative z-10 w-full max-w-xl max-h-[90dvh] sm:max-h-[80dvh] liquid-glass-elevated rounded-[28px] shadow-2xl border border-[var(--border-control)] overflow-hidden flex flex-col transition-[transform,opacity] duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none ${
          isOpenVisual
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-2 scale-[0.97]"
        }`}
      >
        {/* Search Input Bar */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b"
          style={{ borderColor: "var(--separator)" }}
        >
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ color: "var(--label-secondary)" }}
            aria-hidden="true"
          >
            <IconSearch className="w-5 h-5" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="TSMC, SK hynix, OpenAI, CoreWeave, CoWoS-L, HBM4 검색… (ESC 닫기)"
            aria-label="fabnow 섹션 및 엔티티 빠른 검색"
            className="w-full bg-transparent border-0 outline-none p-0 text-sm font-semibold text-base-content placeholder:text-[var(--label-tertiary)] focus:ring-0"
          />
          <button
            type="button"
            onClick={() => closeMenu(true)}
            aria-label="커맨드 메뉴 닫기"
            className="btn btn-ghost btn-circle btn-xs rounded-2xl pst-press text-base-content shrink-0"
          >
            <IconXMark className="w-4 h-4" />
          </button>
        </div>

        {/* Command Menu Results List with overscroll-contain */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-1">
          {filtered.length === 0 ? (
            <div
              className="py-10 text-center text-xs font-medium"
              style={{ color: "var(--label-secondary)" }}
            >
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
                    closeMenu(!item.isEntityRoute);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full pst-press flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-start transition-all duration-150 ${
                    isSelected
                      ? "bg-primary/14 text-accent-primary ring-1 ring-primary/40"
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
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold shrink-0 ps-2"
                    style={{
                      color: isSelected
                        ? "var(--accent-primary-text)"
                        : "var(--label-secondary)",
                    }}
                  >
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
          className="shrink-0 px-4 sm:px-5 py-2.5 border-t flex items-center justify-between text-[11px] font-medium"
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
