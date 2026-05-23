import { NextResponse } from "next/server";

type PdokDoc = {
  id?: string;
  weergavenaam?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 3) {
      return NextResponse.json({ suggesties: [] });
    }

    const url = new URL("https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest");
    url.searchParams.set("q", query);
    url.searchParams.set("rows", "5");
    url.searchParams.set("fq", "type:adres");
    url.searchParams.set("fl", "id,weergavenaam");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ suggesties: [] });
    const data = await response.json();
    const suggesties = ((data?.response?.docs || []) as PdokDoc[]).map((doc) => ({
      id: doc.id || doc.weergavenaam,
      label: doc.weergavenaam || ""
    })).filter((item) => item.label);

    return NextResponse.json({ suggesties });
  } catch {
    return NextResponse.json({ suggesties: [] });
  }
}
