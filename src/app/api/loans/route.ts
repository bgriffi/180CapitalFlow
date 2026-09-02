import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRemainingBalance } from "@/lib/loan-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: {
      project: true,
      payments: {
        orderBy: { dueDate: "desc" },
        take: 12,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const loansWithBalance = loans.map((loan) => {
    const successfulPayments = loan.payments.filter(
      (p) => p.status === "SUCCEEDED"
    ).length;
    const remainingBalance = calculateRemainingBalance(
      loan.principalAmount,
      loan.interestRate,
      loan.termMonths,
      successfulPayments
    );
    return { ...loan, remainingBalance };
  });

  return NextResponse.json(loansWithBalance);
}
