import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  Settings
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthRef } from '../utils/finance';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { summary, currentMonth } = useFinance();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/expenses', label: 'Minhas Contas', icon: Receipt },
    { to: '/income', label: 'Receitas & Salário', icon: Wallet },
    { to: '/reports', label: 'Relatórios', icon: BarChart3 },
    { to: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 p-5 shrink-0 select-none justify-between h-screen sticky top-0">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 font-black text-xl">
            $
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
              Meu Financeiro
            </h1>
            <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
              Controle Pessoal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mini Month Summary Widget at Bottom of Sidebar */}
      <div className="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {formatMonthRef(currentMonth)}
          </span>
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              summary.alertLevel === 'danger'
                ? 'bg-rose-500 animate-ping'
                : summary.alertLevel === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
          />
        </div>

        <div>
          <span className="text-xs text-slate-400 block">Saldo Previsto</span>
          <span
            className={clsx(
              'text-lg font-black tracking-tight',
              summary.balanceForecast >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {formatCurrency(summary.balanceForecast)}
          </span>
        </div>

        {/* Mini Progress */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Comprometimento</span>
            <span className="font-bold text-slate-200">
              {summary.commitmentRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-500 rounded-full',
                summary.alertLevel === 'danger'
                  ? 'bg-rose-500'
                  : summary.alertLevel === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(summary.commitmentRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
