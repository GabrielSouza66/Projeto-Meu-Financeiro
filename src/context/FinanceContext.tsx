import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import type { Transaction, SalaryInfo, CreditCardInfo, MonthlySummary, PaymentStatus } from '../types/finance';
import { 
  getCurrentMonthRef, 
  calculateSummary, 
  getDefaultSalary, 
  getDefaultTransactions,
  PREDEFINED_FIXED_ACCOUNTS,
  DEFAULT_CREDIT_CARDS,
  generateUUID
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
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Background sync to cloud if user is logged in
    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('transactions')
          .insert([{
            id: newTx.id,
            user_id: user.id,
            title: newTx.title,
            category: newTx.category,
            account_type: newTx.account_type,
            amount: Number(newTx.amount) || 0,
            due_date: newTx.due_date,
            month_ref: newTx.month_ref,
            status: newTx.status,
            notes: newTx.notes || null,
            created_at: newTx.created_at,
            updated_at: newTx.updated_at,
          }])
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar lançamento no Supabase:', error);
          });
      }
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const now = new Date().toISOString();
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: now } : t))
    );

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const payload: any = { ...updates, updated_at: now };
        delete payload.id;
        delete payload.user_id;
        supabase
          .from('transactions')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao atualizar lançamento no Supabase:', error);
          });
      }
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao remover lançamento do Supabase:', error);
          });
      }
    }
  };

  const togglePaymentStatus = (id: string) => {
    let nextStatus: PaymentStatus = 'pending';
    let isPaying = false;

    setTransactions((prev) => {
      const updated: Transaction[] = prev.map((t) => {
        if (t.id === id) {
          nextStatus = t.status === 'paid' ? 'pending' : 'paid';
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

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('transactions')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao atualizar status no Supabase:', error);
          });
      }
    }
  };

  const updateSalary = (monthRef: string, updates: Partial<SalaryInfo>) => {
    let updatedRecord: SalaryInfo = {
      ...getDefaultSalary(monthRef),
      ...updates,
      month_ref: monthRef,
    };

    setSalaries((prev) => {
      const existing = prev[monthRef] || getDefaultSalary(monthRef);
      updatedRecord = {
        ...existing,
        ...updates,
        month_ref: monthRef,
      };
      return {
        ...prev,
        [monthRef]: updatedRecord,
      };
    });

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('salary_records')
          .upsert(
            {
              user_id: user.id,
              month_ref: monthRef,
              base_salary: Number(updatedRecord.base_salary) || 0,
              extra_income: Number(updatedRecord.extra_income) || 0,
              payday: Number(updatedRecord.payday) || 5,
              notes: updatedRecord.notes || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,month_ref' }
          )
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar salário no Supabase:', error);
          });
      }
    }
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
          id: generateUUID(),
          title: lastKnown?.title || accountType,
          category: 'fixed',
          account_type: accountType,
          amount: lastKnown?.amount || (accountType === 'Internet' ? 120 : accountType === 'Celular' ? 60 : accountType === 'Seguro Carro' ? 250 : 150),
          due_date: `${year}-${month}-${String(day).padStart(2, '0')}`,
          month_ref: targetMonth,
          status: 'pending',
          notes: 'Gerado automaticamente do modelo fixo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id,
        });
      }
    });

    if (newItems.length > 0) {
      setTransactions((prev) => [...newItems, ...prev]);

      // If user is logged in, immediately push new fixed items to Supabase
      if (user) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const toInsert = newItems.map((item) => ({
            id: item.id,
            user_id: user.id,
            title: item.title,
            category: item.category,
            account_type: item.account_type,
            amount: item.amount,
            due_date: item.due_date,
            month_ref: item.month_ref,
            status: item.status,
            notes: item.notes,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

          supabase
            .from('transactions')
            .upsert(toInsert)
            .then(({ error }) => {
              if (error) console.error('Erro ao salvar contas fixas geradas no Supabase:', error);
            });
        }
      }
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
      setTimeout(() => setSyncStatus('idle'), 4000);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Sincronizando dados com o Supabase...');

    const result = await syncWithCloud(user.id, transactions, salaries);
    if (result.success) {
      if (result.transactions) setTransactions(result.transactions);
      if (result.salaries) setSalaries(result.salaries);
      setSyncStatus('synced');
      setSyncMessage(result.message);
      setTimeout(() => setSyncStatus('idle'), 5000);
    } else {
      setSyncStatus('error');
      setSyncMessage(result.message);
      setTimeout(() => setSyncStatus('idle'), 6000);
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
