import React, { useState, useEffect } from 'react';
import { X, Tag, Check, CreditCard, Shield, Wifi, Smartphone } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { PredefinedAccount, AccountCategory, PaymentStatus } from '../types/finance';
import { PREDEFINED_FIXED_ACCOUNTS, PREDEFINED_CARD_ACCOUNTS, getAvailableMonths } from '../utils/finance';
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
  } = useFinance();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [monthRef, setMonthRef] = useState(currentMonth);
  const [category, setCategory] = useState<AccountCategory>('fixed');
  const [accountType, setAccountType] = useState<PredefinedAccount | string>('Internet');
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
      setTitle('Internet Residencial');
      setAmountStr('');
      const [yr, mo] = currentMonth.split('-');
      setDueDate(`${yr}-${mo}-10`);
      setMonthRef(currentMonth);
      setCategory('fixed');
      setAccountType('Internet');
      setStatus('pending');
      setNotes('');
    }
  }, [editingTransaction, isExpenseModalOpen, currentMonth]);

  if (!isExpenseModalOpen) return null;

  const handleSelectQuickAccount = (acc: PredefinedAccount) => {
    setAccountType(acc);
    if (PREDEFINED_FIXED_ACCOUNTS.includes(acc)) {
      setCategory('fixed');
    } else if (PREDEFINED_CARD_ACCOUNTS.includes(acc)) {
      setCategory('card');
    } else {
      setCategory('variable');
    }

    // Default friendly titles
    if (!editingTransaction) {
      if (acc === 'Internet') setTitle('Internet Residencial');
      else if (acc === 'Celular') setTitle('Plano Celular');
      else if (acc === 'Seguro Carro') setTitle('Seguro do Carro');
      else if (acc === 'Seguro Moto') setTitle('Seguro da Moto');
      else if (acc === 'Cartão Inter') setTitle('Fatura Cartão Inter');
      else if (acc === 'Cartão Nubank') setTitle('Fatura Nubank');
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
    switch (acc) {
      case 'Internet': return <Wifi className="w-4 h-4" />;
      case 'Celular': return <Smartphone className="w-4 h-4" />;
      case 'Seguro Carro':
      case 'Seguro Moto': return <Shield className="w-4 h-4" />;
      case 'Cartão Inter':
      case 'Cartão Nubank': return <CreditCard className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
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
              Cadastre contas fixas, faturas de cartão ou despesas avulsas
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
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Contas Fixas:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PREDEFINED_FIXED_ACCOUNTS.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border text-left',
                        accountType === acc
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                      )}
                    >
                      {getAccountIcon(acc)}
                      <span className="truncate">{acc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Cartões de Crédito:</span>
                <div className="grid grid-cols-2 gap-2">
                  {PREDEFINED_CARD_ACCOUNTS.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc)}
                      className={clsx(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border',
                        accountType === acc
                          ? acc === 'Cartão Inter'
                            ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-900/40'
                            : 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                      )}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{acc}</span>
                    </button>
                  ))}
                </div>
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
              placeholder="Ex: Fatura Nubank, Internet Claro..."
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
