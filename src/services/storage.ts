import type { Transaction, SalaryInfo, CreditCardInfo } from '../types/finance';
import { 
  getDefaultTransactions, 
  getDefaultSalary, 
  DEFAULT_CREDIT_CARDS, 
  getCurrentMonthRef,
  generateUUID,
  isUUID 
} from '../utils/finance';
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
  count?: number;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase não configurado. Os dados permanecem salvos localmente.',
    };
  }

  try {
    // 1. Fetch remote transactions for the user
    const { data: remoteTrans, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (transError) throw transError;

    // 2. Fetch remote salaries for the user
    const { data: remoteSal, error: salError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('user_id', userId);

    if (salError) throw salError;

    // Index remote transactions by ID and by logical unique key
    const remoteById = new Map<string, any>((remoteTrans || []).map((t) => [t.id, t]));
    const getTxKey = (t: Partial<Transaction>) => `${t.month_ref}_${t.account_type}_${t.due_date}_${t.title}`;
    const remoteByKey = new Map<string, any>((remoteTrans || []).map((t) => [getTxKey(t), t]));

    // Normalize and prepare local transactions for upsert
    const toUpsertTransactions: any[] = [];
    const validLocalTransactions: Transaction[] = [];

    for (const tx of localTransactions) {
      let finalId = tx.id;
      // If id is not a valid UUID, check if it already matches a remote row or generate a UUID
      if (!isUUID(finalId)) {
        const matchingRemote = remoteByKey.get(getTxKey(tx));
        if (matchingRemote && isUUID(matchingRemote.id)) {
          finalId = matchingRemote.id;
        } else {
          finalId = generateUUID();
        }
      }

      const normalizedTx: Transaction = {
        ...tx,
        id: finalId,
        user_id: userId,
        updated_at: tx.updated_at || new Date().toISOString(),
      };
      validLocalTransactions.push(normalizedTx);

      const remoteMatch = remoteById.get(finalId);
      if (!remoteMatch) {
        // New transaction created locally (e.g., newly added November bills) -> MUST be uploaded!
        toUpsertTransactions.push({
          id: finalId,
          user_id: userId,
          title: tx.title,
          category: tx.category,
          account_type: tx.account_type,
          amount: Number(tx.amount) || 0,
          due_date: tx.due_date,
          month_ref: tx.month_ref,
          status: tx.status,
          notes: tx.notes || null,
          created_at: tx.created_at || new Date().toISOString(),
          updated_at: normalizedTx.updated_at,
        });
      } else {
        // Both exist: if local has newer status or update, send local
        const localTime = new Date(normalizedTx.updated_at || normalizedTx.created_at).getTime();
        const remoteTime = new Date(remoteMatch.updated_at || remoteMatch.created_at).getTime();
        if (localTime > remoteTime || normalizedTx.status !== remoteMatch.status) {
          toUpsertTransactions.push({
            id: finalId,
            user_id: userId,
            title: tx.title,
            category: tx.category,
            account_type: tx.account_type,
            amount: Number(tx.amount) || 0,
            due_date: tx.due_date,
            month_ref: tx.month_ref,
            status: tx.status,
            notes: tx.notes || null,
            created_at: remoteMatch.created_at || normalizedTx.created_at,
            updated_at: normalizedTx.updated_at,
          });
        }
      }
    }

    // Upsert pending local transactions to Supabase
    if (toUpsertTransactions.length > 0) {
      const { error: upsertTxError } = await supabase
        .from('transactions')
        .upsert(toUpsertTransactions);
      if (upsertTxError) throw upsertTxError;
    }

    // 3. Prepare Salaries
    const remoteSalByMonth = new Map<string, any>((remoteSal || []).map((s) => [s.month_ref, s]));
    const toUpsertSalaries: any[] = [];

    for (const [monthRef, sal] of Object.entries(localSalaries)) {
      const remoteMatch = remoteSalByMonth.get(monthRef);
      if (!remoteMatch) {
        toUpsertSalaries.push({
          user_id: userId,
          month_ref: monthRef,
          base_salary: Number(sal.base_salary) || 0,
          extra_income: Number(sal.extra_income) || 0,
          payday: Number(sal.payday) || 5,
          notes: sal.notes || null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (toUpsertSalaries.length > 0) {
      const { error: upsertSalError } = await supabase
        .from('salary_records')
        .upsert(toUpsertSalaries, { onConflict: 'user_id,month_ref' });
      if (upsertSalError) throw upsertSalError;
    }

    // 4. Fetch the authoritative unified dataset from Supabase
    const { data: finalTrans, error: finalTransError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (finalTransError) throw finalTransError;

    const { data: finalSal, error: finalSalError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('user_id', userId);

    if (finalSalError) throw finalSalError;

    const mergedSalaries: Record<string, SalaryInfo> = { ...localSalaries };
    (finalSal || []).forEach((s: any) => {
      mergedSalaries[s.month_ref] = {
        id: s.id,
        user_id: s.user_id,
        month_ref: s.month_ref,
        base_salary: Number(s.base_salary) || 0,
        extra_income: Number(s.extra_income) || 0,
        payday: Number(s.payday) || 5,
        notes: s.notes || '',
      };
    });

    const unifiedTransactions: Transaction[] = (finalTrans || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      title: t.title,
      category: t.category,
      account_type: t.account_type,
      amount: Number(t.amount) || 0,
      due_date: t.due_date,
      month_ref: t.month_ref,
      status: t.status,
      notes: t.notes || '',
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    // Update local storage cache immediately with the unified data
    saveStoredTransactions(unifiedTransactions);
    saveStoredSalaries(mergedSalaries);

    return {
      success: true,
      transactions: unifiedTransactions,
      salaries: mergedSalaries,
      message: `Sincronização concluída com sucesso! (${unifiedTransactions.length} contas sincronizadas)`,
      count: unifiedTransactions.length,
    };
  } catch (err: any) {
    console.error('Erro na sincronização:', err);
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || 'Falha de conexão com o Supabase.'}`,
    };
  }
};
