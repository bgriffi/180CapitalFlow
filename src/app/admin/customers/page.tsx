import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/loan-utils";
import Nav from "@/components/Nav";
import NewCustomerForm from "./NewCustomerForm";

export default async function AdminCustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      loans: {
        select: { id: true, principalAmount: true, monthlyPayment: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav userName={session.user.name} role={session.user.role} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 mt-1">{customers.length} total customers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Loans</th>
                    <th className="px-6 py-3">Total Borrowed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                        <p className="text-xs text-gray-400">Joined {formatDate(c.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.loans.length}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(c.loans.reduce((s, l) => s + l.principalAmount, 0))}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-400">No customers yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New customer form */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Customer</h2>
              <NewCustomerForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
