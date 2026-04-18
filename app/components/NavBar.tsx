"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;
  const isManager = session?.user.role === "MANAGER";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <BookOpen size={24} />
            </div>
            <Link href="/" className="text-xl font-bold text-gray-900">
              Trinity Library
            </Link>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <Link
              href="/catalog"
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isActive("/catalog")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <BookOpen size={18} />
              Catalog
            </Link>

            {session && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <User size={18} />
                My Dashboard
              </Link>
            )}

            {isManager && (
              <>
                <Link
                  href="/manager"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isActive("/manager")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Settings size={18} />
                  Manage
                </Link>
              </>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            {session ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                    <div className="text-xs text-gray-500">{session.user.email}</div>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                      <div className="text-xs text-gray-500">{session.user.email}</div>
                      {isManager && (
                        <div className="mt-1">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Manager
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setSigningOut(true); signOut(); }}
                      disabled={signingOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {signingOut ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      {signingOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
