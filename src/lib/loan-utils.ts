export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment * 100) / 100;
}

export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number
): number {
  if (annualRate === 0) {
    const monthlyPayment = principal / termMonths;
    return Math.max(0, principal - monthlyPayment * paymentsMade);
  }
  const monthlyRate = annualRate / 12;
  const balance =
    principal *
    (Math.pow(1 + monthlyRate, termMonths) -
      Math.pow(1 + monthlyRate, paymentsMade)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.max(0, Math.round(balance * 100) / 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
