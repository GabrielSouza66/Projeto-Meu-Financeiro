import React, { useState } from 'react';
import { Wallet, Calendar, TrendingUp, Edit3, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthRef } from '../utils/finance';

export const Income: React.FC = () => {
  const {
    currentSalary,
    currentMonth,
    updateSalary,
    setIsSalaryModalOpen,
    summary,
  } = useFinance();

  const [extraTitle, setExtraTitle] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(extraAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const currentExtra = currentSalary.extra_income || 0;
    updateSalary(currentMonth, {
      extra_income: currentExtra + val,
      notes: currentSalary.notes
        ? `${currentSalary.notes} + ${extraTitle || 'Extra'} (${formatCurrency(val)})`
        : `${extraTitle || 'Extra'} (${formatCurrency(val)})`,
    });

    setExtraTitle('');
    setExtraAmount('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Receitas • {formatMonthRef(currentMonth)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Salário & Entradas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão do seu salário líquido, rendas extras, reembolsos e 13º salário
          </p>
        </div>

        <button
          onClick={() => setIsSalaryModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar Salário do Mês</span>
        </button>
      </div>

      {/* Salary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Salário Líquido Base
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(currentSalary.base_salary)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recebimento previsto: todo dia {currentSalary.payday || 5}</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rendas Extras / 13º
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(currentSalary.extra_income || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Freelances, bonificações e reembolsos
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Receita Total do Mês
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(summary.totalIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Base para cálculo do comprometimento ({summary.commitmentRate.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Quick Add Extra Income */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-1">Adicionar Renda Extra neste Mês</h3>
        <p className="text-xs text-slate-400 mb-4">
          Recebeu algum valor adicional? Some diretamente à receita deste mês.
        </p>

        <form onSubmit={handleAddExtra} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Origem do valor
            </label>
            <input
              type="text"
              required
              value={extraTitle}
              onChange={(e) => setExtraTitle(e.target.value)}
              placeholder="Ex: Freelance, Reembolso médico..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={extraAmount}
              onChange={(e) => setExtraAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Adicionar à Receita
            </button>
          </div>
        </form>
      </div>

      {/* Salary vs Fixed Accounts Health Check */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">
          Análise de Cobertura do Salário
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Contas Fixas ({formatCurrency(summary.fixedExpenses)})</span>
              <span>{summary.totalIncome > 0 ? ((summary.fixedExpenses / summary.totalIncome) * 100).toFixed(1) : 0}% da renda</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min((summary.fixedExpenses / (summary.totalIncome || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Cartões Inter + Nubank ({formatCurrency(summary.cardExpenses)})</span>
              <span>{summary.totalIncome > 0 ? ((summary.cardExpenses / summary.totalIncome) * 100).toFixed(1) : 0}% da renda</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.min((summary.cardExpenses / (summary.totalIncome || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Saldo Livre Disponível:</span>
          <span className={`font-black text-sm ${summary.balanceForecast >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(summary.balanceForecast)}
          </span>
        </div>
      </div>
    </div>
  );
};
