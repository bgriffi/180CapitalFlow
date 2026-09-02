import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRemainingBalance, formatCurrency, formatDate } from "@/lib/loan-utils";
import Nav from "@/components/Nav";
import LoanPaymentSection from "./LoanPaymentSection";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const loan = await prisma.loan.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: true,
      payments: { orderBy: { dueDate: "desc" } },
    },
  });

  if (!loan) notFound();

  const successfulPayments = loan.payments.filter((p) => p.status === "SUCCEEDED");
  const remainingBalance = calculateRemainingBalance(
    loan.principalAmount,
    loan.interestRate,
    loan.termMonths,
    successfulPayments.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav userName={session.user.name} role={session.user.role} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Back to dashboard</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {loan.project?.name ?? "Solar Project"}
              </h1>
              {loan.project?.address && (
                <p className="text-sm text-gray-500 mb-4">{loan.project.address}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Original loan</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(loan.principalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining balance</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(remainingBalance)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Interest rate</p>
                  <p className="font-semibold text-gray-900">{(loan.interestRate * 100).toFixed(2)}% APR</p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly payment</p>
                  <p className="font-semibold text-green-600">{formatCurrency(loan.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Term</p>
                  <p className="font-semibold text-gray-900">{loan.termMonths} months</p>
                </div>
                <div>
                  <p className="text-gray-500">Start date</p>
                  <p className="font-semibold text-gray-900">{formatDate(loan.startDate)}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{successfulPayments.length} of {loan.termMonths} payments made</span>
                  <span>{Math.round((successfulPayments.length / loan.termMonths) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(successfulPayments.length / loan.termMonths) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h2>
              {loan.payments.length === 0 ? (
                <p className="text-gray-400 text-sm">No payments yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {loan.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Due {formatDate(payment.dueDate)}
                          {payment.paidAt && ` · Paid ${formatDate(payment.paidAt)}`}
                        </p>
                        {payment.failureReason && (
                          <p className="text-xs text-red-500 mt-0.5">{payment.failureReason}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        payment.status === "SUCCEEDED"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : payment.status === "PROCESSING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment widget */}
          <div className="lg:col-span-1">
            {loan.status === "ACTIVE" ? (
              <LoanPaymentSection loanId={loan.id} monthlyPayment={loan.monthlyPayment} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-500 text-sm">
                  This loan is {loan.status.replace("_", " ").toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
