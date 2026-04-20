"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, User, Clock, AlertTriangle, ArrowLeft, X } from "lucide-react";

interface Checkout {
  id: string;
  checkedOutAt: string;
  dueDate: string;
  renewals: number;
  user: { id: string; name: string; email: string };
  copy: {
    barcode: string;
    resource: { id: string; title: string; author: string };
  };
}

export default function ManagerCheckoutsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/manager/checkouts")
      .then((r) => r.json())
      .then((data) => {
        setCheckouts(data);
        setLoading(false);
      });
  }, []);

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const now = new Date();

  const isOverdue = (dueDate: string) => new Date(dueDate) < now;

  const filtered = checkouts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.copy.resource.title.toLowerCase().includes(q) ||
      c.copy.resource.author.toLowerCase().includes(q) ||
      c.user.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.copy.barcode.toLowerCase().includes(q)
    );
  });

  const overdueCount = checkouts.filter((c) => isOverdue(c.dueDate)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/manager" className="text-blue-600 hover:underline text-sm flex items-center gap-1 mb-4">
            <ArrowLeft size={16} />
            Back to Manage
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Checkouts</h1>
          <p className="text-gray-600">
            {checkouts.length} book{checkouts.length !== 1 ? "s" : ""} currently checked out
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium ml-2">
                ({overdueCount} overdue)
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, author, member name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? "No matching checkouts" : "No active checkouts"}
            </h3>
            <p className="text-gray-600">
              {search ? "Try adjusting your search" : "All books are currently available"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Checked Out</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((c) => {
                    const overdue = isOverdue(c.dueDate);
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${overdue ? "bg-red-50" : ""}`}>
                        <td className="px-6 py-4">
                          <Link href={`/catalog/${c.copy.resource.id}`} className="font-medium text-blue-600 hover:underline">
                            {c.copy.resource.title}
                          </Link>
                          <div className="text-sm text-gray-500">{c.copy.resource.author}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{c.copy.barcode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {c.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{c.user.name}</div>
                              <div className="text-xs text-gray-500">{c.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(c.checkedOutAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(c.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {overdue ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <AlertTriangle size={12} />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <Clock size={12} />
                              On Time
                            </span>
                          )}
                          {c.renewals > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              Renewed {c.renewals}x
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
