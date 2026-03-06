"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  author: string;
  copies: { id: string; status: string }[];
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function CatalogPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, tagFilter]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (tagFilter) params.set("tag", tagFilter);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    fetch(`/api/resources?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResources(data.resources);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      });
  }, [search, tagFilter, page]);

  const availableCount = (copies: Resource["copies"]) =>
    copies.filter((c) => c.status === "AVAILABLE").length;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Catalog</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
        >
          <option value="">All Categories</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : resources.length === 0 ? (
        <p style={{ color: "#666" }}>No resources found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {resources.map((r) => (
            <Link
              key={r.id}
              href={`/catalog/${r.id}`}
              style={{
                display: "block",
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontWeight: 600 }}>{r.title}</h2>
                  <p style={{ color: "#666" }}>{r.author}</p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {r.tags.map((t) => (
                      <span
                        key={t.tag.id}
                        style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", background: t.tag.color + "20", color: t.tag.color, borderRadius: "1rem" }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, color: availableCount(r.copies) > 0 ? "#16a34a" : "#ef4444" }}>
                    {availableCount(r.copies)} / {r.copies.length} available
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{ ...paginationBtn, opacity: page === 1 ? 0.4 : 1 }}
          >
            &laquo;
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ ...paginationBtn, opacity: page === 1 ? 0.4 : 1 }}
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                ...paginationBtn,
                background: p === page ? "#125f89" : "transparent",
                color: p === page ? "white" : "#125f89",
                border: p === page ? "none" : "1px solid #d1d5db",
                minWidth: "2.25rem",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ ...paginationBtn, opacity: page === totalPages ? 0.4 : 1 }}
          >
            &rsaquo;
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={{ ...paginationBtn, opacity: page === totalPages ? 0.4 : 1 }}
          >
            &raquo;
          </button>
        </div>
      )}
    </main>
  );
}

const paginationBtn: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "#125f89",
  color: "white",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
  fontSize: "0.875rem",
};
