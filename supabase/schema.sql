-- ==============================================================================
-- MEU FINANCEIRO - ESQUEMA DO BANCO DE DADOS SUPABASE (PostgreSQL)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto no Supabase (supabase.com)
-- para criar todas as tabelas, índices e políticas de segurança RLS.

-- 1. Criação da tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  theme_preference TEXT DEFAULT 'dark',
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Categorias e Contas Predefinidas
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'card', 'variable', 'salary', 'extra')),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT DEFAULT 'Outro',
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  limit_amount NUMERIC(12,2) DEFAULT 0,
  color TEXT DEFAULT '#ff7a00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Registros de Salário e Receitas Mensais
CREATE TABLE IF NOT EXISTS public.salary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  month_ref TEXT NOT NULL, -- formato YYYY-MM (ex: 2026-10)
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  extra_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  payday INTEGER DEFAULT 5 CHECK (payday BETWEEN 1 AND 31),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_salary_month UNIQUE (user_id, month_ref)
);

-- 5. Tabela de Transações e Contas (Fixas, Cartões e Outras)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fixed', 'card', 'variable', 'salary', 'extra')),
  account_type TEXT NOT NULL, -- 'Internet', 'Celular', 'Seguro Carro', 'Seguro Moto', 'Cartão Inter', 'Cartão Nubank', etc.
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  month_ref TEXT NOT NULL, -- formato YYYY-MM
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para buscas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON public.transactions(user_id, month_ref);
CREATE INDEX IF NOT EXISTS idx_salary_user_month ON public.salary_records(user_id, month_ref);

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- Garante que cada usuário veja e modifique APENAS os seus próprios dados financeiros.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuário pode ver próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuário pode inserir próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para salary_records
CREATE POLICY "Usuário pode gerenciar seus salários" ON public.salary_records
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Usuário pode gerenciar suas transações" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para credit_cards
CREATE POLICY "Usuário pode gerenciar seus cartões" ON public.credit_cards
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para categories
CREATE POLICY "Usuário pode gerenciar suas categorias" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente no SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

