"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  BottomBar,
  Sidebar,
  type BottomBarItem,
  type SidebarNavItem,
  ToggleButton,
} from "@/components/ui";
import {
  FabnowBrandMark,
  IconBellShield,
  IconChart,
  IconCompass,
  IconDownload,
  IconGrid,
  IconLayers,
  IconMoon,
  IconSidebarLeft,
  IconSun,
} from "@/components/ui/icons";
import { usePwaInstall } from "@/components/providers/ClientRuntimeProvider";
import { useToast } from "@/context/OverlayContext";
import { triggerHaptic } from "@/lib/haptics";

const OfflineBanner = dynamic(
  () => import("@/components/ui/OfflineBanner").then((mod) => mod.OfflineBanner),
  { ssr: false }
);

function subscribeColorScheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getColorSchemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getColorSchemeServerSnapshot(): "light" | "dark" {
  return "light";
}

export interface SectionMeta {
  title: string;
  badge: string;
  description?: string;
}

export interface AppShellProps {
  activeSection?: string;
  onSelectSection?: (sectionId: string) => void;
  title?: string;
  subtitle?: string;
  sectionTitles?: Record<string, SectionMeta>;
  sidebarItems?: SidebarNavItem[];
  mobileTabs?: BottomBarItem[];
  children: React.ReactNode;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  {
    id: "overview",
    label: "통합 수급 현황",
    icon: <IconGrid className="w-5 h-5" />,
    activeIcon: <IconGrid className="w-5 h-5" filled />,
  },
  {
    id: "fabs",
    label: "파운드리·메모리 출하",
    icon: <IconLayers className="w-5 h-5" />,
    activeIcon: <IconLayers className="w-5 h-5" filled />,
  },
  {
    id: "labs",
    label: "프론티어 랩 수요",
    icon: <IconCompass className="w-5 h-5" />,
    activeIcon: <IconCompass className="w-5 h-5" filled />,
  },
  {
    id: "neoclouds",
    label: "네오클라우드 수요",
    icon: <IconChart className="w-5 h-5" />,
    activeIcon: <IconChart className="w-5 h-5" filled />,
  },
  {
    id: "bottlenecks",
    label: "병목·리드타임",
    icon: <IconBellShield className="w-5 h-5" />,
    activeIcon: <IconBellShield className="w-5 h-5" filled />,
  },
];

const MOBILE_BOTTOM_ITEMS: BottomBarItem[] = [
  {
    id: "overview",
    label: "현황",
    icon: <IconGrid className="w-5 h-5" />,
    activeIcon: <IconGrid className="w-5 h-5" filled />,
  },
  {
    id: "fabs",
    label: "출하",
    icon: <IconLayers className="w-5 h-5" />,
    activeIcon: <IconLayers className="w-5 h-5" filled />,
  },
  {
    id: "labs",
    label: "랩 수요",
    icon: <IconCompass className="w-5 h-5" />,
    activeIcon: <IconCompass className="w-5 h-5" filled />,
  },
  {
    id: "neoclouds",
    label: "클라우드",
    icon: <IconChart className="w-5 h-5" />,
    activeIcon: <IconChart className="w-5 h-5" filled />,
  },
  {
    id: "bottlenecks",
    label: "병목",
    icon: <IconBellShield className="w-5 h-5" />,
    activeIcon: <IconBellShield className="w-5 h-5" filled />,
  },
];

const DEFAULT_SECTION_TITLES: Record<string, SectionMeta> = {
  overview: {
    title: "통합 수급 현황",
    badge: "LIVE",
    description: "파운드리·HBM 출하 vs 프론티어 랩·네오클라우드 AI 수요 매트릭스",
  },
  fabs: {
    title: "파운드리·메모리 출하",
    badge: "10개 핵심 라인",
    description: "TSMC · SK hynix · 삼성전자 · Micron · Intel Foundry 월간 출하 및 가동률",
  },
  labs: {
    title: "프론티어 랩 수요",
    badge: "5개 랩",
    description: "OpenAI · Anthropic · Google DeepMind · xAI · Meta AI 연산·HBM 수요 및 공급 갭",
  },
  neoclouds: {
    title: "네오클라우드 수요",
    badge: "5개 클라우드",
    description: "CoreWeave · Nebius · Lambda · Crusoe · TensorWave GPU 클러스터 백로그 및 전력",
  },
  bottlenecks: {
    title: "병목·리드타임",
    badge: "6대 공정",
    description: "CoWoS-L · HBM3E/HBM4 · N2/N3P EUV · 기판 · 수랭 전력 병목 포화도",
  },
};

export function AppShell({
  activeSection: controlledActiveSection,
  onSelectSection: controlledOnSelectSection,
  title = "fabnow",
  subtitle = "반도체 출하 지표 · AI 수요 인텔리전스",
  sectionTitles = DEFAULT_SECTION_TITLES,
  sidebarItems,
  mobileTabs,
  children,
}: AppShellProps) {
  const resolvedSidebarItems = sidebarItems ?? SIDEBAR_ITEMS;
  const resolvedMobileTabs = mobileTabs ?? MOBILE_BOTTOM_ITEMS;
  const defaultHomeSection = resolvedSidebarItems[0]?.id || "overview";

  const [internalActiveSection, setInternalActiveSection] =
    useState<string>(defaultHomeSection);
  const activeSection = controlledActiveSection ?? internalActiveSection;
  const onSelectSection = controlledOnSelectSection ?? setInternalActiveSection;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const osColorScheme = useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot
  );
  const [userThemeOverride, setUserThemeOverride] = useState<
    "light" | "dark" | null
  >(null);
  const theme = userThemeOverride ?? osColorScheme;

  const { showToast } = useToast();
  const { canInstall, isInstalling, promptInstall } = usePwaInstall();

  const currentSection = sectionTitles[activeSection] ??
    DEFAULT_SECTION_TITLES[activeSection] ?? {
      title: "통합 수급 현황",
      badge: "fabnow",
      description: subtitle,
    };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${currentSection.title} — ${title}`;
    }
  }, [currentSection.title, title]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = (nextDark: boolean) => {
    const nextTheme = nextDark ? "dark" : "light";
    setUserThemeOverride(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    triggerHaptic("selection");
    showToast({
      title: nextDark
        ? "다크 모드 적용됨"
        : "라이트 모드 적용됨",
      variant: "info",
      durationMs: 2200,
    });
  };

  return (
    <div
      style={
        {
          "--active-sidebar-width": isSidebarCollapsed
            ? "var(--sidebar-collapsed-width)"
            : "var(--sidebar-width)",
        } as React.CSSProperties
      }
      className="relative w-full min-h-dvh overflow-x-clip md:overflow-x-visible"
    >
      {/* 1. Desktop/Tablet (>= md) Single-Level Collapsible Liquid Glass Sidebar */}
      <Sidebar
        items={resolvedSidebarItems}
        activeId={activeSection}
        onSelect={onSelectSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Edge-to-Edge Background Extension Main Content */}
      <main
        className="w-full min-h-dvh transition-all duration-300 ease-out px-4 sm:px-6 md:pe-6 pt-2.5 md:pt-3 md:ps-[calc(var(--active-sidebar-width)+24px)]"
        style={{
          paddingBottom:
            "calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px) + 32px)",
        }}
      >
        {/* Minimal Sticky Liquid Glass Top Utility Bar (Single responsive header & single <h1>) */}
        <header className="sticky top-2 md:top-3 z-20 liquid-glass rounded-3xl px-3.5 md:px-4 py-2.5 flex items-center justify-between gap-2 md:gap-4 transition-all duration-300 ease-out mb-4 md:mb-6 shadow-sm">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsSidebarCollapsed((prev) => !prev);
              }}
              aria-label={
                isSidebarCollapsed
                  ? "사이드바 전체 확장 모드로 전환"
                  : "사이드바 미니 아이콘 모드로 접기"
              }
              className="hidden md:inline-flex btn btn-sm btn-ghost btn-square rounded-2xl pst-press border border-base-content/20 text-base-content shrink-0"
            >
              <IconSidebarLeft
                className={`w-4 h-4 transition-transform duration-300 ${
                  isSidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                onSelectSection(defaultHomeSection);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="text-start flex flex-col justify-center min-w-0 flex-1 cursor-pointer pst-press group focus-visible:outline-2 focus-visible:outline-primary rounded-xl p-1 -m-1"
              title={`${currentSection.title} - fabnow 통합 수급 현황으로 이동`}
              aria-label={`${currentSection.title} - fabnow 통합 수급 현황으로 이동 및 맨 위로 스크롤`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FabnowBrandMark className="w-5 h-5 shrink-0 md:hidden" />
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-base-content group-hover:text-primary transition-colors truncate">
                  {currentSection.title}
                </h1>
              </div>
              <p
                className="hidden md:block text-xs font-medium truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                {currentSection.description ?? subtitle}
              </p>
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
            {canInstall && (
              <button
                type="button"
                aria-disabled={isInstalling}
                onClick={() => {
                  if (isInstalling) return;
                  triggerHaptic("selection");
                  void promptInstall();
                }}
                aria-label="fabnow 앱 설치"
                className="btn btn-sm btn-ghost rounded-2xl pst-press border border-base-content/20 text-base-content font-semibold gap-1.5"
              >
                <IconDownload className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">앱 설치</span>
              </button>
            )}

            <button
              type="button"
              aria-pressed={theme === "dark"}
              aria-label={
                theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
              }
              onClick={() => toggleTheme(theme !== "dark")}
              className={`sm:hidden btn btn-sm btn-square rounded-2xl pst-press transition-all duration-300 ease-out ${
                theme === "dark"
                  ? "bg-primary text-primary-content border-primary shadow-xs"
                  : "bg-base-100 text-base-content border-base-content/25 hover:bg-base-200"
              }`}
            >
              {theme === "dark" ? (
                <IconMoon className="w-4 h-4" />
              ) : (
                <IconSun className="w-4 h-4" />
              )}
            </button>

            <span className="hidden sm:inline-flex">
              <ToggleButton
                label="다크"
                icon={
                  theme === "dark" ? (
                    <IconMoon className="w-4 h-4" />
                  ) : (
                    <IconSun className="w-4 h-4" />
                  )
                }
                active={theme === "dark"}
                onToggle={toggleTheme}
              />
            </span>
          </div>
        </header>

        <div className="min-w-0">{children}</div>
      </main>

      {/* 3. Mobile (< md) Fixed Liquid Glass Bottom TabBar */}
      <BottomBar
        items={resolvedMobileTabs}
        activeId={activeSection}
        onSelect={onSelectSection}
      />

      {/* 4. Real-Time Offline Detection & Background Queueing Banner */}
      <OfflineBanner />
    </div>
  );
}
