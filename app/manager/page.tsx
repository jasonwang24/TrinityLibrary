"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Plus, Tag, ClipboardList } from "lucide-react";

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "MANAGER") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session, router]);

  if (status === "loading" || !session || session.user.role !== "MANAGER") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const cards = [
    {
      href: "/manager/add-resource",
      icon: <Plus size={32} />,
      title: "Add Resource",
      description: "Catalog a new book, e-book, or journal",
      color: "bg-blue-100 text-blue-600",
    },
    {
      href: "/manager/tags",
      icon: <Tag size={32} />,
      title: "Manage Tags",
      description: "Create and edit custom tags",
      color: "bg-purple-100 text-purple-600",
    },
    {
      href: "/manager/checkouts",
      icon: <ClipboardList size={32} />,
      title: "Active Checkouts",
      description: "View all checked out books and who has them",
      color: "bg-red-100 text-red-600",
    },
    {
      href: "/manager/users",
      icon: <Users size={32} />,
      title: "Manage Users",
      description: "Promote members to managers or remove access",
      color: "bg-green-100 text-green-600",
    },
    {
      href: "/catalog",
      icon: <BookOpen size={32} />,
      title: "Browse Catalog",
      description: "View and edit all resources",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Library</h1>
          <p className="text-gray-600">Manage resources, tags, and library settings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className={`${card.color} rounded-lg p-3 inline-block mb-4`}>
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h2>
              <p className="text-sm text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
