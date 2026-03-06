"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ResourceDetail {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  type: string;
  publisher?: string;
  year?: number;
  digitalUrl?: string;
  copies: {
    id: string;
    barcode: string;
    status: string;
    location?: string;
    checkouts: { user: { name: string }; id: string }[];
  }[];
  tags: { tag: { id: string; name: string; color: string } }[];
  holds: { id: string; user: { name: string }; createdAt: string }[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    description: "",
    isbn: "",
    publisher: "",
    year: "",
    selectedTagIds: [] as string[],
    copies: [] as { id: string; location: string }[],
  });

  useEffect(() => {
    fetchResource();
  }, [id]);

  useEffect(() => {
    if (editing) {
      fetch("/api/tags").then((r) => r.json()).then(setAllTags);
    }
  }, [editing]);

  function fetchResource() {
    fetch(`/api/resources/${id}`)
      .then((r) => r.json())
      .then(setResource);
  }

  function startEditing() {
    if (!resource) return;
    setEditForm({
      title: resource.title,
      author: resource.author,
      description: resource.description || "",
      isbn: resource.isbn || "",
      publisher: resource.publisher || "",
      year: resource.year ? String(resource.year) : "",
      selectedTagIds: resource.tags.map((t) => t.tag.id),
      copies: resource.copies.map((c) => ({ id: c.id, location: c.location || "" })),
    });
    setEditing(true);
  }

  async function handleSave() {
    const res = await fetch(`/api/resources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        author: editForm.author,
        description: editForm.description || undefined,
        isbn: editForm.isbn || undefined,
        publisher: editForm.publisher || undefined,
        year: editForm.year ? parseInt(editForm.year) : undefined,
        tagIds: editForm.selectedTagIds,
        copies: editForm.copies,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setResource(updated);
      setEditing(false);
      setMessage("Saved!");
    } else {
      setMessage("Save failed");
    }
  }

  async function handleCheckout(copyId: string) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copyId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Checked out successfully!");
      fetchResource();
    } else {
      setMessage(data.error);
    }
  }

  async function handleHold() {
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Hold placed!");
      fetchResource();
    } else {
      setMessage(data.error);
    }
  }

  function toggleTag(tagId: string) {
    setEditForm((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((t) => t !== tagId)
        : [...prev.selectedTagIds, tagId],
    }));
  }

  function updateCopyLocation(copyId: string, location: string) {
    setEditForm((prev) => ({
      ...prev,
      copies: prev.copies.map((c) => (c.id === copyId ? { ...c, location } : c)),
    }));
  }

  if (!resource) return <p style={{ padding: "2rem" }}>Loading...</p>;

  const availableCopies = resource.copies.filter((c) => c.status === "AVAILABLE");
  const isManager = session?.user.role === "MANAGER";

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <Link href="/catalog" style={{ color: "#125f89", marginBottom: "1rem", display: "inline-block" }}>
        &larr; Back to Catalog
      </Link>

      {message && (
        <p style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.375rem", margin: "1rem 0" }}>
          {message}
        </p>
      )}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Edit Resource</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSave} style={buttonStyle}>Save</button>
              <button onClick={() => setEditing(false)} style={{ ...buttonStyle, background: "transparent", color: "#666", border: "1px solid #d1d5db" }}>Cancel</button>
            </div>
          </div>

          <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" style={inputStyle} />
          <input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} placeholder="Author" style={inputStyle} />
          <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" style={{ ...inputStyle, minHeight: 60 }} />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} placeholder="ISBN" style={{ ...inputStyle, flex: 1 }} />
            <input value={editForm.publisher} onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })} placeholder="Publisher" style={{ ...inputStyle, flex: 1 }} />
            <input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} placeholder="Year" type="number" style={{ ...inputStyle, width: 100 }} />
          </div>

          <div>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Categories</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "1rem",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    border: "none",
                    background: editForm.selectedTagIds.includes(tag.id) ? tag.color : "#f3f4f6",
                    color: editForm.selectedTagIds.includes(tag.id) ? "white" : "#666",
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Copy Locations</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {editForm.copies.map((copy) => {
                const original = resource.copies.find((c) => c.id === copy.id);
                return (
                  <div key={copy.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.875rem", minWidth: 100 }}>{original?.barcode}</span>
                    <input
                      value={copy.location}
                      onChange={(e) => updateCopyLocation(copy.id, e.target.value)}
                      placeholder="Location (e.g. Shelf 3)"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>{resource.title}</h1>
              <p style={{ color: "#666", fontSize: "1.1rem" }}>{resource.author}</p>
            </div>
            {isManager && (
              <button onClick={startEditing} style={{ ...buttonStyle, background: "#08abdb" }}>
                Edit
              </button>
            )}
          </div>

          {resource.description && <p style={{ margin: "1rem 0" }}>{resource.description}</p>}

          <div style={{ display: "flex", gap: "1rem", margin: "1rem 0", flexWrap: "wrap" }}>
            {resource.isbn && <span>ISBN: {resource.isbn}</span>}
            {resource.year && <span>Year: {resource.year}</span>}
            {resource.publisher && <span>Publisher: {resource.publisher}</span>}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap" }}>
            {resource.tags.map((t) => (
              <span
                key={t.tag.name}
                style={{ padding: "0.25rem 0.75rem", background: t.tag.color + "20", color: t.tag.color, borderRadius: "1rem", fontSize: "0.875rem" }}
              >
                {t.tag.name}
              </span>
            ))}
          </div>

          {resource.digitalUrl && (
            <p style={{ margin: "1rem 0" }}>
              <a href={resource.digitalUrl} style={{ color: "#125f89" }}>Access Digital Resource</a>
            </p>
          )}

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem" }}>Copies ({resource.copies.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {resource.copies.map((copy) => (
              <div
                key={copy.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem" }}
              >
                <div>
                  <span style={{ fontFamily: "monospace" }}>{copy.barcode}</span>
                  {copy.location && <span style={{ color: "#666", marginLeft: "1rem" }}>{copy.location}</span>}
                  <span
                    style={{
                      marginLeft: "1rem",
                      color: copy.status === "AVAILABLE" ? "#16a34a" : "#ef4444",
                      fontWeight: 500,
                    }}
                  >
                    {copy.status}
                  </span>
                </div>
                {session && copy.status === "AVAILABLE" && (
                  <button onClick={() => handleCheckout(copy.id)} style={buttonStyle}>
                    Check Out
                  </button>
                )}
              </div>
            ))}
          </div>

          {session && availableCopies.length === 0 && (
            <button onClick={handleHold} style={{ ...buttonStyle, marginTop: "1rem", background: "#c6af7d" }}>
              Place Hold
            </button>
          )}

          {resource.holds.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem" }}>Holds ({resource.holds.length})</h2>
              <ol style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {resource.holds.map((h) => (
                  <li key={h.id}>{h.user.name} — {new Date(h.createdAt).toLocaleDateString()}</li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "#125f89",
  color: "white",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
};
