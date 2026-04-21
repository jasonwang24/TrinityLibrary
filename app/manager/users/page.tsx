"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Shield, ShieldOff, X, Trash2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "MANAGER";
  createdAt: string;
};

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ text: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  function showMessage(text: string, kind: "success" | "error" = "success") {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 3000);
  }

  async function toggleRole(user: User) {
    const nextRole = user.role === "MANAGER" ? "MEMBER" : "MANAGER";
    const verb = nextRole === "MANAGER" ? "Promote" : "Demote";
    if (!confirm(`${verb} ${user.name} (${user.email}) to ${nextRole.toLowerCase()}?`)) return;

    setBusyId(user.id);
    const res = await fetch(`/api/users/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    setBusyId(null);

    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showMessage(`${updated.name} is now a ${nextRole.toLowerCase()}`);
    } else {
      const data = await res.json().catch(() => ({}));
      showMessage(data.error || "Update failed", "error");
    }
  }

  async function deleteUser(user: User) {
    const typed = prompt(
      `This permanently deletes ${user.name} and all their checkout, hold, and review history. Type their email (${user.email}) to confirm:`,
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== user.email.toLowerCase()) {
      showMessage("Email didn't match — deletion cancelled", "error");
      return;
    }

    setBusyId(user.id);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    setBusyId(null);

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showMessage(`${user.name} deleted`);
    } else {
      const data = await res.json().catch(() => ({}));
      showMessage(data.error || "Delete failed", "error");
    }
  }

  if (!session || session.user.role !== "MANAGER") return null;

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/manager"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Manage
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users size={32} />
            Manage Users
          </h1>
          <p className="text-gray-600">Promote members to managers or demote managers to members.</p>
        </div>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm ${
              message.kind === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No users found</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map((u) => {
                const isSelf = u.id === session.user.id;
                const isManager = u.role === "MANAGER";
                return (
                  <li
                    key={u.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{u.name}</span>
                        {isManager && (
                          <span
                            className="inline-block text-xs px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: "#967e50" }}
                          >
                            Manager
                          </span>
                        )}
                        {isSelf && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{u.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={busyId === u.id || (isSelf && isManager)}
                        title={isSelf && isManager ? "You can't remove your own manager access" : ""}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isManager
                            ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isManager ? <ShieldOff size={16} /> : <Shield size={16} />}
                        {busyId === u.id
                          ? "Updating..."
                          : isManager
                            ? "Remove manager"
                            : "Make manager"}
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
