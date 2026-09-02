"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/components/PaymentForm";
import { formatCurrency } from "@/lib/loan-utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  loanId: string;
  monthlyPayment: number;
}

export default function LoanPaymentSection({ loanId, monthlyPayment }: Props) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-green-300 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 mb-1">Payment submitted!</p>
        <p className="text-sm text-gray-500">It may take a moment to process.</p>
        <button
          onClick={() => { setSuccess(false); setOpen(false); }}
          className="mt-4 text-sm text-green-600 hover:underline"
        >
          Make another payment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Make a Payment</h2>
      <p className="text-sm text-gray-500 mb-4">
        Monthly amount: <strong className="text-gray-800">{formatCurrency(monthlyPayment)}</strong>
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Pay Now
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ mode: "payment", currency: "usd", amount: Math.round(monthlyPayment * 100) }}>
          <PaymentForm
            loanId={loanId}
            amount={monthlyPayment}
            onSuccess={() => setSuccess(true)}
          />
        </Elements>
      )}
    </div>
  );
}
