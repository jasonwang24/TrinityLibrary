"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { BookOpen, Sparkles } from "lucide-react";

interface FloatingBook {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

interface Sparkle {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
}

export default function WelcomeAnimation({
  userName,
  onComplete,
}: {
  userName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<
    "enter" | "card" | "stamp" | "text" | "exit"
  >("enter");

  const books = useMemo<FloatingBook[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
        size: 16 + Math.random() * 20,
        opacity: 0.08 + Math.random() * 0.12,
      })),
    []
  );

  const sparkles = useMemo<Sparkle[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        top: 10 + Math.random() * 80,
        delay: 1 + Math.random() * 3,
        size: 4 + Math.random() * 8,
      })),
    []
  );

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("card"), 300),
      setTimeout(() => setPhase("stamp"), 1000),
      setTimeout(() => setPhase("text"), 1600),
      setTimeout(() => setPhase("exit"), 4200),
      setTimeout(onComplete, 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const firstName = userName.split(" ")[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #0e4b6c 0%, #082a3e 50%, #051c2a 100%)",
        animation:
          phase === "exit" ? "welcomeFadeOut 0.8s ease-in forwards" : undefined,
      }}
    >
      {/* floating books background */}
      {books.map((book) => (
        <div
          key={book.id}
          className="absolute text-blue-300"
          style={{
            left: `${book.left}%`,
            bottom: "-40px",
            opacity: 0,
            animation: `welcomeFloat ${book.duration}s ease-in-out ${book.delay}s infinite`,
          }}
        >
          <BookOpen size={book.size} strokeWidth={1} />
        </div>
      ))}

      {/* sparkle particles */}
      {(phase === "stamp" || phase === "text" || phase === "exit") &&
        sparkles.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-gold"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: 0,
              animation: `welcomeSparkle 2s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}

      {/* main card */}
      <div
        className="relative"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform:
            phase === "enter" ? "translateY(60px) scale(0.9)" : "translateY(0) scale(1)",
          transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* glow behind card */}
        <div
          className="absolute -inset-8 rounded-3xl"
          style={{
            background:
              "radial-gradient(ellipse, rgba(198, 175, 125, 0.3) 0%, transparent 70%)",
            opacity: phase === "stamp" || phase === "text" || phase === "exit" ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />

        <div
          className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl shadow-2xl px-10 py-8 sm:px-14 sm:py-10 text-center overflow-hidden"
          style={{ minWidth: "320px", maxWidth: "440px" }}
        >
          {/* decorative border */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: "2px solid rgba(198, 175, 125, 0.4)",
              boxShadow:
                "inset 0 0 30px rgba(198, 175, 125, 0.08), 0 25px 60px rgba(0,0,0,0.4)",
            }}
          />

          {/* gold accent line at top */}
          <div
            className="absolute top-0 left-1/2 h-1 bg-gradient-to-r from-transparent via-gold to-transparent rounded-b"
            style={{
              width: phase === "stamp" || phase === "text" || phase === "exit" ? "80%" : "0%",
              transform: "translateX(-50%)",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          {/* logo */}
          <div
            className="flex justify-center mb-6"
            style={{
              opacity: phase === "enter" ? 0 : 1,
              transform:
                phase === "stamp" || phase === "text" || phase === "exit"
                  ? "scale(1)"
                  : "scale(0.5)",
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
            }}
          >
            <Image
              src="/trinity-logo-vertical.png"
              alt="Trinity Cambridge Church"
              width={160}
              height={200}
              className="mx-auto"
              priority
            />
          </div>

          {/* member card stamp */}
          <div
            className="relative mb-3"
            style={{
              transform:
                phase === "stamp" || phase === "text" || phase === "exit"
                  ? "scale(1)"
                  : "scale(1.8)",
              opacity:
                phase === "stamp" || phase === "text" || phase === "exit" ? 1 : 0,
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <p className="text-sm text-gray-500 mb-1">Member</p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {firstName}
            </h1>
          </div>

          {/* sparkle icon next to name */}
          <div
            className="flex items-center justify-center gap-2 mb-6"
            style={{
              opacity: phase === "text" || phase === "exit" ? 1 : 0,
              transform:
                phase === "text" || phase === "exit"
                  ? "translateY(0)"
                  : "translateY(10px)",
              transition: "all 0.5s ease",
            }}
          >
            <Sparkles size={16} className="text-gold" />
            <p className="text-sm text-gray-500">Your reading adventure begins</p>
            <Sparkles size={16} className="text-gold" />
          </div>

          {/* divider */}
          <div
            className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-5"
            style={{
              opacity: phase === "text" || phase === "exit" ? 1 : 0,
              transition: "opacity 0.5s ease 0.2s",
            }}
          />

          {/* stats row */}
          <div
            className="flex justify-center gap-8 text-center"
            style={{
              opacity: phase === "text" || phase === "exit" ? 1 : 0,
              transform:
                phase === "text" || phase === "exit"
                  ? "translateY(0)"
                  : "translateY(15px)",
              transition: "all 0.5s ease 0.2s",
            }}
          >
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-xs text-gray-500">Books Read</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-blue-600">&infin;</div>
              <div className="text-xs text-gray-500">Possibilities</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
