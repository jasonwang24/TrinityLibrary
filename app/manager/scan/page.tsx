"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function ScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [mode, setMode] = useState<"checkin" | "checkout">("checkout");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  async function startScanner() {
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      if (videoRef.current) {
        const result = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current);
        setBarcode(result.getText());
        setScanning(false);
      }
    } catch {
      setMessage("Camera access denied or scanner error");
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode) return;

    const endpoint = mode === "checkout" ? "/api/checkout" : "/api/checkin";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`${mode === "checkout" ? "Checked out" : "Checked in"} successfully!`);
      setBarcode("");
    } else {
      setMessage(data.error);
    }
  }

  if (!session || session.user.role !== "MANAGER") return null;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem" }}>
      <Link href="/manager" style={{ color: "#125f89", marginBottom: "1rem", display: "inline-block" }}>
        &larr; Manager Panel
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Barcode Scanner</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setMode("checkout")}
          style={{ ...tabStyle, background: mode === "checkout" ? "#125f89" : "#e5e7eb", color: mode === "checkout" ? "white" : "black" }}
        >
          Check Out
        </button>
        <button
          onClick={() => setMode("checkin")}
          style={{ ...tabStyle, background: mode === "checkin" ? "#125f89" : "#e5e7eb", color: mode === "checkin" ? "white" : "black" }}
        >
          Check In
        </button>
      </div>

      {message && <p style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.375rem", marginBottom: "1rem" }}>{message}</p>}

      {scanning && (
        <video ref={videoRef} style={{ width: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} />
      )}

      <button onClick={startScanner} disabled={scanning} style={{ ...btnStyle, marginBottom: "1rem", background: "#08abdb", width: "100%" }}>
        {scanning ? "Scanning..." : "Open Camera Scanner"}
      </button>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Or enter barcode manually..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          style={{ flex: 1, padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
        />
        <button type="submit" style={btnStyle}>
          {mode === "checkout" ? "Check Out" : "Check In"}
        </button>
      </form>
    </main>
  );
}

const tabStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
  fontWeight: 500,
};

const btnStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  background: "#125f89",
  color: "white",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
};
