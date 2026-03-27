"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send } from "lucide-react";

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const pathname = usePathname();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    await fetch("/api/bug-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, message: message.trim() }),
    });

    setSending(false);
    setSubmitted(true);
    setMessage("");
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
    }, 2000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="font-semibold text-gray-900 text-sm">Report a Bug</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          {submitted ? (
            <div className="p-6 text-center">
              <div className="text-green-600 font-medium mb-1">Thanks!</div>
              <div className="text-sm text-gray-500">Your report has been submitted.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                maxLength={1000}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{message.length}/1000</span>
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center ml-auto"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
