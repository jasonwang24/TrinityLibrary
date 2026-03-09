"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 text-white rounded-full p-6">
              <BookOpen size={48} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trinity Library
          </h1>
          <p className="text-gray-600 mb-8">
            Search the catalog, check out resources, and manage your holds.
          </p>

          <Link
            href="/catalog"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center mb-3"
          >
            Browse Catalog
          </Link>

          {session ? (
            <Link
              href="/dashboard"
              className="block w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Sign In
            </Link>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Access your library account to browse and checkout books
          </p>
        </div>
      </div>
    </div>
  );
}
