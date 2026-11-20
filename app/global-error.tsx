"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <meta name="color-scheme" content="light dark" />
        <title>fabnow 시스템 복구 모드</title>
        <style>{`
          :root {
            color-scheme: light dark;
            --ge-bg: #f8f5f0;
            --ge-surface: #fdfcf9;
            --ge-blush: #faf3f6;
            --ge-border: rgba(88, 76, 102, 0.14);
            --ge-control-border: #7b7285;
            --ge-text: #1f1b24;
            --ge-text-secondary: #4e4758;
            --ge-text-tertiary: #655d70;
            --ge-text-error: #9f1239;
            --ge-primary: #b52a67;
            --ge-primary-fg: #ffffff;
            --ge-focus: #8d194d;
            --ge-shadow: 0 20px 44px -12px rgba(31, 27, 36, 0.10), 0 4px 12px rgba(31, 27, 36, 0.04);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #14111d;
              --ge-surface: #1d1828;
              --ge-blush: #241b29;
              --ge-border: rgba(235, 224, 248, 0.16);
              --ge-control-border: #8d82a3;
              --ge-text: #f7f3fa;
              --ge-text-secondary: #d5cde2;
              --ge-text-tertiary: #b5aac5;
              --ge-text-error: #fda4af;
              --ge-primary: #f472b6;
              --ge-primary-fg: #280616;
              --ge-focus: #f9a8d4;
              --ge-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.55);
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background-color: var(--ge-bg);
            color: var(--ge-text);
            font-family: "NanumSquareNeo", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
            word-break: keep-all;
            overflow-wrap: break-word;
            -webkit-font-smoothing: antialiased;
          }
          .ge-card {
            width: 100%;
            max-width: 28rem;
            border-radius: 28px;
            padding: 2rem;
            text-align: center;
            background-color: var(--ge-surface);
            border: 1px solid var(--ge-border);
            box-shadow: var(--ge-shadow);
          }
          .ge-icon {
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            background-color: var(--ge-blush);
            color: var(--ge-text-error);
            border: 1px solid var(--ge-border);
          }
          .ge-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 700;
            background-color: var(--ge-blush);
            color: var(--ge-text-error);
            border: 1px solid var(--ge-border);
          }
          .ge-title {
            margin: 0.75rem 0 0;
            font-size: 1.5rem;
            font-weight: 800;
            line-height: 1.25;
            letter-spacing: -0.025em;
            color: var(--ge-text);
          }
          .ge-desc {
            margin: 0.625rem 0 0;
            font-size: 0.9375rem;
            font-weight: 500;
            line-height: 1.6;
            color: var(--ge-text-secondary);
          }
          .ge-digest {
            margin: 0.5rem 0 0;
            font-size: 0.75rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-variant-numeric: tabular-nums;
            color: var(--ge-text-tertiary);
          }
          .ge-actions {
            margin-top: 1.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
          }
          .ge-btn-primary,
          .ge-btn-secondary {
            width: 100%;
            min-height: 44px;
            padding: 0.75rem 1.25rem;
            border-radius: 18px;
            font-family: inherit;
            font-size: 0.9375rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
          }
          .ge-btn-primary {
            border: 1px solid var(--ge-primary);
            background-color: var(--ge-primary);
            color: var(--ge-primary-fg);
          }
          .ge-btn-secondary {
            border: 1px solid var(--ge-control-border);
            background-color: transparent;
            color: var(--ge-text);
            font-size: 0.875rem;
            font-weight: 600;
          }
          .ge-btn-primary:hover,
          .ge-btn-secondary:hover {
            opacity: 0.92;
          }
          .ge-btn-primary:active,
          .ge-btn-secondary:active {
            transform: scale(0.97);
          }
          .ge-btn-primary:focus-visible,
          .ge-btn-secondary:focus-visible {
            outline: 3px solid var(--ge-focus);
            outline-offset: 2px;
          }
          @media (prefers-reduced-motion: reduce) {
            .ge-btn-primary,
            .ge-btn-secondary {
              transition: opacity 150ms ease;
            }
            .ge-btn-primary:active,
            .ge-btn-secondary:active {
              transform: none;
            }
          }
        `}</style>
      </head>
      <body className="min-h-dvh flex items-center justify-center p-6 font-sans">
        <main className="ge-card rounded-[28px]">
          <div className="ge-icon rounded-[20px]">
            <svg
              width="28"
              height="28"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <span className="ge-badge">System Recovery</span>
          <h1 className="ge-title">fabnow 시스템 복구 모드</h1>
          <p className="ge-desc">
            치명적인 렌더링 오류가 발생했습니다. 아래 버튼을 눌러 대시보드를 초기화하십시오.
          </p>
          {error.digest && (
            <p className="ge-digest">오류 코드: {error.digest}</p>
          )}

          <div className="ge-actions">
            <button
              type="button"
              onClick={() => reset()}
              className="ge-btn-primary rounded-[18px]"
            >
              대시보드 다시 시작
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="ge-btn-secondary rounded-[18px]"
            >
              페이지 새로고침
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
