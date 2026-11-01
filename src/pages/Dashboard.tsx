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
    fixedTemplates,
    cards,
    theme,
  } = useFinance();

  const navigate = useNavigate();

  // Prepare chart data for Distribution (Pie)
  const fixedTotal = summary.fixedExpenses;
  const otherTotal = summary.otherExpenses;

  // Compute breakdown for registered cards or generic card
  const cardItems = cards.length > 0
    ? cards.map((c, i) => {
        const val = monthTransactions
          .filter((t) => t.category === 'card' && (t.account_type === c.name || t.title.toLowerCase().includes(c.name.toLowerCase())))
          .reduce((acc, t) => acc + t.amount, 0);
        const palette = ['#8a05be', '#ff7a00', '#06b6d4', '#ec4899', '#eab308', '#3b82f6'];
        return {
          name: c.name,
          value: val,
          color: c.color || palette[i % palette.length],
        };
      }).filter((c) => c.value > 0)
    : [];

  const totalRegisteredCardsValue = cardItems.reduce((acc, c) => acc + c.value, 0);
  const unassignedCardValue = Math.max(0, summary.cardExpenses - totalRegisteredCardsValue);

  const distributionData = [
    { name: 'Contas Fixas', value: fixedTotal, color: '#10b981' },
    ...(cardItems.length > 0
      ? cardItems
      : summary.cardExpenses > 0
      ? [{ name: 'Cartão de Crédito', value: summary.cardExpenses, color: '#8a05be' }]
      : []),
    ...(unassignedCardValue > 0 && cardItems.length > 0
      ? [{ name: 'Outros Cartões', value: unassignedCardValue, color: '#a855f7' }]
      : []),
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
    const lower = (type || '').toLowerCase();
    if (lower.includes('internet') || lower.includes('fibra') || lower.includes('wifi')) {
      return <Wifi className="w-4 h-4 text-emerald-400" />;
    }
    if (lower.includes('celular') || lower.includes('tel') || lower.includes('plano')) {
      return <Smartphone className="w-4 h-4 text-teal-400" />;
    }
    if (lower.includes('seguro')) {
      return <Shield className="w-4 h-4 text-sky-400" />;
    }
    if (lower.includes('luz') || lower.includes('energia')) {
      return <Zap className="w-4 h-4 text-amber-400" />;
    }
    if (lower.includes('água') || lower.includes('agua') || lower.includes('saneamento')) {
      return <Droplets className="w-4 h-4 text-cyan-400" />;
    }
    if (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('condominio')) {
      return <Home className="w-4 h-4 text-blue-400" />;
    }
    if (lower.includes('mercado') || lower.includes('feira') || lower.includes('compras')) {
      return <ShoppingBag className="w-4 h-4 text-rose-400" />;
    }
    if (lower.includes('cartão') || lower.includes('cartao') || lower.includes('fatura') || lower.includes('card')) {
      return <CreditCard className="w-4 h-4 text-purple-400" />;
    }
    return <MoreHorizontal className="w-4 h-4 text-indigo-400" />;
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
            title="Importa ou gera as contas fixas do seu modelo para este mês"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gerar Fixas do Mês</span>
          </button>
        </div>
      </div>

      {/* Dynamic Alert Banner */}
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
                <p className="text-xs text-slate-400">Modelo de contas fixas cadastradas</p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-emerald-400">
              {formatCurrency(summary.fixedExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {fixedTemplates.length > 0 ? (
              fixedTemplates.slice(0, 4).map((tpl) => {
                const item = monthTransactions.find(
                  (t) => t.category === 'fixed' && (t.account_type === tpl.account_type || t.title === tpl.title)
                );
                return (
                  <div key={tpl.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
                    <span className="text-slate-400 truncate">{tpl.title}</span>
                    <span className="font-semibold text-slate-200">
                      {item ? formatCurrency(item.amount) : formatCurrency(tpl.default_amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center text-slate-500 py-2">
                Nenhuma conta fixa cadastrada no modelo.
              </div>
            )}
          </div>
        </div>

        {/* Faturas de Cartão de Crédito */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Faturas de Cartão</h4>
                <p className="text-xs text-slate-400">Cartão de Crédito</p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-purple-400">
              {formatCurrency(summary.cardExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {cards.length > 0 ? (
              cards.map((c) => {
                const val = monthTransactions
                  .filter((t) => t.category === 'card' && (t.account_type === c.name || t.title.toLowerCase().includes(c.name.toLowerCase())))
                  .reduce((acc, t) => acc + t.amount, 0);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border-l-2"
                    style={{ borderLeftColor: c.color || '#8a05be' }}
                  >
                    <span className="text-slate-400 truncate">{c.name}</span>
                    <span className="font-semibold text-slate-200">
                      {formatCurrency(val)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border-l-2 border-purple-500">
                <span className="text-slate-400">Cartão de Crédito</span>
                <span className="font-semibold text-purple-400">
                  {formatCurrency(summary.cardExpenses)}
                </span>
              </div>
            )}
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={theme === 'dark' ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                      borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#ffffff' : '#0f172a' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center">Nenhuma despesa para exibir no gráfico</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
            {distributionData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Comparativo Receita vs Despesas */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Fluxo de Caixa Mensal</h3>
              <span className="text-xs font-semibold text-slate-400">Valores em R$</span>
            </div>
            <p className="text-xs text-slate-400">Comparação entre receita e despesas planejadas/pagas</p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#ffffff' : '#0f172a' 
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Receita: <strong className="text-emerald-400">{formatCurrency(summary.totalIncome)}</strong></span>
            <span>Despesas: <strong className="text-amber-400">{formatCurrency(summary.totalExpenses)}</strong></span>
            <span>Saldo: <strong className={summary.balanceForecast >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(summary.balanceForecast)}</strong></span>
          </div>
        </div>
      </div>

      {/* Recent / Pending Bills List */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Próximos Vencimentos</h3>
            <p className="text-xs text-slate-400">Contas do mês de {formatMonthRef(currentMonth)}</p>
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nenhuma conta registrada para este mês.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {monthTransactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-800/60 shrink-0">
                    {getAccountIcon(tx.account_type || tx.title)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">{tx.title}</h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Vence: {formatDateBR(tx.due_date)}</span>
                      <span>•</span>
                      <span>{tx.account_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => togglePaymentStatus(tx.id)}
                    className={`p-1.5 rounded-lg transition ${
                      tx.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }`}
                    title={tx.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}
                  >
                    {tx.status === 'paid' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
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
