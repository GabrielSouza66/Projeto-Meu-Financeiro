import type { Transaction, SalaryInfo, CreditCardInfo } from '../types/finance';
import { getDefaultTransactions, getDefaultSalary, DEFAULT_CREDIT_CARDS, getCurrentMonthRef } from '../utils/finance';
import { getSupabaseClient } from './supabase';

const KEYS = {
  TRANSACTIONS: 'meu_financeiro_transactions_v1',
  SALARIES: 'meu_financeiro_salaries_v1',
  CARDS: 'meu_financeiro_cards_v1',
  THEME: 'meu_financeiro_theme',
};

export const loadStoredTransactions = (): Transaction[] => {
  const currentMonth = getCurrentMonthRef();
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) {
      const initial = getDefaultTransactions(currentMonth);
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar transações locais:', e);
    return getDefaultTransactions(currentMonth);
  }
};

export const saveStoredTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Falha ao salvar transações locais:', e);
  }
};

export const loadStoredSalaries = (): Record<string, SalaryInfo> => {
  const currentMonth = getCurrentMonthRef();
  try {
    const raw = localStorage.getItem(KEYS.SALARIES);
    if (!raw) {
      const initial: Record<string, SalaryInfo> = {
        [currentMonth]: getDefaultSalary(currentMonth),
      };
      localStorage.setItem(KEYS.SALARIES, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar salários locais:', e);
    return { [currentMonth]: getDefaultSalary(currentMonth) };
  }
};

export const saveStoredSalaries = (salaries: Record<string, SalaryInfo>) => {
  try {
    localStorage.setItem(KEYS.SALARIES, JSON.stringify(salaries));
  } catch (e) {
    console.error('Falha ao salvar salários locais:', e);
  }
};

export const loadStoredCards = (): CreditCardInfo[] => {
  try {
    const raw = localStorage.getItem(KEYS.CARDS);
    if (!raw) {
      localStorage.setItem(KEYS.CARDS, JSON.stringify(DEFAULT_CREDIT_CARDS));
      return DEFAULT_CREDIT_CARDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar cartões locais:', e);
    return DEFAULT_CREDIT_CARDS;
  }
};

export const saveStoredCards = (cards: CreditCardInfo[]) => {
  try {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Falha ao salvar cartões locais:', e);
  }
};

// Cloud sync functions with Supabase
export const syncWithCloud = async (
  userId: string,
  localTransactions: Transaction[],
  localSalaries: Record<string, SalaryInfo>
): Promise<{
  success: boolean;
  transactions?: Transaction[];
  salaries?: Record<string, SalaryInfo>;
  message: string;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase não configurado. Dados salvos localmente.',
    };
  }

  try {
    // 1. Fetch remote transactions
    const { data: remoteTrans, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (transError) throw transError;

    // 2. Fetch remote salaries
    const { data: remoteSal, error: salError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('user_id', userId);

    if (salError) throw salError;

    // Merge or upload: If remote is empty, upload local
    if ((!remoteTrans || remoteTrans.length === 0) && localTransactions.length > 0) {
      const toInsert = localTransactions.map((t) => ({
        ...t,
        user_id: userId,
      }));
      await supabase.from('transactions').upsert(toInsert);
    }

    if ((!remoteSal || remoteSal.length === 0) && Object.keys(localSalaries).length > 0) {
      const salToInsert = Object.values(localSalaries).map((s) => ({
        ...s,
        user_id: userId,
      }));
      await supabase.from('salary_records').upsert(salToInsert);
    }

    // Re-fetch clean merged dataset
    const { data: finalTrans } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    const { data: finalSal } = await supabase
      .from('salary_records')
      .select('*')
      .eq('user_id', userId);

    const mergedSalaries: Record<string, SalaryInfo> = {};
    (finalSal || []).forEach((s: any) => {
      mergedSalaries[s.month_ref] = s;
    });

    return {
      success: true,
      transactions: finalTrans || localTransactions,
      salaries: Object.keys(mergedSalaries).length ? mergedSalaries : localSalaries,
      message: 'Sincronizado com a nuvem com sucesso!',
    };
  } catch (err: any) {
    console.error('Erro na sincronização:', err);
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || 'Falha de conexão'}`,
    };
  }
};
