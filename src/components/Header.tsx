import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sun, 
  Moon, 
  Cloud, 
  CloudOff, 
  AlertOctagon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  User
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getAvailableMonths } from '../utils/finance';
import { AuthModal } from './AuthModal';
import clsx from 'clsx';

export const Header: React.FC = () => {
  const {
    currentMonth,
    setCurrentMonth,
    summary,
    theme,
    toggleTheme,
    setIsExpenseModalOpen,
    setEditingTransaction,
    user,
    syncNow,
    syncStatus,
    syncMessage,
  } = useFinance();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const months = getAvailableMonths();

  const handlePrevMonth = () => {
    const currentIndex = months.findIndex((m) => m.value === currentMonth);
    if (currentIndex > 0) {
      setCurrentMonth(months[currentIndex - 1].value);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = months.findIndex((m) => m.value === currentMonth);
    if (currentIndex < months.length - 1) {
      setCurrentMonth(months[currentIndex + 1].value);
    }
  };

  const getStatusBadge = () => {
    if (summary.alertLevel === 'danger') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Alerta Crítico</span>
        </div>
      );
    }
    if (summary.alertLevel === 'warning') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Atenção</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>Sob Controle</span>
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Month Selector with Arrows */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-white px-2 py-1 outline-none cursor-pointer text-center"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block">{getStatusBadge()}</div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add Button */}
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/50 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Conta</span>
            </button>

            {/* Cloud Sync Status / Button */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => syncNow()}
                  disabled={syncStatus === 'syncing'}
                  title="Clique para sincronizar com a nuvem"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm',
                    syncStatus === 'syncing' && 'bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-wait',
                    syncStatus === 'synced' && 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
                    syncStatus === 'error' && 'bg-rose-500/10 border-rose-500/40 text-rose-300',
                    syncStatus === 'idle' && 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 active:scale-95'
                  )}
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span className="hidden sm:inline">Sincronizando...</span>
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Sincronizado</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline">Erro Sinc</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Sincronizar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  title={`Conta: ${user.email} (Clique para gerenciar)`}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                title="Conectar com a Nuvem (Supabase)"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:scale-95"
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Conectar Nuvem</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Global Floating Toast / Notification */}
        {syncStatus !== 'idle' && (
          <div className="fixed top-18 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div
              className={clsx(
                'px-4 py-2.5 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 backdrop-blur-xl',
                syncStatus === 'synced' && 'bg-slate-950/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40',
                syncStatus === 'error' && 'bg-slate-950/95 text-rose-300 border-rose-500/50 shadow-rose-950/40',
                syncStatus === 'syncing' && 'bg-slate-950/95 text-amber-300 border-amber-500/50 shadow-amber-950/40'
              )}
            >
              {syncStatus === 'synced' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {syncStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
              <span>{syncMessage}</span>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
