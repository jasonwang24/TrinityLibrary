"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<"start" | "logo" | "text" | "out" | "done">("start");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("logo"), 200),
      setTimeout(() => setPhase("text"), 1000),
      setTimeout(() => setPhase("out"), 2500),
      setTimeout(() => setPhase("done"), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase === "done") return null;

  const visible = phase !== "start";
  const textVisible = phase === "text" || phase === "out";
  const isOut = phase === "out";

  const rays = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    delay: 0.1 + i * 0.05,
  }));

  const sparkles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 80 + seededRandom(i + 1) * 60;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 2 + seededRandom(i + 100) * 3,
      delay: 0.4 + seededRandom(i + 200) * 0.6,
    };
  });

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #051c2a 0%, #0e4b6c 50%, #125f89 100%)",
        opacity: isOut ? 0 : 1,
        transform: isOut ? "scale(1.1)" : "scale(1)",
        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* everything anchored to true center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(8, 171, 219, 0.15) 0%, rgba(198, 175, 125, 0.05) 40%, transparent 70%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.2)",
            transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* logo + text group */}
        <div className="flex flex-col items-center">
          <div
            className="relative"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.88)",
              transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* rays + sparkles anchored to logo center */}
            <div className="absolute inset-0 flex items-center justify-center overflow-visible">
              {mounted && rays.map((ray, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: 600,
                    height: 2,
                    background: "linear-gradient(to right, transparent, rgba(198, 175, 125, 0.06) 30%, rgba(198, 175, 125, 0.1) 50%, rgba(198, 175, 125, 0.06) 70%, transparent)",
                    opacity: 0,
                    ["--ray-angle" as string]: `${ray.angle}deg`,
                    transform: `rotate(${ray.angle}deg) scaleX(0)`,
                    animation: visible && !isOut
                      ? `splashRay 2s ease-out ${ray.delay}s forwards`
                      : undefined,
                  }}
                />
              ))}
              {mounted && sparkles.map((s, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-gold/60"
                  style={{
                    width: s.size,
                    height: s.size,
                    opacity: 0,
                    animation: textVisible
                      ? `splashSparkle 1s ease-out ${s.delay}s forwards`
                      : undefined,
                    ["--tx" as string]: `${s.x}px`,
                    ["--ty" as string]: `${s.y}px`,
                  }}
                />
              ))}
            </div>
            <Image
              src="/trinity-logo-vertical.png"
              alt="Trinity Cambridge Church"
              width={160}
              height={200}
              priority
              className="brightness-0 invert relative"
            />
            {/* shimmer sweep */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ opacity: textVisible ? 1 : 0 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  animation: textVisible ? "splashShimmer 0.8s ease-out 0.1s forwards" : undefined,
                  transform: "translateX(-100%)",
                }}
              />
            </div>
          </div>

          <div
            className="mt-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            style={{
              width: textVisible ? 220 : 0,
              transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          <p
            className="mt-3 text-blue-200/50 uppercase tracking-[0.35em] text-xs font-semibold"
            style={{
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.4s ease 0.15s",
            }}
          >
            Book Library
          </p>
        </div>
      </div>
    </div>
  );
}
