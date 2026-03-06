"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AddResourcePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    type: "BOOK",
    publisher: "",
    year: "",
    digitalUrl: "",
    copies: "1",
  });
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isbnLookup, setIsbnLookup] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  async function lookupISBN() {
    if (!form.isbn) return;
    setIsbnLookup(true);
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${form.isbn}.json`);
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          publisher: data.publishers?.[0] || prev.publisher,
          year: data.publish_date?.match(/\d{4}/)?.[0] || prev.year,
        }));
        setMessage("ISBN lookup successful!");
      } else {
        setMessage("ISBN not found in Open Library");
      }
    } catch {
      setMessage("ISBN lookup failed");
    }
    setIsbnLookup(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        year: form.year ? parseInt(form.year) : undefined,
        copies: parseInt(form.copies),
        tagIds: selectedTags,
        isbn: form.isbn || undefined,
        description: form.description || undefined,
        digitalUrl: form.digitalUrl || undefined,
        publisher: form.publisher || undefined,
      }),
    });

    if (res.ok) {
      const resource = await res.json();
      router.push(`/catalog/${resource.id}`);
    } else {
      const data = await res.json();
      setMessage(JSON.stringify(data.error));
    }
  }

  if (!session || session.user.role !== "MANAGER") return null;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <Link href="/manager" style={{ color: "#125f89", marginBottom: "1rem", display: "inline-block" }}>
        &larr; Manager Panel
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Add New Resource</h1>

      {message && <p style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.375rem", marginBottom: "1rem" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={lookupISBN} disabled={isbnLookup} style={{ ...btnStyle, background: "#08abdb" }}>
            {isbnLookup ? "Looking up..." : "Lookup"}
          </button>
        </div>

        <input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={inputStyle} />
        <input placeholder="Author *" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required style={inputStyle} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} />

        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          <option value="BOOK">Book</option>
          <option value="EBOOK">E-Book</option>
          <option value="JOURNAL">Journal</option>
          <option value="AUDIOBOOK">Audiobook</option>
          <option value="DVD">DVD</option>
          <option value="OTHER">Other</option>
        </select>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input placeholder="Publisher" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={{ ...inputStyle, width: 100 }} />
        </div>

        {["EBOOK", "JOURNAL", "AUDIOBOOK"].includes(form.type) && (
          <input placeholder="Digital URL" value={form.digitalUrl} onChange={(e) => setForm({ ...form, digitalUrl: e.target.value })} style={inputStyle} />
        )}

        <input placeholder="Number of copies" type="number" min="1" value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} style={inputStyle} />

        <div>
          <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Tags</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tags.map((tag) => (
              <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={(e) =>
                    setSelectedTags(e.target.checked ? [...selectedTags, tag.id] : selectedTags.filter((t) => t !== tag.id))
                  }
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" style={btnStyle}>Add Resource</button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "0.375rem",
  fontSize: "1rem",
};

const btnStyle: React.CSSProperties = {
  padding: "0.75rem",
  background: "#125f89",
  color: "white",
  border: "none",
  borderRadius: "0.375rem",
  fontSize: "1rem",
  cursor: "pointer",
};
