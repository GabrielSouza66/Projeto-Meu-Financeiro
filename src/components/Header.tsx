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
  AlertTriangle
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
            <button
              onClick={() => setIsAuthModalOpen(true)}
              title={user ? `Logado como ${user.email}` : 'Conectar com a Nuvem'}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition',
                user
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              {user ? (
                <>
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Sincronizado</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-slate-400" />
                  <span className="hidden md:inline">Local</span>
                </>
              )}
            </button>

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
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
