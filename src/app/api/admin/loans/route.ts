import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMonthlyPayment } from "@/lib/loan-utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, principalAmount, interestRate, termMonths, startDate, projectId } =
    await req.json();

  if (!userId || !principalAmount || interestRate == null || !termMonths || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const monthlyPayment = calculateMonthlyPayment(
    Number(principalAmount),
    Number(interestRate),
    Number(termMonths)
  );

  const loan = await prisma.loan.create({
    data: {
      userId,
      projectId: projectId ?? null,
      principalAmount: Number(principalAmount),
      interestRate: Number(interestRate),
      termMonths: Number(termMonths),
      monthlyPayment,
      startDate: new Date(startDate),
      status: "ACTIVE",
    },
    include: { user: true, project: true },
  });

  return NextResponse.json(loan, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const loans = await prisma.loan.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: true,
      payments: { orderBy: { dueDate: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loans);
}
