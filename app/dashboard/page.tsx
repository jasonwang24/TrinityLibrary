"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  function fetchData() {
    fetch("/api/user/checkouts").then((r) => r.json()).then(setCheckouts);
    fetch("/api/user/holds").then((r) => r.json()).then(setHolds);
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
    }
  }

  if (status === "loading") return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!session) return null;

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const readyHolds = holds.filter((h) => h.status === "FULFILLED");
  const activeHolds = holds.filter((h) => h.status === "ACTIVE");

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>My Dashboard</h1>

      {message && (
        <p style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.375rem", marginBottom: "1rem" }}>
          {message}
        </p>
      )}

      {readyHolds.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem", color: "#125f89" }}>
            Ready for Pickup ({readyHolds.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {readyHolds.map((hold) => (
              <div
                key={hold.id}
                style={{
                  padding: "1rem",
                  border: "2px solid #c6af7d",
                  borderRadius: "0.5rem",
                  background: "#fefce8",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ fontWeight: 600 }}>{hold.resource.title}</h3>
                    <p style={{ color: "#666", fontSize: "0.875rem" }}>{hold.resource.author}</p>
                    <p style={{ fontSize: "0.875rem", color: "#967e50", marginTop: "0.25rem" }}>
                      Your hold is ready! Pick up within 3 days.
                    </p>
                    {hold.notifiedAt && (
                      <p style={{ fontSize: "0.75rem", color: "#999" }}>
                        Available since: {new Date(hold.notifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {hold.resource.copies.length > 0 && (
                      <button onClick={() => handlePickupHold(hold.resource.copies[0].id)} style={btnSmall}>
                        Check Out
                      </button>
                    )}
                    <button onClick={() => handleCancelHold(hold.id)} style={{ ...btnSmall, background: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Current Checkouts ({checkouts.length})
      </h2>

      {checkouts.length === 0 ? (
        <p style={{ color: "#666", marginBottom: "2rem" }}>No active checkouts. <Link href="/catalog" style={{ color: "#125f89" }}>Browse the catalog</Link>.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {checkouts.map((co) => (
            <div
              key={co.id}
              style={{
                padding: "1rem",
                border: `1px solid ${isOverdue(co.dueDate) ? "#fecaca" : "#e5e7eb"}`,
                borderRadius: "0.5rem",
                background: isOverdue(co.dueDate) ? "#fef2f2" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{co.copy.resource.title}</h3>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>{co.copy.resource.author}</p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    Barcode: <span style={{ fontFamily: "monospace" }}>{co.copy.barcode}</span>
                  </p>
                  <p style={{ fontSize: "0.875rem", color: isOverdue(co.dueDate) ? "#ef4444" : "#666" }}>
                    Due: {new Date(co.dueDate).toLocaleDateString()}
                    {isOverdue(co.dueDate) && " (OVERDUE)"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#999" }}>Renewals used: {co.renewals}/2</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {co.renewals < 2 && (
                    <button onClick={() => handleRenew(co.id)} style={{ ...btnSmall, background: "#967e50" }}>
                      Renew
                    </button>
                  )}
                  <button onClick={() => handleReturn(co.copy.barcode)} style={btnSmall}>
                    Return
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeHolds.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Active Holds ({activeHolds.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activeHolds.map((hold) => (
              <div
                key={hold.id}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ fontWeight: 600 }}>{hold.resource.title}</h3>
                    <p style={{ color: "#666", fontSize: "0.875rem" }}>{hold.resource.author}</p>
                    <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                      Placed: {new Date(hold.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => handleCancelHold(hold.id)} style={{ ...btnSmall, background: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

const btnSmall: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  background: "#125f89",
  color: "white",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
  fontSize: "0.875rem",
};
