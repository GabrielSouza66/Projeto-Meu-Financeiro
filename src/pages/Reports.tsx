import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, getAvailableMonths, calculateSummary, getDefaultSalary, formatMonthRef } from '../utils/finance';
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
  const { transactions, salaries, currentMonth, theme, user } = useFinance();

  // Generate historical data for the last 6 months
  const available = getAvailableMonths();
  const currentIndex = available.findIndex((m) => m.value === currentMonth);
  const startIdx = Math.max(0, currentIndex - 5);
  const targetMonths = available.slice(startIdx, currentIndex + 1);

  const historyData = targetMonths.map((m) => {
    const sal = salaries[m.value] || getDefaultSalary(m.value);
    const sum = calculateSummary(transactions, sal, m.value);

    return {
      mes: m.label.split(' ')[0].substring(0, 3) + '/' + m.value.split('-')[0].substring(2),
      fullMonth: m.label,
      receita: sum.totalIncome,
      despesas: sum.totalExpenses,
      saldo: sum.balanceForecast,
      fixas: sum.fixedExpenses,
      cartoes: sum.cardExpenses,
      outras: sum.otherExpenses,
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

  const handleExportPDF = () => {
    const currentSal = salaries[currentMonth] || getDefaultSalary(currentMonth);
    const currentSum = calculateSummary(transactions, currentSal, currentMonth);
    const monthTx = transactions
      .filter((t) => t.month_ref === currentMonth)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar a impressão do relatório em PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - ${formatMonthRef(currentMonth)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body { background: #fff; color: #1e293b; padding: 32px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .header p { color: #64748b; font-size: 12px; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
          .kpi-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .kpi-value { font-size: 18px; font-weight: 900; color: #0f172a; }
          .kpi-value.green { color: #16a34a; }
          .kpi-value.purple { color: #7e22ce; }
          .kpi-value.red { color: #dc2626; }

          h2 { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #16a34a; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 12px; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
          tr:hover td { background: #f8fafc; }
          .status-paid { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 10px; }
          .status-pending { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 10px; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8; }

          @media print {
            body { padding: 15px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Meu Financeiro • Relatório Mensal</h1>
            <p>Competência: <strong>${formatMonthRef(currentMonth)}</strong> | Usuário: ${user?.email || 'Individual'}</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">Documento Gerado</span>
            <p style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Receita Total</div>
            <div class="kpi-value green">${formatCurrency(currentSum.totalIncome)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Contas Fixas</div>
            <div class="kpi-value">${formatCurrency(currentSum.fixedExpenses)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Cartão de Crédito</div>
            <div class="kpi-value purple">${formatCurrency(currentSum.cardExpenses)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Saldo Previsto</div>
            <div class="kpi-value ${currentSum.balanceForecast >= 0 ? 'green' : 'red'}">${formatCurrency(currentSum.balanceForecast)}</div>
          </div>
        </div>

        <h2>Detalhamento dos Lançamentos do Mês</h2>
        <table>
          <thead>
            <tr>
              <th>Descrição da Conta</th>
              <th>Categoria</th>
              <th>Vencimento</th>
              <th>Situação</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${
              monthTx.length > 0
                ? monthTx
                    .map(
                      (t) => `
              <tr>
                <td class="font-bold">${t.title}</td>
                <td>${t.category === 'fixed' ? 'Fixa' : t.category === 'card' ? 'Cartão' : 'Variável/Outros'} (${t.account_type})</td>
                <td>${formatDateBR(t.due_date)}</td>
                <td>
                  <span class="${t.status === 'paid' ? 'status-paid' : 'status-pending'}">
                    ${t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                  </span>
                </td>
                <td class="text-right font-bold">${formatCurrency(t.amount)}</td>
              </tr>
            `
                    )
                    .join('')
                : '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum lançamento encontrado neste mês.</td></tr>'
            }
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: 800;">
              <td colspan="4" style="padding: 10px;">TOTAL DESPESAS PREVISTAS:</td>
              <td class="text-right" style="padding: 10px; color: #0f172a; font-size: 13px;">${formatCurrency(currentSum.totalExpenses)}</td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: 800;">
              <td colspan="4" style="padding: 10px;">SALDO RESTANTE PREVISTO:</td>
              <td class="text-right" style="padding: 10px; color: ${currentSum.balanceForecast >= 0 ? '#16a34a' : '#dc2626'}; font-size: 14px;">${formatCurrency(currentSum.balanceForecast)}</td>
            </tr>
          </tfoot>
        </table>

        <h2>Histórico Comparativo (Últimos 6 Meses)</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Receita</th>
              <th>Fixas</th>
              <th>Cartão de Crédito</th>
              <th>Outras Despesas</th>
              <th>Total Despesas</th>
              <th class="text-right">Saldo Previsto</th>
            </tr>
          </thead>
          <tbody>
            ${historyData
              .map(
                (h) => `
              <tr>
                <td class="font-bold">${h.fullMonth}</td>
                <td style="color: #16a34a; font-weight: bold;">${formatCurrency(h.receita)}</td>
                <td>${formatCurrency(h.fixas)}</td>
                <td style="color: #7e22ce; font-weight: bold;">${formatCurrency(h.cartoes)}</td>
                <td>${formatCurrency(h.outras)}</td>
                <td style="font-weight: 600;">${formatCurrency(h.despesas)}</td>
                <td class="text-right font-bold" style="color: ${h.saldo >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(h.saldo)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado pelo aplicativo Meu Financeiro • Controle Financeiro Pessoal & Familiar</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
            Histórico mensal, evolução de despesas e faturas de cartão de crédito
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs sm:text-sm font-bold transition shadow"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs sm:text-sm font-bold transition shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>
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
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#ffffff' : '#0f172a' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="receita" name="Receita Total" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas Totais" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo Previsto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Evolução das Faturas de Cartão de Crédito */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Evolução das Faturas de Cartão de Crédito</h3>
          <p className="text-xs text-slate-400">Histórico mês a mês dos gastos consolidados em cartões</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#ffffff' : '#0f172a' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="cartoes"
                name="Faturas de Cartão de Crédito"
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
              <th className="p-3">Cartão de Crédito</th>
              <th className="p-3">Outras Despesas</th>
              <th className="p-3">Total Despesas</th>
              <th className="p-3 text-right">Saldo Previsto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {historyData.map((h) => (
              <tr key={h.fullMonth} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-bold text-white">{h.fullMonth}</td>
                <td className="p-3 text-emerald-400 font-semibold">{formatCurrency(h.receita)}</td>
                <td className="p-3">{formatCurrency(h.fixas)}</td>
                <td className="p-3 text-purple-400 font-semibold">{formatCurrency(h.cartoes)}</td>
                <td className="p-3">{formatCurrency(h.outras)}</td>
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
