import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import type { 
  Transaction, 
  SalaryInfo, 
  CreditCardInfo, 
  MonthlySummary, 
  PaymentStatus,
  FixedBillTemplate 
} from '../types/finance';
import { 
  getCurrentMonthRef, 
  calculateSummary, 
  getDefaultSalary, 
  getDefaultTransactions,
  DEFAULT_CREDIT_CARDS,
  DEFAULT_FIXED_BILLS_TEMPLATES,
  generateUUID
} from '../utils/finance';
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredSalaries,
  saveStoredSalaries,
  loadStoredCards,
  saveStoredCards,
  loadStoredFixedTemplates,
  saveStoredFixedTemplates,
  clearUserStorage,
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
  addCard: (card: Omit<CreditCardInfo, 'id'>) => void;
  updateCard: (id: string, updates: Partial<CreditCardInfo>) => void;
  deleteCard: (id: string) => void;
  fixedTemplates: FixedBillTemplate[];
  addFixedTemplate: (tpl: Omit<FixedBillTemplate, 'id'>) => void;
  updateFixedTemplate: (id: string, updates: Partial<FixedBillTemplate>) => void;
  deleteFixedTemplate: (id: string) => void;
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
  saveAndSync: () => Promise<{ success: boolean; message: string }>;
  lastSavedAt: Date | null;
  user: any;
  isCloudConfigured: boolean;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  isSalaryModalOpen: boolean;
  setIsSalaryModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot' | 'reset';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot' | 'reset') => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthRef());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salaries, setSalaries] = useState<Record<string, SalaryInfo>>({});
  const [cards, setCards] = useState<CreditCardInfo[]>(() => loadStoredCards());
  const [fixedTemplates, setFixedTemplates] = useState<FixedBillTemplate[]>(() => loadStoredFixedTemplates());
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('meu_financeiro_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');

  // Cloud & Auth state
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('meu_financeiro_last_saved');
    return saved ? new Date(saved) : null;
  });
  
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

  // Save to localStorage when state changes (scoped to user if authenticated)
  useEffect(() => {
    if (user?.id) {
      saveStoredTransactions(transactions, user.id);
    }
  }, [transactions, user]);

  useEffect(() => {
    if (user?.id) {
      saveStoredSalaries(salaries, user.id);
    }
  }, [salaries, user]);

  useEffect(() => {
    saveStoredCards(cards, user?.id);
  }, [cards, user]);

  useEffect(() => {
    saveStoredFixedTemplates(fixedTemplates, user?.id);
  }, [fixedTemplates, user]);

  // Migração, saneamento e DEDUPLICAÇÃO rigorosa de cartões
  useEffect(() => {
    const seen = new Set<string>();
    const cleaned: CreditCardInfo[] = [];
    let needsUpdate = false;

    for (const c of cards) {
      const nameKey = (c.name || '').trim().toLowerCase();
      // Remove cartões legados (Inter e Nubank)
      if (
        !nameKey ||
        nameKey.includes('inter') ||
        nameKey.includes('nubank') ||
        c.id === 'card-inter' ||
        c.id === 'card-nubank'
      ) {
        needsUpdate = true;
        continue;
      }
      // Descarta duplicatas com o mesmo nome
      if (seen.has(nameKey)) {
        needsUpdate = true;
        continue;
      }
      seen.add(nameKey);
      cleaned.push(c);
    }

    if (cleaned.length === 0) {
      cleaned.push(DEFAULT_CREDIT_CARDS[0]);
      needsUpdate = true;
    }

    if (needsUpdate || cleaned.length !== cards.length) {
      setCards(cleaned);
      saveStoredCards(cleaned);
    }
  }, [cards]);

  // Deduplicação de modelos de contas fixas
  useEffect(() => {
    const seen = new Set<string>();
    const cleaned: FixedBillTemplate[] = [];
    let needsUpdate = false;

    for (const t of fixedTemplates) {
      const k = (t.title || '').trim().toLowerCase();
      if (!k) continue;
      if (seen.has(k)) {
        needsUpdate = true;
        continue;
      }
      seen.add(k);
      cleaned.push(t);
    }

    if (cleaned.length === 0) {
      cleaned.push(...DEFAULT_FIXED_BILLS_TEMPLATES);
      needsUpdate = true;
    }

    if (needsUpdate || cleaned.length !== fixedTemplates.length) {
      setFixedTemplates(cleaned);
      saveStoredFixedTemplates(cleaned);
    }
  }, [fixedTemplates]);

  useEffect(() => {
    const hasLegacyTx = transactions.some(
      (t) =>
        t.category === 'card' &&
        (t.title.toLowerCase().includes('inter') ||
          t.title.toLowerCase().includes('nubank') ||
          t.account_type.toLowerCase().includes('inter') ||
          t.account_type.toLowerCase().includes('nubank'))
    );
    if (hasLegacyTx) {
      const cleaned: Transaction[] = [];
      const seenCardMonth = new Set<string>();

      for (const tx of transactions) {
        const isLegacyCard =
          tx.category === 'card' &&
          (tx.title.toLowerCase().includes('inter') ||
            tx.title.toLowerCase().includes('nubank') ||
            tx.account_type.toLowerCase().includes('inter') ||
            tx.account_type.toLowerCase().includes('nubank'));

        if (isLegacyCard) {
          if (!seenCardMonth.has(tx.month_ref)) {
            cleaned.push({
              ...tx,
              title: 'Fatura Cartão de Crédito',
              account_type: 'Cartão de Crédito',
            });
            seenCardMonth.add(tx.month_ref);
          }
        } else {
          if (tx.category === 'card' && tx.account_type === 'Cartão de Crédito') {
            seenCardMonth.add(tx.month_ref);
          }
          cleaned.push(tx);
        }
      }

      setTransactions(cleaned);
      saveStoredTransactions(cleaned);
    }
  }, [transactions]);

  // Check Supabase Auth session on mount and load user data
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const loadUserData = async (activeUser: any) => {
      if (!activeUser) {
        setTransactions([]);
        setSalaries({});
        clearUserStorage();
        return;
      }

      // 1. Instant load from user-scoped local storage if present
      const cachedTx = loadStoredTransactions(activeUser.id);
      const cachedSal = loadStoredSalaries(activeUser.id);
      const cachedCards = loadStoredCards(activeUser.id);
      const cachedTemplates = loadStoredFixedTemplates(activeUser.id);

      if (cachedTx.length > 0) setTransactions(cachedTx);
      if (Object.keys(cachedSal).length > 0) setSalaries(cachedSal);
      if (cachedCards.length > 0) setCards(cachedCards);
      if (cachedTemplates.length > 0) setFixedTemplates(cachedTemplates);

      // 2. Authoritative sync with Supabase cloud
      try {
        setSyncStatus('syncing');
        setSyncMessage('Carregando dados da sua conta...');
        const result = await syncWithCloud(activeUser.id, cachedTx, cachedSal, cachedCards, cachedTemplates);
        if (result.success) {
          if (result.transactions) setTransactions(result.transactions);
          if (result.salaries) setSalaries(result.salaries);
          if (result.cards && result.cards.length > 0) setCards(result.cards);
          if (result.fixedTemplates && result.fixedTemplates.length > 0) setFixedTemplates(result.fixedTemplates);
          setSyncStatus('idle');
          setSyncMessage('');
        } else {
          setSyncStatus('idle');
        }
      } catch (e) {
        console.error('Falha ao sincronizar dados do usuário:', e);
        setSyncStatus('idle');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        loadUserData(activeUser);
      } else {
        setTransactions([]);
        setSalaries({});
        clearUserStorage();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (event === 'SIGNED_IN' && activeUser) {
        loadUserData(activeUser);
      } else if (event === 'SIGNED_OUT') {
        setTransactions([]);
        setSalaries({});
        clearUserStorage();
        setSyncStatus('idle');
        setSyncMessage('');
      }

      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('reset');
        setIsAuthModalOpen(true);
      }
    });

    // Also check if URL contains recovery token or hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setAuthModalMode('reset');
      setIsAuthModalOpen(true);
    }

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
    const fallbackBase = allSalaries.length > 0 ? allSalaries[allSalaries.length - 1].base_salary : 0;
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

  // Card actions
  const addCard = (cardData: Omit<CreditCardInfo, 'id'>) => {
    const newCard: CreditCardInfo = {
      ...cardData,
      id: generateUUID(),
      user_id: user?.id,
    };
    setCards((prev) => [...prev, newCard]);

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('credit_cards')
          .insert([{
            id: newCard.id,
            user_id: user.id,
            name: newCard.name,
            brand: newCard.brand || 'Outro',
            closing_day: Number(newCard.closing_day) || 15,
            due_day: Number(newCard.due_day) || 22,
            limit_amount: Number(newCard.limit_amount) || 0,
            color: newCard.color || '#8a05be',
          }])
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar cartão no Supabase:', error);
          });
      }
    }
  };

  const updateCard = (id: string, updates: Partial<CreditCardInfo>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('credit_cards')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao atualizar cartão no Supabase:', error);
          });
      }
    }
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));

    if (user) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from('credit_cards')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao excluir cartão no Supabase:', error);
          });
      }
    }
  };

  // Fixed Templates actions
  const addFixedTemplate = (tplData: Omit<FixedBillTemplate, 'id'>) => {
    const newTpl: FixedBillTemplate = {
      ...tplData,
      id: generateUUID(),
    };
    setFixedTemplates((prev) => [...prev, newTpl]);
  };

  const updateFixedTemplate = (id: string, updates: Partial<FixedBillTemplate>) => {
    setFixedTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteFixedTemplate = (id: string) => {
    setFixedTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const generateFixedBillsForMonth = (targetMonth: string) => {
    const existingFixed = transactions.filter(
      (t) => t.month_ref === targetMonth && t.category === 'fixed'
    );
    const [year, month] = targetMonth.split('-');
    const newItems: Transaction[] = [];

    // Find the most recent fixed accounts from any month to copy their values if available
    const pastFixed = transactions
      .filter((t) => t.category === 'fixed')
      .reverse();

    fixedTemplates.forEach((tpl) => {
      const alreadyExists = existingFixed.some(
        (t) =>
          t.title.trim().toLowerCase() === tpl.title.trim().toLowerCase() ||
          (tpl.account_type && t.account_type.trim().toLowerCase() === tpl.account_type.trim().toLowerCase())
      );

      if (!alreadyExists) {
        const lastKnown = pastFixed.find(
          (p) =>
            p.title.trim().toLowerCase() === tpl.title.trim().toLowerCase() ||
            (tpl.account_type && p.account_type.trim().toLowerCase() === tpl.account_type.trim().toLowerCase())
        );

        const day = Math.min(Math.max(Number(tpl.due_day) || 10, 1), 28);
        newItems.push({
          id: generateUUID(),
          title: tpl.title,
          category: 'fixed',
          account_type: tpl.account_type || tpl.title,
          amount: lastKnown?.amount || Number(tpl.default_amount) || 0,
          due_date: `${year}-${month}-${String(day).padStart(2, '0')}`,
          month_ref: targetMonth,
          status: 'pending',
          notes: 'Gerado a partir do seu modelo de contas fixas',
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
    setTransactions([]);
    setSalaries({});
    setCards(DEFAULT_CREDIT_CARDS);
    setFixedTemplates(DEFAULT_FIXED_BILLS_TEMPLATES);
    clearUserStorage();
  };

  const saveAndSync = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Gravação local explícita imediata
      saveStoredTransactions(transactions, user?.id);
      saveStoredSalaries(salaries, user?.id);
      saveStoredCards(cards, user?.id);
      saveStoredFixedTemplates(fixedTemplates, user?.id);

      const now = new Date();
      setLastSavedAt(now);
      localStorage.setItem('meu_financeiro_last_saved', now.toISOString());

      // 2. Sincronização com o Supabase se o usuário estiver autenticado
      if (user) {
        setSyncStatus('syncing');
        setSyncMessage('Salvando e sincronizando dados com o Supabase...');

        const result = await syncWithCloud(user.id, transactions, salaries, cards, fixedTemplates);
        if (result.success) {
          if (result.transactions) setTransactions(result.transactions);
          if (result.salaries) setSalaries(result.salaries);
          if (result.cards && result.cards.length > 0) setCards(result.cards);
          if (result.fixedTemplates && result.fixedTemplates.length > 0) setFixedTemplates(result.fixedTemplates);
          setSyncStatus('synced');
          setSyncMessage(result.message || 'Dados salvos e sincronizados com a nuvem com sucesso!');
          setTimeout(() => setSyncStatus('idle'), 5000);
          return { success: true, message: result.message || 'Dados salvos e sincronizados com a nuvem!' };
        } else {
          setSyncStatus('error');
          setSyncMessage(result.message);
          setTimeout(() => setSyncStatus('idle'), 6000);
          return { success: false, message: result.message };
        }
      } else {
        // Usuário no modo local: dados garantidos localmente
        setSyncStatus('synced');
        const msg = 'Alterações salvas com sucesso no seu dispositivo! Faça login para salvar na nuvem.';
        setSyncMessage(msg);
        setTimeout(() => setSyncStatus('idle'), 4000);
        return { success: true, message: msg };
      }
    } catch (err: any) {
      console.error('Erro em saveAndSync:', err);
      setSyncStatus('error');
      setSyncMessage('Erro ao salvar alterações.');
      setTimeout(() => setSyncStatus('idle'), 5000);
      return { success: false, message: err?.message || 'Erro ao salvar alterações.' };
    }
  };

  const syncNow = async () => {
    await saveAndSync();
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
        addCard,
        updateCard,
        deleteCard,
        fixedTemplates,
        addFixedTemplate,
        updateFixedTemplate,
        deleteFixedTemplate,
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
        saveAndSync,
        lastSavedAt,
        user,
        isCloudConfigured,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        editingTransaction,
        setEditingTransaction,
        isSalaryModalOpen,
        setIsSalaryModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
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
