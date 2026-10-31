import type { Transaction, SalaryInfo, MonthlySummary, PredefinedAccount, CreditCardInfo } from '../types/finance';

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
  'Seguro Carro',
  'Seguro Moto',
];

export const PREDEFINED_CARD_ACCOUNTS: PredefinedAccount[] = [
  'Cartão Inter',
  'Cartão Nubank',
];

export const PREDEFINED_OTHER_ACCOUNTS: PredefinedAccount[] = [
  'Luz',
  'Água',
  'Aluguel',
  'Mercado',
  'Outro',
];

export const DEFAULT_CREDIT_CARDS: CreditCardInfo[] = [
  {
    id: 'card-inter',
    name: 'Cartão Inter',
    brand: 'Inter',
    color: '#ff7a00',
    closing_day: 20,
    due_day: 28,
    limit_amount: 5000,
  },
  {
    id: 'card-nubank',
    name: 'Cartão Nubank',
    brand: 'Nubank',
    color: '#8a05be',
    closing_day: 15,
    due_day: 22,
    limit_amount: 6000,
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
      id: `fix-1-${monthRef}`,
      title: 'Internet Residencial',
      category: 'fixed',
      account_type: 'Internet',
      amount: 120.0,
      due_date: `${year}-${month}-10`,
      month_ref: monthRef,
      status: 'paid',
      notes: 'Fibra óptica 600 Mega',
      created_at: new Date().toISOString(),
    },
    {
      id: `fix-2-${monthRef}`,
      title: 'Plano Celular',
      category: 'fixed',
      account_type: 'Celular',
      amount: 60.0,
      due_date: `${year}-${month}-15`,
      month_ref: monthRef,
      status: 'paid',
      notes: 'Plano pós-pago / controle',
      created_at: new Date().toISOString(),
    },
    {
      id: `fix-3-${monthRef}`,
      title: 'Seguro Automóvel',
      category: 'fixed',
      account_type: 'Seguro Carro',
      amount: 250.0,
      due_date: `${year}-${month}-20`,
      month_ref: monthRef,
      status: 'pending',
      notes: 'Parcela seguro Porto Seguro',
      created_at: new Date().toISOString(),
    },
    {
      id: `fix-4-${monthRef}`,
      title: 'Seguro Motocicleta',
      category: 'fixed',
      account_type: 'Seguro Moto',
      amount: 150.0,
      due_date: `${year}-${month}-22`,
      month_ref: monthRef,
      status: 'pending',
      notes: 'Proteção veicular moto',
      created_at: new Date().toISOString(),
    },
    {
      id: `card-1-${monthRef}`,
      title: 'Fatura Inter',
      category: 'card',
      account_type: 'Cartão Inter',
      amount: 1250.0,
      due_date: `${year}-${month}-28`,
      month_ref: monthRef,
      status: 'pending',
      notes: 'Fatura fechada compras do mês',
      created_at: new Date().toISOString(),
    },
    {
      id: `card-2-${monthRef}`,
      title: 'Fatura Nubank',
      category: 'card',
      account_type: 'Cartão Nubank',
      amount: 1780.0,
      due_date: `${year}-${month}-22`,
      month_ref: monthRef,
      status: 'pending',
      notes: 'Fatura fechada roxinho',
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
