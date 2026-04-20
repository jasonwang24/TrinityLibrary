"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 text-white rounded-full p-6">
              <BookOpen size={48} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset password</h1>

          {submitted ? (
            <>
              <p className="text-gray-600 mb-8">
                If an account exists for <span className="font-medium">{email}</span>, we&apos;ve
                sent password reset instructions. The link expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
              >
                <ArrowLeft size={18} />
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-8">
                Enter the email for your account and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail size={20} />
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="text-sm text-gray-600 mt-6">
                Remembered it?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
