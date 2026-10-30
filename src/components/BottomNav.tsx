import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, BarChart3, Settings } from 'lucide-react';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/expenses', label: 'Contas', icon: Receipt },
    { to: '/income', label: 'Receitas', icon: Wallet },
    { to: '/reports', label: 'Gráficos', icon: BarChart3 },
    { to: '/settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-2 px-1 rounded-xl transition duration-150',
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={clsx(
                    'p-1 rounded-lg transition-transform',
                    isActive && 'bg-emerald-500/15 scale-110'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

