const CONGRESS_API_BASE = "https://api.congress.gov/v3";

export function getApiKey(): string {
  const key = process.env.CONGRESS_API_KEY;
  if (!key) throw new Error("CONGRESS_API_KEY is not set. Sign up at https://api.congress.gov/sign-up/");
  return key;
}

export interface CongressBillListItem {
  congress: number;
  type: string;
  number: number;
  title: string;
  latestAction?: { actionDate: string; text: string };
  url: string;
}

export interface CongressBillDetail {
  congress: number;
  type: string;
  number: number;
  title: string;
  titles?: { title: string; titleType: string }[];
  introducedDate?: string;
  sponsors?: {
    fullName: string;
    party: string;
    state: string;
  }[];
  latestAction?: { actionDate: string; text: string };
  policyArea?: { name: string };
  subjects?: { url: string };
  textVersions?: { url: string };
  summaries?: { url: string };
}

export interface CongressSummary {
  versionCode: string;
  actionDate: string;
  text: string;
}

// Fetch recent bills from a given congress
export async function fetchRecentBills(
  congress: number = 118,
  billType: string = "hr",
  limit: number = 20,
  offset: number = 0
): Promise<CongressBillListItem[]> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}?api_key=${getApiKey()}&format=json&limit=${limit}&offset=${offset}&sort=updateDate+desc`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Congress API error ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  return data.bills || [];
}

// Fetch full detail for a specific bill
export async function fetchBillDetail(
  congress: number,
  billType: string,
  billNumber: number
): Promise<CongressBillDetail> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}?api_key=${getApiKey()}&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Congress API error ${res.status} for bill ${billType}${billNumber}`);
  }
  const data = await res.json();
  return data.bill;
}

// Fetch the official summary for a bill
export async function fetchBillSummaries(
  congress: number,
  billType: string,
  billNumber: number
): Promise<CongressSummary[]> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${getApiKey()}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.summaries || [];
}

// Fetch subjects/tags for a bill
export async function fetchBillSubjects(
  congress: number,
  billType: string,
  billNumber: number
): Promise<string[]> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}/subjects?api_key=${getApiKey()}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const subjects = data.subjects?.legislativeSubjects || [];
  return subjects.map((s: { name: string }) => s.name);
}

// Fetch text versions for a bill (returns URLs to the actual text)
export async function fetchBillTextVersions(
  congress: number,
  billType: string,
  billNumber: number
): Promise<{ date: string; type: string; url: string }[]> {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}/text?api_key=${getApiKey()}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const versions = data.textVersions || [];
  return versions.map(
    (v: { date: string; type: string; formats: { url: string }[] }) => ({
      date: v.date,
      type: v.type,
      url: v.formats?.[0]?.url || "",
    })
  );
}

// Determine bill status from its latest action text
export function inferBillStatus(latestActionText: string | undefined): string {
  if (!latestActionText) return "introduced";
  const text = latestActionText.toLowerCase();
  if (text.includes("became public law") || text.includes("signed by president"))
    return "enacted";
  if (text.includes("vetoed")) return "vetoed";
  if (text.includes("passed senate") && text.includes("passed house"))
    return "passed_both";
  if (text.includes("passed senate")) return "passed_senate";
  if (text.includes("passed house")) return "passed_house";
  if (text.includes("referred to")) return "in_committee";
  return "introduced";
}

// Map bill type to Congress.gov URL path segment
function billTypeToUrlSegment(billType: string): string {
  const map: Record<string, string> = {
    hr: "house-bill",
    s: "senate-bill",
    hjres: "house-joint-resolution",
    sjres: "senate-joint-resolution",
    hconres: "house-concurrent-resolution",
    sconres: "senate-concurrent-resolution",
    hres: "house-resolution",
    sres: "senate-resolution",
  };
  return map[billType.toLowerCase()] || "house-bill";
}

// Format ordinal suffix for congress number
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// High-level: sync a batch of bills from Congress.gov into our format
export async function syncBills(
  congress: number = 118,
  billType: string = "hr",
  limit: number = 20
) {
  const bills = await fetchRecentBills(congress, billType, limit);
  const results = [];

  for (const bill of bills) {
    try {
      const detail = await fetchBillDetail(congress, billType, bill.number);
      const summaries = await fetchBillSummaries(congress, billType, bill.number);
      const subjects = await fetchBillSubjects(congress, billType, bill.number);

      // Also fetch the text URL
      const textVersions = await fetchBillTextVersions(congress, billType, bill.number);
      const latestTextUrl = textVersions.length > 0 ? textVersions[textVersions.length - 1].url : null;

      const latestSummary = summaries.length > 0 ? summaries[summaries.length - 1] : null;
      const sponsor = detail.sponsors?.[0];
      const shortTitle = detail.titles?.find(
        (t) => t.titleType === "Short Title(s) as Introduced"
      )?.title;

      results.push({
        id: `${congress}-${billType}-${bill.number}`,
        congress,
        bill_type: billType,
        bill_number: bill.number,
        title: detail.title || bill.title,
        short_title: shortTitle || null,
        summary: latestSummary?.text || null,
        latest_action_text: detail.latestAction?.text || bill.latestAction?.text || null,
        latest_action_date: detail.latestAction?.actionDate || bill.latestAction?.actionDate || null,
        introduced_date: detail.introducedDate || null,
        sponsor_name: sponsor?.fullName || null,
        sponsor_party: sponsor?.party || null,
        sponsor_state: sponsor?.state || null,
        policy_area: detail.policyArea?.name || null,
        subjects,
        full_text_url: latestTextUrl,
        congress_url: `https://www.congress.gov/bill/${ordinal(congress)}-congress/${billTypeToUrlSegment(billType)}/${bill.number}`,
        status: inferBillStatus(detail.latestAction?.text),
      });
    } catch (err) {
      console.error(`Failed to sync bill ${billType}${bill.number}:`, err);
    }
  }

  return results;
}
