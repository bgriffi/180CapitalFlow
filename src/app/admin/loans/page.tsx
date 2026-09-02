import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/loan-utils";
import Nav from "@/components/Nav";
import NewLoanForm from "./NewLoanForm";

export default async function AdminLoansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [loans, customers] = await Promise.all([
    prisma.loan.findMany({
      include: {
        user: { select: { name: true, email: true } },
        project: true,
        payments: { where: { status: "SUCCEEDED" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav userName={session.user.name} role={session.user.role} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
            <p className="text-gray-500 mt-1">{loans.length} total loans</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Principal</th>
                      <th className="px-6 py-3">Monthly</th>
                      <th className="px-6 py-3">Progress</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{loan.user.name}</p>
                          <p className="text-xs text-gray-400">{loan.project?.name ?? "No project"}</p>
                          <p className="text-xs text-gray-400">{formatDate(loan.startDate)}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">
                          {formatCurrency(loan.monthlyPayment)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 mb-1">
                            {loan.payments.length}/{loan.termMonths}
                          </div>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${(loan.payments.length / loan.termMonths) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            loan.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {loans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No loans yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* New loan form */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Loan</h2>
              <NewLoanForm customers={customers} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
