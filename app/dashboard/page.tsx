"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, BookOpen, Clock, Calendar, AlertCircle, CheckCircle, History } from "lucide-react";

interface Checkout {
  id: string;
  checkedOutAt: string;
  dueDate: string;
  renewals: number;
  copy: {
    barcode: string;
    resource: { title: string; author: string };
  };
}

interface Hold {
  id: string;
  status: string;
  createdAt: string;
  notifiedAt?: string;
  resource: {
    id: string;
    title: string;
    author: string;
    copies: { id: string; barcode: string }[];
  };
}

interface HistoryItem {
  id: string;
  checkedOutAt: string;
  returnedAt: string;
  copy: {
    resource: { id: string; title: string; author: string };
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  function fetchData() {
    fetch("/api/user/checkouts").then((r) => r.json()).then(setCheckouts);
    fetch("/api/user/holds").then((r) => r.json()).then(setHolds);
    fetch("/api/user/history").then((r) => r.json()).then(setHistory);
  }

  async function handleReturn(barcode: string) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });
    if (res.ok) {
      setMessage("Returned successfully!");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleRenew(checkoutId: string) {
    const res = await fetch("/api/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Renewed! New due date: " + new Date(data.dueDate).toLocaleDateString());
      fetchData();
    } else {
      setMessage(data.error);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handlePickupHold(copyId: string) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copyId }),
    });
    if (res.ok) {
      setMessage("Checked out successfully!");
      fetchData();
    } else {
      const data = await res.json();
      setMessage(data.error);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleCancelHold(holdId: string) {
    const res = await fetch("/api/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdId }),
    });
    if (res.ok) {
      setMessage("Hold cancelled.");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }
  if (!session) return null;

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const readyHolds = holds.filter((h) => h.status === "FULFILLED");
  const activeHolds = holds.filter((h) => h.status === "ACTIVE");
  const isManager = session.user.role === "MANAGER";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl">
              {session.user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{session.user.name}</h1>
              <p className="text-gray-600 mb-2">{session.user.email}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <User size={14} />
                  Active Member
                </span>
                {isManager && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Manager
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{checkouts.length}</div>
              <div className="text-sm text-gray-600">Books Checked Out</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{holds.length}</div>
              <div className="text-sm text-gray-600">Books on Hold</div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        {readyHolds.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 text-amber-700">
              <AlertCircle size={24} />
              Ready for Pickup ({readyHolds.length})
            </h2>
            <div className="space-y-4">
              {readyHolds.map((hold) => (
                <div key={hold.id} className="bg-amber-50 rounded-lg shadow-sm border-2 border-amber-300 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{hold.resource.title}</h3>
                      <p className="text-gray-600 text-sm">{hold.resource.author}</p>
                      <p className="text-sm text-amber-700 mt-1">Your hold is ready! Pick up within 3 days.</p>
                      {hold.notifiedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available since: {formatDate(hold.notifiedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {hold.resource.copies.length > 0 && (
                        <button
                          onClick={() => handlePickupHold(hold.resource.copies[0].id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelHold(hold.id)}
                        className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={24} />
              Checked Out Books
            </h2>

            {checkouts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <BookOpen className="mx-auto text-gray-400 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No books checked out</h3>
                <p className="text-gray-600 mb-4">Browse the library to find books to read</p>
                <Link
                  href="/catalog"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {checkouts.map((co) => {
                  const daysUntilDue = getDaysUntilDue(co.dueDate);
                  const overdue = isOverdue(co.dueDate);
                  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

                  return (
                    <div key={co.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{co.copy.resource.title}</h3>
                        {(overdue || isDueSoon) && (
                          <AlertCircle size={20} className={overdue ? "text-red-500" : "text-orange-500"} />
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} />
                          <span>Checked out: {formatDate(co.checkedOutAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span className={
                            overdue ? "text-red-600 font-medium" :
                            isDueSoon ? "text-orange-600 font-medium" : "text-gray-600"
                          }>
                            Due: {formatDate(co.dueDate)}
                            {overdue && " (Overdue)"}
                            {isDueSoon && !overdue && ` (${daysUntilDue} days left)`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Renewals: {co.renewals}/2</p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {co.renewals < 2 && !overdue && (
                          <button
                            onClick={() => handleRenew(co.id)}
                            className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                          >
                            Request Extension (+14 days)
                          </button>
                        )}
                        <button
                          onClick={() => handleReturn(co.copy.barcode)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={24} />
              Active Holds
            </h2>

            {activeHolds.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Clock className="mx-auto text-gray-400 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No holds placed</h3>
                <p className="text-gray-600">You can place holds on checked-out books</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeHolds.map((hold) => (
                  <div key={hold.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <Link
                      href={`/catalog/${hold.resource.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 block mb-3"
                    >
                      {hold.resource.title}
                    </Link>

                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">{hold.resource.author}</p>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>Requested: {formatDate(hold.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelHold(hold.id)}
                      className="mt-3 w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      Cancel Hold
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History size={24} />
              Reading History
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Checked Out</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Returned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/catalog/${item.copy.resource.id}`} className="font-medium text-blue-600 hover:underline">
                          {item.copy.resource.title}
                        </Link>
                        <div className="text-sm text-gray-500">{item.copy.resource.author}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.checkedOutAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.returnedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
