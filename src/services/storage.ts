import type { Transaction, SalaryInfo, CreditCardInfo, FixedBillTemplate } from '../types/finance';
import { 
  getDefaultTransactions, 
  getDefaultSalary, 
  DEFAULT_CREDIT_CARDS, 
  DEFAULT_FIXED_BILLS_TEMPLATES,
  getCurrentMonthRef,
  generateUUID,
  isUUID 
} from '../utils/finance';
import { getSupabaseClient } from './supabase';

const KEYS = {
  TRANSACTIONS: 'meu_financeiro_transactions_v1',
  SALARIES: 'meu_financeiro_salaries_v1',
  CARDS: 'meu_financeiro_cards_v1',
  FIXED_TEMPLATES: 'meu_financeiro_fixed_templates_v1',
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

export const loadStoredFixedTemplates = (): FixedBillTemplate[] => {
  try {
    const raw = localStorage.getItem(KEYS.FIXED_TEMPLATES);
    if (!raw) {
      localStorage.setItem(KEYS.FIXED_TEMPLATES, JSON.stringify(DEFAULT_FIXED_BILLS_TEMPLATES));
      return DEFAULT_FIXED_BILLS_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar modelo de contas fixas:', e);
    return DEFAULT_FIXED_BILLS_TEMPLATES;
  }
};

export const saveStoredFixedTemplates = (templates: FixedBillTemplate[]) => {
  try {
    localStorage.setItem(KEYS.FIXED_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Falha ao salvar modelo de contas fixas:', e);
  }
};

// Cloud sync functions with Supabase
export const syncWithCloud = async (
  userId: string,
  localTransactions: Transaction[],
  localSalaries: Record<string, SalaryInfo>,
  localCards?: CreditCardInfo[],
  localTemplates?: FixedBillTemplate[]
): Promise<{
  success: boolean;
  transactions?: Transaction[];
  salaries?: Record<string, SalaryInfo>;
  cards?: CreditCardInfo[];
  fixedTemplates?: FixedBillTemplate[];
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

    // 5. Sync credit cards (safe try-catch)
    let unifiedCards: CreditCardInfo[] = localCards || [];
    try {
      if (localCards && localCards.length > 0) {
        const cardsToUpsert = localCards.map((c) => ({
          id: isUUID(c.id) ? c.id : generateUUID(),
          user_id: userId,
          name: c.name,
          brand: c.brand || 'Outro',
          closing_day: Number(c.closing_day) || 15,
          due_day: Number(c.due_day) || 22,
          limit_amount: c.limit_amount ? Number(c.limit_amount) : 0,
          color: c.color || '#8a05be',
        }));
        await supabase.from('credit_cards').upsert(cardsToUpsert);
      }
      const { data: remoteCards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userId);
      if (remoteCards && remoteCards.length > 0) {
        unifiedCards = remoteCards.map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          name: c.name,
          brand: c.brand,
          closing_day: c.closing_day,
          due_day: c.due_day,
          limit_amount: c.limit_amount,
          color: c.color,
        }));
        saveStoredCards(unifiedCards);
      }
    } catch (cardErr) {
      console.warn('Sync de cartões ignorado ou tabela não configurada:', cardErr);
    }

    // 6. Sync fixed templates (safe try-catch)
    let unifiedTemplates: FixedBillTemplate[] = localTemplates || [];
    try {
      if (localTemplates && localTemplates.length > 0) {
        const templatesToUpsert = localTemplates.map((t) => ({
          id: isUUID(t.id) ? t.id : generateUUID(),
          user_id: userId,
          title: t.title,
          account_type: t.account_type || t.title,
          default_amount: Number(t.default_amount) || 0,
          due_day: Number(t.due_day) || 10,
          category: 'fixed',
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('fixed_templates').upsert(templatesToUpsert);
      }
      const { data: remoteTemplates } = await supabase
        .from('fixed_templates')
        .select('*')
        .eq('user_id', userId);
      if (remoteTemplates && remoteTemplates.length > 0) {
        unifiedTemplates = remoteTemplates.map((t: any) => ({
          id: t.id,
          user_id: t.user_id,
          title: t.title,
          account_type: t.account_type,
          default_amount: Number(t.default_amount) || 0,
          due_day: t.due_day,
          category: 'fixed',
        }));
        saveStoredFixedTemplates(unifiedTemplates);
      }
    } catch (tplErr) {
      console.warn('Sync de modelos fixos ignorado ou tabela não configurada:', tplErr);
    }

    return {
      success: true,
      transactions: unifiedTransactions,
      salaries: mergedSalaries,
      cards: unifiedCards,
      fixedTemplates: unifiedTemplates,
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
