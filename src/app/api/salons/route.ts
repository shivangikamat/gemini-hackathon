import { NextRequest, NextResponse } from "next/server";
import { findSalonMatches } from "@/lib/maps";
import type { SalonSearchResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const style = request.nextUrl.searchParams.get("style")?.trim();
  const location = request.nextUrl.searchParams.get("location")?.trim();

  if (!style || !location) {
    return NextResponse.json(
      { error: "Both style and location are required." },
      { status: 400 }
    );
  }

  const payload: SalonSearchResponse = {
    demo: true,
    location,
    selectedStyle: style,
    salons: findSalonMatches(style, location),
  };

  return NextResponse.json(payload);
}
