"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { triggerHaptic } from "@/lib/haptics";
import { IconXMark } from "./icons";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  dismissThreshold?: number; // px downward before dismissing
  className?: string;
}

interface PointerSample {
  y: number;
  t: number;
}

const CLOSE_DURATION_MS = 240;
const APPLE_DECELERATION_RATE = 0.998;

function projectMomentum(velocityPxPerSec: number): number {
  return (
    ((velocityPxPerSec / 1000) * APPLE_DECELERATION_RATE) /
    (1 - APPLE_DECELERATION_RATE)
  );
}

function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  dismissThreshold = 80,
  className = "",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const shouldRenderRef = useRef<boolean>(isOpen);
  const isClosingRef = useRef<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Pointer drag tracking on drag handle & header
  const pointerDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startY: number;
    currentY: number;
    samples: PointerSample[];
  }>({
    active: false,
    pointerId: null,
    startY: 0,
    currentY: 0,
    samples: [],
  });

  // Touch drag fallback when pulling down from top of scroll container
  const touchDragRef = useRef<{
    active: boolean;
    insideBody: boolean;
    startY: number | null;
    currentY: number;
    samples: PointerSample[];
  }>({
    active: false,
    insideBody: false,
    startY: null,
    currentY: 0,
    samples: [],
  });

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    shouldRenderRef.current = shouldRender;
  }, [shouldRender]);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const finishClose = useCallback(
    (notifyParent: boolean) => {
      closeTimerRef.current = null;
      isClosingRef.current = false;
      shouldRenderRef.current = false;
      setShouldRender(false);
      setIsClosing(false);
      setIsEntered(false);
      setIsDragging(false);
      setTranslateY(0);

      const prevEl = previousFocusRef.current;
      previousFocusRef.current = null;
      if (prevEl && prevEl.isConnected) {
        prevEl.focus();
      }
      if (notifyParent) {
        onClose();
      }
    },
    [onClose]
  );

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setIsDragging(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      finishClose(true);
    }, CLOSE_DURATION_MS);
  }, [finishClose]);

  // Synchronize external isOpen prop changes with smooth enter/exit transitions
  useEffect(() => {
    let nestedRaf = 0;
    const raf = window.requestAnimationFrame(() => {
      if (isOpen) {
        if (closeTimerRef.current !== null) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        if (!previousFocusRef.current && document.activeElement instanceof HTMLElement) {
          previousFocusRef.current = document.activeElement;
        }
        isClosingRef.current = false;
        shouldRenderRef.current = true;
        setShouldRender(true);
        setIsClosing(false);
        setTranslateY(0);

        nestedRaf = window.requestAnimationFrame(() => {
          setIsEntered(true);
        });
      } else if (shouldRenderRef.current && !isClosingRef.current) {
        isClosingRef.current = true;
        setIsClosing(true);
        setIsDragging(false);
        if (closeTimerRef.current !== null) {
          window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
          finishClose(false);
        }, CLOSE_DURATION_MS);
      }
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (nestedRaf) {
        window.cancelAnimationFrame(nestedRaf);
      }
    };
  }, [isOpen, finishClose]);

  // Focus management, Tab focus trap & Escape key handler (NO body overflow mutation)
  useEffect(() => {
    if (!shouldRender) return;

    if (!previousFocusRef.current && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }

    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
      const nodes = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(nodes);
    };

    const focusTimer = window.setTimeout(() => {
      const container = sheetRef.current;
      if (!container) return;
      if (!container.contains(document.activeElement)) {
        const focusable = getFocusableElements(container);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container.focus();
        }
      }
    }, 16);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        triggerHaptic("light");
        requestClose();
        return;
      }

      if (e.key === "Tab") {
        const container = sheetRef.current;
        if (!container) return;
        const focusable = getFocusableElements(container);
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

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldRender, requestClose]);

  if (!shouldRender) return null;

  const computeVelocity = (samples: PointerSample[]): number => {
    const now = performance.now();
    const recent = samples.filter((s) => now - s.t <= 120);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = Math.max(1, last.t - first.t);
    return ((last.y - first.y) / dt) * 1000;
  };

  // Pointer Events (setPointerCapture) on Drag Handle & Sheet Header
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isClosingRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }

    const now = performance.now();
    pointerDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      currentY: 0,
      samples: [{ y: e.clientY, t: now }],
    };
    setIsDragging(true);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const state = pointerDragRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const now = performance.now();
    const deltaY = e.clientY - state.startY;
    state.samples.push({ y: e.clientY, t: now });
    state.samples = state.samples.filter((s) => now - s.t <= 120);

    if (deltaY < 0) {
      const dimension = sheetRef.current?.clientHeight || 400;
      const resisted = -rubberband(-deltaY, dimension);
      state.currentY = resisted;
      setTranslateY(resisted);
    } else {
      state.currentY = deltaY;
      setTranslateY(deltaY);
    }
  };

  const handleHeaderPointerEnd = (
    e: React.PointerEvent<HTMLElement>,
    cancelled = false
  ) => {
    const state = pointerDragRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    const deltaY = state.currentY;
    const velocityPxPerSec = computeVelocity(state.samples);
    const projectedEndpoint = deltaY + projectMomentum(velocityPxPerSec);

    pointerDragRef.current = {
      active: false,
      pointerId: null,
      startY: 0,
      currentY: 0,
      samples: [],
    };
    setIsDragging(false);

    if (
      !cancelled &&
      (deltaY > dismissThreshold ||
        projectedEndpoint > 180 ||
        (velocityPxPerSec > 400 && deltaY > 25))
    ) {
      triggerHaptic("medium");
      requestClose();
    } else {
      if (Math.abs(deltaY) > 6) {
        triggerHaptic("light");
      }
      setTranslateY(0);
    }
  };

  // Touch drag fallback inside scroll body when scrolled to top (scrollTop <= 0)
  const handleBodyTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isClosingRef.current || pointerDragRef.current.active) return;
    if (bodyRef.current && bodyRef.current.scrollTop > 0) return;

    const y = e.touches[0].clientY;
    touchDragRef.current = {
      active: true,
      insideBody: true,
      startY: y,
      currentY: 0,
      samples: [{ y, t: performance.now() }],
    };
  };

  const handleBodyTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = touchDragRef.current;
    if (!state.active || state.startY === null) return;
    if (bodyRef.current && bodyRef.current.scrollTop > 0) {
      state.active = false;
      setIsDragging(false);
      setTranslateY(0);
      return;
    }

    const y = e.touches[0].clientY;
    const deltaY = y - state.startY;
    if (deltaY <= 0) {
      return;
    }

    setIsDragging(true);
    const now = performance.now();
    state.samples.push({ y, t: now });
    state.samples = state.samples.filter((s) => now - s.t <= 120);
    state.currentY = deltaY;
    setTranslateY(deltaY);
  };

  const handleBodyTouchEnd = () => {
    const state = touchDragRef.current;
    if (!state.active) return;

    const deltaY = state.currentY;
    const velocityPxPerSec = computeVelocity(state.samples);
    const projectedEndpoint = deltaY + projectMomentum(velocityPxPerSec);

    touchDragRef.current = {
      active: false,
      insideBody: false,
      startY: null,
      currentY: 0,
      samples: [],
    };
    setIsDragging(false);

    if (
      deltaY > dismissThreshold ||
      projectedEndpoint > 180 ||
      (velocityPxPerSec > 400 && deltaY > 25)
    ) {
      triggerHaptic("medium");
      requestClose();
    } else if (deltaY > 0) {
      triggerHaptic("light");
      setTranslateY(0);
    }
  };

  const isOpenVisual = isEntered && !isClosing;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "시트 대화상자"}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 pt-4 sm:p-4 select-none overscroll-contain"
    >
      {/* Dimmed & Blurred Liquid Glass Backdrop */}
      <div
        className={`fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-[240ms] ease-out motion-reduce:transition-opacity ${
          isOpenVisual
            ? "opacity-100 backdrop-blur-[4px]"
            : "opacity-0 backdrop-blur-none"
        }`}
        style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
        onClick={() => {
          triggerHaptic("light");
          requestClose();
        }}
        aria-hidden="true"
      />

      {/* Sheet Modal Box with Pointer Drag Handle, Strong Curvature & GPU Transitions */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        style={{
          transform:
            isDragging || (translateY !== 0 && !isClosing)
              ? `translate3d(0, ${translateY}px, 0)`
              : undefined,
          transition: isDragging
            ? "none"
            : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), translate 240ms cubic-bezier(0.22, 1, 0.36, 1), scale 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out",
        }}
        className={`relative z-10 w-full sm:max-w-lg max-h-[93dvh] sm:max-h-[86dvh] liquid-glass-elevated rounded-t-[28px] max-sm:rounded-b-none max-sm:border-b-0 sm:rounded-[28px] shadow-2xl border border-[var(--border-control)] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] focus:outline-none motion-reduce:transition-opacity motion-reduce:transform-none motion-reduce:translate-y-0 motion-reduce:scale-100 ${
          isOpenVisual
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-full scale-100 sm:translate-y-4 sm:scale-[0.96]"
        } ${className}`}
      >
        {/* Pill Drag Handle with Pointer Capture for Mobile Intuitive Affordance */}
        <div
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={(e) => handleHeaderPointerEnd(e, false)}
          onPointerCancel={(e) => handleHeaderPointerEnd(e, true)}
          style={{ touchAction: "none" }}
          className="shrink-0 pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing sm:hidden"
        >
          <span
            className="w-11 h-1.5 rounded-full bg-[var(--border-control)] opacity-75 hover:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        </div>

        {/* Sticky Sheet Header (Supports Pointer Drag on Mobile Handle Area) */}
        {(title || description) && (
          <div
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={(e) => handleHeaderPointerEnd(e, false)}
            onPointerCancel={(e) => handleHeaderPointerEnd(e, true)}
            style={{ borderColor: "var(--separator)", touchAction: "pan-x" }}
            className="shrink-0 flex items-start justify-between gap-3 px-5 pt-2 sm:pt-4 pb-3.5 border-b cursor-grab active:cursor-grabbing sm:cursor-default"
          >
            <div className="min-w-0">
              {title && (
                <h3
                  id={titleId}
                  className="text-base font-bold tracking-tight text-base-content"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id={descId}
                  className="text-xs font-medium mt-0.5 leading-snug"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                requestClose();
              }}
              aria-label="닫기"
              className="btn btn-ghost btn-circle btn-sm rounded-2xl pst-press text-base-content shrink-0"
            >
              <IconXMark className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Sheet Body with overscroll-contain */}
        <div
          ref={bodyRef}
          onTouchStart={handleBodyTouchStart}
          onTouchMove={handleBodyTouchMove}
          onTouchEnd={handleBodyTouchEnd}
          onTouchCancel={handleBodyTouchEnd}
          className="p-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain select-text"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
