import type { Transaction, SalaryInfo, MonthlySummary, PredefinedAccount, CreditCardInfo, FixedBillTemplate } from '../types/finance';

export const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1).replace('.', ',')}%`;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex] || '';
};

export const formatMonthRef = (monthRef: string): string => {
  if (!monthRef) return '';
  const [year, month] = monthRef.split('-');
  const mIndex = parseInt(month, 10) - 1;
  return `${getMonthName(mIndex)} ${year}`;
};

export const getCurrentMonthRef = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getAvailableMonths = (): { label: string; value: string }[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const result: { label: string; value: string }[] = [];

  // 6 months in past to 12 months ahead
  for (let i = -6; i <= 12; i++) {
    const d = new Date(currentYear, currentMonth + i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const val = `${yr}-${mo}`;
    result.push({
      label: formatMonthRef(val),
      value: val,
    });
  }
  return result;
};

export const PREDEFINED_FIXED_ACCOUNTS: PredefinedAccount[] = [
  'Internet',
  'Celular',
  'Seguro',
  'Luz',
  'Água',
  'Aluguel',
];

export const PREDEFINED_CARD_ACCOUNTS: PredefinedAccount[] = [
  'Cartão de Crédito',
];

export const PREDEFINED_OTHER_ACCOUNTS: PredefinedAccount[] = [
  'Luz',
  'Água',
  'Aluguel',
  'Mercado',
  'Outro',
];

export const DEFAULT_FIXED_BILLS_TEMPLATES: FixedBillTemplate[] = [
  {
    id: 'tpl-internet',
    title: 'Internet Residencial',
    account_type: 'Internet',
    default_amount: 120,
    due_day: 10,
    category: 'fixed',
  },
  {
    id: 'tpl-celular',
    title: 'Plano Celular',
    account_type: 'Celular',
    default_amount: 60,
    due_day: 15,
    category: 'fixed',
  },
  {
    id: 'tpl-seguro',
    title: 'Seguro',
    account_type: 'Seguro',
    default_amount: 250,
    due_day: 20,
    category: 'fixed',
  },
];

export const DEFAULT_CREDIT_CARDS: CreditCardInfo[] = [
  {
    id: 'card-1',
    name: 'Cartão de Crédito',
    brand: 'Outro',
    color: '#8a05be',
    closing_day: 15,
    due_day: 22,
    limit_amount: 5000,
  },
];

export const getDefaultSalary = (monthRef: string): SalaryInfo => ({
  id: `sal-${monthRef}`,
  month_ref: monthRef,
  base_salary: 5200.0,
  extra_income: 0,
  payday: 5,
  notes: 'Salário Líquido Mensal',
});

export const getDefaultTransactions = (monthRef: string): Transaction[] => {
  const [year, month] = monthRef.split('-');
  return [
    {
      id: generateUUID(),
      title: 'Internet Residencial',
      category: 'fixed',
      account_type: 'Internet',
      amount: 120.0,
      due_date: `${year}-${month}-10`,
      month_ref: monthRef,
      status: 'paid',
      notes: 'Fibra óptica',
      created_at: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      title: 'Plano Celular',
      category: 'fixed',
      account_type: 'Celular',
      amount: 60.0,
      due_date: `${year}-${month}-15`,
      month_ref: monthRef,
      status: 'paid',
      notes: 'Pós-pago',
      created_at: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      title: 'Fatura Cartão de Crédito',
      category: 'card',
      account_type: 'Cartão de Crédito',
      amount: 1850.0,
      due_date: `${year}-${month}-22`,
      month_ref: monthRef,
      status: 'pending',
      notes: 'Fatura fechada compras do mês',
      created_at: new Date().toISOString(),
    },
  ];
};

export const calculateSummary = (
  transactions: Transaction[],
  salary: SalaryInfo,
  monthRef: string
): MonthlySummary => {
  const monthTransactions = transactions.filter((t) => t.month_ref === monthRef);

  let fixedExpenses = 0;
  let cardExpenses = 0;
  let otherExpenses = 0;
  let paidExpenses = 0;
  let pendingExpenses = 0;

  monthTransactions.forEach((t) => {
    if (t.category === 'fixed') {
      fixedExpenses += t.amount;
    } else if (t.category === 'card') {
      cardExpenses += t.amount;
    } else {
      otherExpenses += t.amount;
    }

    if (t.status === 'paid') {
      paidExpenses += t.amount;
    } else {
      pendingExpenses += t.amount;
    }
  });

  const totalExpenses = fixedExpenses + cardExpenses + otherExpenses;
  const totalIncome = (salary?.base_salary || 0) + (salary?.extra_income || 0);
  const balanceForecast = totalIncome - totalExpenses;
  const balanceRealized = totalIncome - paidExpenses;

  const commitmentRate = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;

  let alertLevel: 'comfortable' | 'warning' | 'danger' = 'comfortable';
  if (commitmentRate >= 100 || balanceForecast < 0) {
    alertLevel = 'danger';
  } else if (commitmentRate >= 80) {
    alertLevel = 'warning';
  }

  return {
    month_ref: monthRef,
    totalIncome,
    totalExpenses,
    fixedExpenses,
    cardExpenses,
    otherExpenses,
    balanceForecast,
    balanceRealized,
    paidExpenses,
    pendingExpenses,
    commitmentRate,
    alertLevel,
  };
};
