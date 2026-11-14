import { NextResponse } from "next/server";
import { fetchLiveFabnowTelemetry } from "@/lib/server/liveFeed";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  const payload = await fetchLiveFabnowTelemetry({ forceRefresh });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": forceRefresh
        ? "no-store"
        : "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
