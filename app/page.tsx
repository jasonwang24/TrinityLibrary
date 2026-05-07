"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useCallback, useEffect } from "react";
import { BookOpen, Search, ArrowRight, Star, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import WelcomeAnimation from "./components/WelcomeAnimation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface FeaturedEntry {
  id: string;
  note: string | null;
  resource: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    isbn?: string;
    copies: { status: string }[];
  };
}

function coverUrl(r: FeaturedEntry["resource"]) {
  if (r.coverImage) return `https://books.google.com/books/content?id=${r.coverImage}&printsec=frontcover&img=1&zoom=3`;
  if (r.isbn) return `https://covers.openlibrary.org/b/isbn/${r.isbn}-L.jpg`;
  return null;
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { data: session, status } = useSession();
  const sessionLoading = status === "loading";
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(
    searchParams.get("welcome") === "true"
  );
  const [featured, setFeatured] = useState<FeaturedEntry[]>([]);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    window.history.replaceState({}, "", "/");
  }, []);

  useEffect(() => {
    fetch("/api/featured").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setFeatured(data);
    });
  }, []);

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  return (
    <>
      {showWelcome && session && (
        <WelcomeAnimation
          userName={session.user.name || "Reader"}
          onComplete={handleWelcomeComplete}
        />
      )}
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
            backgroundSize: "120px 120px, 80px 80px, 100px 100px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/10 blur-3xl" />

        {/* content */}
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl px-10 py-10 flex flex-col items-center shadow-2xl shadow-black/20">
            <div className="mb-2">
              <Image
                src="/trinity-logo-vertical.png"
                alt="Trinity Cambridge Church"
                width={280}
                height={350}
                priority
                className="brightness-0 invert opacity-90"
              />
            </div>
            <p className="text-blue-200/70 uppercase tracking-[0.25em] text-sm font-semibold mb-8">
              Book Library
            </p>

            <div className="grid grid-cols-2 gap-3 w-full" style={{ minWidth: "360px" }}>
              <Link
                href="/catalog"
                className={`bg-white text-blue-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-black/10 whitespace-nowrap ${sessionLoading ? "opacity-0" : "opacity-100"}`}
              >
                <Search size={18} />
                Browse Catalog
              </Link>

              <Link
                href={session ? "/dashboard" : "/login"}
                className={`bg-white/15 text-white border border-white/20 px-6 py-3.5 rounded-xl font-semibold hover:bg-white/25 transition-all text-center flex items-center justify-center gap-2 whitespace-nowrap ${sessionLoading ? "opacity-0" : "opacity-100"}`}
              >
                {session ? "My Dashboard" : "Sign In"}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {featured.length > 0 && (
            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-white/50 animate-bounce">
              <span className="text-xs uppercase tracking-widest">Featured books</span>
              <ChevronDown size={18} />
            </div>
          )}
        </div>

        {/* decorative book icons */}
        {featured.length === 0 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1 opacity-[0.08]">
            {Array.from({ length: 7 }).map((_, i) => (
              <BookOpen key={i} size={28} className="text-white" strokeWidth={1} />
            ))}
          </div>
        )}
      </div>

      {featured.length > 0 && (
        <section className="bg-gray-50 py-16 px-4 border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline gap-3 mb-10">
              <Star size={22} className="text-yellow-400 fill-yellow-400 shrink-0 translate-y-0.5" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Featured This Month</h2>
                <p className="text-sm text-gray-500 mt-0.5">{monthName} picks from our librarians</p>
              </div>
            </div>

            <div className={`grid gap-6 ${
              featured.length === 1 ? "grid-cols-1 max-w-xs" :
              featured.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-lg" :
              featured.length <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" :
              "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6"
            }`}>
              {featured.map((entry) => {
                const r = entry.resource;
                const url = coverUrl(r);
                const available = r.copies.filter((c) => c.status === "AVAILABLE").length;
                return (
                  <Link
                    key={entry.id}
                    href={`/catalog/${r.id}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="aspect-[2/3] bg-gradient-to-br from-blue-100 to-indigo-50 relative overflow-hidden">
                      {url ? (
                        <img
                          src={url}
                          alt={r.title}
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
                      <div className={`absolute inset-0 flex items-center justify-center ${url ? "hidden" : ""}`}>
                        <BookOpen size={48} className="text-blue-200" strokeWidth={1} />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2.5 right-2.5">
                        {available > 0 ? (
                          <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                            <CheckCircle size={10} />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-white/80 backdrop-blur-sm text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                            <XCircle size={10} />
                            Out
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{r.author}</p>
                      {entry.note && (
                        <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-3 border-t border-gray-100 pt-2 mt-2">
                          &ldquo;{entry.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
