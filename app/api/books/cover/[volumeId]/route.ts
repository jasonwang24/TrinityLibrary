import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ volumeId: string }> }) {
  const { volumeId } = await params;

  const key = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : "";

  for (const zoom of [3, 2, 1]) {
    const url = `https://books.google.com/books/content?id=${volumeId}&printsec=frontcover&img=1&zoom=${zoom}${key}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 4000) continue; // placeholder images are tiny (~2KB)
      return new Response(buffer, {
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    } catch {
      continue;
    }
  }

  return new Response(null, { status: 404 });
}
