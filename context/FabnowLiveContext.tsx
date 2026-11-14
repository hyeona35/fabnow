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
import type {
  AutoRefreshIntervalSec,
  FabnowLivePayload,
  LiveTickerQuote,
} from "@/lib/live/types";
import { useToast } from "@/context/OverlayContext";

const INTERVAL_STORAGE_KEY = "fabnow:auto-refresh-sec";
const INTERVAL_EVENT = "fabnow:interval-change";
const DEFAULT_INTERVAL_SEC: AutoRefreshIntervalSec = 300; // Default 5 minutes

interface FabnowLiveContextValue {
  liveData: FabnowLivePayload | null;
  isRefreshing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  intervalSec: AutoRefreshIntervalSec;
  nextRefreshInSec: number;
  setIntervalSec: (sec: AutoRefreshIntervalSec) => void;
  refreshNow: (opts?: { manual?: boolean }) => Promise<void>;
  getQuoteForEntity: (entityKey: string) => LiveTickerQuote | undefined;
}

const FabnowLiveContext = createContext<FabnowLiveContextValue | null>(null);

function normalizeInterval(raw: unknown): AutoRefreshIntervalSec {
  if (raw === 60 || raw === 300 || raw === 900 || raw === 0) return raw;
  return DEFAULT_INTERVAL_SEC;
}

function subscribeInterval(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === null || ev.key === INTERVAL_STORAGE_KEY) {
      callback();
    }
  };
  const onLocalChange = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(INTERVAL_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(INTERVAL_EVENT, onLocalChange);
  };
}

function getIntervalSnapshot(): AutoRefreshIntervalSec {
  try {
    const saved = window.localStorage.getItem(INTERVAL_STORAGE_KEY);
    if (saved === null) return DEFAULT_INTERVAL_SEC;
    return normalizeInterval(Number(saved));
  } catch {
    return DEFAULT_INTERVAL_SEC;
  }
}

function getIntervalServerSnapshot(): AutoRefreshIntervalSec {
  return DEFAULT_INTERVAL_SEC;
}

export function FabnowLiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showToast } = useToast();
  const [liveData, setLiveData] = useState<FabnowLivePayload | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const intervalSec = useSyncExternalStore(
    subscribeInterval,
    getIntervalSnapshot,
    getIntervalServerSnapshot
  );
  const [nextRefreshInSec, setNextRefreshInSec] =
    useState<number>(DEFAULT_INTERVAL_SEC);

  const lastFetchTimestampRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);
  const intervalSecRef = useRef<AutoRefreshIntervalSec>(intervalSec);

  useEffect(() => {
    intervalSecRef.current = intervalSec;
  }, [intervalSec]);

  const applyFetchedPayload = useCallback(
    (json: FabnowLivePayload, manual: boolean) => {
      setLiveData(json);
      setLastError(null);
      lastFetchTimestampRef.current = Date.now();
      setNextRefreshInSec(intervalSecRef.current);

      if (manual) {
        showToast({
          title: "실시간 수급·시장 피드 동기화 완료",
          description: `시세 ${json.liveStats.liveQuotesCount}/${json.liveStats.totalQuotesCount}건 · 뉴스/공시 ${json.liveStats.liveHeadlinesCount}건 갱신`,
          variant: "success",
        });
      }
    },
    [showToast]
  );

  const refreshNow = useCallback(
    async (opts?: { manual?: boolean }) => {
      const manual = Boolean(opts?.manual);
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsRefreshing(true);

      try {
        const endpoint = manual ? "/api/fabnow?refresh=1" : "/api/fabnow";
        const res = await fetch(endpoint, {
          cache: manual ? "no-store" : "default",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as FabnowLivePayload;
        applyFetchedPayload(json, manual);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "외부 피드 연결 지연";
        setLastError(msg);
        if (manual) {
          showToast({
            title: "실시간 피드 동기화 지연",
            description: "기준 데이터는 정상 유지되며 다음 주기에 자동 재시도합니다.",
            variant: "warning",
          });
        }
      } finally {
        inFlightRef.current = false;
        setIsRefreshing(false);
      }
    },
    [applyFetchedPayload, showToast]
  );

  const setIntervalSec = useCallback((sec: AutoRefreshIntervalSec) => {
    intervalSecRef.current = sec;
    setNextRefreshInSec(sec);
    try {
      window.localStorage.setItem(INTERVAL_STORAGE_KEY, String(sec));
      window.dispatchEvent(new Event(INTERVAL_EVENT));
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  // Initial background sync after mount (async callbacks avoid sync setState in effect)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/fabnow")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FabnowLivePayload>;
      })
      .then((json) => {
        if (!cancelled) {
          applyFetchedPayload(json, false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLastError(
            err instanceof Error ? err.message : "초기 피드 연결 지연"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyFetchedPayload]);

  // Countdown tick + periodic auto-refresh paused while tab is hidden
  useEffect(() => {
    if (intervalSec === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      setNextRefreshInSec((prev) => {
        const base = prev > intervalSec ? intervalSec : prev;
        if (base <= 1) {
          void refreshNow({ manual: false });
          return intervalSec;
        }
        return base - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [intervalSec, refreshNow]);

  // Refresh promptly when returning to tab or regaining network connectivity
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const curInterval = intervalSecRef.current;
      if (curInterval === 0) return;
      const elapsedSec = (Date.now() - lastFetchTimestampRef.current) / 1000;
      if (elapsedSec >= curInterval) {
        void refreshNow({ manual: false });
      }
    };

    const handleOnline = () => {
      void refreshNow({ manual: false });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [refreshNow]);

  const quoteByEntity = useMemo(() => {
    const map = new Map<string, LiveTickerQuote>();
    for (const q of liveData?.quotes ?? []) {
      map.set(q.entityKey, q);
    }
    return map;
  }, [liveData]);

  const getQuoteForEntity = useCallback(
    (entityKey: string) => quoteByEntity.get(entityKey),
    [quoteByEntity]
  );

  const displayedNextRefreshSec =
    intervalSec === 0 ? 0 : Math.min(nextRefreshInSec, intervalSec);

  const value = useMemo<FabnowLiveContextValue>(
    () => ({
      liveData,
      isRefreshing,
      lastSyncedAt: liveData?.syncedAt ?? null,
      lastError,
      intervalSec,
      nextRefreshInSec: displayedNextRefreshSec,
      setIntervalSec,
      refreshNow,
      getQuoteForEntity,
    }),
    [
      liveData,
      isRefreshing,
      lastError,
      intervalSec,
      displayedNextRefreshSec,
      setIntervalSec,
      refreshNow,
      getQuoteForEntity,
    ]
  );

  return (
    <FabnowLiveContext.Provider value={value}>
      {children}
    </FabnowLiveContext.Provider>
  );
}

export function useFabnowLive(): FabnowLiveContextValue {
  const ctx = useContext(FabnowLiveContext);
  if (!ctx) {
    throw new Error("useFabnowLive must be used within FabnowLiveProvider");
  }
  return ctx;
}
