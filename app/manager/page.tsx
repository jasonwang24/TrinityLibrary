"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") {
      router.push("/");
    }
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem" }}>Manager Panel</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Link href="/manager/add-resource" style={cardStyle}>
          <h2 style={{ fontWeight: 600 }}>Add Resource</h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Catalog a new book, e-book, or journal</p>
        </Link>

        <Link href="/manager/scan" style={cardStyle}>
          <h2 style={{ fontWeight: 600 }}>Scan Barcode</h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Check in/out via barcode scan</p>
        </Link>

        <Link href="/manager/tags" style={cardStyle}>
          <h2 style={{ fontWeight: 600 }}>Manage Tags</h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Create and edit custom tags</p>
        </Link>

        <Link href="/catalog" style={cardStyle}>
          <h2 style={{ fontWeight: 600 }}>Browse Catalog</h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>View and edit all resources</p>
        </Link>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "1.5rem",
  border: "1px solid #e5e7eb",
  borderRadius: "0.5rem",
  textDecoration: "none",
  color: "inherit",
};
