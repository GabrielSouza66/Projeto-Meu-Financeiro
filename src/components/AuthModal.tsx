import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  RefreshCw,
  KeyRound,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { getSupabaseClient } from '../services/supabase';
import { useFinance } from '../context/FinanceContext';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose 
}) => {
  const { 
    user, 
    isCloudConfigured, 
    syncNow, 
    syncStatus, 
    syncMessage,
    isAuthModalOpen: contextIsOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode
  } = useFinance();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    setIsAuthModalOpen(false);
    setMessage(null);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  // Handle Login & Signup
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
      if (authModalMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Conta criada com sucesso! Verifique seu e-mail de confirmação ou acesse com seus dados.',
          type: 'success',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Login realizado com sucesso! Sincronizando dados com a nuvem...',
          type: 'success',
        });
        await syncNow();
        setTimeout(() => handleClose(), 1200);
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

  // Handle "Forgot Password" (Send email)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage({
        text: 'Supabase não conectado. Configure as chaves em Configurações.',
        type: 'error',
      });
      return;
    }

    if (!email.trim()) {
      setMessage({ text: 'Por favor, informe seu e-mail cadastrado.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setMessage({
        text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada e spam para redefinir a senha.',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Erro ao enviar e-mail de recuperação.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle "Reset Password" (Save new password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage({
        text: 'Supabase não conectado.',
        type: 'error',
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'A nova senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As duas senhas não coincidem. Digite novamente.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({
        text: 'Sua senha foi redefinida com sucesso! Você já está autenticado.',
        type: 'success',
      });
      setNewPassword('');
      setConfirmPassword('');
      await syncNow();
      setTimeout(() => {
        setAuthModalMode('login');
        handleClose();
      }, 1500);
    } catch (err: any) {
      setMessage({
        text: err.message || 'Erro ao redefinir senha.',
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
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              {authModalMode === 'forgot' || authModalMode === 'reset' ? (
                <KeyRound className="w-5 h-5 text-amber-400" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {authModalMode === 'forgot'
                  ? 'Recuperar Senha'
                  : authModalMode === 'reset'
                  ? 'Redefinir Senha'
                  : 'Nuvem & Autenticação'}
              </h3>
              <p className="text-xs text-slate-400">
                {authModalMode === 'forgot'
                  ? 'Enviaremos um link de recuperação'
                  : authModalMode === 'reset'
                  ? 'Cadastre uma nova senha de acesso'
                  : 'Sincronize seus dados com segurança'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* USER LOGGED IN SCREEN */}
          {user && authModalMode !== 'reset' ? (
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
                  <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
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
                  onClick={() => {
                    setAuthModalMode('reset');
                    setMessage(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alterar Minha Senha</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : authModalMode === 'forgot' ? (
            /* FORGOT PASSWORD FORM */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white pt-1">Esqueceu sua senha?</h4>
                <p className="text-xs text-slate-400">
                  Informe seu e-mail cadastrado e enviaremos um link seguro para você redefinir sua senha.
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Seu E-mail
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-950/50 disabled:opacity-50"
                >
                  {loading ? 'Enviando e-mail...' : 'Enviar Link de Recuperação'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          ) : authModalMode === 'reset' ? (
            /* RESET PASSWORD FORM */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white pt-1">Criar Nova Senha</h4>
                <p className="text-xs text-slate-400">
                  Digite e confirme a sua nova senha para acessar sua conta.
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {loading ? 'Salvando nova senha...' : 'Salvar Nova Senha'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          ) : (
            /* LOGIN & SIGNUP FORMS */
            <div className="space-y-4">
              {!isCloudConfigured && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Supabase em Modo Local
                  </div>
                  O aplicativo está salvando tudo perfeitamente no seu navegador.
                </div>
              )}

              {/* Tabs: Entrar / Criar Conta */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setMessage(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    authModalMode === 'login' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setMessage(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    authModalMode === 'signup' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{message.text}</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      Senha
                    </label>
                    {authModalMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('forgot');
                          setMessage(null);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
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
                  {loading
                    ? 'Processando...'
                    : authModalMode === 'signup'
                    ? 'Cadastrar na Nuvem'
                    : 'Acessar Conta'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleClose}
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
