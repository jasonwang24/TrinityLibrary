"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function TagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6B7280");

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const tag = await res.json();
      setTags([...tags, tag]);
      setName("");
    }
  }

  if (!session || session.user.role !== "MANAGER") return null;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem" }}>
      <Link href="/manager" style={{ color: "#125f89", marginBottom: "1rem", display: "inline-block" }}>
        &larr; Manager Panel
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Manage Tags</h1>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Tag name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ flex: 1, padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 40, height: 38, border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem", background: "#125f89", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>
          Add
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {tags.map((tag) => (
          <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: tag.color }} />
            <span>{tag.name}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
