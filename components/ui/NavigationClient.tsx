"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";
import {
  FabnowBrandMark,
  IconArrowPath,
  IconChevronDown,
  IconDownload,
  IconMenuMorph,
  IconMoon,
  IconSun,
} from "./icons";

export interface TabBarItem {
  /** Unique item identifier. */
  id: string;
  /** Visible tab label text. */
  label: string;
  /** Inactive/default icon element. */
  icon?: React.ReactNode;
  /** Optional active/selected state icon element. */
  activeIcon?: React.ReactNode;
  /** Optional notification badge or numerical count. */
  badge?: string | number;
}

export type BottomBarItem = TabBarItem;

export interface TabBarProps {
  /** List of mobile tab bar items (maximum 3-5 items per HIG). */
  items: TabBarItem[];
  /** Currently active tab identifier. */
  activeId: string;
  /** Selection callback fired on tab tap. */
  onSelect: (id: string) => void;
  /** When true, renders inline for showcase preview instead of fixed viewport bottom. */
  inlinePreview?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

export type BottomBarProps = TabBarProps;

export function TabBar({
  items,
  activeId,
  onSelect,
  inlinePreview = false,
  className = "",
}: TabBarProps) {
  // pstui Principle: Limit mobile tab bar items to 3~5 items maximum
  const visibleItems = items.slice(0, 5);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (inlinePreview) return;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const delta = currentY - lastScrollY;
          if (delta > 25 && currentY > 100) {
            setIsMinimized(true);
          } else if (delta < -20 || currentY <= 30) {
            setIsMinimized(false);
          }
          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [inlinePreview]);

  return (
    <nav
      aria-label="주요 하단 탐색 막대"
      onClick={() => {
        if (isMinimized) setIsMinimized(false);
      }}
      style={
        inlinePreview
          ? { height: "var(--tabbar-height)" }
          : {
              height: "var(--tabbar-height)",
              bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
              width: "min(32rem, calc(100% - 2rem))",
              left: 0,
              right: 0,
              marginInline: "auto",
              transformOrigin: "bottom center",
            }
      }
      className={`dock liquid-glass rounded-[28px] control-border border border-[var(--border-control,rgba(80,70,95,0.28))] transition-all duration-300 ease-out p-1.5 ${
        inlinePreview
          ? "relative w-full z-10"
          : "fixed inset-x-0 max-w-lg mx-auto md:hidden z-30 box-border"
      } ${
        isMinimized && !inlinePreview
          ? "scale-90 translate-y-2 opacity-90"
          : "scale-100 translate-y-0 opacity-100"
      } ${className}`}
    >
      {visibleItems.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              onSelect(item.id);
            }}
            aria-current={isActive ? "page" : undefined}
            style={!isActive ? { color: "var(--label-secondary)" } : undefined}
            className={`!mb-0 pst-press min-h-[44px] min-w-[44px] rounded-[22px] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-300 ease-out flex-1 h-full ${
              isActive
                ? "dock-active text-accent-primary bg-primary/14 border border-primary/30 font-semibold"
                : "hover:text-base-content hover:bg-base-content/5 font-semibold"
            }`}
          >
            {(item.icon || item.activeIcon) && (
              <span className="dock-icon shrink-0">
                {isActive ? (item.activeIcon ?? item.icon) : item.icon}
              </span>
            )}
            <span className="dock-label text-[11px] leading-tight font-semibold truncate max-w-full text-center px-0.5">
              {item.label}
            </span>
            {item.badge !== undefined && (
              <span
                className={`badge badge-xs absolute top-1.5 end-2 font-bold ${
                  isActive ? "badge-soft badge-primary" : "badge-neutral"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// Backward-compatible alias
export const BottomBar = TabBar;

export interface SidebarSubItem {
  /** Sub-item identifier. */
  id: string;
  /** Sub-item visible label text. */
  label: string;
  /** Optional secondary badge. */
  badge?: string | number;
}

export interface SidebarNavItem {
  /** Navigation item identifier. */
  id: string;
  /** Navigation item visible label text. */
  label: string;
  /** Primary icon element. */
  icon?: React.ReactNode;
  /** Optional active/selected state icon element. */
  activeIcon?: React.ReactNode;
  /** Optional notification badge or numerical count. */
  badge?: string | number;
  /** Sub-navigation hierarchy (strictly maximum 2 levels per DESIGN.md 4.1). */
  children?: SidebarSubItem[];
}

export interface SidebarProps {
  /** List of top-level sidebar navigation items. */
  items: SidebarNavItem[];
  /** Currently active navigation identifier. */
  activeId: string;
  /** Selection callback fired when an item is clicked. */
  onSelect: (id: string) => void;
  /** Whether the sidebar is collapsed to icon-only mode (76px width). */
  isCollapsed: boolean;
  /** Optional collapse toggle callback. */
  onToggleCollapse?: () => void;
  /** When true, renders inline for showcase preview without fixed viewport positioning. */
  inlinePreview?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  isCollapsed,
  inlinePreview = false,
  className = "",
}: SidebarProps) {
  return (
    <aside
      aria-label="사이드바 탐색"
      style={{
        width: isCollapsed
          ? "var(--sidebar-collapsed-width)"
          : "var(--sidebar-width)",
      }}
      className={`liquid-glass pst-sidebar-shadow control-border border border-[var(--border-control,rgba(80,70,95,0.28))] transition-all duration-300 ease-out flex flex-col select-none ${
        inlinePreview
          ? "relative rounded-[28px] h-[420px] m-1"
          : "hidden md:flex fixed top-3.5 bottom-3.5 start-3.5 z-30 rounded-[28px]"
      } ${className}`}
    >
      {/* Top Leading fabnow Header */}
      <div
        className={`flex items-center px-3 pt-3.5 pb-2.5 border-b ${
          isCollapsed ? "justify-center" : "justify-start"
        }`}
        style={{ borderColor: "var(--separator)" }}
      >
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => {
              onSelect("overview");
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.documentElement.scrollTo?.({ top: 0, behavior: "smooth" });
                document.body.scrollTo?.({ top: 0, behavior: "smooth" });
              }
            }}
            title="fabnow 통합 수급 현황으로 이동"
            aria-label="fabnow 통합 수급 현황으로 이동"
            className="flex items-center gap-2.5 min-w-[44px] min-h-[44px] px-2 cursor-pointer pst-press rounded-[20px] hover:opacity-85 transition-opacity focus-visible:outline-2 focus-visible:outline-primary text-start"
          >
            <FabnowBrandMark className="w-7 h-7 shrink-0" />
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="text-sm font-extrabold tracking-tight text-base-content truncate">
                fabnow
              </span>
              <span
                className="text-[11px] font-medium tracking-tight truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                반도체·AI 수급 지표
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onSelect("overview");
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.documentElement.scrollTo?.({ top: 0, behavior: "smooth" });
                document.body.scrollTo?.({ top: 0, behavior: "smooth" });
              }
            }}
            title="fabnow 통합 수급 현황으로 이동"
            aria-label="fabnow 통합 수급 현황으로 이동"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-[20px] flex items-center justify-center pst-press hover:bg-base-content/10 transition-colors focus-visible:outline-2 focus-visible:outline-primary mx-auto"
          >
            <FabnowBrandMark className="w-6 h-6 shrink-0" />
          </button>
        )}
      </div>

      {/* Navigation Menu (Up to 2 Hierarchy Levels) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 px-2">
        <ul className="menu w-full p-0 gap-1">
          {items.map((item) => {
            const isActive =
              item.id === activeId ||
              Boolean(item.children?.some((sub) => sub.id === activeId));
            const renderedIcon = isActive
              ? (item.activeIcon ?? item.icon)
              : item.icon;

            if (item.children && item.children.length > 0 && !isCollapsed) {
              return (
                <li key={item.id}>
                  <details open={isActive}>
                    <summary
                      onClick={() => onSelect(item.id)}
                      className={`pst-press min-h-[44px] rounded-[20px] px-3 py-2.5 text-sm transition-all duration-300 ease-out ${
                        isActive
                          ? "bg-primary/14 text-accent-primary border border-primary/30 font-semibold"
                          : "text-base-content hover:bg-base-content/8 font-medium"
                      }`}
                    >
                      {renderedIcon && <span className="shrink-0">{renderedIcon}</span>}
                      <span className="truncate">{item.label}</span>
                    </summary>
                    <ul className="ps-4 mt-1.5 space-y-1 before:bg-base-content/20">
                      {item.children.map((sub) => {
                        const isSubActive = sub.id === activeId;
                        return (
                          <li key={sub.id}>
                            <button
                              type="button"
                              onClick={() => onSelect(sub.id)}
                              aria-current={isSubActive ? "page" : undefined}
                              className={`pst-press min-h-[44px] rounded-[18px] px-3 py-2 text-xs flex items-center justify-between ${
                                isSubActive
                                  ? "bg-primary/14 text-accent-primary border border-primary/30 font-semibold"
                                  : "text-base-content hover:bg-base-content/8 font-medium"
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                              {sub.badge !== undefined && (
                                <span className="badge badge-xs font-semibold badge-soft badge-primary">
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`pst-press min-h-[44px] rounded-[20px] px-3 py-2.5 text-sm flex items-center justify-between transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-primary/14 text-accent-primary border border-primary/30 font-semibold shadow-xs"
                      : "text-base-content hover:bg-base-content/8 font-medium"
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    {renderedIcon && <span className="shrink-0">{renderedIcon}</span>}
                    {!isCollapsed && (
                      <span className="text-sm truncate">{item.label}</span>
                    )}
                  </span>
                  {!isCollapsed && item.badge !== undefined && (
                    <span className="badge badge-xs font-semibold badge-soft badge-primary">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export interface TabItem {
  /** Unique tab identifier. */
  id: string;
  /** Visible tab label text. */
  label: string;
  /** Optional numerical badge count. */
  badge?: string | number;
  /** Optional tab panel content rendered when active. */
  content?: React.ReactNode;
  /** Whether the tab is disabled. */
  disabled?: boolean;
}

export interface TabsProps {
  /** List of segmented tab items (max 5 items on mobile, max 7 items on PC). */
  items: TabItem[];
  /** Currently active tab identifier. */
  activeId: string;
  /** Callback fired when a tab is selected. */
  onChange: (id: string) => void;
  /** Visual presentation variant (segmented, box, border, lift). */
  variant?: "segmented" | "box" | "border" | "lift";
  /** Size variant. */
  size?: "xs" | "sm" | "md" | "lg";
  /** Additional CSS class names. */
  className?: string;
}

export function Tabs({
  items,
  activeId,
  onChange,
  variant = "segmented",
  size = "md",
  className = "",
}: TabsProps) {
  const cappedItems = variant === "segmented" ? items.slice(0, 7) : items;
  const activeTab = cappedItems.find((t) => t.id === activeId);

  const sizeClass =
    size === "xs"
      ? "tabs-xs"
      : size === "sm"
      ? "tabs-sm"
      : size === "lg"
      ? "tabs-lg"
      : "tabs-md";

  const styleClass =
    variant === "border"
      ? "tabs-border"
      : variant === "lift"
      ? "tabs-lift"
      : "tabs-box";

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div
        role="tablist"
        aria-label="탭 전환 제어기"
        style={{ backgroundColor: "var(--fill-tertiary)" }}
        className={`tabs ${styleClass} ${sizeClass} ${
          variant === "segmented"
            ? "grid grid-flow-col auto-cols-fr p-1.5 rounded-[22px] border control-border border-[var(--border-control,rgba(80,70,95,0.35))] gap-1"
            : "rounded-[22px] p-1.5 gap-1 border control-border border-[var(--border-control,rgba(80,70,95,0.35))]"
        }`}
      >
        {cappedItems.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              disabled={tab.disabled}
              aria-selected={isActive}
              onClick={() => !tab.disabled && onChange(tab.id)}
              style={!isActive ? { color: "var(--label-secondary)" } : undefined}
              className={`tab pst-press min-h-[44px] flex-1 rounded-2xl transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                isActive
                  ? "tab-active bg-base-100 text-base-content font-semibold shadow-sm border control-border border-[var(--border-control,rgba(80,70,95,0.32))]"
                  : "hover:text-base-content font-semibold"
              } ${tab.disabled ? "tab-disabled opacity-40" : ""}`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`badge badge-xs font-bold ${
                    isActive
                      ? "badge-soft badge-primary"
                      : "bg-base-content/12 text-base-content border-none"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab?.content && (
        <div
          role="tabpanel"
          className="material-regular rounded-[24px] p-4 shadow-xs transition-all duration-300 ease-out text-base-content"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}

export interface MegaMenuLink {
  /** Unique link identifier. */
  id: string;
  /** Primary link title text. */
  title: string;
  /** Descriptive caption or summary of the linked destination. */
  description: string;
  /** Optional badge text. */
  badge?: string;
  /** Click callback for programmatic navigation. */
  onClick?: () => void;
}

export type MegamenuLink = MegaMenuLink;

export interface MegaMenuSection {
  /** Unique section identifier. */
  id: string;
  /** Visible tab/menu button label. */
  label: string;
  /** Column layout containing categorized links. */
  columns: {
    heading: string;
    links: MegaMenuLink[];
  }[];
  /** Optional featured highlight card slot. */
  featuredCard?: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    onCtaClick?: () => void;
  };
}

export type MegamenuSection = MegaMenuSection;

export interface MegaMenuProps {
  /** List of top-level megamenu sections. */
  sections: MegaMenuSection[];
  /** Additional CSS class names. */
  className?: string;
}

export type MegamenuProps = MegaMenuProps;

export function MegaMenu({ sections, className = "" }: MegaMenuProps) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  const activeSection = sections.find((s) => s.id === openSectionId);

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      <div
        role="menubar"
        aria-label="메가메뉴 탐색"
        className="megamenu megamenu-wide w-full liquid-glass rounded-[24px] p-1.5 border control-border border-[var(--border-control,rgba(80,70,95,0.32))] flex flex-wrap items-center gap-1.5"
      >
        <span className="megamenu-active" aria-hidden="true" />
        {sections.slice(0, 10).map((section) => {
          const isOpen = section.id === openSectionId;
          return (
            <button
              key={section.id}
              type="button"
              role="menuitem"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenSectionId((prev) =>
                  prev === section.id ? null : section.id
                )
              }
              className={`btn btn-sm min-h-[44px] rounded-[18px] pst-press transition-all duration-300 ease-out ${
                isOpen
                  ? "bg-primary/14 text-accent-primary border border-primary/30 font-semibold shadow-xs"
                  : "btn-ghost border-none text-base-content font-semibold"
              }`}
            >
              <span>{section.label}</span>
              <IconChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          );
        })}
      </div>

      {activeSection && (
        <div className="liquid-glass-elevated rounded-[28px] p-4 sm:p-5 border control-border border-[var(--border-control,rgba(80,70,95,0.28))] transition-all duration-300 ease-out">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSection.columns.map((col) => (
                <div key={col.heading} className="space-y-2">
                  <p
                    className="text-xs font-bold px-2"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {col.heading}
                  </p>
                  <ul className="menu p-0 gap-1">
                    {col.links.map((link) => (
                      <li key={link.id}>
                        <button
                          type="button"
                          onClick={link.onClick}
                          className="pst-press min-h-[44px] rounded-[18px] p-2.5 flex flex-col items-start gap-1 hover:bg-base-content/8 transition-all duration-300 ease-out"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-base-content">
                              {link.title}
                            </span>
                            {link.badge && (
                              <span className="badge badge-xs badge-soft badge-primary font-semibold">
                                {link.badge}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs text-start"
                            style={{ color: "var(--label-secondary)" }}
                          >
                            {link.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {activeSection.featuredCard && (
              <div className="material-regular rounded-[20px] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <span className="badge badge-xs badge-soft badge-primary font-semibold">
                    추천 구성
                  </span>
                  <h4 className="text-sm font-bold text-base-content mt-1">
                    {activeSection.featuredCard.title}
                  </h4>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {activeSection.featuredCard.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={activeSection.featuredCard.onCtaClick}
                  className="btn btn-sm min-h-[44px] btn-primary text-primary-content rounded-2xl pst-press w-full font-semibold"
                >
                  {activeSection.featuredCard.ctaLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const Megamenu = MegaMenu;

export interface StackProps {
  /** Array of card nodes to stack on top of each other. */
  items: React.ReactNode[];
  /** Direction from which underlying stacked cards peek out. */
  placement?: "top" | "bottom" | "start" | "end";
  /** Additional CSS class names. */
  className?: string;
}

export function Stack({
  items,
  placement = "bottom",
  className = "",
}: StackProps) {
  const [rotationOffset, setRotationOffset] = useState<number>(0);

  if (items.length === 0) {
    return (
      <div className="material-regular rounded-2xl p-4 text-xs text-center">
        <span style={{ color: "var(--label-secondary)" }}>
          표시할 스택 항목이 없습니다.
        </span>
      </div>
    );
  }

  const normalizedOffset = rotationOffset % items.length;
  const order = items.map((_, i) => (i + normalizedOffset) % items.length);

  const rotateStack = () => {
    if (items.length <= 1) return;
    setRotationOffset((prev) => (prev + 1) % items.length);
  };

  const placementClass =
    placement === "top"
      ? "stack-top"
      : placement === "start"
      ? "stack-start"
      : placement === "end"
      ? "stack-end"
      : "stack-bottom";

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        onClick={rotateStack}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            rotateStack();
          }
        }}
        aria-label="스택 카드 순환하기 (클릭 또는 Enter)"
        className={`stack ${placementClass} cursor-pointer pst-press min-h-[44px] min-w-[44px] ${className}`}
      >
        {order.map((idx) => (
          <div key={idx} className="transition-all duration-300 ease-out">
            {items[idx]}
          </div>
        ))}
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: "var(--label-secondary)" }}
      >
        카드를 클릭하여 다음 레이어 보기 ({order[0] + 1}/{items.length})
      </span>
    </div>
  );
}

/* ============================================================================
 * Floating + Expanding Capsule Navbar & GPU Reveal Menu (pstui v0.3)
 * ========================================================================== */

export interface FloatingNavbarItem {
  /** Unique section identifier. */
  id: string;
  /** Full section title. */
  label: string;
  /** Compact capsule pill label for single-line desktop/mobile display. */
  shortLabel?: string;
  /** Brief description used in expanded panels. */
  description?: string;
  /** Optional count or status badge. */
  badge?: string | number;
  /** Default SVG icon (with nav-icon-micro support). */
  icon?: React.ReactNode;
  /** Active/filled SVG icon. */
  activeIcon?: React.ReactNode;
}

export interface FloatingNavbarProps {
  /** Brand title displayed on the left of the floating capsule. */
  brandTitle?: string;
  /** Brand emblem element. */
  brandMark?: React.ReactNode;
  /** Callback fired when clicking the brand logo. */
  onBrandClick?: () => void;
  /** Primary exploration section items (up to 5). */
  items: FloatingNavbarItem[];
  /** Currently active section identifier. */
  activeId: string;
  /** Callback fired when selecting a section pill. */
  onSelect: (id: string) => void;
  /** Whether the RevealMenu panel is currently expanded. */
  isMenuOpen: boolean;
  /** Toggle callback for the Menu trigger button. */
  onToggleMenu: () => void;
  /** Ref attached to the Menu trigger button for ESC focus restoration. */
  menuTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  /** Controlled panel DOM id for aria-controls. */
  menuPanelId?: string;
  /** Current theme mode ("light" | "dark"). */
  theme?: "light" | "dark";
  /** Callback fired when toggling theme mode. */
  onToggleTheme?: (nextDark: boolean) => void;
  /** Whether PWA installation prompt is currently available. */
  canInstall?: boolean;
  /** Whether PWA installation is in progress. */
  isInstalling?: boolean;
  /** Trigger callback for PWA install CTA. */
  onInstall?: () => void;
  /** Optional live status badge label (e.g. "LIVE"). */
  liveBadgeLabel?: string;
  /** Optional controlled compact override; defaults to RAF scroll-aware compacting. */
  isCompact?: boolean;
  /** Additional CSS class names on outer wrapper. */
  className?: string;
}

/**
 * Floating + Expanding Liquid Glass Capsule Navbar.
 * Single-line fixed height (h-14) with >= 44px concentric inner controls,
 * RAF + hysteresis horizontal scroll compacting, and GPU-accelerated sliding active pill.
 */
export function FloatingNavbar({
  brandTitle = "fabnow",
  brandMark,
  onBrandClick,
  items,
  activeId,
  onSelect,
  isMenuOpen,
  onToggleMenu,
  menuTriggerRef,
  menuPanelId = "pst-reveal-menu",
  theme = "light",
  onToggleTheme,
  canInstall = false,
  isInstalling = false,
  onInstall,
  liveBadgeLabel = "LIVE",
  isCompact,
  className = "",
}: FloatingNavbarProps) {
  const visibleItems = useMemo(() => items.slice(0, 5), [items]);
  const [isScrolledCompact, setIsScrolledCompact] = useState<boolean>(false);
  const effectiveCompact = (isCompact ?? isScrolledCompact) && !isMenuOpen;

  const navTrackRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillRect, setPillRect] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  // Scroll listener with RAF + hysteresis (> 48px compact, scroll up or <= 24px expand)
  useEffect(() => {
    if (isCompact !== undefined) return;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        if (currentY <= 24) {
          setIsScrolledCompact(false);
        } else if (delta > 8 && currentY > 48) {
          setIsScrolledCompact(true);
        } else if (delta < -10) {
          setIsScrolledCompact(false);
        }
        lastScrollY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCompact]);

  // Measure sliding active pill highlight asynchronously (ResizeObserver + RAF)
  useEffect(() => {
    const trackEl = navTrackRef.current;
    if (!trackEl) return;

    const measure = () => {
      const activeEl = pillRefs.current[activeId];
      if (!activeEl || activeEl.offsetWidth === 0) return;
      const nextLeft = activeEl.offsetLeft;
      const nextWidth = activeEl.offsetWidth;
      setPillRect((prev) =>
        prev.ready && prev.left === nextLeft && prev.width === nextWidth
          ? prev
          : { left: nextLeft, width: nextWidth, ready: true }
      );
    };

    const rafId = window.requestAnimationFrame(measure);
    const settleTimer = window.setTimeout(measure, 310);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        window.requestAnimationFrame(measure);
      });
      observer.observe(trackEl);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      observer?.disconnect();
    };
  }, [activeId, effectiveCompact, visibleItems]);

  const activeItem =
    visibleItems.find((item) => item.id === activeId) ?? visibleItems[0];

  return (
    <div
      className={`fixed top-3 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none ${className}`}
    >
      <nav
        aria-label="주요 탐색 캡슐 막대"
        className={`pointer-events-auto h-14 p-1.5 rounded-full w-full flex items-center justify-between gap-1.5 sm:gap-2 transition-[max-width,box-shadow,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          effectiveCompact
            ? "max-w-3xl liquid-glass-elevated shadow-lg"
            : "max-w-5xl liquid-glass shadow-sm"
        }`}
      >
        {/* 1. Brand Emblem & Title */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("selection");
            if (onBrandClick) {
              onBrandClick();
            } else {
              onSelect(visibleItems[0]?.id ?? "overview");
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          }}
          title={`${brandTitle} 홈으로 이동 및 맨 위로 스크롤`}
          aria-label={`${brandTitle} 홈으로 이동 및 맨 위로 스크롤`}
          className="group pst-press h-11 min-w-[44px] px-2.5 sm:px-3 rounded-full flex items-center gap-2 shrink-0 hover:bg-base-content/[0.06] transition-colors cursor-pointer"
        >
          {brandMark ?? <FabnowBrandMark className="w-7 h-7 shrink-0" />}
          <span className="text-sm font-extrabold tracking-tight text-base-content whitespace-nowrap">
            {brandTitle}
          </span>
        </button>

        {/* 2. Desktop Compact Inline Section Pills with Sliding Active Highlight */}
        <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
          <div
            ref={navTrackRef}
            className="relative inline-flex items-center gap-1 min-w-0"
          >
            <span
              aria-hidden="true"
              style={{
                transform: `translate3d(${pillRect.left}px, 0, 0)`,
                width: `${pillRect.width}px`,
                opacity: pillRect.ready ? 1 : 0,
              }}
              className="pointer-events-none absolute top-0 bottom-0 start-0 rounded-full bg-primary/14 border border-primary/30 shadow-xs transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            />
            {visibleItems.map((item) => {
              const isActive = item.id === activeId;
              const pillLabel = item.shortLabel ?? item.label;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    pillRefs.current[item.id] = el;
                  }}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelect(item.id);
                  }}
                  style={
                    !isActive ? { color: "var(--label-secondary)" } : undefined
                  }
                  className={`group relative z-10 pst-press h-11 min-w-[44px] rounded-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[color,padding,background-color] duration-200 cursor-pointer ${
                    effectiveCompact ? "px-2.5" : "px-3"
                  } ${
                    isActive
                      ? `text-accent-primary font-bold ${
                          !pillRect.ready
                            ? "bg-primary/14 border border-primary/30"
                            : ""
                        }`
                      : "hover:text-base-content hover:bg-base-content/[0.05] font-semibold"
                  }`}
                >
                  {(item.icon || item.activeIcon) && (
                    <span className="shrink-0 inline-flex items-center">
                      {isActive ? (item.activeIcon ?? item.icon) : item.icon}
                    </span>
                  )}
                  <span className="text-xs tracking-tight whitespace-nowrap">
                    {pillLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Smaller Widths (< lg): Active Section Indicator Pill */}
        {activeItem && (
          <div className="flex lg:hidden items-center justify-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onToggleMenu();
              }}
              aria-expanded={isMenuOpen}
              aria-controls={menuPanelId}
              aria-label={`현재 섹션: ${activeItem.label}. 탐색 메뉴 ${
                isMenuOpen ? "닫기" : "열기"
              }`}
              className="group pst-press h-11 min-w-[44px] max-w-full px-3 rounded-full inline-flex items-center justify-center gap-1.5 bg-primary/12 border border-primary/28 text-accent-primary font-bold text-xs transition-colors cursor-pointer"
            >
              {(activeItem.activeIcon ?? activeItem.icon) && (
                <span className="shrink-0 inline-flex items-center">
                  {activeItem.activeIcon ?? activeItem.icon}
                </span>
              )}
              <span className="truncate whitespace-nowrap">
                {activeItem.shortLabel ?? activeItem.label}
              </span>
            </button>
          </div>
        )}

        {/* 4. Trailing Utilities (Live Dot, Install CTA, Theme Toggle, Menu Trigger) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {liveBadgeLabel && !effectiveCompact && (
            <span
              className="hidden xl:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full bg-base-100/75 border control-border border-[var(--border-control,rgba(80,70,95,0.24))] text-[11px] font-bold text-base-content tracking-wide shrink-0"
              title="실시간 데이터 스트리밍 활성"
            >
              <span
                className="w-2 h-2 rounded-full bg-success animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span>{liveBadgeLabel}</span>
            </span>
          )}

          {canInstall && onInstall && (
            <button
              type="button"
              aria-disabled={isInstalling}
              onClick={() => {
                if (isInstalling) return;
                triggerHaptic("selection");
                onInstall();
              }}
              aria-label="fabnow 앱 설치"
              className="group pst-press h-11 min-w-[44px] px-2.5 sm:px-3 rounded-full border control-border border-[var(--border-control,rgba(80,70,95,0.35))] bg-base-100/80 hover:bg-base-100 text-base-content text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <IconDownload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span
                className={
                  effectiveCompact
                    ? "hidden"
                    : "hidden sm:inline whitespace-nowrap"
                }
              >
                앱 설치
              </span>
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              aria-pressed={theme === "dark"}
              aria-label={
                theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
              }
              onClick={() => onToggleTheme(theme !== "dark")}
              className="group pst-press h-11 w-11 min-w-[44px] min-h-[44px] rounded-full border control-border border-[var(--border-control,rgba(80,70,95,0.35))] bg-base-100/80 hover:bg-base-100 text-base-content inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <IconMoon className="w-4 h-4" />
              ) : (
                <IconSun className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            ref={menuTriggerRef}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls={menuPanelId}
            aria-label={isMenuOpen ? "탐색 메뉴 닫기" : "탐색 메뉴 열기"}
            onClick={() => {
              triggerHaptic("light");
              onToggleMenu();
            }}
            className={`group pst-press h-11 min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              effectiveCompact ? "w-11 px-0" : "px-2.5 xl:px-3.5"
            } ${
              isMenuOpen
                ? "bg-primary text-primary-content border border-primary shadow-xs"
                : "bg-base-100/85 hover:bg-base-100 text-base-content border control-border border-[var(--border-control,rgba(80,70,95,0.35))]"
            }`}
          >
            <IconMenuMorph isOpen={isMenuOpen} className="w-5 h-5 shrink-0" />
            {!effectiveCompact && (
              <span className="hidden xl:inline text-xs font-bold whitespace-nowrap">
                {isMenuOpen ? "닫기" : "메뉴"}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}

export type RevealMenuItem = FloatingNavbarItem;

export interface RevealMenuProps {
  /** DOM id referenced by the Menu trigger button's aria-controls. */
  id?: string;
  /** Controlled open state. */
  isOpen: boolean;
  /** Callback to close the RevealMenu. */
  onClose: () => void;
  /** Exploration section items to display with descriptions. */
  items: RevealMenuItem[];
  /** Currently active section identifier. */
  activeId: string;
  /** Callback when a section card is clicked. */
  onSelect: (id: string) => void;
  /** Ref to the trigger button so ESC restores focus accurately. */
  returnFocusToRef?: React.RefObject<HTMLElement | null>;
  /** Current theme mode for quick utility toggle. */
  theme?: "light" | "dark";
  /** Theme toggle handler. */
  onToggleTheme?: (nextDark: boolean) => void;
  /** Whether PWA install CTA is available. */
  canInstall?: boolean;
  /** Whether PWA install is pending. */
  isInstalling?: boolean;
  /** PWA install handler. */
  onInstall?: () => void;
  /** Optional scroll-to-top callback. */
  onScrollTop?: () => void;
  /** Optional panel subtitle text. */
  subtitle?: string;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * GPU-Composited Liquid Glass Reveal Menu Panel.
 * Animates via clip-path mask expansion + staggered reveal children (--stagger-index * 35ms),
 * runs a smooth 220ms closing transition before unmounting, and preserves full keyboard & ESC focus handling.
 */
export function RevealMenu({
  id = "pst-reveal-menu",
  isOpen,
  onClose,
  items,
  activeId,
  onSelect,
  returnFocusToRef,
  theme = "light",
  onToggleTheme,
  canInstall = false,
  isInstalling = false,
  onInstall,
  onScrollTop,
  subtitle = "전체 탐색 섹션 · 빠른 제어",
  className = "",
}: RevealMenuProps) {
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [mounted, setMounted] = useState<boolean>(isOpen);
  const [animPhase, setAnimPhase] = useState<"entering" | "open" | "closing">(
    isOpen ? "open" : "closing"
  );

  // React 19 derived-state-during-render pattern (avoids sync setState in useEffect)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMounted(true);
      setAnimPhase("entering");
    } else if (mounted) {
      setAnimPhase("closing");
    }
  }

  useEffect(() => {
    if (animPhase === "entering") {
      const rafId = window.requestAnimationFrame(() => {
        setAnimPhase("open");
      });
      return () => window.cancelAnimationFrame(rafId);
    }
    if (animPhase === "closing" && mounted) {
      const timerId = window.setTimeout(() => {
        setMounted(false);
      }, 220);
      return () => window.clearTimeout(timerId);
    }
    return undefined;
  }, [animPhase, mounted]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        triggerHaptic("light");
        onClose();
        window.requestAnimationFrame(() => {
          returnFocusToRef?.current?.focus();
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, returnFocusToRef]);

  if (!mounted) return null;

  const isRevealed = animPhase === "open";
  const visibleItems = items.slice(0, 5);

  const handleScrollTop = () => {
    triggerHaptic("light");
    if (onScrollTop) {
      onScrollTop();
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop Dimming & Blur Overlay (sits below z-40 FloatingNavbar so capsule stays interactive) */}
      <div
        data-state={animPhase === "closing" ? "closing" : "open"}
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }}
        aria-hidden="true"
        style={{
          backgroundColor: "var(--liquid-glass-dimming)",
          backdropFilter: isRevealed ? "blur(8px)" : "blur(0px)",
          WebkitBackdropFilter: isRevealed ? "blur(8px)" : "blur(0px)",
        }}
        className={`sheet-backdrop fixed inset-0 z-30 overscroll-contain transition-[opacity,backdrop-filter] duration-[220ms] ease-out motion-reduce:transition-opacity ${
          isRevealed ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Anchored Reveal Panel */}
      <div
        className={`fixed top-[76px] inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none ${className}`}
      >
        <section
          id={id}
          role="region"
          aria-label="전체 탐색 섹션 및 빠른 도구"
          data-state={animPhase === "closing" ? "closing" : "open"}
          style={{
            clipPath: isRevealed
              ? "inset(0 0 0% 0 round 28px)"
              : "inset(0 0 100% 0 round 28px)",
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed
              ? "translate3d(0, 0, 0)"
              : "translate3d(0, -6px, 0)",
            willChange: "clip-path, opacity, transform",
          }}
          className="reveal-panel pointer-events-auto w-full max-w-5xl liquid-glass-elevated rounded-[28px] p-3 sm:p-4 shadow-2xl border control-border border-[var(--border-control,rgba(80,70,95,0.28))] overscroll-contain max-h-[calc(100dvh-96px)] overflow-y-auto touch-pan-y transition-[clip-path,opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none motion-reduce:[clip-path:none!important]"
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between gap-3 px-2 pb-2.5 mb-3 border-b"
            style={{ borderColor: "var(--separator)" }}
          >
            <div className="min-w-0 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
              <p
                className="text-xs font-bold tracking-tight truncate"
                style={{ color: "var(--label-secondary)" }}
              >
                {subtitle}
              </p>
            </div>
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium shrink-0"
              style={{ color: "var(--label-tertiary)" }}
            >
              <kbd className="kbd kbd-xs font-mono">ESC</kbd>
              <span>닫기</span>
            </span>
          </div>

          {/* 5 Exploration Sections (Staggered Reveal Children: index * 35ms) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {visibleItems.map((item, idx) => {
              const isActive = item.id === activeId;
              const delayMs = isRevealed ? idx * 35 : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelect(item.id);
                    onClose();
                  }}
                  style={
                    {
                      "--stagger-index": idx,
                      transitionDelay: `${delayMs}ms`,
                      opacity: isRevealed ? 1 : 0,
                    } as React.CSSProperties
                  }
                  className={`reveal-item group pst-press min-h-[44px] rounded-2xl p-3.5 text-start flex sm:flex-col items-start justify-between gap-3 border transition-[background-color,border-color,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none cursor-pointer ${
                    isActive
                      ? "bg-primary/14 border-primary/35 shadow-xs"
                      : "bg-base-100/85 hover:bg-base-100 control-border border-[var(--border-control,rgba(80,70,95,0.28))]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-auto sm:w-full shrink-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {isActive ? (item.activeIcon ?? item.icon) : item.icon}
                    </span>
                    {item.badge !== undefined && (
                      <span className="hidden sm:inline-flex badge badge-xs badge-soft badge-primary font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-extrabold tracking-tight break-keep ${
                          isActive ? "text-accent-primary" : "text-base-content"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span className="sm:hidden badge badge-xs badge-soft badge-primary font-bold shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className="text-xs font-medium leading-snug line-clamp-2 break-keep"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Utility Row */}
          <div
            style={
              {
                "--stagger-index": visibleItems.length,
                borderColor: "var(--separator)",
                transitionDelay: isRevealed
                  ? `${visibleItems.length * 35}ms`
                  : "0ms",
                opacity: isRevealed ? 1 : 0,
              } as React.CSSProperties
            }
            className="reveal-item mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none"
          >
            <div className="flex flex-wrap items-center gap-2">
              {onToggleTheme && (
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  onClick={() => onToggleTheme(theme !== "dark")}
                  className="group pst-press min-h-[44px] px-3.5 rounded-2xl bg-base-100/85 hover:bg-base-100 border control-border border-[var(--border-control,rgba(80,70,95,0.32))] text-xs font-bold text-base-content inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {theme === "dark" ? (
                    <IconMoon className="w-4 h-4 shrink-0" />
                  ) : (
                    <IconSun className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {theme === "dark"
                      ? "다크 모드 (라이트로 전환)"
                      : "라이트 모드 (다크로 전환)"}
                  </span>
                </button>
              )}

              {canInstall && onInstall && (
                <button
                  type="button"
                  aria-disabled={isInstalling}
                  onClick={() => {
                    if (isInstalling) return;
                    triggerHaptic("selection");
                    onInstall();
                    onClose();
                  }}
                  className="group pst-press min-h-[44px] px-3.5 rounded-2xl bg-primary text-primary-content text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-opacity cursor-pointer"
                >
                  <IconDownload className="w-4 h-4 shrink-0" />
                  <span>fabnow 앱 설치</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleScrollTop}
              className="group pst-press min-h-[44px] px-3.5 rounded-2xl bg-base-100/85 hover:bg-base-100 border control-border border-[var(--border-control,rgba(80,70,95,0.32))] text-xs font-bold text-base-content inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <IconArrowPath className="w-3.5 h-3.5 shrink-0" />
              <span>맨 위로 스크롤</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

/* ============================================================================
 * Upgraded PreviewModalShell (Mobile Bottom Sheet + Momentum Drag + No Body CLS)
 * ========================================================================== */

interface PreviewModalContextValue {
  requestClose: () => void;
}

const PreviewModalContext = createContext<PreviewModalContextValue | null>(
  null
);

export interface PreviewModalShellProps {
  ariaLabelledBy?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Internal client dialog body mounted only while pathname matches /preview/*.
 * Mobile (< 640px): authentic Bottom Sheet with Pointer Events swipe-down + Apple momentum projection.
 * Desktop (>= 640px): elevated rounded-[28px] sheet dialog.
 * Zero body.style.overflow mutation (prevents root scrollbar CLS) via overscroll-behavior: contain.
 */
function PreviewModalContent({
  ariaLabelledBy,
  ariaLabel = "상세 정보 모달",
  children,
}: PreviewModalShellProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<"entering" | "open" | "closing">(
    "entering"
  );
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDragDismissing, setIsDragDismissing] = useState<boolean>(false);

  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragSamplesRef = useRef<Array<{ y: number; t: number }>>([]);

  const handleClose = useCallback((fromDrag = false) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsDragging(false);
    setIsDragDismissing(fromDrag);
    if (!fromDrag) {
      setDragY(0);
    }
    setPhase("closing");
    triggerHaptic(fromDrag ? "medium" : "light");

    closeTimerRef.current = window.setTimeout(() => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }, 230);
  }, [router]);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      prevFocusedRef.current = document.activeElement;
    }

    const openRaf = window.requestAnimationFrame(() => {
      setPhase("open");
    });

    const focusTimer = window.setTimeout(() => {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.focus();
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
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
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(openRaf);
      window.clearTimeout(focusTimer);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      if (prevFocusedRef.current?.isConnected) {
        prevFocusedRef.current.focus();
      }
    };
  }, [handleClose]);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (closingRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events without active pointer capture
    }

    dragPointerIdRef.current = e.pointerId;
    dragStartYRef.current = e.clientY;
    dragSamplesRef.current = [{ y: 0, t: performance.now() }];
    setIsDragging(true);
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isDragging ||
      dragStartYRef.current === null ||
      e.pointerId !== dragPointerIdRef.current
    ) {
      return;
    }

    const rawDelta = e.clientY - dragStartYRef.current;
    // Apple WWDC rubber-banding resistance above origin
    let nextY = rawDelta;
    if (rawDelta < 0) {
      const overshoot = -rawDelta;
      const dimension = 420;
      nextY = -((overshoot * dimension * 0.55) / (dimension + 0.55 * overshoot));
    }

    const now = performance.now();
    const samples = dragSamplesRef.current;
    samples.push({ y: nextY, t: now });
    if (samples.length > 6) {
      samples.shift();
    }

    setDragY(nextY);
  };

  const handleDragPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      dragStartYRef.current === null ||
      e.pointerId !== dragPointerIdRef.current
    ) {
      return;
    }

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore capture release failures
    }

    const samples = dragSamplesRef.current;
    const latest = samples[samples.length - 1] ?? {
      y: dragY,
      t: performance.now(),
    };
    const reference =
      [...samples].reverse().find((s) => latest.t - s.t >= 35) ??
      samples[0] ??
      latest;

    const dt = Math.max(1, latest.t - reference.t);
    const velocityPxPerSec = ((latest.y - reference.y) / dt) * 1000;

    // Apple Fluid Interfaces WWDC 2018 exponential-decay momentum projection
    const decelerationRate = 0.998;
    const projectedDistance =
      ((velocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
    const projectedEndpoint = latest.y + projectedDistance;

    dragPointerIdRef.current = null;
    dragStartYRef.current = null;
    dragSamplesRef.current = [];

    if (
      e.type === "pointerup" &&
      (latest.y > 90 ||
        projectedEndpoint > 220 ||
        (velocityPxPerSec > 450 && latest.y > 24))
    ) {
      handleClose(true);
    } else {
      setIsDragging(false);
      setDragY(0);
      triggerHaptic("light");
    }
  };

  const contextValue = useMemo(
    () => ({ requestClose: () => handleClose(false) }),
    [handleClose]
  );

  const isVisible = phase === "open";

  return (
    <PreviewModalContext.Provider value={contextValue}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        className="fixed inset-0 z-50 flex items-end justify-center p-0 pt-4 sm:items-center sm:p-4 overscroll-contain"
      >
        <div
          data-state={phase === "closing" ? "closing" : "open"}
          className={`sheet-backdrop fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-240 ease-out motion-reduce:transition-opacity ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundColor: "var(--liquid-glass-dimming)",
            backdropFilter: isVisible ? "blur(8px)" : "blur(0px)",
            WebkitBackdropFilter: isVisible ? "blur(8px)" : "blur(0px)",
          }}
          onClick={() => handleClose(false)}
          aria-hidden="true"
        />
        <div
          ref={dialogRef}
          tabIndex={-1}
          data-state={phase === "closing" ? "closing" : "open"}
          data-dragging={isDragging || isDragDismissing ? "true" : "false"}
          style={
            isDragging
              ? {
                  animation: "none",
                  transform: `translate3d(0, ${dragY}px, 0)`,
                  transition: "none",
                }
              : isDragDismissing
              ? {
                  animation: "none",
                  transform: "translate3d(0, 100%, 0)",
                  opacity: 0,
                  transition:
                    "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
                }
              : undefined
          }
          className={`sheet-panel relative z-10 w-full sm:max-w-2xl max-h-[93dvh] sm:max-h-[86dvh] flex flex-col overflow-hidden liquid-glass-elevated control-border border border-[var(--border-control,rgba(80,70,95,0.28))] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overscroll-contain focus:outline-none transition-[transform,opacity] duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none ${
            isVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-full sm:translate-y-5 sm:scale-[0.98] opacity-0"
          }`}
        >
          {/* Mobile Bottom Sheet Drag Handle Bar */}
          <div
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerEnd}
            onPointerCancel={handleDragPointerEnd}
            aria-hidden="true"
            className="sm:hidden w-full pt-3 pb-2.5 flex justify-center shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
          >
            <span className="w-11 h-1.5 rounded-full bg-base-content/30 hover:bg-base-content/45 transition-colors" />
          </div>

          {/* Scrollable Sheet Content */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-5 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </PreviewModalContext.Provider>
  );
}

/**
 * Accessible intercepted-route modal dialog shell with mobile Bottom Sheet,
 * swipe-down momentum dismissal, ESC handling, backdrop dismissal,
 * focus trapping, and CLS-free scroll containment.
 */
export function PreviewModalShell({
  ariaLabelledBy,
  ariaLabel = "상세 정보 모달",
  children,
}: PreviewModalShellProps) {
  const pathname = usePathname();
  if (!pathname?.startsWith("/preview/")) {
    return null;
  }

  return (
    <PreviewModalContent
      ariaLabelledBy={ariaLabelledBy}
      ariaLabel={ariaLabel}
    >
      {children}
    </PreviewModalContent>
  );
}

export interface PreviewModalCloseButtonProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Client close button for intercepted route modals.
 * Coordinates with PreviewModalShell exit transition when mounted inside it.
 */
export function PreviewModalCloseButton({
  children,
  className = "",
  ariaLabel,
}: PreviewModalCloseButtonProps) {
  const router = useRouter();
  const modalCtx = useContext(PreviewModalContext);
  const closingRef = useRef<boolean>(false);

  const handleClose = () => {
    if (modalCtx) {
      modalCtx.requestClose();
      return;
    }
    if (closingRef.current) return;
    closingRef.current = true;
    triggerHaptic("light");
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
    window.setTimeout(() => {
      closingRef.current = false;
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
