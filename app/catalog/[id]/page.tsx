"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, BookOpen, Edit, Calendar, X, Trash2, Star, Plus } from "lucide-react";

interface ResourceDetail {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverImage?: string;
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
    checkouts: { user: { id: string; name: string }; id: string }[];
  }[];
  tags: { tag: { id: string; name: string; color: string } }[];
  holds: { id: string; user: { id: string; name: string }; createdAt: string }[];
  reviews: { id: string; rating: number; text?: string; createdAt: string; user: { id: string; name: string } }[];
  _avgRating: number | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function ResourceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [editing, setEditing] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  function resolveCoverUrl(coverImage: string | null | undefined, isbn?: string | null): { src: string; fallback?: string } | null {
    if (coverImage) {
      if (coverImage.startsWith("http")) {
        // URL saved from picker — try to get a larger version
        let hi = coverImage;
        if (coverImage.includes("fife=")) {
          hi = coverImage.replace(/fife=w\d+-h\d+/, "fife=w800-h1200").replace("&source=gbs_api", "");
        } else if (coverImage.includes("zoom=")) {
          hi = coverImage.replace(/zoom=\d+/, "zoom=3").replace("&edge=curl", "").replace("&source=gbs_api", "");
        }
        return { src: hi, fallback: hi !== coverImage ? coverImage : undefined };
      }
      // Legacy volume ID — use proxy
      return { src: `/api/books/cover/${coverImage}` };
    }
    if (isbn) return { src: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` };
    return null;
  }

  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverSearch, setCoverSearch] = useState("");
  const [coverResults, setCoverResults] = useState<{ id: string; title: string; thumbnail?: string }[]>([]);
  const [coverSearching, setCoverSearching] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    description: "",
    isbn: "",
    coverImage: "",
    publisher: "",
    year: "",
    selectedTagIds: [] as string[],
    copies: [] as {
      id?: string;
      _key: string;
      barcode?: string;
      location: string;
      canDelete: boolean;
    }[],
  });

  useEffect(() => {
    fetchResource();
  }, [id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showPreview) setShowPreview(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showPreview]);

  useEffect(() => {
    if (editing) {
      fetch("/api/tags").then((r) => r.json()).then(setAllTags);
    }
  }, [editing]);

  function fetchResource() {
    setCoverLoaded(false);
    fetch(`/api/resources/${id}`)
      .then((r) => r.json())
      .then(setResource);
  }

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  }

  function startEditing() {
    if (!resource) return;
    setEditForm({
      title: resource.title,
      author: resource.author,
      description: resource.description || "",
      isbn: resource.isbn || "",
      coverImage: resource.coverImage || "",
      publisher: resource.publisher || "",
      year: resource.year ? String(resource.year) : "",
      selectedTagIds: resource.tags.map((t) => t.tag.id),
      copies: resource.copies.map((c) => ({
        id: c.id,
        _key: c.id,
        barcode: c.barcode,
        location: c.location || "",
        canDelete: c.status === "AVAILABLE",
      })),
    });
    setCoverSearch("");
    setCoverResults([]);
    setEditing(true);
  }

  async function searchGoogleBooks() {
    if (!coverSearch.trim()) return;
    setCoverSearching(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(coverSearch)}`);
      const data = await res.json();
      setCoverResults((data.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.volumeInfo?.title ?? "",
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace("http:", "https:"),
      })));
    } finally {
      setCoverSearching(false);
    }
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
        coverImage: editForm.coverImage || null,
        publisher: editForm.publisher || undefined,
        year: editForm.year ? parseInt(editForm.year) : undefined,
        tagIds: editForm.selectedTagIds,
        copies: editForm.copies.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          location: c.location,
        })),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setResource(updated);
      setEditing(false);
      showMessage("Saved!");
    } else {
      const data = await res.json().catch(() => ({}));
      showMessage(data.error || "Save failed", "error");
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
      showMessage("Book successfully checked out! Due date: " + new Date(data.dueDate).toLocaleDateString());
      fetchResource();
    } else {
      showMessage(data.error, "error");
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
      showMessage("Hold placed successfully! We'll notify you when the book becomes available.");
      fetchResource();
    } else {
      showMessage(data.error, "error");
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${resource?.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/catalog");
    } else {
      showMessage("Failed to delete resource", "error");
    }
  }

  async function handleCancelHold(holdId: string) {
    const res = await fetch("/api/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdId }),
    });
    if (res.ok) {
      showMessage("Hold cancelled.");
      fetchResource();
    } else {
      showMessage("Failed to cancel hold", "error");
    }
  }

  async function handleSubmitReview() {
    if (reviewRating === 0) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: id, rating: reviewRating, text: reviewText || undefined }),
    });
    if (res.ok) {
      showMessage("Review submitted!");
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText("");
      fetchResource();
    } else {
      const data = await res.json();
      showMessage(data.error, "error");
    }
  }

  async function handleDeleteReview(reviewId: string) {
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    if (res.ok) {
      showMessage("Review deleted.");
      fetchResource();
    } else {
      showMessage("Failed to delete review", "error");
    }
  }

  function startEditReview(review: ResourceDetail["reviews"][0]) {
    setReviewRating(review.rating);
    setReviewText(review.text || "");
    setShowReviewForm(true);
  }

  function toggleTag(tagId: string) {
    setEditForm((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((t) => t !== tagId)
        : [...prev.selectedTagIds, tagId],
    }));
  }

  function updateCopyLocation(key: string, location: string) {
    setEditForm((prev) => ({
      ...prev,
      copies: prev.copies.map((c) => (c._key === key ? { ...c, location } : c)),
    }));
  }

  function addCopy() {
    setEditForm((prev) => ({
      ...prev,
      copies: [
        ...prev.copies,
        {
          _key: `new-${Date.now()}-${Math.random()}`,
          location: "",
          canDelete: true,
        },
      ],
    }));
  }

  function removeCopy(key: string) {
    setEditForm((prev) => ({
      ...prev,
      copies: prev.copies.filter((c) => c._key !== key),
    }));
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const availableCopies = (resource.copies || []).filter((c) => c.status === "AVAILABLE");
  const isManager = session?.user.role === "MANAGER";
  const userHasCheckedOut = session ? resource.copies.some((c) =>
    c.checkouts.some((co) => co.user.id === session.user.id)
  ) : false;
  const userHold = session ? resource.holds.find((h) => h.user.id === session.user.id) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/catalog"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Catalog
        </Link>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
            messageType === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        {editing ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Resource</h2>
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} placeholder="Author" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} placeholder="ISBN" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input value={editForm.publisher} onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })} placeholder="Publisher" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} placeholder="Year" type="number" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cover Image</p>
                <div className="flex gap-3 mb-3">
                  {editForm.coverImage && (
                    <img
                      src={resolveCoverUrl(editForm.coverImage)?.src ?? ""}
                      alt="Current cover"
                      className="w-16 h-24 object-cover rounded shadow-sm shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coverSearch}
                        onChange={(e) => setCoverSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchGoogleBooks()}
                        placeholder="Search Google Books by title or author…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={searchGoogleBooks}
                        disabled={coverSearching}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 shrink-0"
                      >
                        {coverSearching ? "…" : "Search"}
                      </button>
                    </div>
                    {editForm.coverImage && (
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, coverImage: "" })}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove cover
                      </button>
                    )}
                  </div>
                </div>
                {coverResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {coverResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          const url = result.thumbnail?.replace("http:", "https:") ?? result.id;
                          setEditForm({ ...editForm, coverImage: url });
                          setCoverResults([]);
                          setCoverSearch("");
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${editForm.coverImage === result.id ? "border-blue-500" : "border-transparent hover:border-blue-300"}`}
                        title={result.title}
                      >
                        {result.thumbnail ? (
                          <img src={result.thumbnail} alt={result.title} className="w-full aspect-[2/3] object-cover" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center">
                            <BookOpen size={20} className="text-gray-300" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        editForm.selectedTagIds.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Copies ({editForm.copies.length})</p>
                  <button
                    type="button"
                    onClick={addCopy}
                    className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Copy
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.copies.map((copy) => (
                    <div key={copy._key} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-500 min-w-[120px]">
                        {copy.barcode || "New copy"}
                      </span>
                      <input
                        value={copy.location}
                        onChange={(e) => updateCopyLocation(copy._key, e.target.value)}
                        placeholder="Location (e.g. Shelf 3)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeCopy(copy._key)}
                        disabled={!copy.canDelete}
                        title={copy.canDelete ? "Remove copy" : "Cannot remove — copy is not available"}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-3 gap-8 p-8">
              <div className="md:col-span-1">
                <div
                  className={`aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4 overflow-hidden ${coverLoaded ? "cursor-pointer" : ""}`}
                  onClick={() => coverLoaded && setShowPreview(true)}
                >
                  {(resource.coverImage || resource.isbn) ? (
                    <img
                      src={resolveCoverUrl(resource.coverImage, resource.isbn)?.src ?? ""}
                      alt={resource.title}
                      className="w-full h-full object-cover rounded-lg"
                      onLoad={(e) => {
                        if (e.currentTarget.naturalWidth <= 1) {
                          e.currentTarget.style.display = "none";
                        } else {
                          setCoverLoaded(true);
                        }
                      }}
                      onError={(e) => {
                        const fb = resolveCoverUrl(resource.coverImage, resource.isbn)?.fallback;
                        if (fb && e.currentTarget.src !== fb) { e.currentTarget.src = fb; return; }
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  {!coverLoaded && <BookOpen className="text-blue-300" size={80} />}
                </div>

                <div className="mb-4">
                  {availableCopies.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                      <CheckCircle size={20} />
                      <div>
                        <div className="font-semibold">Available</div>
                        <div className="text-sm">{availableCopies.length} of {resource.copies.length} copies ready</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg flex items-center gap-2">
                      <XCircle size={20} />
                      <div>
                        <div className="font-semibold">All Checked Out</div>
                        <div className="text-sm">No copies currently available</div>
                      </div>
                    </div>
                  )}
                </div>

                {session && availableCopies.length > 0 && !userHasCheckedOut && (
                  <button
                    onClick={() => handleCheckout(availableCopies[0].id)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Check Out Book
                  </button>
                )}

                {session && userHasCheckedOut && (
                  <div className="w-full bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm text-center font-medium">
                    You have this book checked out
                  </div>
                )}

                {session && availableCopies.length === 0 && !userHasCheckedOut && !userHold && (
                  <button
                    onClick={handleHold}
                    className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Place Hold
                  </button>
                )}

                {session && userHold && (
                  <button
                    onClick={() => handleCancelHold(userHold.id)}
                    className="w-full bg-red-50 border border-red-300 text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    Cancel Your Hold
                  </button>
                )}

                {isManager && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={startEditing}
                      className="flex-1 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xl text-gray-600">by {resource.author}</p>
                  {resource._avgRating !== null && (
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= Math.round(resource._avgRating!) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {resource._avgRating.toFixed(1)} ({resource.reviews.length})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {resource.tags.map((t) => (
                    <span
                      key={t.tag.name}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>

                {resource.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{resource.description}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Book Details</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resource.isbn && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ISBN</dt>
                        <dd className="mt-1 text-sm text-gray-900">{resource.isbn}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Author</dt>
                      <dd className="mt-1 text-sm text-gray-900">{resource.author}</dd>
                    </div>
                    {resource.publisher && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Publisher</dt>
                        <dd className="mt-1 text-sm text-gray-900">{resource.publisher}</dd>
                      </div>
                    )}
                    {resource.year && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Year</dt>
                        <dd className="mt-1 text-sm text-gray-900">{resource.year}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{resource.type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Availability</dt>
                      <dd className="mt-1">
                        {availableCopies.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                            <CheckCircle size={14} />
                            {availableCopies.length} available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-orange-700 font-medium">
                            <XCircle size={14} />
                            All checked out
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {resource.digitalUrl && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <a
                      href={resource.digitalUrl}
                      className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                    >
                      Access Digital Resource
                    </a>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Copies ({resource.copies.length})</h2>
                  <div className="space-y-2">
                    {resource.copies.map((copy) => (
                      <div
                        key={copy.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {isManager && <span className="font-mono text-sm">{copy.barcode}</span>}
                          {copy.location && <span className="text-sm text-gray-500">{copy.location}</span>}
                          {copy.status === "AVAILABLE" ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                              <CheckCircle size={12} />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                              <XCircle size={12} />
                              {copy.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {resource.holds.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Holds ({resource.holds.length})</h2>
                    <div className="space-y-2">
                      {resource.holds.map((h, i) => (
                        <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-900">{h.user.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Reviews {resource.reviews.length > 0 && `(${resource.reviews.length})`}
                    </h2>
                    {session && !showReviewForm && (() => {
                      const existingReview = resource.reviews.find((r) => r.user.id === session.user.id);
                      return existingReview ? (
                        <button
                          onClick={() => startEditReview(existingReview)}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Edit Your Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Write a Review
                        </button>
                      );
                    })()}
                  </div>

                  {showReviewForm && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setReviewHover(star)}
                              onMouseLeave={() => setReviewHover(0)}
                            >
                              <Star
                                size={24}
                                className={`transition-colors ${
                                  star <= (reviewHover || reviewRating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review (optional)</label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this book..."
                          rows={3}
                          maxLength={500}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSubmitReview}
                          disabled={reviewRating === 0}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Submit Review
                        </button>
                        <button
                          onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewText(""); }}
                          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {resource.reviews.length === 0 && !showReviewForm ? (
                    <p className="text-sm text-gray-500">No reviews yet. Be the first to review this book!</p>
                  ) : (
                    <div className="space-y-4">
                      {resource.reviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{review.user.name}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {review.text && (
                                <p className="text-sm text-gray-700">{review.text}</p>
                              )}
                            </div>
                            {session && (review.user.id === session.user.id || isManager) && (
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showPreview && (resource.coverImage || resource.isbn) && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8 cursor-pointer"
            onClick={() => setShowPreview(false)}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <img
              src={resolveCoverUrl(resource.coverImage, resource.isbn)?.src ?? ""}
              alt={resource.title}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
