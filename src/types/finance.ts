export type AccountCategory = 'fixed' | 'card' | 'variable' | 'salary' | 'extra';

export type PredefinedAccount = 
  | 'Internet' 
  | 'Celular' 
  | 'Seguro Carro' 
  | 'Seguro Moto' 
  | 'Cartão Inter' 
  | 'Cartão Nubank' 
  | 'Salário'
  | 'Outro';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Transaction {
  id: string;
  user_id?: string;
  title: string;
  category: AccountCategory;
  account_type: PredefinedAccount | string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  month_ref: string; // YYYY-MM (e.g. "2026-10")
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SalaryInfo {
  id: string;
  user_id?: string;
  month_ref: string; // YYYY-MM
  base_salary: number;
  extra_income: number;
  payday: number; // day of month, e.g. 5
  notes?: string;
}

export interface CreditCardInfo {
  id: string;
  name: 'Cartão Inter' | 'Cartão Nubank' | string;
  brand: 'Inter' | 'Nubank' | 'Outro';
  color: string;
  closing_day: number;
  due_day: number;
  limit_amount?: number;
}

export interface MonthlySummary {
  month_ref: string;
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  cardExpenses: number;
  otherExpenses: number;
  balanceForecast: number; // Income - TotalExpenses (predicted remaining)
  balanceRealized: number; // Income received - Paid expenses
  paidExpenses: number;
  pendingExpenses: number;
  commitmentRate: number; // (totalExpenses / totalIncome) * 100
  alertLevel: 'comfortable' | 'warning' | 'danger';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

