import React, { useState } from 'react';
import { X, Mail, Lock, Cloud, CheckCircle, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '../services/supabase';
import { useFinance } from '../context/FinanceContext';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isCloudConfigured, syncNow, syncStatus, syncMessage } = useFinance();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage({
        text: 'Chaves do Supabase não configuradas. Acesse a aba Configurações para adicioná-las.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Conta criada! Verifique seu e-mail de confirmação ou faça login.',
          type: 'success',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Login realizado com sucesso! Sincronizando dados...',
          type: 'success',
        });
        await syncNow();
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Erro durante a autenticação.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nuvem & Autenticação</h3>
              <p className="text-xs text-slate-400">Sincronize PC e Celular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {user ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Conectado na Nuvem</h4>
                <p className="text-sm text-slate-300 font-medium mt-1">{user.email}</p>
                <p className="text-xs text-slate-500 mt-0.5">Seus dados estão sincronizados com segurança</p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  disabled={syncStatus === 'syncing'}
                  onClick={async () => {
                    await syncNow();
                  }}
                  className={clsx(
                    'w-full py-2.5 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow',
                    syncStatus === 'syncing'
                      ? 'bg-amber-600/80 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98'
                  )}
                >
                  <RefreshCw className={clsx('w-4 h-4', syncStatus === 'syncing' && 'animate-spin')} />
                  <span>{syncStatus === 'syncing' ? 'Sincronizando com o banco...' : 'Sincronizar Agora'}</span>
                </button>

                {/* Status Feedback Notification */}
                {syncMessage && (
                  <div
                    className={clsx(
                      'p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left transition border',
                      syncStatus === 'synced' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      syncStatus === 'error' && 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                      syncStatus === 'syncing' && 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    )}
                  >
                    {syncStatus === 'synced' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {syncStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
                    <span className="leading-snug">{syncMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!isCloudConfigured && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Supabase em Modo Local
                  </div>
                  O aplicativo está salvando tudo perfeitamente no seu navegador. Para conectar ao Supabase gratuito na nuvem, você pode inserir sua URL e Chave Anon na aba Configurações.
                </div>
              )}

              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    !isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : isSignUp ? 'Cadastrar na Nuvem' : 'Acessar Conta'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Continuar usando localmente no navegador
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

