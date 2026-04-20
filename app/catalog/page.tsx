"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, BookOpen, CheckCircle, XCircle, Grid, List, ArrowLeft, ArrowRight, Star, Shuffle, X } from "lucide-react";
import { useEasterEgg } from "../providers";

interface Resource {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverImage?: string;
  copies: { id: string; status: string }[];
  tags: { tag: { id: string; name: string; color: string } }[];
  _avgRating: number | null;
  _reviewCount: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" /><div className="text-sm text-gray-500">Loading catalog...</div></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trigger: triggerEasterEgg } = useEasterEgg();
  const easterEggFired = useRef(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"gallery" | "spreadsheet">("gallery");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "checked-out">((searchParams.get("availability") as any) || "all");
  const [sliderPage, setSliderPage] = useState(parseInt(searchParams.get("page") || "1"));
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    setPage(1);
    setSliderPage(1);
  }, [debouncedSearch, tagFilter, availabilityFilter]);

  useEffect(() => {
    if (search.toLowerCase() === "trinity library" && !easterEggFired.current) {
      easterEggFired.current = true;
      triggerEasterEgg();
    } else if (search.toLowerCase() !== "trinity library") {
      easterEggFired.current = false;
    }
  }, [search, triggerEasterEgg]);

  useEffect(() => {
    setSliderPage(page);
  }, [page]);

  useEffect(() => {
    setLoading(true);
    const scrollY = window.scrollY;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (tagFilter) params.set("tag", tagFilter);
    if (availabilityFilter !== "all") params.set("availability", availabilityFilter);
    if (page > 1) params.set("page", String(page));

    // Sync to URL without triggering re-render
    const urlParams = params.toString();
    window.history.replaceState(null, "", `/catalog${urlParams ? `?${urlParams}` : ""}`);

    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    fetch(`/api/resources?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResources(data.resources);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
        requestAnimationFrame(() => window.scrollTo(0, scrollY));
      });
  }, [debouncedSearch, tagFilter, availabilityFilter, page]);

  const availableCount = (copies: Resource["copies"]) =>
    (copies || []).filter((c) => c.status === "AVAILABLE").length;

  const [surpriseLoading, setSurpriseLoading] = useState(false);

  async function pickRandomBook() {
    setSurpriseLoading(true);
    const res = await fetch("/api/resources?page=1&limit=200&availability=available");
    const data = await res.json();
    if (data.resources?.length > 0) {
      const random = data.resources[Math.floor(Math.random() * data.resources.length)];
      router.push(`/catalog/${random.id}`);
      // Don't set surpriseLoading to false — let it spin until navigation completes
    } else {
      setSurpriseLoading(false);
    }
  }

  const filteredResources = resources;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalog</h1>
            <p className="text-gray-600">Browse and search our collection of books</p>
          </div>
          <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setViewMode("gallery")}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                viewMode === "gallery"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Grid size={18} />
              Gallery
            </button>
            <button
              onClick={() => setViewMode("spreadsheet")}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                viewMode === "spreadsheet"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List size={18} />
              List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              onClick={pickRandomBook}
              disabled={surpriseLoading}
              className="px-4 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap text-sm disabled:opacity-50"
              title="Pick a random book"
            >
              {surpriseLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Shuffle size={16} />
              )}
              {surpriseLoading ? "Picking..." : "Surprise me"}
            </button>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter size={16} />
              Availability
            </label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setAvailabilityFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availabilityFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Books
              </button>
              <button
                onClick={() => setAvailabilityFilter("available")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availabilityFilter === "available"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setAvailabilityFilter("checked-out")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availabilityFilter === "checked-out"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Checked Out
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTagFilter("")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  tagFilter === ""
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setTagFilter(tag.name === tagFilter ? "" : tag.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    tagFilter === tag.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredResources.length} of {total} books
        </div>

        {loading && (
          <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        <div ref={contentRef}>
        {filteredResources.length === 0 && !loading ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "gallery" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((r) => {
              const available = availableCount(r.copies);
              return (
                <Link
                  key={r.id}
                  href={`/catalog/${r.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-50 relative flex items-center justify-center overflow-hidden">
                    {(r.coverImage || r.isbn) ? (
                      <img
                        src={r.coverImage
                          ? `https://books.google.com/books/content?id=${r.coverImage}&printsec=frontcover&img=1&zoom=3`
                          : `https://covers.openlibrary.org/b/isbn/${r.isbn}-L.jpg`}
                        alt={r.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          if (e.currentTarget.naturalWidth <= 1) {
                            e.currentTarget.style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                          }
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <BookOpen className={`text-blue-300 absolute ${r.coverImage || r.isbn ? "hidden" : ""}`} size={64} />
                    <div className="absolute top-2 right-2">
                      {available > 0 ? (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <CheckCircle size={12} />
                          Available
                        </div>
                      ) : (
                        <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <XCircle size={12} />
                          Checked Out
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{r.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{r.author}</p>
                    {r._avgRating !== null && (
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= Math.round(r._avgRating!) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{r._avgRating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.tags.slice(0, 2).map((t) => (
                        <span
                          key={t.tag.id}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                        >
                          {t.tag.name}
                        </span>
                      ))}
                      {r.tags.length > 2 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{r.tags.length - 2} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {available} / {r.copies.length} copies available
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResources.map((r) => {
                    const available = availableCount(r.copies);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/catalog/${r.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                            {r.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{r.author}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {r.tags.slice(0, 3).map((t) => (
                              <span key={t.tag.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                                {t.tag.name}
                              </span>
                            ))}
                            {r.tags.length > 3 && (
                              <span className="text-xs text-gray-500 px-1">+{r.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {available > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <CheckCircle size={12} />
                              {available} Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <XCircle size={12} />
                              Checked Out
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="flex items-center gap-4 w-full max-w-md">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={1}
                  max={totalPages}
                  value={sliderPage}
                  onChange={(e) => setSliderPage(Number(e.target.value))}
                  onMouseUp={() => setPage(sliderPage)}
                  onTouchEnd={() => setPage(sliderPage)}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:transition-colors"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">1</span>
                  <span className="text-xs text-gray-400">{totalPages}</span>
                </div>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Page {sliderPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
