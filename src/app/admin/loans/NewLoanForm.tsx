"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateMonthlyPayment, formatCurrency } from "@/lib/loan-utils";

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

export default function NewLoanForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    userId: "",
    principalAmount: "",
    interestRate: "6.5",
    termMonths: "120",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const preview =
    form.principalAmount && form.interestRate && form.termMonths
      ? calculateMonthlyPayment(
          Number(form.principalAmount),
          Number(form.interestRate) / 100,
          Number(form.termMonths)
        )
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate) / 100,
        termMonths: Number(form.termMonths),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create loan");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setForm({
      userId: "",
      principalAmount: "",
      interestRate: "6.5",
      termMonths: "120",
      startDate: new Date().toISOString().split("T")[0],
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          Loan created successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select
          value={form.userId}
          onChange={(e) => update("userId", e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email} ({c.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount ($)</label>
        <input
          type="number"
          value={form.principalAmount}
          onChange={(e) => update("principalAmount", e.target.value)}
          required
          min="1000"
          step="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          placeholder="25000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
        <input
          type="number"
          value={form.interestRate}
          onChange={(e) => update("interestRate", e.target.value)}
          required
          min="0"
          max="30"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Term (months)</label>
        <select
          value={form.termMonths}
          onChange={(e) => update("termMonths", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
        >
          <option value="60">60 months (5 yr)</option>
          <option value="84">84 months (7 yr)</option>
          <option value="120">120 months (10 yr)</option>
          <option value="144">144 months (12 yr)</option>
          <option value="180">180 months (15 yr)</option>
          <option value="240">240 months (20 yr)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => update("startDate", e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {preview !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          Monthly payment: <strong>{formatCurrency(preview)}</strong>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition"
      >
        {loading ? "Creating…" : "Create Loan"}
      </button>
    </form>
  );
}
