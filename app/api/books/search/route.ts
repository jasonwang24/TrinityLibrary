import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ items: [] });

  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8${key ? `&key=${key}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Google Books request failed" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
