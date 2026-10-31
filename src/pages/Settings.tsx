import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Database, 
  Smartphone, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getStoredSupabaseConfig, saveSupabaseConfig } from '../services/supabase';
import { AuthModal } from '../components/AuthModal';
import clsx from 'clsx';

export const Settings: React.FC = () => {
  const {
    theme,
    toggleTheme,
    resetToDefaultData,
    transactions,
    salaries,
    cards,
    user,
    syncNow,
    syncStatus,
  } = useFinance();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isSavedConfig, setIsSavedConfig] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    setSupabaseUrl(config.url || '');
    setSupabaseAnonKey(config.anonKey || '');
  }, []);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsSavedConfig(true);
    setTimeout(() => {
      setIsSavedConfig(false);
      window.location.reload();
    }, 1000);
  };

  const handleExportBackup = () => {
    const backup = {
      transactions,
      salaries,
      cards,
      version: '1.0',
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && data.salaries) {
          localStorage.setItem('meu_financeiro_transactions_v1', JSON.stringify(data.transactions));
          localStorage.setItem('meu_financeiro_salaries_v1', JSON.stringify(data.salaries));
          if (data.cards) {
            localStorage.setItem('meu_financeiro_cards_v1', JSON.stringify(data.cards));
          }
          alert('Backup restaurado com sucesso! Recarregando...');
          window.location.reload();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de exemplo padrão (Salário R$ 5.200, Contas Fixas e Cartões)?')) {
      resetToDefaultData();
      alert('Dados restaurados para o modelo padrão!');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Preferências & Sistema
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Configurações
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Personalização de tema, sincronização com nuvem e instalação no celular
        </p>
      </div>

      {/* Section 1: Tema Visual */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Aparência da Aplicação</h3>
          <p className="text-xs text-slate-400">Escolha o estilo visual de sua preferência</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
              theme === 'dark'
                ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Dark Premium</h4>
                <p className="text-xs text-slate-400">Tons escuros, alto contraste e visual bancário moderno</p>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
              theme === 'light'
                ? 'bg-slate-950 border-emerald-500 shadow-md'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Light Clean</h4>
                <p className="text-xs text-slate-400">Fundo claro e limpo para ambientes iluminados</p>
              </div>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Section 2: Nuvem & Supabase */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Conexão na Nuvem (Supabase)</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {user ? 'Autenticado' : 'Modo Offline / Local'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronize automaticamente seus lançamentos entre o computador e o celular
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => syncNow()}
                disabled={syncStatus === 'syncing'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', syncStatus === 'syncing' && 'animate-spin')} />
                <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            )}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow shrink-0"
            >
              {user ? 'Gerenciar Conta' : 'Fazer Login / Cadastro'}
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Project URL do Supabase
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value.trim())}
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {supabaseUrl.includes('sb_publishable_') && (
                <p className="text-[11px] text-amber-400 mt-1">
                  ⚠️ Parece que você colou a chave publishable na URL. A URL correta tem o formato <code className="bg-slate-900 px-1 rounded">https://&lt;id-do-projeto&gt;.supabase.co</code> (disponível em Project Settings &gt; API).
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Chave Pública (Publishable Key ou Anon)
              </label>
              <input
                type="text"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value.trim())}
                placeholder="sb_publishable_... ou eyJhbGci..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {supabaseAnonKey.startsWith('sb_secret_') && (
                <p className="text-[11px] text-rose-400 mt-1">
                  🚨 <strong>Cuidado:</strong> Você inseriu a <strong>Secret Key</strong> (<code className="bg-slate-900 px-1 rounded">sb_secret_...</code>). Para o navegador, utilize a chave pública (<code className="bg-slate-900 px-1 rounded">sb_publishable_...</code> ou a antiga <code className="bg-slate-900 px-1 rounded">anon</code>).
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              * Também é possível configurar no arquivo <code className="text-emerald-400">.env.local</code>.
            </span>
            <div className="flex items-center gap-2">
              {isSavedConfig && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configuração salva!
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700"
              >
                Salvar Chaves
              </button>
            </div>
          </div>
        </form>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Script do Banco de Dados Pronto:</strong> O arquivo{' '}
            <code className="text-emerald-300">supabase/schema.sql</code> já foi gerado na raiz do projeto com as 5 tabelas e regras de segurança Row Level Security (RLS). Basta copiá-lo e colar no SQL Editor do seu painel do Supabase.
          </div>
        </div>
      </div>

      {/* Section 3: Como Usar no Celular (PWA) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Como Instalar no Celular (PWA)</h3>
            <p className="text-xs text-slate-400">Funciona exatamente como um aplicativo nativo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              No Android (Chrome)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Abra o link da sua aplicação no Google Chrome do celular;</li>
              <li>Toque nos <strong className="text-slate-200">3 pontinhos (Menu)</strong> no canto superior direito;</li>
              <li>Toque em <strong className="text-slate-200">"Instalar aplicativo"</strong> ou "Adicionar à tela inicial";</li>
              <li>O ícone do <strong>Meu Financeiro</strong> aparecerá na tela do seu celular!</li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              No iPhone (Safari)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Abra o link da sua aplicação no navegador Safari do iOS;</li>
              <li>Toque no botão de <strong className="text-slate-200">Compartilhar</strong> (quadrado com seta para cima);</li>
              <li>Role para baixo e selecione <strong className="text-slate-200">"Adicionar à Tela de Início"</strong>;</li>
              <li>Toque em "Adicionar". O app abrirá em tela cheia sem barras de navegador.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Section 4: Gerenciamento e Backup de Dados */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Backup e Restauração de Dados</h3>
          <p className="text-xs text-slate-400">Exporte ou importe seus dados para segurança total</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Fazer Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Restaurar Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 text-xs font-bold transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Modelo Padrão</span>
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
