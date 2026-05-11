"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X, BookOpen, Star, Save } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  isbn?: string;
}

interface SelectedBook {
  resourceId: string;
  resource: Resource;
  note: string;
  recommenderName: string;
}

interface FeaturedEntry {
  id: string;
  resourceId: string;
  note: string | null;
  recommenderName: string | null;
  resource: Resource;
}

const MAX_FEATURED = 6;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function coverUrl(r: Resource) {
  if (r.coverImage) return r.coverImage.startsWith("http") ? r.coverImage : `https://books.google.com/books/content?id=${r.coverImage}&printsec=frontcover&img=1&zoom=1`;
  if (r.isbn) return `https://covers.openlibrary.org/b/isbn/${r.isbn}-M.jpg`;
  return null;
}

export default function ManagerFeaturedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const now = new Date();
  const months = [
    { month: now.getMonth() + 1, year: now.getFullYear() },
    { month: now.getMonth() === 11 ? 1 : now.getMonth() + 2, year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear() },
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState<SelectedBook[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Resource[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  const { month, year } = months[activeTab];

  useEffect(() => {
    setSelected([]);
    fetch(`/api/manager/featured?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data: FeaturedEntry[]) => {
        setSelected(data.map((f) => ({ resourceId: f.resourceId, resource: f.resource, note: f.note ?? "", recommenderName: f.recommenderName ?? "" })));
      });
  }, [month, year]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const r = await fetch(`/api/resources?q=${encodeURIComponent(search)}&limit=8&page=1`);
      const data = await r.json();
      setResults(data.resources ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  function addBook(r: Resource) {
    if (selected.length >= MAX_FEATURED) return;
    if (selected.some((s) => s.resourceId === r.id)) return;
    setSelected((prev) => [...prev, { resourceId: r.id, resource: r, note: "", recommenderName: "" }]);
    setSearch("");
    setResults([]);
  }

  function removeBook(resourceId: string) {
    setSelected((prev) => prev.filter((s) => s.resourceId !== resourceId));
  }

  function updateNote(resourceId: string, note: string) {
    setSelected((prev) => prev.map((s) => s.resourceId === resourceId ? { ...s, note } : s));
  }

  function updateRecommender(resourceId: string, recommenderName: string) {
    setSelected((prev) => prev.map((s) => s.resourceId === resourceId ? { ...s, recommenderName } : s));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/manager/featured", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, books: selected.map((s) => ({ resourceId: s.resourceId, note: s.note || undefined, recommenderName: s.recommenderName || undefined })) }),
    });
    setSaving(false);
    setSavedMessage("Saved!");
    setTimeout(() => setSavedMessage(""), 3000);
  }

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredResults = results.filter((r) => !selected.some((s) => s.resourceId === r.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/manager" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft size={20} />
          Back to Manager
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Featured Books</h1>
          <p className="text-gray-600">Choose up to {MAX_FEATURED} books to spotlight each month</p>
        </div>

        {/* Month tabs */}
        <div className="flex gap-2 mb-6">
          {months.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === i
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {MONTH_NAMES[m.month - 1]} {m.year}
              {i === 0 && <span className="ml-1.5 text-xs opacity-70">(current)</span>}
            </button>
          ))}
        </div>

        {/* Selected books */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Selected{" "}
              <span className={`text-sm font-normal ${selected.length >= MAX_FEATURED ? "text-amber-600" : "text-gray-500"}`}>
                ({selected.length}/{MAX_FEATURED})
              </span>
            </h2>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {savedMessage && (
            <div className="mx-6 mt-4 px-4 py-2.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
              {savedMessage}
            </div>
          )}

          {selected.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              <Star size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No books selected yet — search below to add some</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {selected.map((s, i) => {
                const url = coverUrl(s.resource);
                return (
                  <li key={s.resourceId} className="flex items-start gap-4 px-6 py-4">
                    <span className="text-sm font-semibold text-gray-400 w-5 mt-1 shrink-0">{i + 1}</span>
                    <div className="w-10 h-14 bg-blue-50 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      {url ? (
                        <img src={url} alt={s.resource.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={20} className="text-blue-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{s.resource.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{s.resource.author}</p>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={s.recommenderName}
                          onChange={(e) => updateRecommender(s.resourceId, e.target.value)}
                          placeholder="Recommended by (e.g. Pastor John)"
                          maxLength={100}
                          className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={s.note}
                          onChange={(e) => updateNote(s.resourceId, e.target.value)}
                          placeholder="Add a note for readers (optional)"
                          maxLength={200}
                          className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeBook(s.resourceId)}
                      className="text-gray-400 hover:text-red-500 transition-colors mt-1 shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Add Books</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or author…"
                disabled={selected.length >= MAX_FEATURED}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 disabled:bg-gray-50"
              />
              {search && (
                <button onClick={() => { setSearch(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            {selected.length >= MAX_FEATURED && (
              <p className="text-xs text-amber-600 mt-2">Maximum of {MAX_FEATURED} books reached</p>
            )}
          </div>

          {searching && (
            <div className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {!searching && filteredResults.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {filteredResults.map((r) => {
                const url = coverUrl(r);
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => addBook(r)}
                      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-8 h-12 bg-blue-50 rounded overflow-hidden shrink-0 flex items-center justify-center">
                        {url ? (
                          <img src={url} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen size={16} className="text-blue-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{r.title}</p>
                        <p className="text-xs text-gray-500">{r.author}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-medium shrink-0">Add</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!searching && search && filteredResults.length === 0 && (
            <div className="px-6 py-6 text-sm text-gray-400 text-center">No results found</div>
          )}

          {!search && (
            <div className="px-6 py-6 text-sm text-gray-400 text-center">
              Type to search the catalog
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
