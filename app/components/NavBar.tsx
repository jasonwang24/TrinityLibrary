"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BookOpen, User, Settings, LogOut, ChevronDown, Menu, X, Trash2, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const sessionLoading = status === "loading";
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

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

  function openDeleteModal() {
    setShowUserMenu(false);
    setDeleteConfirmText("");
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!session) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/users/${session.user.id}`, { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Delete failed");
      setDeleting(false);
    }
  }

  const emailMatches =
    !!session?.user.email &&
    deleteConfirmText.trim().toLowerCase() === session.user.email.toLowerCase();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <Link href="/" className="flex items-center self-center">
            <Image
              src="/trinity-logo.png"
              alt="Trinity Cambridge Church"
              width={600}
              height={200}
              priority
              className="block h-8 sm:h-10 w-auto"
            />
          </Link>

          <div className={`absolute left-1/2 -translate-x-1/2 items-center gap-1 ${sessionLoading ? "hidden" : "hidden md:flex"}`}>
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

            {!sessionLoading && session && (
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

            {!sessionLoading && isManager && (
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
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="relative" ref={menuRef}>
            {sessionLoading ? null : session ? (
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
                          <span
                            className="inline-block text-xs px-2 py-1 rounded text-white"
                            style={{ backgroundColor: "#967e50" }}
                          >
                            Manager
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setSigningOut(true); signOut(); }}
                      disabled={signingOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {signingOut ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      {signingOut ? "Signing out..." : "Sign Out"}
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={openDeleteModal}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete account
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

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-2 flex flex-col gap-1">
            <Link
              href="/catalog"
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isActive("/catalog") ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <BookOpen size={18} />
              Catalog
            </Link>
            {!sessionLoading && session && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isActive("/dashboard") ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <User size={18} />
                My Dashboard
              </Link>
            )}
            {!sessionLoading && isManager && (
              <Link
                href="/manager"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isActive("/manager") ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Settings size={18} />
                Manage
              </Link>
            )}
          </div>
        )}
      </div>

      {showDeleteModal && session && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 text-red-600 rounded-full p-2 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 id="delete-account-title" className="text-lg font-semibold text-gray-900">
                  Delete your account?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  This permanently removes your account, checkout history, holds, and reviews.
                  This can't be undone.
                </p>
              </div>
            </div>

            <label className="block text-sm text-gray-700 mb-2">
              Type <span className="font-semibold">{session.user.email}</span> to confirm:
            </label>
            <input
              type="email"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deleting}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              placeholder={session.user.email || ""}
            />

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={!emailMatches || deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {deleting && (
                  <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
