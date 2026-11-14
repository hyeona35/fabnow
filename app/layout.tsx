import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { OverlayProvider } from "@/context/OverlayContext";
import { FabnowLiveProvider } from "@/context/FabnowLiveContext";
import { ClientRuntimeProvider } from "@/components/providers/ClientRuntimeProvider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://fabnow.workers.dev";
const SITE_TITLE = "fabnow — 반도체 출하 지표 · AI 수요 인텔리전스";
const SITE_DESCRIPTION =
  "TSMC·SK hynix·삼성전자·Micron의 파운드리·HBM 출하량과 OpenAI·Anthropic·Google DeepMind·CoreWeave·Nebius의 AI 연산 수요 및 CoWoS·EUV 병목 공정을 추적하는 실시간 반도체 수급 인텔리전스 대시보드.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | fabnow",
  },
  description: SITE_DESCRIPTION,
  applicationName: "fabnow",
  authors: [{ name: "fabnow Intelligence", url: SITE_URL }],
  generator: "Next.js 16",
  keywords: [
    "fabnow",
    "반도체 출하 지표",
    "AI 수요 인텔리전스",
    "HBM3E",
    "HBM4",
    "CoWoS-L",
    "TSMC",
    "SK hynix",
    "삼성전자",
    "Micron",
    "OpenAI",
    "Anthropic",
    "CoreWeave",
    "Nebius",
    "네오클라우드",
    "프론티어 랩",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
      "application/atom+xml": "/feed.xml",
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "fabnow — AI 반도체 수급 인텔리전스",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "fabnow — 반도체 출하 지표 · AI 수요 인텔리전스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@fabnow_intel",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "fabnow",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#09070e" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "fabnow",
      description: SITE_DESCRIPTION,
      inLanguage: "ko-KR",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "fabnow — 반도체 출하 지표 · AI 수요 인텔리전스",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android, macOS, Windows",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description: SITE_DESCRIPTION,
      inLanguage: "ko-KR",
    },
  ],
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased font-sans"
      data-theme="light"
    >
      <head>
        {/* Preload core NanumSquare Neo self-hosted weights for instant FOUT-free rendering */}
        <link
          rel="preload"
          href="/fonts/NanumSquareNeoTTF-bRg.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/NanumSquareNeoTTF-cBd.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Structured Data (JSON-LD) for Rich Search Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
        <ClientRuntimeProvider>
          <Suspense fallback={<div className="min-h-dvh w-full" />}>
            <NuqsAdapter>
              <OverlayProvider>
                <FabnowLiveProvider>
                  {children}
                  {modal}
                </FabnowLiveProvider>
              </OverlayProvider>
            </NuqsAdapter>
          </Suspense>
        </ClientRuntimeProvider>
      </body>
    </html>
  );
}

