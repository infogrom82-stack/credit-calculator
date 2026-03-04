export interface ScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  lastPayment?: number;
  totalInterest: number;
  totalAmount: number;
  schedule: ScheduleItem[];
}

export function calculateLoan(
  amount: number,
  annualRate: number,
  term: number,
  termType: "months" | "years",
  loanType: "annuity" | "differentiated"
): LoanResult {
  const months = termType === "years" ? term * 12 : term;
  const monthlyRate = annualRate / 100 / 12;

  if (loanType === "annuity") {
    return calculateAnnuity(amount, monthlyRate, months);
  } else {
    return calculateDifferentiated(amount, monthlyRate, months);
  }
}

function calculateAnnuity(
  amount: number,
  monthlyRate: number,
  months: number
): LoanResult {
  const schedule: ScheduleItem[] = [];
  
  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = amount / months;
  } else {
    monthlyPayment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  let balance = amount;
  let totalInterest = 0;

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;

    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((amount + totalInterest) * 100) / 100,
    schedule,
  };
}

function calculateDifferentiated(
  amount: number,
  monthlyRate: number,
  months: number
): LoanResult {
  const schedule: ScheduleItem[] = [];
  const principalPayment = amount / months;
  let balance = amount;
  let totalInterest = 0;
  let firstPayment = 0;
  let lastPayment = 0;

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;
    const payment = principalPayment + interest;
    balance = Math.max(0, balance - principalPayment);
    totalInterest += interest;

    if (month === 1) {
      firstPayment = payment;
    }
    if (month === months) {
      lastPayment = payment;
    }

    schedule.push({
      month,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return {
    monthlyPayment: Math.round(firstPayment * 100) / 100,
    lastPayment: Math.round(lastPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((amount + totalInterest) * 100) / 100,
    schedule,
  };
}

const currencyConfig: Record<string, { locale: string; currency: string }> = {
  RUB: { locale: "ru-RU", currency: "RUB" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
  PLN: { locale: "pl-PL", currency: "PLN" },
};

export function formatCurrency(value: number, currencyCode: string = "RUB"): string {
  const config = currencyConfig[currencyCode] || currencyConfig.RUB;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
