"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface NavProps {
  userName?: string | null;
  role?: string;
}

export default function Nav({ userName, role }: NavProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">180 Degree Solar</span>
          </Link>

          {role === "ADMIN" && (
            <div className="flex gap-4 text-sm">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
              <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900 transition">Customers</Link>
              <Link href="/admin/loans" className="text-gray-600 hover:text-gray-900 transition">Loans</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-gray-600">{userName}</span>
          )}
          {role === "ADMIN" && (
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Admin</span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
