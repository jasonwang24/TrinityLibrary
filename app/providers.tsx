"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState, useRef, createContext, useContext, useCallback } from "react";

const EasterEggContext = createContext<{ trigger: () => void }>({ trigger: () => {} });
export const useEasterEgg = () => useContext(EasterEggContext);

function EasterEgg({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<{ id: number; emoji: string; left: number; delay: number }[]>([]);
  const keys = useRef<string[]>([]);
  const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown"];

  const trigger = useCallback(() => {
    const emojis = ["📖", "📚", "📕", "📗", "📘", "📙", "✨", "⭐"];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2500);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      keys.current.push(e.key);
      keys.current = keys.current.slice(-sequence.length);
      if (keys.current.join(",") === sequence.join(",")) {
        trigger();
        keys.current = [];
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [trigger]);

  return (
    <EasterEggContext.Provider value={{ trigger }}>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-2xl"
              style={{
                left: `${p.left}%`,
                top: "-30px",
                animationDelay: `${p.delay}s`,
                animation: `fall 2s ease-in forwards ${p.delay}s`,
              }}
            >
              {p.emoji}
            </div>
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translateY(105vh) rotate(${Math.random() > 0.5 ? '' : '-'}360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      {children}
    </EasterEggContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EasterEgg>{children}</EasterEgg>
    </SessionProvider>
  );
}
