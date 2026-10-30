import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatMonthRef } from '../utils/finance';

export const SalaryModal: React.FC = () => {
  const {
    isSalaryModalOpen,
    setIsSalaryModalOpen,
    currentMonth,
    currentSalary,
    updateSalary,
  } = useFinance();

  const [baseSalaryStr, setBaseSalaryStr] = useState('');
  const [extraIncomeStr, setExtraIncomeStr] = useState('');
  const [payday, setPayday] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentSalary) {
      setBaseSalaryStr(String(currentSalary.base_salary));
      setExtraIncomeStr(String(currentSalary.extra_income || 0));
      setPayday(currentSalary.payday || 5);
      setNotes(currentSalary.notes || '');
    }
  }, [currentSalary, isSalaryModalOpen]);

  if (!isSalaryModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(baseSalaryStr.replace(',', '.'));
    const extra = parseFloat(extraIncomeStr.replace(',', '.') || '0');

    if (isNaN(base) || base < 0) {
      alert('Informe um salário válido.');
      return;
    }

    updateSalary(currentMonth, {
      base_salary: base,
      extra_income: isNaN(extra) ? 0 : extra,
      payday: Number(payday),
      notes,
    });

    setIsSalaryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">Receita Mensal & Salário</h3>
            <p className="text-xs text-slate-400">Competência: {formatMonthRef(currentMonth)}</p>
          </div>
          <button
            onClick={() => setIsSalaryModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Salário Líquido Mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-400 font-bold text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={baseSalaryStr}
                onChange={(e) => setBaseSalaryStr(e.target.value)}
                placeholder="5200.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Renda Extra / 13º / Reembolso (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={extraIncomeStr}
                onChange={(e) => setExtraIncomeStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Dia de Recebimento
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="number"
                min="1"
                max="31"
                value={payday}
                onChange={(e) => setPayday(Number(e.target.value))}
                placeholder="5"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Salário da empresa principal + freelances"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSalaryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              Salvar Receita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
