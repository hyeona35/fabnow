"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithInstall extends Navigator {
  install?: () => Promise<void>;
  standalone?: boolean;
}

export interface PwaInstallState {
  canInstall: boolean;
  isStandalone: boolean;
  isInstalling: boolean;
  installStatus: string | null;
  promptInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallState>({
  canInstall: false,
  isStandalone: false,
  isInstalling: false,
  installStatus: null,
  promptInstall: async () => {},
});

export function usePwaInstall(): PwaInstallState {
  return useContext(PwaInstallContext);
}

const emptySubscribe = () => () => {};
const getServerFalse = () => false;

function subscribeStandalone(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia?.("(display-mode: standalone)");
  media?.addEventListener?.("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    media?.removeEventListener?.("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithInstall;
  const media = window.matchMedia?.("(display-mode: standalone)");
  return Boolean(media?.matches || nav.standalone === true);
}

function getWebInstallSupportSnapshot(): boolean {
  return (
    typeof Navigator !== "undefined" &&
    typeof (Navigator.prototype as NavigatorWithInstall).install === "function"
  );
}

/**
 * ClientRuntimeProvider
 * Handles:
 * 1. Automatic stale Next.js chunk 404 error recovery (reload with safety guard)
 * 2. Service Worker registration & clean update activation for PWA offline support
 * 3. Progressive Web Install state (navigator.install() + beforeinstallprompt fallback)
 */
export function ClientRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supportsWebInstall = useSyncExternalStore(
    emptySubscribe,
    getWebInstallSupportSnapshot,
    getServerFalse
  );
  const standaloneDisplay = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerFalse
  );
  const [installedDuringSession, setInstalledDuringSession] = useState(false);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const isStandalone = standaloneDisplay || installedDuringSession;

  useEffect(() => {
    // 1. Stale Chunk 404 Mitigation for SPA Long Sessions
    const isChunkError = (err: unknown): boolean => {
      if (!err) return false;
      const str = String(err);
      return (
        str.includes("ChunkLoadError") ||
        str.includes("Loading chunk") ||
        str.includes("Failed to fetch dynamically imported module") ||
        str.includes("_next/static/chunks")
      );
    };

    const handleChunkError = (err: unknown) => {
      if (!isChunkError(err)) return;
      const now = Date.now();
      let lastRetry: string | null = null;
      try {
        lastRetry = sessionStorage.getItem("pstui_chunk_retry");
      } catch {
        // Storage disabled or blocked in private mode
      }

      if (!lastRetry || now - Number(lastRetry) > 15000) {
        try {
          sessionStorage.setItem("pstui_chunk_retry", now.toString());
        } catch {
          // Ignore storage quota or security error
        }
        // Clean cache and reload to fetch latest deployed chunk hashes
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        window.location.reload();
      }
    };

    const onError = (event: ErrorEvent) => {
      handleChunkError(event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleChunkError(event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    // 2. Web Install / beforeinstallprompt fallback listeners
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setHasDeferredPrompt(true);
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasDeferredPrompt(false);
      setInstalledDuringSession(true);
      setInstallStatus("앱이 설치되었습니다");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // 3. PWA Service Worker Registration & Update Activation
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (reg.waiting && navigator.serviceWorker.controller) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (
                  installing.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  installing.postMessage({ type: "SKIP_WAITING" });
                }
              };
            }
          };
        })
        .catch(() => {
          // SW registration failed silently in unsupported sandboxes
        });
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalling || isStandalone) return;
    setIsInstalling(true);

    try {
      const nav = window.navigator as NavigatorWithInstall;
      if (supportsWebInstall && typeof nav.install === "function") {
        // Call directly within user click handler to preserve transient user activation
        await nav.install();
        setInstallStatus("앱이 설치되거나 열렸습니다");
        setHasDeferredPrompt(false);
        return;
      }

      const promptEvent = deferredPromptRef.current;
      if (promptEvent) {
        // Discard single-use prompt event before awaiting outcome
        deferredPromptRef.current = null;
        setHasDeferredPrompt(false);
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        setInstallStatus(
          outcome === "accepted" ? "앱 설치가 시작되었습니다" : "설치가 취소되었습니다"
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setInstallStatus("설치가 취소되었습니다");
      }
    } finally {
      setIsInstalling(false);
    }
  }, [isInstalling, isStandalone, supportsWebInstall]);

  const contextValue = useMemo<PwaInstallState>(
    () => ({
      canInstall: !isStandalone && (supportsWebInstall || hasDeferredPrompt),
      isStandalone,
      isInstalling,
      installStatus,
      promptInstall,
    }),
    [
      isStandalone,
      supportsWebInstall,
      hasDeferredPrompt,
      isInstalling,
      installStatus,
      promptInstall,
    ]
  );

  return (
    <PwaInstallContext.Provider value={contextValue}>
      {children}
    </PwaInstallContext.Provider>
  );
}
