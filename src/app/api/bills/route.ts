import { NextRequest, NextResponse } from "next/server";
import { getBills, getBillCount } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const bills = getBills(limit, offset);
    const total = getBillCount();

    return NextResponse.json({ bills, count: bills.length, total, limit, offset });
  } catch (error) {
    console.error("Bills fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}
