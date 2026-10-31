import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'meu_financeiro_supabase_url',
  SUPABASE_ANON_KEY: 'meu_financeiro_supabase_anon_key',
};

export const getStoredSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  let localUrl = (localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '').trim();
  let localKey = (localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '').trim();

  // Auto-cleanup: if localStorage has obsolete or misconfigured keys (e.g. secret key or publishable key in URL), remove them
  if (localUrl.includes('sb_publishable_') || localUrl.includes('sb_secret_')) {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localUrl = '';
  }
  if (localKey.startsWith('sb_secret_')) {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    localKey = '';
  }

  // URL prioritizing valid value, sanitized (no trailing slash)
  let url = (localUrl || envUrl || '').replace(/\/+$/, '');
  let anonKey = localKey || envKey || '';

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

  if (anonKey.startsWith('sb_secret_')) {
    console.error(
      '⚠️ [Supabase] ATENÇÃO: Foi configurada uma chave secreta ("sb_secret_..."). No frontend, utilize sempre a chave pública ("sb_publishable_..." ou "anon" que começa com "eyJ..."). A Secret Key nunca deve ser exposta no navegador!'
    );
  }

  if (url.includes('sb_publishable_') || url.includes('sb_secret_')) {
    console.error(
      '⚠️ [Supabase] ATENÇÃO: A URL informada parece conter uma chave API. A URL do projeto deve ser no formato: https://<project-ref>.supabase.co (encontrada em Project Settings > API no Supabase).'
    );
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

