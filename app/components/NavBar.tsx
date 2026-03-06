"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav style={{ background: "#125f89", color: "white", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link href="/" style={{ color: "white", textDecoration: "none", fontWeight: 700, fontSize: "1.1rem" }}>
          Trinity Library
        </Link>
        <Link href="/catalog" style={{ color: "#c6af7d", textDecoration: "none" }}>Catalog</Link>
        {session && (
          <Link href="/dashboard" style={{ color: "#c6af7d", textDecoration: "none" }}>My Dashboard</Link>
        )}
        {session?.user.role === "MANAGER" && (
          <Link href="/manager" style={{ color: "#c6af7d", textDecoration: "none" }}>Manager</Link>
        )}
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {session ? (
          <>
            <span style={{ fontSize: "0.875rem" }}>{session.user.name}</span>
            <button
              onClick={() => signOut()}
              style={{ background: "transparent", border: "1px solid #c6af7d", color: "#c6af7d", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" style={{ color: "#c6af7d", textDecoration: "none" }}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
