import { NextRequest, NextResponse } from "next/server";
import { getBill, getTally } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bill = getBill(params.id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const tally = getTally(bill.id);

    return NextResponse.json({ bill, tally });
  } catch (error) {
    console.error("Bill detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
