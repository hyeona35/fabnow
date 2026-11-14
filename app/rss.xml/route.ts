import { NextResponse } from "next/server";

/**
 * Permanent redirect from /rss.xml to the canonical fabnow RSS feed at /feed.xml.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/feed.xml";
  return NextResponse.redirect(url, 308);
}
