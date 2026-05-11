import { NextRequest } from "next/server";

const PLACEHOLDER_MAX_BYTES = 5000;

async function fetchIfReal(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > PLACEHOLDER_MAX_BYTES ? buf : null;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ volumeId: string }> }) {
  const { volumeId } = await params;
  const key = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : "";

  const headers = {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=604800, immutable",
  };

  // If the "volumeId" segment is actually a full URL, use it directly
  const decoded = decodeURIComponent(volumeId);
  if (decoded.startsWith("http")) {
    const thumb = decoded.replace("http:", "https:");

    // Try a larger fife size first
    if (thumb.includes("fife=")) {
      const hi = thumb.replace(/fife=w\d+-h\d+/, "fife=w800-h1200").replace("&source=gbs_api", "");
      const buf = await fetchIfReal(hi);
      if (buf) return new Response(buf, { headers });
    }

    // Try zoom=3 for zoom-style URLs
    if (thumb.includes("zoom=")) {
      const hi = thumb.replace(/zoom=\d+/, "zoom=3").replace("&edge=curl", "").replace("&source=gbs_api", "");
      const buf = await fetchIfReal(hi);
      if (buf) return new Response(buf, { headers });
    }

    // Fall back to the original thumbnail URL
    const buf = await fetchIfReal(thumb);
    if (buf) return new Response(buf, { headers });
    return new Response(null, { status: 404 });
  }

  // Legacy volume ID path
  for (const zoom of [3, 2, 1]) {
    const url = `https://books.google.com/books/content?id=${volumeId}&printsec=frontcover&img=1&zoom=${zoom}${key}`;
    const buf = await fetchIfReal(url);
    if (buf) return new Response(buf, { headers });
  }

  return new Response(null, { status: 404 });
}
