"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Trinity Library
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Search the catalog, check out resources, and manage your holds.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/catalog" style={linkStyle}>
          Browse Catalog
        </Link>
      </div>
    </main>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  background: "#125f89",
  color: "white",
  borderRadius: "0.5rem",
  textDecoration: "none",
  fontWeight: 500,
};
