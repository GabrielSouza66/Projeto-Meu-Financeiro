import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getAvailableMonths, calculateSummary, getDefaultSalary } from '../utils/finance';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export const Reports: React.FC = () => {
  const { transactions, salaries, currentMonth } = useFinance();

  // Generate historical data for the last 6 months
  const available = getAvailableMonths();
  const currentIndex = available.findIndex((m) => m.value === currentMonth);
  const startIdx = Math.max(0, currentIndex - 5);
  const targetMonths = available.slice(startIdx, currentIndex + 1);

  const historyData = targetMonths.map((m) => {
    const sal = salaries[m.value] || getDefaultSalary(m.value);
    const sum = calculateSummary(transactions, sal, m.value);

    const inter = transactions
      .filter((t) => t.month_ref === m.value && t.account_type === 'Cartão Inter')
      .reduce((acc, t) => acc + t.amount, 0);

    const nubank = transactions
      .filter((t) => t.month_ref === m.value && t.account_type === 'Cartão Nubank')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      mes: m.label.split(' ')[0].substring(0, 3) + '/' + m.value.split('-')[0].substring(2),
      fullMonth: m.label,
      receita: sum.totalIncome,
      despesas: sum.totalExpenses,
      saldo: sum.balanceForecast,
      fixas: sum.fixedExpenses,
      inter,
      nubank,
      cartoes: sum.cardExpenses,
    };
  });

  const handleExportCSV = () => {
    const monthTx = transactions.filter((t) => t.month_ref === currentMonth);
    const headers = ['ID', 'Conta', 'Categoria', 'Valor (R$)', 'Vencimento', 'Mês', 'Situação', 'Observações'];
    const rows = monthTx.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.amount.toFixed(2),
      t.due_date,
      t.month_ref,
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Relatórios & Análises
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Evolução Financeira
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Histórico de meses, comparação de faturas dos cartões e exportação
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs sm:text-sm font-bold transition shadow"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Exportar CSV (Excel)</span>
        </button>
      </div>

      {/* Chart 1: Receitas vs Despesas (6 Meses) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Evolução: Receita vs Despesas vs Saldo</h3>
          <p className="text-xs text-slate-400">Comparativo do histórico recente de lançamentos</p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="receita" name="Receita Total" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas Totais" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo Previsto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Evolução das Faturas dos Cartões Inter vs Nubank */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Evolução das Faturas dos Cartões</h3>
          <p className="text-xs text-slate-400">Comparativo mês a mês entre o Cartão Inter e Nubank</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="inter"
                name="Cartão Inter"
                stroke="#ff7a00"
                strokeWidth={3}
                dot={{ r: 5, fill: '#ff7a00' }}
              />
              <Line
                type="monotone"
                dataKey="nubank"
                name="Cartão Nubank"
                stroke="#8a05be"
                strokeWidth={3}
                dot={{ r: 5, fill: '#8a05be' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
        <h3 className="text-base font-bold text-white mb-3">Tabela Resumo dos Períodos</h3>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Mês</th>
              <th className="p-3">Receita</th>
              <th className="p-3">Fixas</th>
              <th className="p-3">Inter</th>
              <th className="p-3">Nubank</th>
              <th className="p-3">Total Despesas</th>
              <th className="p-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {historyData.map((h) => (
              <tr key={h.fullMonth} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-bold text-white">{h.fullMonth}</td>
                <td className="p-3 text-emerald-400 font-semibold">{formatCurrency(h.receita)}</td>
                <td className="p-3">{formatCurrency(h.fixas)}</td>
                <td className="p-3 text-orange-400">{formatCurrency(h.inter)}</td>
                <td className="p-3 text-purple-400">{formatCurrency(h.nubank)}</td>
                <td className="p-3 font-semibold text-slate-200">{formatCurrency(h.despesas)}</td>
                <td className={`p-3 font-black text-right ${h.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(h.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
