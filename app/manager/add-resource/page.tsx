"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Search } from "lucide-react";

export default function AddResourcePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverImage: "",
    type: "BOOK",
    publisher: "",
    year: "",
    digitalUrl: "",
    copies: "1",
    location: "",
  });
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isbnLookup, setIsbnLookup] = useState(false);
  const [coverSearch, setCoverSearch] = useState("");
  const [coverResults, setCoverResults] = useState<{ id: string; title: string; thumbnail?: string }[]>([]);
  const [coverSearching, setCoverSearching] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  async function lookupISBN() {
    const normalizedIsbn = form.isbn.replace(/[-\s]/g, "");
    if (!normalizedIsbn) return;
    setIsbnLookup(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data`
      );
      if (res.ok) {
        const data = await res.json();
        const book = data[`ISBN:${normalizedIsbn}`];
        if (book) {
          setForm((prev) => ({
            ...prev,
            title: book.title || prev.title,
            author:
              book.authors?.map((a: { name: string }) => a.name).join(", ") ||
              prev.author,
            publisher: book.publishers?.[0]?.name || prev.publisher,
            year: book.publish_date?.match(/\d{4}/)?.[0] || prev.year,
          }));
          setMessage("ISBN lookup successful!");
          setMessageType("success");
        } else {
          setMessage("ISBN not found in Open Library");
          setMessageType("error");
        }
      } else {
        setMessage("ISBN not found in Open Library");
        setMessageType("error");
      }
    } catch {
      setMessage("ISBN lookup failed");
      setMessageType("error");
    }
    setIsbnLookup(false);
    setTimeout(() => setMessage(""), 3000);
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
        isbn: form.isbn.replace(/[-\s]/g, "") || undefined,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        digitalUrl: form.digitalUrl || undefined,
        publisher: form.publisher || undefined,
        location: form.location ? `Shelf ${form.location}` : undefined,
      }),
    });

    if (res.ok) {
      const resource = await res.json();
      router.push(`/catalog/${resource.id}`);
    } else {
      const data = await res.json();
      setMessage(JSON.stringify(data.error));
      setMessageType("error");
    }
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

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  if (!session || session.user.role !== "MANAGER") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/manager"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Manage
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BookOpen size={32} />
            Add New Resource
          </h1>
          <p className="text-gray-600">Enter the details of the new book to add to the library</p>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            messageType === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
              <div className="flex gap-2">
                <input
                  placeholder="978-0-00-000000-0"
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={lookupISBN}
                  disabled={isbnLookup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Search size={18} />
                  {isbnLookup ? "Looking up..." : "Lookup"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                placeholder="Enter book title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
              <input
                placeholder="Enter author name"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter a brief description of the book"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
              <div className="flex gap-3 mb-3">
                {form.coverImage && (
                  <img src={form.coverImage} alt="Cover" className="w-16 h-24 object-cover rounded shadow-sm shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coverSearch}
                      onChange={(e) => setCoverSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchGoogleBooks())}
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
                  {form.coverImage && (
                    <button type="button" onClick={() => setForm({ ...form, coverImage: "" })} className="text-xs text-red-500 hover:underline">
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
                      onClick={() => { setForm({ ...form, coverImage: result.thumbnail ?? "" }); setCoverResults([]); setCoverSearch(""); }}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${form.coverImage === result.thumbnail ? "border-blue-500" : "border-transparent hover:border-blue-300"}`}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BOOK">Book</option>
                <option value="EBOOK">E-Book</option>
                <option value="JOURNAL">Journal</option>
                <option value="MAGAZINE">Magazine</option>
                <option value="AUDIOBOOK">Audiobook</option>
                <option value="DVD">DVD</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                <input
                  placeholder="Publisher name"
                  value={form.publisher}
                  onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  placeholder="2024"
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {["EBOOK", "JOURNAL", "MAGAZINE", "AUDIOBOOK"].includes(form.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital URL</label>
                <input
                  placeholder="https://example.com/resource"
                  value={form.digitalUrl}
                  onChange={(e) => setForm({ ...form, digitalUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  value={form.copies}
                  onChange={(e) => setForm({ ...form, copies: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shelf</label>
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <span className="pl-4 pr-2 text-gray-500 select-none">Shelf</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="3"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="flex-1 py-2 pr-4 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {selectedTags.includes(tag.id) ? "✓ " : "+ "}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Resource to Library
              </button>
              <button
                type="button"
                onClick={() => router.push("/manager")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
