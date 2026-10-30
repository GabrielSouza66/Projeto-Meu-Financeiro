import React from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';
import type { MonthlySummary } from '../types/finance';
import { formatCurrency, formatPercent } from '../utils/finance';

interface AlertBannerProps {
  summary: MonthlySummary;
  onManageClick?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ summary, onManageClick }) => {
  const { alertLevel, commitmentRate, balanceForecast, totalExpenses, totalIncome } = summary;

  if (alertLevel === 'danger') {
    const deficit = Math.abs(balanceForecast);
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900/90 to-red-950 p-4 sm:p-5 border-2 border-rose-500 shadow-xl shadow-rose-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-lg animate-pulse shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Alerta Vermelho Crítico
                </span>
                <span className="text-xs font-semibold text-rose-200">
                  {formatPercent(commitmentRate)} comprometido
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                Dívidas e despesas superam seu salário neste mês!
              </h4>
              <p className="text-xs sm:text-sm text-rose-200/90 mt-0.5">
                Despesas ({formatCurrency(totalExpenses)}) ultrapassam a receita ({formatCurrency(totalIncome)}) em{' '}
                <strong className="text-white underline decoration-rose-300">
                  {formatCurrency(deficit)}
                </strong>
                . É necessário reduzir gastos nos cartões ou ajustar o orçamento.
              </p>
            </div>
          </div>

          {onManageClick && (
            <button
              onClick={onManageClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-rose-950 font-bold text-sm shadow hover:bg-rose-100 transition active:scale-95 shrink-0"
            >
              <span>Ajustar Contas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (alertLevel === 'warning') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-yellow-950/80 p-4 sm:p-5 border border-amber-500/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                  Atenção ao Orçamento
                </span>
                <span className="text-xs font-medium text-amber-200">
                  {formatPercent(commitmentRate)} da renda
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                Seus gastos atingiram a faixa de alerta (acima de 80%).
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Margem de segurança apertada. Saldo livre previsto de apenas{' '}
                <span className="font-semibold text-white">{formatCurrency(balanceForecast)}</span>.
              </p>
            </div>
          </div>

          {onManageClick && (
            <button
              onClick={onManageClick}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition active:scale-95 shrink-0"
            >
              <span>Ver Detalhes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900/90 p-4 sm:p-5 border border-emerald-500/30 shadow-md">
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                Sob Controle
              </span>
              <span className="text-xs font-medium text-emerald-300/80">
                {formatPercent(commitmentRate)} comprometido
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
              Suas despesas estão saudáveis e dentro do salário informado.
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Saldo previsto para poupar ou investir:{' '}
              <span className="font-bold text-emerald-400">{formatCurrency(balanceForecast)}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
