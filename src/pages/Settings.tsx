import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Database, 
  Smartphone, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Bookmark,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getStoredSupabaseConfig, saveSupabaseConfig } from '../services/supabase';
import { AuthModal } from '../components/AuthModal';
import { formatCurrency, DEFAULT_FIXED_BILLS_TEMPLATES, DEFAULT_CREDIT_CARDS } from '../utils/finance';
import type { CreditCardInfo, FixedBillTemplate } from '../types/finance';
import clsx from 'clsx';

export const Settings: React.FC = () => {
  const {
    theme,
    toggleTheme,
    resetToDefaultData,
    transactions,
    salaries,
    cards,
    addCard,
    updateCard,
    deleteCard,
    fixedTemplates,
    addFixedTemplate,
    updateFixedTemplate,
    deleteFixedTemplate,
    user,
    syncNow,
    syncStatus,
  } = useFinance();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isSavedConfig, setIsSavedConfig] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // States for Card Modal/Form
  const [editingCard, setEditingCard] = useState<CreditCardInfo | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState(15);
  const [cardDueDay, setCardDueDay] = useState(22);
  const [cardLimit, setCardLimit] = useState('');
  const [cardColor, setCardColor] = useState('#8a05be');

  // States for Fixed Template Modal/Form
  const [editingTemplate, setEditingTemplate] = useState<FixedBillTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [tplTitle, setTplTitle] = useState('');
  const [tplAccountType, setTplAccountType] = useState('Internet');
  const [tplDefaultAmount, setTplDefaultAmount] = useState('');
  const [tplDueDay, setTplDueDay] = useState(10);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    setSupabaseUrl(config.url || '');
    setSupabaseAnonKey(config.anonKey || '');
  }, []);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsSavedConfig(true);
    setTimeout(() => {
      setIsSavedConfig(false);
      window.location.reload();
    }, 1000);
  };

  const handleExportBackup = () => {
    const backup = {
      transactions,
      salaries,
      cards,
      fixedTemplates,
      version: '1.1',
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && data.salaries) {
          localStorage.setItem('meu_financeiro_transactions_v1', JSON.stringify(data.transactions));
          localStorage.setItem('meu_financeiro_salaries_v1', JSON.stringify(data.salaries));
          if (data.cards) {
            localStorage.setItem('meu_financeiro_cards_v1', JSON.stringify(data.cards));
          }
          if (data.fixedTemplates) {
            localStorage.setItem('meu_financeiro_fixed_templates_v1', JSON.stringify(data.fixedTemplates));
          }
          alert('Backup restaurado com sucesso! Recarregando...');
          window.location.reload();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de exemplo padrão (Salário R$ 5.200, Contas Fixas e Cartões)?')) {
      resetToDefaultData();
      alert('Dados restaurados para o modelo padrão!');
    }
  };

  // Card Handlers
  const handleOpenNewCard = () => {
    setEditingCard(null);
    setCardName('');
    setCardClosingDay(15);
    setCardDueDay(22);
    setCardLimit('');
    setCardColor('#8a05be');
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CreditCardInfo) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardClosingDay(card.closing_day);
    setCardDueDay(card.due_day);
    setCardLimit(card.limit_amount ? String(card.limit_amount) : '');
    setCardColor(card.color || '#8a05be');
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      alert('Informe o nome do cartão de crédito.');
      return;
    }
    const limitNum = cardLimit ? parseFloat(cardLimit.replace(',', '.')) : undefined;

    if (editingCard) {
      updateCard(editingCard.id, {
        name: cardName.trim(),
        closing_day: Number(cardClosingDay) || 15,
        due_day: Number(cardDueDay) || 22,
        limit_amount: limitNum,
        color: cardColor,
      });
    } else {
      addCard({
        name: cardName.trim(),
        closing_day: Number(cardClosingDay) || 15,
        due_day: Number(cardDueDay) || 22,
        limit_amount: limitNum,
        color: cardColor,
      });
    }
    setIsCardModalOpen(false);
  };

  const handleDeleteCard = (card: CreditCardInfo) => {
    if (confirm(`Deseja remover o cartão "${card.name}"?`)) {
      deleteCard(card.id);
    }
  };

  // Template Handlers
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTplTitle('');
    setTplAccountType('Internet');
    setTplDefaultAmount('');
    setTplDueDay(10);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: FixedBillTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplAccountType(tpl.account_type || tpl.title);
    setTplDefaultAmount(tpl.default_amount > 0 ? String(tpl.default_amount) : '');
    setTplDueDay(tpl.due_day);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim()) {
      alert('Informe o nome/título da conta fixa.');
      return;
    }
    const amountNum = tplDefaultAmount ? parseFloat(tplDefaultAmount.replace(',', '.')) : 0;

    if (editingTemplate) {
      updateFixedTemplate(editingTemplate.id, {
        title: tplTitle.trim(),
        account_type: tplAccountType.trim() || tplTitle.trim(),
        default_amount: isNaN(amountNum) ? 0 : amountNum,
        due_day: Number(tplDueDay) || 10,
        category: 'fixed',
      });
    } else {
      addFixedTemplate({
        title: tplTitle.trim(),
        account_type: tplAccountType.trim() || tplTitle.trim(),
        default_amount: isNaN(amountNum) ? 0 : amountNum,
        due_day: Number(tplDueDay) || 10,
        category: 'fixed',
      });
    }
    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (tpl: FixedBillTemplate) => {
    if (confirm(`Deseja remover a conta "${tpl.title}" do modelo de fixas?`)) {
      deleteFixedTemplate(tpl.id);
    }
  };

  const handleResetFixedTemplates = () => {
    if (confirm('Deseja restaurar as contas fixas padrão (Internet, Celular, Seguro)?')) {
      DEFAULT_FIXED_BILLS_TEMPLATES.forEach((item) => {
        if (!fixedTemplates.some((t) => t.title.toLowerCase() === item.title.toLowerCase())) {
          addFixedTemplate(item);
        }
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Preferências & Personalização
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Configurações
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Personalização de cartões de crédito, contas fixas mensais, tema e nuvem
        </p>
      </div>

      {/* Section 1: Tema Visual */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Aparência da Aplicação</h3>
          <p className="text-xs text-slate-400">Escolha o estilo visual de sua preferência</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
              theme === 'dark'
                ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Dark Premium</h4>
                <p className="text-xs text-slate-400">Tons escuros, alto contraste e visual bancário moderno</p>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-left transition ${
              theme === 'light'
                ? 'bg-slate-950 border-emerald-500 shadow-md'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Light Clean</h4>
                <p className="text-xs text-slate-400">Fundo claro e limpo para ambientes iluminados</p>
              </div>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Section 2: Meus Cartões de Crédito */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Meus Cartões de Crédito</h3>
                <p className="text-xs text-slate-400">Adicione e nomeie quantos cartões de crédito desejar</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenNewCard}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
              style={{ borderLeftWidth: '4px', borderLeftColor: card.color || '#8a05be' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{card.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Fecha dia {card.closing_day} • Vence dia {card.due_day}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditCard(card)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Editar cartão"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remover cartão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {card.limit_amount ? (
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs flex justify-between items-center text-slate-400">
                  <span>Limite:</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(card.limit_amount)}</span>
                </div>
              ) : null}
            </div>
          ))}

          {cards.length === 0 && (
            <div className="col-span-full p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              Nenhum cartão cadastrado. Clique no botão acima para cadastrar seu cartão de crédito.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Modelo de Contas Fixas Mensais */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Modelo de Contas Fixas Mensais</h3>
                <p className="text-xs text-slate-400">Personalize a lista de contas que devem ser geradas todo mês</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFixedTemplates}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
              title="Adiciona as contas de exemplo recomendadas"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={handleOpenNewTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conta Fixa</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-slate-300">
          💡 <strong>Como funciona:</strong> Ao clicar no botão <strong>"Gerar Fixas do Mês"</strong> no Painel ou na página de Contas, o sistema criará automaticamente cada uma das contas cadastradas abaixo para o mês selecionado.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {fixedTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vence todo dia {tpl.due_day}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditTemplate(tpl)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Editar conta fixa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remover do modelo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs flex justify-between items-center text-slate-400">
                <span>Valor Previsto:</span>
                <span className="font-semibold text-emerald-400">
                  {tpl.default_amount > 0 ? formatCurrency(tpl.default_amount) : 'Variável'}
                </span>
              </div>
            </div>
          ))}

          {fixedTemplates.length === 0 && (
            <div className="col-span-full p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              Nenhuma conta fixa cadastrada no seu modelo. Clique em "+ Nova Conta Fixa" acima.
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Nuvem & Supabase */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Conexão na Nuvem (Supabase)</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {user ? 'Autenticado' : 'Modo Offline / Local'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronize automaticamente seus lançamentos entre o computador e o celular
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => syncNow()}
                disabled={syncStatus === 'syncing'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', syncStatus === 'syncing' && 'animate-spin')} />
                <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            )}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow shrink-0"
            >
              {user ? 'Gerenciar Conta' : 'Fazer Login / Cadastro'}
            </button>
          </div>
        </div>

        {/* Informative Status Banner for Normal Users */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Sincronização na Nuvem Ativa
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                Servidor Configurado
              </span>
            </h4>
            <p className="text-slate-300 mt-1 leading-relaxed">
              As pessoas com quem você compartilhar o site <strong>NÃO precisam digitar nenhuma URL ou chave de banco de dados</strong>. A aplicação já se conecta automaticamente ao servidor. Cada pessoa só precisa clicar no botão <strong>"Fazer Login / Cadastro"</strong> acima para criar sua própria conta individual e privada.
            </p>
          </div>
        </div>

        {/* Collapsible toggle for developers */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition underline-offset-4 hover:underline"
          >
            <span>{showAdvancedConfig ? '▲ Ocultar configurações técnicas de conexão' : '⚙️ Configurações técnicas de conexão (Apenas Desenvolvedor)'}</span>
          </button>
        </div>

        {/* Credentials Form (Avançado) */}
        {showAdvancedConfig && (
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Project URL do Supabase
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value.trim())}
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Chave Pública (Publishable Key ou Anon)
                </label>
                <input
                  type="text"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value.trim())}
                  placeholder="sb_publishable_... ou eyJhbGci..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                * Já carregado automaticamente do seu arquivo <code className="text-emerald-400">.env.local</code> / Vercel.
              </span>
              <div className="flex items-center gap-2">
                {isSavedConfig && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Configuração salva!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700"
                >
                  Salvar Chaves
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Script do Banco de Dados Pronto:</strong> O arquivo{' '}
            <code className="text-emerald-300">supabase/schema.sql</code> já foi gerado na raiz do projeto com as 5 tabelas e regras de segurança Row Level Security (RLS).
          </div>
        </div>
      </div>

      {/* Section 5: Como Usar no Celular (PWA) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Como Instalar no Celular (PWA)</h3>
            <p className="text-xs text-slate-400">Funciona exatamente como um aplicativo nativo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              No Android (Chrome)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Abra o link da sua aplicação no Google Chrome do celular;</li>
              <li>Toque nos <strong className="text-slate-200">3 pontinhos (Menu)</strong> no canto superior direito;</li>
              <li>Toque em <strong className="text-slate-200">"Instalar aplicativo"</strong> ou "Adicionar à tela inicial";</li>
              <li>O ícone do <strong>Meu Financeiro</strong> aparecerá na tela do seu celular!</li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              No iPhone (Safari)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Abra o link da sua aplicação no navegador Safari do iOS;</li>
              <li>Toque no botão de <strong className="text-slate-200">Compartilhar</strong> (quadrado com seta para cima);</li>
              <li>Role para baixo e selecione <strong className="text-slate-200">"Adicionar à Tela de Início"</strong>;</li>
              <li>Toque em "Adicionar". O app abrirá em tela cheia sem barras de navegador.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Section 6: Gerenciamento e Backup de Dados */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Backup e Restauração de Dados</h3>
          <p className="text-xs text-slate-400">Exporte ou importe seus dados para segurança total</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Fazer Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Restaurar Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 text-xs font-bold transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Modelo Padrão</span>
          </button>
        </div>
      </div>

      {/* Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCard ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Ex: Nubank, Inter, XP, Itaú..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia Fechamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Limite Total (Opcional - R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {['#8a05be', '#ff7a00', '#06b6d4', '#10b981', '#ef4444', '#ec4899', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCardColor(color)}
                      className={clsx(
                        'w-7 h-7 rounded-full border-2 transition',
                        cardColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingTemplate ? 'Editar Conta Fixa' : 'Nova Conta Fixa no Modelo'}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Conta Fixa
                </label>
                <input
                  type="text"
                  required
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  placeholder="Ex: Internet Claro, Seguro do Carro, Aluguel..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tplDefaultAmount}
                    onChange={(e) => setTplDefaultAmount(e.target.value)}
                    placeholder="Ex: 120,00"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia Vencimento (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={tplDueDay}
                    onChange={(e) => setTplDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo / Categoria
                </label>
                <select
                  value={tplAccountType}
                  onChange={(e) => setTplAccountType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Internet">Internet</option>
                  <option value="Celular">Celular</option>
                  <option value="Seguro">Seguro</option>
                  <option value="Luz">Luz / Energia</option>
                  <option value="Água">Água / Saneamento</option>
                  <option value="Aluguel">Aluguel / Condomínio</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Salvar Conta Fixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
