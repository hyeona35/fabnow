import { NextResponse } from "next/server";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fabnow.workers.dev"
).replace(/\/+$/, "");

export async function GET() {
  const now = new Date().toUTCString();

  const feedItems = [
    {
      title: "fabnow 실시간 브리핑: 파운드리·HBM 출하 및 프론티어 AI 수급 갭 분석",
      link: `${SITE_URL}/#overview`,
      pubDate: now,
      description:
        "TSMC N3P/N2·CoWoS-L, SK hynix HBM3E 12-Hi/HBM4, Samsung SF2·HBM4, Micron HBM3E, Intel 18A 공급 지표와 프론티어 랩·네오클라우드 수요 병목을 통합 추적합니다.",
      guid: `${SITE_URL}/live/overview`,
    },
    {
      title: "프론티어 랩 & 네오클라우드 AI 컴퓨트 수주 잔고 및 전력 커밋 지표",
      link: `${SITE_URL}/#labs`,
      pubDate: now,
      description:
        "OpenAI, Anthropic, Google DeepMind, xAI, Meta AI 및 CoreWeave, Nebius, Lambda, Crusoe, TensorWave의 월간 GPU 환산 수요, HBM TB 수요, 백로그 개월 수 업데이트",
      guid: `${SITE_URL}/live/demand`,
    },
    {
      title: "첨단 패키징(CoWoS-L) · HBM4 Base Die · 액침 냉각 랙 전력 병목 모니터",
      link: `${SITE_URL}/#bottlenecks`,
      pubDate: now,
      description:
        "CoWoS-L 인터포저, HBM3E 12-Hi 스태킹, N2/N3P EUV 웨이퍼, ABF/글라스 기판 포화도와 리드타임 변동 추적 (Cloudflare Workers vinext Edge SSR)",
      guid: `${SITE_URL}/live/bottlenecks`,
    },
  ];

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>fabnow — 반도체 출하 지표 · AI 수요 인텔리전스</title>
    <link>${SITE_URL}</link>
    <description>파운드리·HBM 반도체 공급 출하 지표와 프론티어 AI 랩·네오클라우드 컴퓨트 수요 병목을 추적하는 Cloudflare Workers Edge SSR 인텔리전스 대시보드</description>
    <language>ko-KR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${feedItems
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
