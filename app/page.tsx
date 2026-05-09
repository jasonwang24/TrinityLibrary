"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useCallback } from "react";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import WelcomeAnimation from "./components/WelcomeAnimation";

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

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    window.history.replaceState({}, "", "/");
  }, []);

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

          <div className={`flex gap-3 w-full ${sessionLoading ? "opacity-0" : "opacity-100"}`} style={{ minWidth: "360px" }}>
            {session ? (
              <>
                <Link
                  href="/catalog"
                  className="flex-1 bg-white text-blue-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-black/10 whitespace-nowrap"
                >
                  <Search size={18} />
                  Browse Catalog
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-white/15 text-white border border-white/20 px-6 py-3.5 rounded-xl font-semibold hover:bg-white/25 transition-all text-center flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  My Dashboard
                  <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="flex-1 bg-white text-blue-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* decorative book icons */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1 opacity-[0.08]">
        {Array.from({ length: 7 }).map((_, i) => (
          <BookOpen key={i} size={28} className="text-white" strokeWidth={1} />
        ))}
      </div>
    </div>
    </>
  );
}
