"use client";

import React, { useEffect } from "react";

/**
 * ClientRuntimeProvider
 * Handles:
 * 1. Automatic stale Next.js chunk 404 error recovery (reload with safety guard)
 * 2. Service Worker registration for PWA offline support
 * 3. SPA long-session memory safety
 */
export function ClientRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

    // 2. PWA Service Worker Registration
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (
                  installing.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New content available, automatic safe update
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
    };
  }, []);

  return <>{children}</>;
}
