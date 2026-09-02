import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/loan-utils";
import Nav from "@/components/Nav";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [customerCount, loanCount, payments] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
  ]);

  const recentLoans = await prisma.loan.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav userName={session.user.name} role={session.user.role} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">180 Degree Solar — Loan Management</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{customerCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Active Loans</p>
            <p className="text-3xl font-bold text-gray-900">{loanCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(payments._sum.amount ?? 0)}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <Link
            href="/admin/customers"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            + New Customer
          </Link>
          <Link
            href="/admin/loans"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            + New Loan
          </Link>
        </div>

        {/* Recent loans table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Loans</h2>
            <Link href="/admin/loans" className="text-sm text-green-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Monthly</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{loan.user.name}</p>
                      <p className="text-gray-400 text-xs">{loan.user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{loan.project?.name ?? "—"}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(loan.principalAmount)}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(loan.monthlyPayment)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        loan.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No loans yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
