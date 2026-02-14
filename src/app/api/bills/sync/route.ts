import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { syncBills } from "@/lib/congress";
import { upsertBill } from "@/lib/db";
import { summarizeBill } from "@/lib/ai";
import type { Bill } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const congress = body.congress || 118;
    const billType = body.bill_type || "hr";
    const limit = body.limit || 10;

    // Pull bills from Congress.gov
    const bills = await syncBills(congress, billType, limit);

    const saved = [];
    for (const bill of bills) {
      // Save to DB
      upsertBill(bill);

      // Generate AI summary if we have an official summary to work with
      if (bill.summary) {
        try {
          const aiSummary = await summarizeBill(bill as unknown as Bill);
          upsertBill({ ...bill, ai_summary: aiSummary });
          saved.push({ ...bill, ai_summary: aiSummary });
        } catch {
          saved.push(bill);
        }
      } else {
        saved.push(bill);
      }
    }

    return NextResponse.json({
      synced: saved.length,
      bills: saved.map((b) => ({
        id: b.id,
        title: b.title,
        status: b.status,
      })),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync bills from Congress.gov" },
      { status: 500 }
    );
  }
}
