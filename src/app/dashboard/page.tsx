import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRemainingBalance, formatCurrency, formatDate } from "@/lib/loan-utils";
import Nav from "@/components/Nav";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: {
      project: true,
      payments: { where: { status: "SUCCEEDED" }, orderBy: { paidAt: "desc" }, take: 6 },
    },
    orderBy: { createdAt: "desc" },
  });

  const loansWithBalance = loans.map((loan) => ({
    ...loan,
    remainingBalance: calculateRemainingBalance(
      loan.principalAmount,
      loan.interestRate,
      loan.termMonths,
      loan.payments.length
    ),
  }));

  const totalRemaining = loansWithBalance.reduce((sum, l) => sum + l.remainingBalance, 0);
  const activeLoans = loansWithBalance.filter((l) => l.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav userName={session.user.name} role={session.user.role} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-gray-500 mb-8">Manage your solar loan payments</p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Remaining Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRemaining)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Monthly Payment Due</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(activeLoans.reduce((s, l) => s + l.monthlyPayment, 0))}
            </p>
          </div>
        </div>

        {/* Loan list */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Loans</h2>

        {loans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            No loans found. Contact your 180 Degree Solar representative.
          </div>
        ) : (
          <div className="space-y-4">
            {loansWithBalance.map((loan) => (
              <div key={loan.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {loan.project?.name ?? "Solar Project"}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        loan.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : loan.status === "PAID_OFF"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {loan.status.replace("_", " ")}
                      </span>
                    </div>
                    {loan.project?.address && (
                      <p className="text-sm text-gray-500">{loan.project.address}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Started {formatDate(loan.startDate)} · {loan.termMonths} month term ·{" "}
                      {(loan.interestRate * 100).toFixed(2)}% APR
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-500">Remaining balance</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(loan.remainingBalance)}</p>
                    <p className="text-sm text-gray-500">
                      of {formatCurrency(loan.principalAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{loan.payments.length} payments made</span>
                    <span>{loan.termMonths - loan.payments.length} remaining</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (loan.payments.length / loan.termMonths) * 100)}%` }}
                    />
                  </div>
                </div>

                {loan.status === "ACTIVE" && (
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/dashboard/loans/${loan.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    >
                      Make a Payment
                    </Link>
                    <Link
                      href={`/dashboard/loans/${loan.id}`}
                      className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                    >
                      View History
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
