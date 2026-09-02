import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { loanId } = await req.json();

  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId: session.user.id },
    include: { user: true },
  });

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  if (loan.status !== "ACTIVE") {
    return NextResponse.json({ error: "Loan is not active" }, { status: 400 });
  }

  // Get or create Stripe customer
  let stripeCustomerId = loan.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: loan.user.email,
      name: loan.user.name ?? undefined,
      metadata: { userId: loan.user.id, loanId: loan.id },
    });
    stripeCustomerId = customer.id;
    await prisma.loan.update({
      where: { id: loan.id },
      data: { stripeCustomerId },
    });
  }

  // Create payment intent for the monthly payment amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(loan.monthlyPayment * 100), // cents
    currency: "usd",
    customer: stripeCustomerId,
    metadata: { loanId: loan.id, userId: session.user.id },
    description: `Monthly loan payment - Loan ${loan.id}`,
    automatic_payment_methods: { enabled: true },
  });

  // Create a pending payment record
  const dueDate = new Date();
  dueDate.setDate(1);
  dueDate.setMonth(dueDate.getMonth() + 1);

  await prisma.payment.create({
    data: {
      loanId: loan.id,
      amount: loan.monthlyPayment,
      status: "PROCESSING",
      dueDate,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
