import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'meu_financeiro_supabase_url',
  SUPABASE_ANON_KEY: 'meu_financeiro_supabase_anon_key',
};

export const getStoredSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  const url = localUrl || envUrl || '';
  const anonKey = localKey || envKey || '';

  return { url, anonKey };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (anonKey) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  }
};

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
};

