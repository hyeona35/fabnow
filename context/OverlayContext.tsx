"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  IconBellShield,
  IconCheckCircle,
  IconErrorCircle,
  IconExclamationTriangle,
  IconInfoCircle,
  IconXMark,
} from "@/components/ui/icons";
import { triggerHaptic } from "@/lib/haptics";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  undoLabel?: string;
  onUndo?: () => void;
  durationMs?: number;
}

export interface ModalOptions {
  id?: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  isDirty?: boolean;
  onSaveDraft?: () => void;
  onDiscard?: () => void;
  size?: "sm" | "md" | "lg";
}

export interface AlertDialogOptions {
  title: string;
  description: string;
  actionVerb: string; // Concrete verb required by pstui (e.g. '삭제', '변환', '지우기') - never '확인' or '예'
  cancelLabel?: string; // Always defaults to '취소'
  isDestructive?: boolean;
  onAction: () => void | Promise<void>;
}

export interface PrePermissionModalOptions {
  title: string;
  description: string;
  featurePurpose: string;
  buttonLabel?: "계속" | "다음"; // Strictly '계속' or '다음' per pstui Pre-Alert rule
  onContinue: () => void | Promise<void>;
}

interface OverlayContextValue {
  activeModal: ModalOptions | null;
  isModalDirty: boolean;
  showDirtyGuardSheet: boolean;
  urgentAlert: AlertDialogOptions | null;
  prePermissionModal: PrePermissionModalOptions | null;
  toasts: ToastItem[];
  openModal: (options: ModalOptions) => void;
  closeModal: (force?: boolean) => void;
  setModalDirty: (dirty: boolean) => void;
  openAlertDialog: (options: AlertDialogOptions) => void;
  closeAlertDialog: () => void;
  openPrePermissionModal: (options: PrePermissionModalOptions) => void;
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

interface PointerSample {
  y: number;
  t: number;
}

const SHEET_CLOSE_DURATION_MS = 240;
const APPLE_DECELERATION_RATE = 0.998;

/** Apple WWDC Designing Fluid Interfaces exponential momentum projection (px). */
function projectMomentum(velocityPxPerSec: number): number {
  return (
    ((velocityPxPerSec / 1000) * APPLE_DECELERATION_RATE) /
    (1 - APPLE_DECELERATION_RATE)
  );
}

/** Apple WWDC soft rubber-banding boundary resistance. */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return ctx;
}

export function useModal() {
  const {
    activeModal,
    isModalDirty,
    showDirtyGuardSheet,
    urgentAlert,
    prePermissionModal,
    openModal,
    closeModal,
    setModalDirty,
    openAlertDialog,
    closeAlertDialog,
    openPrePermissionModal,
  } = useOverlay();

  return {
    activeModal,
    isModalDirty,
    showDirtyGuardSheet,
    urgentAlert,
    prePermissionModal,
    openModal,
    closeModal,
    setModalDirty,
    openAlertDialog,
    closeAlertDialog,
    openPrePermissionModal,
  };
}

export function useToast() {
  const { toasts, showToast, dismissToast } = useOverlay();
  return { toasts, showToast, dismissToast };
}

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  // Primary Sheet Modal state
  const [activeModal, setActiveModal] = useState<ModalOptions | null>(null);
  const [isModalEntered, setIsModalEntered] = useState<boolean>(false);
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);
  const [isModalDirty, setIsModalDirty] = useState<boolean>(false);
  const [modalDragY, setModalDragY] = useState<number>(0);
  const [isDraggingModal, setIsDraggingModal] = useState<boolean>(false);

  // Dirty Guard Sheet state
  const [showDirtyGuardSheet, setShowDirtyGuardSheet] = useState<boolean>(false);
  const [isDirtyGuardEntered, setIsDirtyGuardEntered] = useState<boolean>(false);
  const [isDirtyGuardClosing, setIsDirtyGuardClosing] = useState<boolean>(false);

  // Urgent AlertDialog state
  const [urgentAlert, setUrgentAlert] = useState<AlertDialogOptions | null>(null);
  const [isAlertEntered, setIsAlertEntered] = useState<boolean>(false);
  const [isAlertClosing, setIsAlertClosing] = useState<boolean>(false);
  const [isAlertSubmitting, setIsAlertSubmitting] = useState<boolean>(false);

  // Pre-Permission Modal state
  const [prePermissionModal, setPrePermissionModal] =
    useState<PrePermissionModalOptions | null>(null);
  const [isPrePermEntered, setIsPrePermEntered] = useState<boolean>(false);
  const [isPrePermClosing, setIsPrePermClosing] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Native <dialog> & panel refs
  const primaryDialogRef = useRef<HTMLDialogElement | null>(null);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);
  const dirtySheetRef = useRef<HTMLDivElement | null>(null);
  const urgentDialogRef = useRef<HTMLDialogElement | null>(null);
  const urgentAlertRef = useRef<HTMLDivElement | null>(null);
  const prePermDialogRef = useRef<HTMLDialogElement | null>(null);
  const prePermissionRef = useRef<HTMLDivElement | null>(null);

  // Focus restoration refs (per overlay layer so stacked AlertDialogs return focus cleanly)
  const primaryReturnFocusRef = useRef<HTMLElement | null>(null);
  const dirtyReturnFocusRef = useRef<HTMLElement | null>(null);
  const alertReturnFocusRef = useRef<HTMLElement | null>(null);
  const prePermReturnFocusRef = useRef<HTMLElement | null>(null);

  // Lifecycle & timer refs (prevent stale closures and overlapping transitions)
  const activeModalRef = useRef<ModalOptions | null>(null);
  const isModalDirtyRef = useRef<boolean>(false);
  const isModalClosingRef = useRef<boolean>(false);
  const modalCloseTimerRef = useRef<number | null>(null);

  const showDirtyGuardRef = useRef<boolean>(false);
  const isDirtyGuardClosingRef = useRef<boolean>(false);
  const dirtyCloseTimerRef = useRef<number | null>(null);

  const urgentAlertRefState = useRef<AlertDialogOptions | null>(null);
  const isAlertClosingRef = useRef<boolean>(false);
  const alertCloseTimerRef = useRef<number | null>(null);

  const prePermRefState = useRef<PrePermissionModalOptions | null>(null);
  const isPrePermClosingRef = useRef<boolean>(false);
  const prePermCloseTimerRef = useRef<number | null>(null);

  // Pointer drag state for mobile primary sheet handle
  const dragRef = useRef<{
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

  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  useEffect(() => {
    isModalDirtyRef.current = isModalDirty;
  }, [isModalDirty]);

  useEffect(() => {
    showDirtyGuardRef.current = showDirtyGuardSheet;
  }, [showDirtyGuardSheet]);

  useEffect(() => {
    urgentAlertRefState.current = urgentAlert;
  }, [urgentAlert]);

  useEffect(() => {
    prePermRefState.current = prePermissionModal;
  }, [prePermissionModal]);

  // Cleanup timers on provider unmount
  useEffect(() => {
    return () => {
      if (modalCloseTimerRef.current !== null) {
        window.clearTimeout(modalCloseTimerRef.current);
      }
      if (dirtyCloseTimerRef.current !== null) {
        window.clearTimeout(dirtyCloseTimerRef.current);
      }
      if (alertCloseTimerRef.current !== null) {
        window.clearTimeout(alertCloseTimerRef.current);
      }
      if (prePermCloseTimerRef.current !== null) {
        window.clearTimeout(prePermCloseTimerRef.current);
      }
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.durationMs ?? 4500;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast]
  );

  const openDirtyGuardSheet = useCallback(() => {
    if (dirtyCloseTimerRef.current !== null) {
      window.clearTimeout(dirtyCloseTimerRef.current);
      dirtyCloseTimerRef.current = null;
    }
    if (
      document.activeElement instanceof HTMLElement &&
      modalBoxRef.current?.contains(document.activeElement)
    ) {
      dirtyReturnFocusRef.current = document.activeElement;
    }
    isDirtyGuardClosingRef.current = false;
    showDirtyGuardRef.current = true;
    setIsDirtyGuardClosing(false);
    setIsDirtyGuardEntered(false);
    setShowDirtyGuardSheet(true);
  }, []);

  const closeDirtyGuardSheet = useCallback(() => {
    if (!showDirtyGuardRef.current || isDirtyGuardClosingRef.current) return;
    isDirtyGuardClosingRef.current = true;
    setIsDirtyGuardClosing(true);

    if (dirtyCloseTimerRef.current !== null) {
      window.clearTimeout(dirtyCloseTimerRef.current);
    }
    dirtyCloseTimerRef.current = window.setTimeout(() => {
      dirtyCloseTimerRef.current = null;
      isDirtyGuardClosingRef.current = false;
      showDirtyGuardRef.current = false;
      setShowDirtyGuardSheet(false);
      setIsDirtyGuardClosing(false);
      setIsDirtyGuardEntered(false);

      const returnEl = dirtyReturnFocusRef.current;
      dirtyReturnFocusRef.current = null;
      if (returnEl && returnEl.isConnected && modalBoxRef.current?.contains(returnEl)) {
        returnEl.focus();
      } else {
        modalBoxRef.current?.focus();
      }
    }, SHEET_CLOSE_DURATION_MS);
  }, []);

  const openModal = useCallback((options: ModalOptions) => {
    if (modalCloseTimerRef.current !== null) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    if (dirtyCloseTimerRef.current !== null) {
      window.clearTimeout(dirtyCloseTimerRef.current);
      dirtyCloseTimerRef.current = null;
    }
    if (prePermCloseTimerRef.current !== null) {
      window.clearTimeout(prePermCloseTimerRef.current);
      prePermCloseTimerRef.current = null;
    }
    if (prePermDialogRef.current?.open) {
      prePermDialogRef.current.close();
    }
    isPrePermClosingRef.current = false;
    prePermRefState.current = null;
    setPrePermissionModal(null);
    setIsPrePermClosing(false);
    setIsPrePermEntered(false);

    if (
      !activeModalRef.current &&
      !primaryReturnFocusRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      primaryReturnFocusRef.current = document.activeElement;
    }

    const isReplacingOpenModal =
      Boolean(activeModalRef.current) && !isModalClosingRef.current;

    isModalClosingRef.current = false;
    isDirtyGuardClosingRef.current = false;
    showDirtyGuardRef.current = false;
    isModalDirtyRef.current = Boolean(options.isDirty);
    activeModalRef.current = options;

    setShowDirtyGuardSheet(false);
    setIsDirtyGuardClosing(false);
    setIsDirtyGuardEntered(false);
    setIsModalDirty(Boolean(options.isDirty));
    setIsModalClosing(false);
    setModalDragY(0);
    setIsDraggingModal(false);
    if (!isReplacingOpenModal) {
      setIsModalEntered(false);
    }
    setActiveModal(options);
  }, []);

  const closeModal = useCallback(
    (force = false) => {
      if (!activeModalRef.current) return;
      if (!force && isModalDirtyRef.current) {
        openDirtyGuardSheet();
        return;
      }
      if (isModalClosingRef.current) return;

      isModalClosingRef.current = true;
      setIsModalClosing(true);
      setIsDraggingModal(false);
      if (showDirtyGuardRef.current) {
        isDirtyGuardClosingRef.current = true;
        setIsDirtyGuardClosing(true);
      }

      if (modalCloseTimerRef.current !== null) {
        window.clearTimeout(modalCloseTimerRef.current);
      }
      modalCloseTimerRef.current = window.setTimeout(() => {
        modalCloseTimerRef.current = null;
        if (primaryDialogRef.current?.open) {
          primaryDialogRef.current.close();
        }
        isModalClosingRef.current = false;
        isDirtyGuardClosingRef.current = false;
        showDirtyGuardRef.current = false;
        isModalDirtyRef.current = false;
        activeModalRef.current = null;
        dirtyReturnFocusRef.current = null;

        setShowDirtyGuardSheet(false);
        setIsDirtyGuardClosing(false);
        setIsDirtyGuardEntered(false);
        setIsModalDirty(false);
        setIsModalClosing(false);
        setIsModalEntered(false);
        setModalDragY(0);
        setActiveModal(null);

        const prevEl = primaryReturnFocusRef.current;
        primaryReturnFocusRef.current = null;
        if (prevEl && prevEl.isConnected) {
          prevEl.focus();
        }
      }, SHEET_CLOSE_DURATION_MS);
    },
    [openDirtyGuardSheet]
  );

  const setModalDirty = useCallback((dirty: boolean) => {
    isModalDirtyRef.current = dirty;
    setIsModalDirty(dirty);
  }, []);

  const openAlertDialog = useCallback((options: AlertDialogOptions) => {
    if (alertCloseTimerRef.current !== null) {
      window.clearTimeout(alertCloseTimerRef.current);
      alertCloseTimerRef.current = null;
    }
    if (
      !urgentAlertRefState.current &&
      !alertReturnFocusRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      alertReturnFocusRef.current = document.activeElement;
    }

    const sanitizedVerb =
      options.actionVerb === "확인" ||
      options.actionVerb.toLowerCase() === "ok" ||
      options.actionVerb === "예" ||
      options.actionVerb.toLowerCase() === "yes"
        ? "실행"
        : options.actionVerb;

    const nextAlert: AlertDialogOptions = {
      ...options,
      actionVerb: sanitizedVerb,
      cancelLabel: "취소",
    };

    const isReplacing =
      Boolean(urgentAlertRefState.current) && !isAlertClosingRef.current;
    isAlertClosingRef.current = false;
    urgentAlertRefState.current = nextAlert;

    setIsAlertSubmitting(false);
    setIsAlertClosing(false);
    if (!isReplacing) {
      setIsAlertEntered(false);
    }
    setUrgentAlert(nextAlert);
  }, []);

  const closeAlertDialog = useCallback(() => {
    if (!urgentAlertRefState.current || isAlertClosingRef.current) return;
    isAlertClosingRef.current = true;
    setIsAlertClosing(true);

    if (alertCloseTimerRef.current !== null) {
      window.clearTimeout(alertCloseTimerRef.current);
    }
    alertCloseTimerRef.current = window.setTimeout(() => {
      alertCloseTimerRef.current = null;
      if (urgentDialogRef.current?.open) {
        urgentDialogRef.current.close();
      }
      isAlertClosingRef.current = false;
      urgentAlertRefState.current = null;
      setIsAlertSubmitting(false);
      setIsAlertClosing(false);
      setIsAlertEntered(false);
      setUrgentAlert(null);

      const prevEl = alertReturnFocusRef.current;
      alertReturnFocusRef.current = null;
      if (prevEl && prevEl.isConnected) {
        prevEl.focus();
      }
    }, SHEET_CLOSE_DURATION_MS);
  }, []);

  const openPrePermissionModal = useCallback((options: PrePermissionModalOptions) => {
    if (prePermCloseTimerRef.current !== null) {
      window.clearTimeout(prePermCloseTimerRef.current);
      prePermCloseTimerRef.current = null;
    }
    if (modalCloseTimerRef.current !== null) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    if (primaryDialogRef.current?.open) {
      primaryDialogRef.current.close();
    }
    isModalClosingRef.current = false;
    isDirtyGuardClosingRef.current = false;
    showDirtyGuardRef.current = false;
    isModalDirtyRef.current = false;
    activeModalRef.current = null;
    setActiveModal(null);
    setShowDirtyGuardSheet(false);
    setIsDirtyGuardClosing(false);
    setIsDirtyGuardEntered(false);
    setIsModalDirty(false);
    setIsModalClosing(false);
    setIsModalEntered(false);

    if (
      !prePermRefState.current &&
      !prePermReturnFocusRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      prePermReturnFocusRef.current = document.activeElement;
    }

    const nextPrePerm: PrePermissionModalOptions = {
      ...options,
      buttonLabel: options.buttonLabel === "다음" ? "다음" : "계속",
    };

    isPrePermClosingRef.current = false;
    prePermRefState.current = nextPrePerm;
    setIsPrePermClosing(false);
    setIsPrePermEntered(false);
    setPrePermissionModal(nextPrePerm);
  }, []);

  const closePrePermissionModal = useCallback(() => {
    if (!prePermRefState.current || isPrePermClosingRef.current) return;
    isPrePermClosingRef.current = true;
    setIsPrePermClosing(true);

    if (prePermCloseTimerRef.current !== null) {
      window.clearTimeout(prePermCloseTimerRef.current);
    }
    prePermCloseTimerRef.current = window.setTimeout(() => {
      prePermCloseTimerRef.current = null;
      if (prePermDialogRef.current?.open) {
        prePermDialogRef.current.close();
      }
      isPrePermClosingRef.current = false;
      prePermRefState.current = null;
      setIsPrePermClosing(false);
      setIsPrePermEntered(false);
      setPrePermissionModal(null);

      const prevEl = prePermReturnFocusRef.current;
      prePermReturnFocusRef.current = null;
      if (prevEl && prevEl.isConnected) {
        prevEl.focus();
      }
    }, SHEET_CLOSE_DURATION_MS);
  }, []);

  // Native <dialog> .showModal() + GPU enter transition for Primary Modal
  useEffect(() => {
    if (!activeModal) return;
    const dialog = primaryDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    let nestedRaf = 0;
    const raf = window.requestAnimationFrame(() => {
      nestedRaf = window.requestAnimationFrame(() => {
        setIsModalEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (nestedRaf) {
        window.cancelAnimationFrame(nestedRaf);
      }
    };
  }, [activeModal]);

  // GPU enter transition for Dirty Guard Sheet
  useEffect(() => {
    if (!showDirtyGuardSheet) return;
    let nestedRaf = 0;
    const raf = window.requestAnimationFrame(() => {
      nestedRaf = window.requestAnimationFrame(() => {
        setIsDirtyGuardEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (nestedRaf) {
        window.cancelAnimationFrame(nestedRaf);
      }
    };
  }, [showDirtyGuardSheet]);

  // Native <dialog> .showModal() + GPU enter transition for Urgent AlertDialog
  useEffect(() => {
    if (!urgentAlert) return;
    const dialog = urgentDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    let nestedRaf = 0;
    const raf = window.requestAnimationFrame(() => {
      nestedRaf = window.requestAnimationFrame(() => {
        setIsAlertEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (nestedRaf) {
        window.cancelAnimationFrame(nestedRaf);
      }
    };
  }, [urgentAlert]);

  // Native <dialog> .showModal() + GPU enter transition for PrePermission Modal
  useEffect(() => {
    if (!prePermissionModal) return;
    const dialog = prePermDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    let nestedRaf = 0;
    const raf = window.requestAnimationFrame(() => {
      nestedRaf = window.requestAnimationFrame(() => {
        setIsPrePermEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (nestedRaf) {
        window.cancelAnimationFrame(nestedRaf);
      }
    };
  }, [prePermissionModal]);

  // Keyboard Focus Trap, Initial Focus & Escape Handling (Zero body overflow mutation!)
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      activeModal || urgentAlert || prePermissionModal
    );
    if (!isAnyModalOpen) return;

    const getTopmostContainer = (): HTMLElement | null => {
      if (urgentAlert && !isAlertClosing) return urgentAlertRef.current;
      if (showDirtyGuardSheet && !isDirtyGuardClosing) return dirtySheetRef.current;
      if (prePermissionModal && !isPrePermClosing) return prePermissionRef.current;
      if (activeModal && !isModalClosing) return modalBoxRef.current;
      return null;
    };

    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
      const nodes = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(nodes).filter((el) => !el.closest("[inert]"));
    };

    const focusTimer = window.setTimeout(() => {
      const container = getTopmostContainer();
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Prevent Chrome CloseWatcher from force-closing native <dialog> before animations / Dirty Guard
        event.preventDefault();
        if (urgentAlertRefState.current && !isAlertClosingRef.current) {
          closeAlertDialog();
          return;
        }
        if (showDirtyGuardRef.current && !isDirtyGuardClosingRef.current) {
          closeDirtyGuardSheet();
          return;
        }
        if (activeModalRef.current && !isModalClosingRef.current) {
          closeModal(false);
          return;
        }
      }

      if (event.key === "Tab") {
        const container = getTopmostContainer();
        if (!container) return;
        const focusable = getFocusableElements(container);
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;

        if (!activeEl || !container.contains(activeEl)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }

        if (event.shiftKey && activeEl === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeEl === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeModal,
    isModalClosing,
    urgentAlert,
    isAlertClosing,
    prePermissionModal,
    isPrePermClosing,
    showDirtyGuardSheet,
    isDirtyGuardClosing,
    closeModal,
    closeAlertDialog,
    closeDirtyGuardSheet,
  ]);

  // Mobile Primary Sheet Pointer Events drag-down with Apple momentum projection
  const startModalDrag = (e: React.PointerEvent<HTMLElement>, onlyMobileHeader = false) => {
    if (showDirtyGuardRef.current || isModalClosingRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) return;
    if (onlyMobileHeader && typeof window !== "undefined" && window.innerWidth >= 640) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }

    const now = performance.now();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      currentY: 0,
      samples: [{ y: e.clientY, t: now }],
    };
    setIsDraggingModal(true);
  };

  const moveModalDrag = (e: React.PointerEvent<HTMLElement>) => {
    const state = dragRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const now = performance.now();
    const deltaY = e.clientY - state.startY;
    state.samples.push({ y: e.clientY, t: now });
    // Keep only recent ~120ms samples for accurate release velocity
    state.samples = state.samples.filter((s) => now - s.t <= 120);

    if (deltaY < 0) {
      const dimension = modalBoxRef.current?.clientHeight || 420;
      const resisted = -rubberband(-deltaY, dimension);
      state.currentY = resisted;
      setModalDragY(resisted);
    } else {
      state.currentY = deltaY;
      setModalDragY(deltaY);
    }
  };

  const endModalDrag = (e: React.PointerEvent<HTMLElement>, cancelled = false) => {
    const state = dragRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    const now = performance.now();
    const recent = state.samples.filter((s) => now - s.t <= 120);
    let velocityPxPerSec = 0;
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = Math.max(1, last.t - first.t);
      velocityPxPerSec = ((last.y - first.y) / dt) * 1000;
    }

    const deltaY = state.currentY;
    const projectedEndpoint = deltaY + projectMomentum(velocityPxPerSec);

    dragRef.current = {
      active: false,
      pointerId: null,
      startY: 0,
      currentY: 0,
      samples: [],
    };
    setIsDraggingModal(false);

    const shouldDismiss =
      !cancelled &&
      (deltaY > 96 ||
        projectedEndpoint > 180 ||
        (velocityPxPerSec > 450 && deltaY > 24));

    if (shouldDismiss) {
      if (isModalDirtyRef.current) {
        triggerHaptic("light");
        setModalDragY(0);
        closeModal(false);
      } else {
        triggerHaptic("medium");
        closeModal(true);
      }
    } else {
      if (Math.abs(deltaY) > 6) {
        triggerHaptic("light");
      }
      setModalDragY(0);
    }
  };

  const handleDiscardDirty = () => {
    activeModal?.onDiscard?.();
    closeModal(true);
    showToast({
      title: "편집 내용이 삭제되었습니다",
      variant: "info",
    });
  };

  const handleSaveDraftDirty = () => {
    activeModal?.onSaveDraft?.();
    closeModal(true);
    showToast({
      title: "초안이 임시 저장되었습니다",
      description: "언제든지 이어서 작성할 수 있습니다.",
      variant: "success",
    });
  };

  const handleContinueEditing = () => {
    closeDirtyGuardSheet();
  };

  const handleAlertAction = async () => {
    if (!urgentAlert) return;
    try {
      setIsAlertSubmitting(true);
      await urgentAlert.onAction();
      closeAlertDialog();
    } finally {
      setIsAlertSubmitting(false);
    }
  };

  const isModalOpenVisual = isModalEntered && !isModalClosing;
  const isDirtyOpenVisual = isDirtyGuardEntered && !isDirtyGuardClosing;
  const isAlertOpenVisual = isAlertEntered && !isAlertClosing;
  const isPrePermOpenVisual = isPrePermEntered && !isPrePermClosing;

  return (
    <OverlayContext.Provider
      value={{
        activeModal,
        isModalDirty,
        showDirtyGuardSheet,
        urgentAlert,
        prePermissionModal,
        toasts,
        openModal,
        closeModal,
        setModalDirty,
        openAlertDialog,
        closeAlertDialog,
        openPrePermissionModal,
        showToast,
        dismissToast,
      }}
    >
      {children}

      {/* 1. Primary Native <dialog> Sheet UI with Smooth Enter/Exit & Mobile Drag-to-Dismiss */}
      {activeModal && (
        <dialog
          ref={primaryDialogRef}
          aria-labelledby="pst-modal-title"
          aria-describedby={activeModal.description ? "pst-modal-desc" : undefined}
          onCancel={(e) => {
            e.preventDefault();
            if (showDirtyGuardRef.current && !isDirtyGuardClosingRef.current) {
              closeDirtyGuardSheet();
            } else {
              closeModal(false);
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (showDirtyGuardRef.current && !isDirtyGuardClosingRef.current) {
                closeDirtyGuardSheet();
              } else {
                closeModal(false);
              }
            }
          }}
          className="fixed inset-0 m-0 p-0 sm:p-4 w-full h-full max-w-none max-h-none bg-transparent border-0 outline-none overflow-hidden overscroll-contain hidden [&[open]]:flex items-end sm:items-center justify-center z-40 [&::backdrop]:bg-transparent"
        >
          {/* Dimmed & Blurred Backdrop Scrim cleanly outside .modal-box */}
          <div
            onClick={() => {
              if (showDirtyGuardRef.current && !isDirtyGuardClosingRef.current) {
                closeDirtyGuardSheet();
              } else {
                closeModal(false);
              }
            }}
            aria-hidden="true"
            style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
            className={`fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-[240ms] ease-out motion-reduce:transition-opacity ${
              isModalOpenVisual
                ? "opacity-100 backdrop-blur-[4px]"
                : "opacity-0 backdrop-blur-none"
            }`}
          />

          <div
            ref={modalBoxRef}
            tabIndex={-1}
            style={{
              transform:
                isDraggingModal || (modalDragY !== 0 && !isModalClosing)
                  ? `translate3d(0, ${modalDragY}px, 0)`
                  : undefined,
              transition: isDraggingModal
                ? "none"
                : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out",
            }}
            className={`modal-box relative z-10 w-full! max-sm:max-w-none! ${
              activeModal.size === "sm"
                ? "sm:max-w-md!"
                : activeModal.size === "lg"
                ? "sm:max-w-2xl!"
                : "sm:max-w-lg!"
            } max-h-[93dvh]! sm:max-h-[86dvh]! p-0! m-0! pb-[env(safe-area-inset-bottom,0px)]! liquid-glass-elevated rounded-t-[28px]! sm:rounded-[28px]! shadow-2xl border border-[var(--border-control)] flex flex-col overflow-hidden! focus:outline-none motion-reduce:transition-opacity motion-reduce:transform-none! ${
              isModalOpenVisual
                ? "opacity-100 translate-y-0 sm:scale-100"
                : "opacity-0 translate-y-full sm:translate-y-4 sm:scale-[0.96]"
            }`}
          >
            {/* Mobile Drag Handle Bar (< 640px) */}
            <div
              onPointerDown={(e) => startModalDrag(e, false)}
              onPointerMove={moveModalDrag}
              onPointerUp={(e) => endModalDrag(e, false)}
              onPointerCancel={(e) => endModalDrag(e, true)}
              style={{ touchAction: "none" }}
              className="sm:hidden shrink-0 pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing select-none"
            >
              <span
                className="w-11 h-1.5 rounded-full bg-[var(--border-control)] opacity-75 transition-opacity"
                aria-hidden="true"
              />
            </div>

            {/* Sticky Sheet Header */}
            <div
              inert={showDirtyGuardSheet || undefined}
              onPointerDown={(e) => startModalDrag(e, true)}
              onPointerMove={moveModalDrag}
              onPointerUp={(e) => endModalDrag(e, false)}
              onPointerCancel={(e) => endModalDrag(e, true)}
              className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-2 sm:pt-5 pb-3.5 border-b"
              style={{ borderColor: "var(--separator)" }}
            >
              <div className="min-w-0">
                <h3
                  id="pst-modal-title"
                  className="text-lg font-bold tracking-tight text-base-content"
                >
                  {activeModal.title}
                </h3>
                {activeModal.description && (
                  <p
                    id="pst-modal-desc"
                    className="text-sm font-medium mt-0.5 leading-snug"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {activeModal.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => closeModal(false)}
                aria-label="모달 닫기"
                className="btn btn-ghost btn-circle btn-sm rounded-2xl pst-press text-base-content shrink-0"
              >
                <IconXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Internal Scrollable Body */}
            <div
              inert={showDirtyGuardSheet || undefined}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4"
            >
              {activeModal.content}
            </div>

            {/* Optional Sticky Sheet Footer */}
            {activeModal.footer && (
              <div
                inert={showDirtyGuardSheet || undefined}
                className="shrink-0 px-5 sm:px-6 py-3.5 border-t"
                style={{ borderColor: "var(--separator)" }}
              >
                {activeModal.footer}
              </div>
            )}

            {/* Dirty State Action Sheet Guard (Animated Enter/Exit inside Top Layer) */}
            {showDirtyGuardSheet && (
              <div
                ref={dirtySheetRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="dirty-sheet-title"
                tabIndex={-1}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    closeDirtyGuardSheet();
                  }
                }}
                style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
                className={`inset-0 absolute z-50 flex flex-col justify-end p-4 sm:p-5 overscroll-contain focus:outline-none transition-[opacity,backdrop-filter] duration-[240ms] ease-out motion-reduce:transition-opacity ${
                  isDirtyOpenVisual
                    ? "opacity-100 backdrop-blur-[3px]"
                    : "opacity-0 backdrop-blur-none"
                }`}
              >
                <div
                  className={`liquid-glass-elevated rounded-[24px] border border-[var(--border-control)] p-4 sm:p-5 space-y-3 shadow-2xl transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none ${
                    isDirtyOpenVisual
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-6 scale-[0.98]"
                  }`}
                >
                  <div
                    className="text-center pb-2.5 border-b"
                    style={{ borderColor: "var(--separator)" }}
                  >
                    <p
                      id="dirty-sheet-title"
                      className="text-sm font-bold text-base-content"
                    >
                      저장하지 않은 변경 사항이 있습니다
                    </p>
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      지금 닫으면 입력 중인 데이터를 잃게 됩니다.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleDiscardDirty}
                      className="btn btn-error text-error-content w-full rounded-2xl pst-press font-semibold"
                    >
                      편집 내용 삭제
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraftDirty}
                      className="btn btn-primary text-primary-content w-full rounded-2xl pst-press font-semibold"
                    >
                      임시 저장
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueEditing}
                      className="btn btn-ghost w-full rounded-2xl border border-[var(--border-control)] pst-press font-semibold text-base-content"
                    >
                      계속 편집
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </dialog>
      )}

      {/* 2. Single Allowed Urgent AlertDialog Exception (Native Top Layer above activeModal) */}
      {urgentAlert && (
        <dialog
          ref={urgentDialogRef}
          role="alertdialog"
          aria-labelledby="urgent-alert-title"
          aria-describedby="urgent-alert-desc"
          onCancel={(e) => {
            e.preventDefault();
            closeAlertDialog();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAlertDialog();
            }
          }}
          className="fixed inset-0 m-0 p-4 w-full h-full max-w-none max-h-none bg-transparent border-0 outline-none overflow-hidden overscroll-contain hidden [&[open]]:flex items-center justify-center z-50 [&::backdrop]:bg-transparent"
        >
          <div
            onClick={closeAlertDialog}
            aria-hidden="true"
            style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
            className={`fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-[240ms] ease-out motion-reduce:transition-opacity ${
              isAlertOpenVisual
                ? "opacity-100 backdrop-blur-[4px]"
                : "opacity-0 backdrop-blur-none"
            }`}
          />
          <div
            ref={urgentAlertRef}
            tabIndex={-1}
            className={`modal-box relative z-10 w-full! max-w-sm! m-0! p-6! liquid-glass-elevated rounded-[28px]! shadow-2xl border border-[var(--border-control)] text-center focus:outline-none transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none! ${
              isAlertOpenVisual
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-3 scale-[0.96]"
            }`}
          >
            <div
              className={`mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full ${
                urgentAlert.isDestructive
                  ? "bg-error/15 text-status-error"
                  : "bg-primary/14 text-accent-primary"
              }`}
            >
              {urgentAlert.isDestructive ? (
                <IconExclamationTriangle className="w-6 h-6" />
              ) : (
                <IconInfoCircle className="w-6 h-6" />
              )}
            </div>
            <h3
              id="urgent-alert-title"
              className="text-lg font-bold text-base-content"
            >
              {urgentAlert.title}
            </h3>
            <p
              id="urgent-alert-desc"
              className="text-sm font-medium mt-2 leading-relaxed"
              style={{ color: "var(--label-secondary)" }}
            >
              {urgentAlert.description}
            </p>

            {/* pstui Principle: Cancel ('취소') on Left (or bottom of stack), Concrete Verb Action on Right (or top of stack) */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={closeAlertDialog}
                className="btn btn-ghost flex-1 rounded-2xl border border-[var(--border-control)] pst-press font-semibold text-base-content"
              >
                {urgentAlert.cancelLabel ?? "취소"}
              </button>
              <button
                type="button"
                disabled={isAlertSubmitting}
                onClick={handleAlertAction}
                className={`btn flex-1 rounded-2xl pst-press font-semibold ${
                  urgentAlert.isDestructive
                    ? "btn-error text-error-content"
                    : "btn-primary text-primary-content"
                }`}
              >
                {isAlertSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                      />
                    </svg>
                    {`${urgentAlert.actionVerb} 중…`}
                  </span>
                ) : (
                  urgentAlert.actionVerb
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* 3. Pre-Permission Screen (Single '계속' or '다음' button, no close/cancel, no dark patterns) */}
      {prePermissionModal && (
        <dialog
          ref={prePermDialogRef}
          aria-labelledby="pre-permission-title"
          onCancel={(e) => {
            e.preventDefault();
          }}
          className="fixed inset-0 m-0 p-4 w-full h-full max-w-none max-h-none bg-transparent border-0 outline-none overflow-hidden overscroll-contain hidden [&[open]]:flex items-center justify-center z-50 [&::backdrop]:bg-transparent"
        >
          <div
            aria-hidden="true"
            style={{ backgroundColor: "var(--liquid-glass-dimming)" }}
            className={`fixed inset-0 overscroll-contain transition-[opacity,backdrop-filter] duration-[240ms] ease-out motion-reduce:transition-opacity ${
              isPrePermOpenVisual
                ? "opacity-100 backdrop-blur-[4px]"
                : "opacity-0 backdrop-blur-none"
            }`}
          />
          <div
            ref={prePermissionRef}
            tabIndex={-1}
            className={`modal-box relative z-10 w-full! max-w-md! m-0! p-6! liquid-glass-elevated rounded-[28px]! shadow-2xl border border-[var(--border-control)] text-center focus:outline-none transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:transform-none! ${
              isPrePermOpenVisual
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-3 scale-[0.96]"
            }`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/14 text-accent-primary border border-primary/35">
              <IconBellShield className="w-7 h-7" />
            </div>
            <h3
              id="pre-permission-title"
              className="text-xl font-bold text-base-content"
            >
              {prePermissionModal.title}
            </h3>
            <p
              className="text-sm font-medium mt-2 leading-relaxed"
              style={{ color: "var(--label-secondary)" }}
            >
              {prePermissionModal.description}
            </p>
            <div className="mt-4 rounded-[20px] material-regular p-3.5 text-start text-xs leading-relaxed">
              <span className="font-bold text-base-content">활용 목적: </span>
              <span
                className="font-medium"
                style={{ color: "var(--label-secondary)" }}
              >
                {prePermissionModal.featurePurpose}
              </span>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={async () => {
                  const action = prePermissionModal.onContinue;
                  closePrePermissionModal();
                  await action();
                }}
                className="btn btn-primary text-primary-content w-full rounded-2xl pst-press font-semibold"
              >
                {prePermissionModal.buttonLabel ?? "계속"}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* 4. Floating Bottom Toast Container (Liquid Glass Notification Bubbles with Undo Support) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="toast toast-center toast-bottom z-50 w-full max-w-md px-4 pointer-events-none"
        style={{
          bottom:
            "calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto liquid-glass-elevated rounded-[20px] border border-[var(--border-control)] px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 ease-out"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Non-color vector status icon for accessibility */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  t.variant === "success"
                    ? "bg-success/15 text-status-success"
                    : t.variant === "warning"
                    ? "bg-warning/15 text-status-warning"
                    : t.variant === "error"
                    ? "bg-error/15 text-status-error"
                    : "bg-info/15 text-status-info"
                }`}
                aria-hidden="true"
              >
                {t.variant === "success" ? (
                  <IconCheckCircle className="w-5 h-5" />
                ) : t.variant === "warning" ? (
                  <IconExclamationTriangle className="w-5 h-5" />
                ) : t.variant === "error" ? (
                  <IconErrorCircle className="w-5 h-5" />
                ) : (
                  <IconInfoCircle className="w-5 h-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-base-content truncate">
                  {t.title}
                </p>
                {t.description && (
                  <p
                    className="text-xs font-medium line-clamp-2 break-keep"
                    style={{ color: "var(--label-secondary)" }}
                  >
                    {t.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {t.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    t.onUndo?.();
                    dismissToast(t.id);
                  }}
                  className="btn btn-xs btn-primary text-primary-content rounded-xl pst-press px-3 font-semibold"
                >
                  {t.undoLabel ?? "실행 취소"}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="알림 닫기"
                className="btn btn-ghost btn-circle btn-xs rounded-xl pst-press text-base-content"
              >
                <IconXMark className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </OverlayContext.Provider>
  );
}
