import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Wifi, 
  Smartphone, 
  CreditCard,
  RefreshCw,
  Calendar,
  Zap,
  Droplets,
  Home,
  ShoppingBag,
  MoreHorizontal,
  SlidersHorizontal,
  Save,
  Cloud,
  AlertCircle
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, formatMonthRef } from '../utils/finance';
import type { Transaction } from '../types/finance';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const Expenses: React.FC = () => {
  const {
    monthTransactions,
    currentMonth,
    togglePaymentStatus,
    deleteTransaction,
    setEditingTransaction,
    setIsExpenseModalOpen,
    generateFixedBillsForMonth,
    summary,
    saveAndSync,
    lastSavedAt,
    user,
    setIsAuthModalOpen,
    setAuthModalMode,
  } = useFinance();

  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<'all' | 'fixed' | 'card' | 'other' | 'pending' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleSave = async () => {
    setSaveState('saving');
    setFeedbackMessage('Salvando alterações localmente e sincronizando com a nuvem...');

    const res = await saveAndSync();
    if (res.success) {
      setSaveState('success');
      setFeedbackMessage(
        user
          ? 'Tudo certo! Todas as alterações foram salvas e sincronizadas na nuvem.'
          : 'Alterações salvas com sucesso no seu dispositivo! Faça login para manter sincronizado na nuvem.'
      );
      setTimeout(() => {
        setSaveState('idle');
        setFeedbackMessage('');
      }, 5000);
    } else {
      setSaveState('error');
      setFeedbackMessage(res.message || 'Erro ao sincronizar com a nuvem.');
      setTimeout(() => {
        setSaveState('idle');
      }, 6000);
    }
  };

  const lastSavedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Filtering
  const filteredList = monthTransactions.filter((tx) => {
    // Filter tabs
    if (activeFilter === 'fixed' && tx.category !== 'fixed') return false;
    if (activeFilter === 'card' && tx.category !== 'card') return false;
    if (activeFilter === 'other' && tx.category !== 'variable' && tx.category !== 'extra' && tx.account_type !== 'Outro') return false;
    if (activeFilter === 'pending' && tx.status !== 'pending') return false;
    if (activeFilter === 'paid' && tx.status !== 'paid') return false;

    // Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        tx.title.toLowerCase().includes(q) ||
        tx.account_type.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getAccountIcon = (accType: string) => {
    const lower = (accType || '').toLowerCase();
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

  const handleDelete = (tx: Transaction) => {
    if (confirm(`Deseja realmente remover a conta "${tx.title}"?`)) {
      deleteTransaction(tx.id);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Minhas Contas • {formatMonthRef(currentMonth)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão de Lançamentos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controle das suas contas fixas, faturas de cartão de crédito e despesas variáveis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition"
            title="Personalize seu modelo de contas fixas e cartões de crédito"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Modelos & Cartões</span>
          </button>

          <button
            onClick={() => generateFixedBillsForMonth(currentMonth)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
            title="Gera automaticamente as contas fixas ausentes para este mês a partir do seu modelo"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Gerar Fixas</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Despesas</span>
          <span className="text-lg font-black text-white">{formatCurrency(summary.totalExpenses)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-emerald-400 block mb-1 font-semibold">Contas Fixas</span>
          <span className="text-lg font-black text-emerald-400">{formatCurrency(summary.fixedExpenses)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-purple-400 block mb-1 font-semibold">Cartão de Crédito</span>
          <span className="text-lg font-black text-purple-400">{formatCurrency(summary.cardExpenses)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-amber-400 block mb-1 font-semibold">Pendente a Pagar</span>
          <span className="text-lg font-black text-amber-400">{formatCurrency(summary.pendingExpenses)}</span>
        </div>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1">
          {[
            { id: 'all', label: `Todas (${monthTransactions.length})` },
            { id: 'fixed', label: 'Fixas' },
            { id: 'card', label: 'Cartões' },
            { id: 'other', label: 'Outras' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'paid', label: 'Pagas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                activeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conta..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* List / Table of Expenses */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">Nenhum lançamento encontrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Não há contas que atendam aos filtros para este mês.
          </p>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
          >
            Adicionar Primeira Conta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((tx) => (
            <div
              key={tx.id}
              className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                tx.status === 'paid'
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    tx.category === 'card'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : tx.account_type === 'Outro' || tx.category === 'variable'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {getAccountIcon(tx.account_type || tx.title)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">{tx.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        tx.category === 'fixed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.category === 'card'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      }`}
                    >
                      {tx.category === 'fixed' ? 'Fixa' : tx.category === 'card' ? 'Cartão' : 'Outros'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Vencimento: {formatDateBR(tx.due_date)}
                    </span>
                    <span>• {tx.account_type}</span>
                    {tx.notes && <span className="text-slate-500 italic max-w-xs truncate">"{tx.notes}"</span>}
                  </div>
                </div>
              </div>

              {/* Right Value & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div className="text-left sm:text-right">
                  <span className="text-base sm:text-lg font-black text-white block">
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => togglePaymentStatus(tx.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition ${
                      tx.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                    }`}
                  >
                    {tx.status === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pago</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pendente</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(tx)}
                    title="Editar conta"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tx)}
                    title="Excluir conta"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Painel de Salvar e Sincronizar ao Final da Página */}
      <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Info do Salvamento */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Save className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Salvar e Sincronizar Alterações
                </h3>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-3 h-3" />
                    Nuvem Conectada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Modo Local
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {user
                  ? `Salva os lançamentos no dispositivo e sincroniza com sua nuvem (${user.email}).`
                  : 'Salva todas as suas contas com segurança no dispositivo. Faça login para salvar na nuvem.'}
              </p>
              {lastSavedTime && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Último salvamento: hoje às {lastSavedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
                title="Fazer login para sincronizar na nuvem"
              >
                <Cloud className="w-4 h-4 text-purple-400" />
                <span>Entrar na Nuvem</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={clsx(
                'w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-lg active:scale-95 disabled:opacity-75',
                saveState === 'success'
                  ? 'bg-emerald-500 shadow-emerald-950/40'
                  : saveState === 'error'
                  ? 'bg-rose-600 shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50 hover:shadow-emerald-600/25'
              )}
            >
              {saveState === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Salvando & Sincronizando...</span>
                </>
              ) : saveState === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {feedbackMessage && (
          <div
            className={clsx(
              'mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 transition-all',
              saveState === 'success' && 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
              saveState === 'error' && 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
              saveState === 'saving' && 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            )}
          >
            {saveState === 'saving' && <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />}
            {saveState === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {saveState === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
