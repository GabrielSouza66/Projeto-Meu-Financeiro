import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  Shield, 
  Wifi, 
  Smartphone, 
  Zap, 
  Droplets, 
  Home, 
  ShoppingBag, 
  MoreHorizontal,
  Bookmark
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { AccountCategory, PaymentStatus, FixedBillTemplate, CreditCardInfo } from '../types/finance';
import { 
  PREDEFINED_OTHER_ACCOUNTS, 
  getAvailableMonths 
} from '../utils/finance';
import clsx from 'clsx';

export const ExpenseModal: React.FC = () => {
  const {
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    editingTransaction,
    setEditingTransaction,
    addTransaction,
    updateTransaction,
    currentMonth,
    fixedTemplates,
    cards,
  } = useFinance();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [monthRef, setMonthRef] = useState(currentMonth);
  const [category, setCategory] = useState<AccountCategory>('fixed');
  const [accountType, setAccountType] = useState<string>('Internet');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');

  // When modal opens or editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setAmountStr(String(editingTransaction.amount));
      setDueDate(editingTransaction.due_date);
      setMonthRef(editingTransaction.month_ref);
      setCategory(editingTransaction.category);
      setAccountType(editingTransaction.account_type);
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
    } else {
      // Defaults for a new item
      const [yr, mo] = currentMonth.split('-');
      if (fixedTemplates && fixedTemplates.length > 0) {
        const first = fixedTemplates[0];
        setTitle(first.title);
        setAmountStr(first.default_amount > 0 ? String(first.default_amount) : '');
        setDueDate(`${yr}-${mo}-${String(first.due_day).padStart(2, '0')}`);
        setMonthRef(currentMonth);
        setCategory('fixed');
        setAccountType(first.account_type || first.title);
      } else {
        setTitle('Internet Residencial');
        setAmountStr('');
        setDueDate(`${yr}-${mo}-10`);
        setMonthRef(currentMonth);
        setCategory('fixed');
        setAccountType('Internet');
      }
      setStatus('pending');
      setNotes('');
    }
  }, [editingTransaction, isExpenseModalOpen, currentMonth, fixedTemplates]);

  if (!isExpenseModalOpen) return null;

  const [yr, mo] = (monthRef || currentMonth).split('-');

  const handleSelectFixedTemplate = (tpl: FixedBillTemplate) => {
    setCategory('fixed');
    setAccountType(tpl.account_type || tpl.title);
    if (!editingTransaction) {
      setTitle(tpl.title);
      if (tpl.default_amount > 0) {
        setAmountStr(String(tpl.default_amount));
      }
      setDueDate(`${yr}-${mo}-${String(tpl.due_day).padStart(2, '0')}`);
    }
  };

  const handleSelectCard = (card: CreditCardInfo) => {
    setCategory('card');
    setAccountType(card.name);
    if (!editingTransaction) {
      setTitle(`Fatura ${card.name}`);
      setDueDate(`${yr}-${mo}-${String(card.due_day).padStart(2, '0')}`);
    }
  };

  const handleSelectOtherAccount = (acc: string) => {
    setAccountType(acc);
    setCategory('variable');
    if (!editingTransaction) {
      if (acc === 'Luz') setTitle('Conta de Luz / Energia');
      else if (acc === 'Água') setTitle('Conta de Água / Saneamento');
      else if (acc === 'Aluguel') setTitle('Aluguel / Condomínio');
      else if (acc === 'Mercado') setTitle('Compras de Supermercado');
      else if (acc === 'Outro') setTitle('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, informe um valor numérico válido maior que zero.');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        title: title || accountType,
        amount: parsedAmount,
        due_date: dueDate,
        month_ref: monthRef,
        category,
        account_type: accountType,
        status,
        notes,
      });
    } else {
      addTransaction({
        title: title || accountType,
        amount: parsedAmount,
        due_date: dueDate,
        month_ref: monthRef,
        category,
        account_type: accountType,
        status,
        notes,
      });
    }

    setIsExpenseModalOpen(false);
    setEditingTransaction(null);
  };

  const getAccountIcon = (acc: string) => {
    const lower = (acc || '').toLowerCase();
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
    if (lower.includes('cartão') || lower.includes('cartao') || lower.includes('fatura')) {
      return <CreditCard className="w-4 h-4 text-purple-400" />;
    }
    return <MoreHorizontal className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <p className="text-xs text-slate-400">
              Cadastre contas fixas, faturas de cartão de crédito ou despesas avulsas
            </p>
          </div>
          <button
            onClick={() => {
              setIsExpenseModalOpen(false);
              setEditingTransaction(null);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Quick Predefined Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Selecione a Conta / Categoria Rápida
            </label>
            <div className="space-y-3">
              {/* Contas Fixas Personalizadas */}
              {fixedTemplates.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                    Suas Contas Fixas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {fixedTemplates.map((tpl) => {
                      const isSelected = category === 'fixed' && (accountType === tpl.account_type || accountType === tpl.title);
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectFixedTemplate(tpl)}
                          className={clsx(
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border text-left',
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                          )}
                        >
                          {getAccountIcon(tpl.account_type || tpl.title)}
                          <span className="truncate">{tpl.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cartões de Crédito */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  Cartões de Crédito:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cards.map((c) => {
                    const isSelected = category === 'card' && accountType === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCard(c)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border text-left',
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                        )}
                      >
                        <CreditCard className="w-4 h-4 shrink-0" style={{ color: isSelected ? '#ffffff' : (c.color || '#a855f7') }} />
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                  {cards.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectCard({ id: 'default', name: 'Cartão de Crédito', closing_day: 15, due_day: 22 })}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border text-left',
                        category === 'card'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                      )}
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>Cartão de Crédito</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outras Contas */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <MoreHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Outras Contas & Despesas:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PREDEFINED_OTHER_ACCOUNTS.map((acc) => {
                    const isSelected = category === 'variable' && accountType === acc;
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => handleSelectOtherAccount(acc)}
                        className={clsx(
                          'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border text-left',
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/40'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                        )}
                      >
                        {getAccountIcon(acc)}
                        <span className="truncate">{acc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Category / Tipo de Despesa */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 mt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Classificação da Conta:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategory('fixed')}
                  className={clsx(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                    category === 'fixed'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  Fixa
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('card')}
                  className={clsx(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                    category === 'card'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  Cartão
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('variable')}
                  className={clsx(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                    category === 'variable'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  Variável / Outros
                </button>
              </div>
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição / Nome da Conta
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fatura do Cartão, Internet Residencial..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Data de Vencimento
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Competência (Mês de referência) and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mês de Referência
              </label>
              <select
                value={monthRef}
                onChange={(e) => setMonthRef(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {getAvailableMonths().map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Situação do Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5',
                    status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-800'
                  )}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5',
                    status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-800'
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  Pago
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento no débito automático, compras parceladas..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsExpenseModalOpen(false);
                setEditingTransaction(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              {editingTransaction ? 'Salvar Alterações' : 'Adicionar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
