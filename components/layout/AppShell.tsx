"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import {
  FloatingNavbar,
  RevealMenu,
  type BottomBarItem,
  type FloatingNavbarItem,
  type SidebarNavItem,
} from "@/components/ui";
import {
  FabnowBrandMark,
  IconBellShield,
  IconChart,
  IconCompass,
  IconGrid,
  IconLayers,
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

const DEFAULT_SHORT_LABELS: Record<string, string> = {
  overview: "현황",
  fabs: "파운드리",
  labs: "랩 수요",
  neoclouds: "클라우드",
  bottlenecks: "병목",
};

const DEFAULT_NAV_ITEMS: FloatingNavbarItem[] = [
  {
    id: "overview",
    label: "통합 수급 현황",
    shortLabel: "현황",
    badge: "LIVE",
    description: "파운드리·HBM 출하 vs 프론티어 랩·네오클라우드 AI 수요 매트릭스",
    icon: <IconGrid className="w-4 h-4" />,
    activeIcon: <IconGrid className="w-4 h-4" filled />,
  },
  {
    id: "fabs",
    label: "파운드리·메모리 출하",
    shortLabel: "파운드리",
    badge: "10 라인",
    description: "TSMC · SK hynix · 삼성전자 · Micron · Intel Foundry 월간 출하 및 가동률",
    icon: <IconLayers className="w-4 h-4" />,
    activeIcon: <IconLayers className="w-4 h-4" filled />,
  },
  {
    id: "labs",
    label: "프론티어 랩 수요",
    shortLabel: "랩 수요",
    badge: "5 랩",
    description: "OpenAI · Anthropic · Google DeepMind · xAI · Meta AI 연산·HBM 수요 및 공급 갭",
    icon: <IconCompass className="w-4 h-4" />,
    activeIcon: <IconCompass className="w-4 h-4" filled />,
  },
  {
    id: "neoclouds",
    label: "네오클라우드 수요",
    shortLabel: "클라우드",
    badge: "5 클라우드",
    description: "CoreWeave · Nebius · Lambda · Crusoe · TensorWave GPU 클러스터 백로그 및 전력",
    icon: <IconChart className="w-4 h-4" />,
    activeIcon: <IconChart className="w-4 h-4" filled />,
  },
  {
    id: "bottlenecks",
    label: "병목·리드타임",
    shortLabel: "병목",
    badge: "6 공정",
    description: "CoWoS-L · HBM3E/HBM4 · N2/N3P EUV · 기판 · 수랭 전력 병목 포화도",
    icon: <IconBellShield className="w-4 h-4" />,
    activeIcon: <IconBellShield className="w-4 h-4" filled />,
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
  const navItems = useMemo<FloatingNavbarItem[]>(() => {
    if (!sidebarItems || sidebarItems.length === 0) {
      return DEFAULT_NAV_ITEMS.map((item) => {
        const meta = sectionTitles[item.id];
        return meta
          ? {
              ...item,
              label: meta.title,
              badge: meta.badge,
              description: meta.description ?? item.description,
            }
          : item;
      });
    }

    const mobileMap = new Map(
      (mobileTabs ?? []).map((tab) => [tab.id, tab.label])
    );

    return sidebarItems.map((item) => {
      const meta = sectionTitles[item.id];
      const shortFromMobile = mobileMap.get(item.id);
      const shortLabel =
        shortFromMobile ??
        DEFAULT_SHORT_LABELS[item.id] ??
        (item.label.length > 6 ? item.label.slice(0, 6) : item.label);
      return {
        id: item.id,
        label: meta?.title ?? item.label,
        shortLabel,
        badge: meta?.badge ?? item.badge,
        description: meta?.description,
        icon: item.icon,
        activeIcon: item.activeIcon,
      };
    });
  }, [sidebarItems, mobileTabs, sectionTitles]);

  const defaultHomeSection = navItems[0]?.id || "overview";

  const [internalActiveSection, setInternalActiveSection] =
    useState<string>(defaultHomeSection);
  const activeSection = controlledActiveSection ?? internalActiveSection;
  const setActiveSection =
    controlledOnSelectSection ?? setInternalActiveSection;

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelId = useId();

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
      title: navItems.find((n) => n.id === activeSection)?.label ?? "통합 수급 현황",
      badge: title,
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

  const handleSelectSection = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      setIsMenuOpen(false);
    },
    [setActiveSection]
  );

  const toggleTheme = useCallback(
    (nextDark: boolean) => {
      const nextTheme = nextDark ? "dark" : "light";
      setUserThemeOverride(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      triggerHaptic("selection");
      showToast({
        title: nextDark ? "다크 모드 적용됨" : "라이트 모드 적용됨",
        variant: "info",
        durationMs: 2200,
      });
    },
    [showToast]
  );

  return (
    <div className="relative w-full min-h-dvh overflow-x-clip">
      {/* 1. Unified Floating + Expanding Capsule Navbar (Single Top Chrome) */}
      <FloatingNavbar
        brandTitle={title}
        brandMark={<FabnowBrandMark className="w-7 h-7 shrink-0" />}
        onBrandClick={() => {
          handleSelectSection(defaultHomeSection);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        items={navItems}
        activeId={activeSection}
        onSelect={handleSelectSection}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        menuTriggerRef={menuTriggerRef}
        menuPanelId={menuPanelId}
        theme={theme}
        onToggleTheme={toggleTheme}
        canInstall={canInstall}
        isInstalling={isInstalling}
        onInstall={() => void promptInstall()}
        liveBadgeLabel={
          sectionTitles?.overview?.badge === "LIVE" ? "LIVE" : undefined
        }
      />

      {/* 2. GPU-Composited Liquid Glass Reveal Menu Panel */}
      <RevealMenu
        id={menuPanelId}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={navItems}
        activeId={activeSection}
        onSelect={handleSelectSection}
        returnFocusToRef={menuTriggerRef}
        theme={theme}
        onToggleTheme={toggleTheme}
        canInstall={canInstall}
        isInstalling={isInstalling}
        onInstall={() => void promptInstall()}
        subtitle={subtitle}
      />

      {/* 3. Main Content with Constant-Height Zero-CLS Header Spacer */}
      <main
        className="w-full min-h-dvh px-4 sm:px-6 lg:px-8"
        style={{
          paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-7xl mx-auto min-w-0">
          {/* Constant-height in-flow spacer: floating navbar compacting/expanding NEVER shifts <main> content (CLS = 0) */}
          <div aria-hidden="true" className="h-[76px] sm:h-[84px] shrink-0" />

          {/* Calm Editorial Section Header (Single <h1> before all <h2> sections) */}
          <header className="mb-6 sm:mb-8 flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/12 text-accent-primary border border-primary/25">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-success"
                  aria-hidden="true"
                />
                <span>{currentSection.badge}</span>
              </span>
              <span
                className="text-xs font-medium truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                {subtitle}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content break-keep">
              {currentSection.title}
            </h1>
            {currentSection.description && (
              <p
                className="text-xs sm:text-sm font-medium break-keep max-w-3xl"
                style={{ color: "var(--label-secondary)" }}
              >
                {currentSection.description}
              </p>
            )}
          </header>

          <div className="min-w-0">{children}</div>
        </div>
      </main>

      {/* 4. Real-Time Offline Detection & Background Queueing Banner */}
      <OfflineBanner />
    </div>
  );
}
