import React from 'react';
import { 
  Wallet, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Wifi, 
  Smartphone, 
  ChevronRight, 
  RefreshCw, 
  PiggyBank,
  Zap,
  Droplets,
  Home,
  ShoppingBag,
  MoreHorizontal
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FinanceCard } from '../components/FinanceCard';
import { AlertBanner } from '../components/AlertBanner';
import { formatCurrency, formatPercent, formatDateBR, formatMonthRef } from '../utils/finance';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const {
    summary,
    monthTransactions,
    currentMonth,
    currentSalary,
    togglePaymentStatus,
    setIsSalaryModalOpen,
    generateFixedBillsForMonth,
  } = useFinance();

  const navigate = useNavigate();

  // Prepare chart data for Distribution (Pie)
  const fixedTotal = summary.fixedExpenses;
  const interTotal = monthTransactions
    .filter((t) => t.account_type === 'Cartão Inter')
    .reduce((sum, t) => sum + t.amount, 0);
  const nubankTotal = monthTransactions
    .filter((t) => t.account_type === 'Cartão Nubank')
    .reduce((sum, t) => sum + t.amount, 0);
  const otherTotal = summary.otherExpenses;

  const distributionData = [
    { name: 'Contas Fixas', value: fixedTotal, color: '#10b981' }, // Emerald
    { name: 'Cartão Inter', value: interTotal, color: '#ff7a00' }, // Orange
    { name: 'Cartão Nubank', value: nubankTotal, color: '#8a05be' }, // Purple
    ...(otherTotal > 0 ? [{ name: 'Outras Despesas', value: otherTotal, color: '#3b82f6' }] : []),
  ].filter((d) => d.value > 0);

  // Comparison Bar Chart (Receita vs Despesas Totais vs Realizado)
  const comparisonData = [
    { name: 'Receita', valor: summary.totalIncome, fill: '#10b981' },
    { name: 'Despesas', valor: summary.totalExpenses, fill: summary.alertLevel === 'danger' ? '#ef4444' : '#f59e0b' },
    { name: 'Já Pago', valor: summary.paidExpenses, fill: '#06b6d4' },
    { name: 'A Pagar', valor: summary.pendingExpenses, fill: '#64748b' },
  ];

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Internet': return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'Celular': return <Smartphone className="w-4 h-4 text-teal-400" />;
      case 'Seguro Carro':
      case 'Seguro Moto': return <Shield className="w-4 h-4 text-sky-400" />;
      case 'Cartão Inter': return <CreditCard className="w-4 h-4 text-orange-400" />;
      case 'Cartão Nubank': return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'Luz':
      case 'Energia': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Água': return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'Aluguel':
      case 'Condomínio': return <Home className="w-4 h-4 text-blue-400" />;
      case 'Mercado': return <ShoppingBag className="w-4 h-4 text-rose-400" />;
      case 'Outro':
      case 'Outros':
      default: return <MoreHorizontal className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Visão Geral • {formatMonthRef(currentMonth)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Painel Financeiro
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateFixedBillsForMonth(currentMonth)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition"
            title="Importa ou gera contas fixas padrão para este mês se ainda não existirem"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gerar Fixas do Mês</span>
          </button>
        </div>
      </div>

      {/* Dynamic Alert Banner (Red if debts > salary, Yellow if > 80%, Green if under control) */}
      <AlertBanner
        summary={summary}
        onManageClick={() => navigate('/expenses')}
      />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Previsto no Mês */}
        <FinanceCard
          title="Saldo Previsto no Mês"
          value={formatCurrency(summary.balanceForecast)}
          subtitle={
            summary.balanceForecast >= 0
              ? 'Sobra prevista após todas as despesas'
              : 'Déficit! Gastos superaram a receita'
          }
          icon={<PiggyBank className="w-5 h-5" />}
          variant={
            summary.balanceForecast < 0
              ? 'rose'
              : summary.commitmentRate >= 80
              ? 'amber'
              : 'emerald'
          }
        />

        {/* Comprometimento do Salário */}
        <FinanceCard
          title="Comprometimento Salário"
          value={formatPercent(summary.commitmentRate)}
          subtitle={
            summary.commitmentRate >= 100
              ? 'Alerta: 100%+ da renda comprometida'
              : `${formatCurrency(summary.totalExpenses)} do total de ${formatCurrency(summary.totalIncome)}`
          }
          icon={<TrendingDown className="w-5 h-5" />}
          variant={
            summary.commitmentRate >= 100
              ? 'rose'
              : summary.commitmentRate >= 80
              ? 'amber'
              : 'emerald'
          }
        />

        {/* Receita Mensal */}
        <FinanceCard
          title="Receita Mensal"
          value={formatCurrency(summary.totalIncome)}
          subtitle={`Salário: ${formatCurrency(currentSalary.base_salary)} ${
            currentSalary.extra_income > 0 ? `+ Extras: ${formatCurrency(currentSalary.extra_income)}` : ''
          }`}
          icon={<Wallet className="w-5 h-5" />}
          variant="indigo"
          onClick={() => setIsSalaryModalOpen(true)}
          badge="Editar"
        />

        {/* Despesas Totais */}
        <FinanceCard
          title="Despesas Totais"
          value={formatCurrency(summary.totalExpenses)}
          subtitle={`Pagas: ${formatCurrency(summary.paidExpenses)} | Pendentes: ${formatCurrency(summary.pendingExpenses)}`}
          icon={<CreditCard className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/expenses')}
        />
      </div>

      {/* Sub-Cards Breakdown: Contas Fixas & Cartões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contas Fixas */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Contas Fixas</h4>
                <p className="text-xs text-slate-400">Internet, Celular, Seguros</p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-emerald-400">
              {formatCurrency(summary.fixedExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {['Internet', 'Celular', 'Seguro Carro', 'Seguro Moto'].map((acc) => {
              const item = monthTransactions.find((t) => t.account_type === acc);
              return (
                <div key={acc} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
                  <span className="text-slate-400 truncate">{acc}</span>
                  <span className="font-semibold text-slate-200">
                    {item ? formatCurrency(item.amount) : 'R$ 0,00'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartões Inter & Nubank */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Faturas de Cartão</h4>
                <p className="text-xs text-slate-400">Inter & Nubank</p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-purple-400">
              {formatCurrency(summary.cardExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border-l-2 border-orange-500">
              <span className="text-slate-400">Inter</span>
              <span className="font-semibold text-orange-400">
                {formatCurrency(interTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border-l-2 border-purple-500">
              <span className="text-slate-400">Nubank</span>
              <span className="font-semibold text-purple-400">
                {formatCurrency(nubankTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Distribuição das Despesas */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Distribuição das Despesas</h3>
            </div>
            <p className="text-xs text-slate-400">Proporção por categoria de gasto</p>
          </div>

          <div className="h-56 relative flex items-center justify-center my-2">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Nenhuma despesa cadastrada neste mês</div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {distributionData.map((item) => {
              const pct = summary.totalExpenses > 0 ? (item.value / summary.totalExpenses) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatPercent(pct)}</span>
                    <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart: Comparativo de Fluxo */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Comparativo Financeiro</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {formatMonthRef(currentMonth)}
              </span>
            </div>
            <p className="text-xs text-slate-400">Relação entre receita total, despesas previstas e pagamentos</p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Saldo Realizado (Receita - Pagas):</span>
            <span className="font-bold text-white">{formatCurrency(summary.balanceRealized)}</span>
          </div>
        </div>
      </div>

      {/* Lançamentos do Mês / Vencimentos Rápidos */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Contas e Vencimentos deste Mês</h3>
            <p className="text-xs text-slate-400">Clique para alternar entre Pendente e Pago</p>
          </div>

          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
          >
            <span>Gerenciar todas as contas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Nenhuma conta registrada para {formatMonthRef(currentMonth)}.
            <div className="mt-3">
              <button
                onClick={() => generateFixedBillsForMonth(currentMonth)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                Gerar Contas Fixas Agora
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                  tx.status === 'paid'
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                    {getAccountIcon(tx.account_type)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-white truncate">{tx.title}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateBR(tx.due_date)}
                      </span>
                      <span className="truncate">• {tx.account_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-black text-white">{formatCurrency(tx.amount)}</span>
                  <button
                    onClick={() => togglePaymentStatus(tx.id)}
                    className={`mt-1 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition ${
                      tx.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }`}
                  >
                    {tx.status === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Pago</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pendente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
