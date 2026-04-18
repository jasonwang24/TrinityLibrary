"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { IScannerControls } from "@zxing/browser";
import Link from "next/link";
import { ArrowLeft, QrCode, Camera, AlertCircle, CheckCircle } from "lucide-react";

export default function ScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [mode, setMode] = useState<"checkin" | "checkout">("checkout");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  async function startScanner() {
    setScanning(true);
    setMessage("");
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      if (!videoRef.current) throw new Error("Video element not mounted");

      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, _err, controls) => {
          if (result) {
            setBarcode(result.getText());
            controls.stop();
            controlsRef.current = null;
            setScanning(false);
          }
        }
      );
    } catch {
      setMessage("Camera access denied or scanner error");
      setMessageType("error");
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode) return;

    const endpoint = mode === "checkout" ? "/api/checkout" : "/api/checkin";
    const cleaned = barcode.replace(/[-\s]/g, "");
    // If it looks like an ISBN (digits, possibly with X), send as isbn; otherwise as barcode
    const isIsbn = /^[\dX]{10,13}$/i.test(cleaned);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isIsbn ? { isbn: cleaned } : { barcode }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`${mode === "checkout" ? "Checked out" : "Checked in"} successfully!`);
      setMessageType("success");
      setBarcode("");
    } else {
      setMessage(data.error);
      setMessageType("error");
    }
    setTimeout(() => setMessage(""), 3000);
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

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-600 rounded-full p-4">
              <QrCode size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Barcode Scanner</h1>
          <p className="text-gray-600">
            Scan a book&apos;s barcode to check it in or out
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
            <button
              onClick={() => setMode("checkout")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                mode === "checkout"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Check Out
            </button>
            <button
              onClick={() => setMode("checkin")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                mode === "checkin"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Check In
            </button>
          </div>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
              messageType === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {messageType === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message}</span>
            </div>
          )}

          <div className="mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full max-w-md mx-auto rounded-lg ${scanning ? "" : "hidden"}`}
            />
            {!scanning && (
              <div className="aspect-square max-w-md mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Camera className="mx-auto text-gray-400 mb-4" size={64} />
                  <p className="text-gray-600 mb-4">Camera preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center mb-6">
            {scanning ? (
              <button
                onClick={stopScanner}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Camera size={20} />
                Stop Scanning
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Camera size={20} />
                Start Scanning
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">Or enter ISBN / barcode manually</p>
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                placeholder="Enter barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {mode === "checkout" ? "Check Out" : "Check In"}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Select &quot;Check Out&quot; or &quot;Check In&quot; mode</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Click &quot;Start Scanning&quot; to activate your camera, or enter the barcode manually</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Point your camera at the book&apos;s barcode and it will be detected automatically</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
