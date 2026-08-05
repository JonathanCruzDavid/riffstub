import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const zip = new URL(request.url).searchParams.get("zip")?.trim();

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
  }

  // Zip-to-coordinates mappings are effectively static, so cache aggressively.
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Couldn't find that ZIP code." }, { status: 404 });
  }

  const data = await res.json();
  const place = data.places?.[0];

  if (!place) {
    return NextResponse.json({ error: "Couldn't find that ZIP code." }, { status: 404 });
  }

  return NextResponse.json({
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
    label: [place["place name"], place["state abbreviation"]].filter(Boolean).join(", "),
  });
}
