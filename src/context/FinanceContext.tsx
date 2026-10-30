import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import type { Transaction, SalaryInfo, CreditCardInfo, MonthlySummary, PaymentStatus } from '../types/finance';
import { 
  getCurrentMonthRef, 
  calculateSummary, 
  getDefaultSalary, 
  getDefaultTransactions,
  PREDEFINED_FIXED_ACCOUNTS,
  DEFAULT_CREDIT_CARDS
} from '../utils/finance';
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredSalaries,
  saveStoredSalaries,
  loadStoredCards,
  saveStoredCards,
  syncWithCloud,
} from '../services/storage';
import { getSupabaseClient, getStoredSupabaseConfig } from '../services/supabase';

interface FinanceContextType {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  transactions: Transaction[];
  monthTransactions: Transaction[];
  salaries: Record<string, SalaryInfo>;
  currentSalary: SalaryInfo;
  cards: CreditCardInfo[];
  summary: MonthlySummary;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  togglePaymentStatus: (id: string) => void;
  updateSalary: (monthRef: string, updates: Partial<SalaryInfo>) => void;
  generateFixedBillsForMonth: (targetMonth: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  resetToDefaultData: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncMessage: string;
  syncNow: () => Promise<void>;
  user: any;
  isCloudConfigured: boolean;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  isSalaryModalOpen: boolean;
  setIsSalaryModalOpen: (open: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthRef());
  const [transactions, setTransactions] = useState<Transaction[]>(loadStoredTransactions);
  const [salaries, setSalaries] = useState<Record<string, SalaryInfo>>(loadStoredSalaries);
  const [cards, setCards] = useState<CreditCardInfo[]>(loadStoredCards);
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('meu_financeiro_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Cloud & Auth state
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  
  const isCloudConfigured = useMemo(() => {
    const config = getStoredSupabaseConfig();
    return Boolean(config.url && config.anonKey);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('meu_financeiro_theme', theme);
  }, [theme]);

  // Save to localStorage when state changes
  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredSalaries(salaries);
  }, [salaries]);

  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  // Check Supabase Auth session on mount
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter transactions for active month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.month_ref === currentMonth);
  }, [transactions, currentMonth]);

  // Current month's salary
  const currentSalary = useMemo(() => {
    if (salaries[currentMonth]) {
      return salaries[currentMonth];
    }
    // Fallback or copy from previous known salary if exists
    const allSalaries = Object.values(salaries);
    const fallbackBase = allSalaries.length > 0 ? allSalaries[allSalaries.length - 1].base_salary : 5200;
    return {
      ...getDefaultSalary(currentMonth),
      base_salary: fallbackBase,
    };
  }, [salaries, currentMonth]);

  // Calculated summary
  const summary = useMemo(() => {
    return calculateSummary(transactions, currentSalary, currentMonth);
  }, [transactions, currentSalary, currentMonth]);

  // Actions
  const addTransaction = (txData: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePaymentStatus = (id: string) => {
    setTransactions((prev) => {
      let isPaying = false;
      const updated: Transaction[] = prev.map((t) => {
        if (t.id === id) {
          const nextStatus: PaymentStatus = t.status === 'paid' ? 'pending' : 'paid';
          if (nextStatus === 'paid') isPaying = true;
          return { ...t, status: nextStatus, updated_at: new Date().toISOString() };
        }
        return t;
      });

      if (isPaying) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#34d399', '#6ee7b7'],
          });
        } catch (_) {}
      }

      return updated;
    });
  };

  const updateSalary = (monthRef: string, updates: Partial<SalaryInfo>) => {
    setSalaries((prev) => {
      const existing = prev[monthRef] || getDefaultSalary(monthRef);
      return {
        ...prev,
        [monthRef]: {
          ...existing,
          ...updates,
          month_ref: monthRef,
        },
      };
    });
  };

  const generateFixedBillsForMonth = (targetMonth: string) => {
    const existingFixed = transactions.filter(
      (t) => t.month_ref === targetMonth && t.category === 'fixed'
    );
    const existingTitles = new Set(existingFixed.map((t) => t.account_type));

    // Find the most recent fixed accounts from any month to copy their values
    const pastFixed = transactions
      .filter((t) => t.category === 'fixed')
      .reverse();

    const [year, month] = targetMonth.split('-');
    const newItems: Transaction[] = [];

    PREDEFINED_FIXED_ACCOUNTS.forEach((accountType, index) => {
      if (!existingTitles.has(accountType)) {
        const lastKnown = pastFixed.find((p) => p.account_type === accountType);
        const day = 10 + index * 4;
        newItems.push({
          id: `fixed-${Date.now()}-${index}`,
          title: lastKnown?.title || accountType,
          category: 'fixed',
          account_type: accountType,
          amount: lastKnown?.amount || (accountType === 'Internet' ? 120 : accountType === 'Celular' ? 60 : accountType === 'Seguro Carro' ? 250 : 150),
          due_date: `${year}-${month}-${String(day).padStart(2, '0')}`,
          month_ref: targetMonth,
          status: 'pending',
          notes: 'Gerado automaticamente do modelo fixo',
          created_at: new Date().toISOString(),
        });
      }
    });

    if (newItems.length > 0) {
      setTransactions((prev) => [...newItems, ...prev]);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const resetToDefaultData = () => {
    const currentM = getCurrentMonthRef();
    const defaultTx = getDefaultTransactions(currentM);
    const defaultSal: Record<string, SalaryInfo> = {
      [currentM]: getDefaultSalary(currentM),
    };
    setTransactions(defaultTx);
    setSalaries(defaultSal);
    setCards(DEFAULT_CREDIT_CARDS);
  };

  const syncNow = async () => {
    if (!user) {
      setSyncStatus('error');
      setSyncMessage('Faça login com e-mail para sincronizar na nuvem.');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Sincronizando dados com o Supabase...');

    const result = await syncWithCloud(user.id, transactions, salaries);
    if (result.success) {
      if (result.transactions) setTransactions(result.transactions);
      if (result.salaries) setSalaries(result.salaries);
      setSyncStatus('synced');
      setSyncMessage('Sincronizado com sucesso!');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } else {
      setSyncStatus('error');
      setSyncMessage(result.message);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        transactions,
        monthTransactions,
        salaries,
        currentSalary,
        cards,
        summary,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        togglePaymentStatus,
        updateSalary,
        generateFixedBillsForMonth,
        theme,
        toggleTheme,
        resetToDefaultData,
        syncStatus,
        syncMessage,
        syncNow,
        user,
        isCloudConfigured,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        editingTransaction,
        setEditingTransaction,
        isSalaryModalOpen,
        setIsSalaryModalOpen,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
