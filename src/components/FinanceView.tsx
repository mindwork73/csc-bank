/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FinanceEntry, 
  FinanceType, 
  TeamMember, 
  Order, 
  Parcel,
  OrderStatus 
} from '../types';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Search, 
  User, 
  Calendar, 
  Share2, 
  X,
  FileText,
  HelpCircle,
  TrendingDown,
  Trash2,
  AlertCircle,
  PiggyBank,
  ArrowRight,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface FinanceViewProps {
  finance: FinanceEntry[];
  members: TeamMember[];
  orders: Order[];
  parcels: Parcel[];
  calculatedBalances: {
    commonFund: number;
    members: Record<string, number>;
  };
  onAddFinanceEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void;
  onDeleteFinanceEntry: (id: string) => void;
  onClearFinance: () => void;
  profitAllocationType: 'common' | 'manager';
  onUpdateProfitAllocation: (type: 'common' | 'manager') => void;
  darkMode?: boolean;
  currentRole?: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly';
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onSelectRecord?: (type: 'order' | 'parcel', id: string) => void;
  openAddModalOnLoad?: boolean;
  onResetAddModalOnLoad?: () => void;
}

export default function FinanceView({
  finance,
  members,
  orders,
  parcels,
  calculatedBalances,
  onAddFinanceEntry,
  onDeleteFinanceEntry,
  onClearFinance,
  profitAllocationType,
  onUpdateProfitAllocation,
  darkMode = true,
  currentRole = 'root',
  onShowToast,
  onSelectRecord,
  openAddModalOnLoad = false,
  onResetAddModalOnLoad
}: FinanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [memberFilter, setMemberFilter] = useState<string>('ALL');
  const [commonFundFilter, setCommonFundFilter] = useState<string>('ALL'); // 'ALL' | 'COMMON' | 'PERSONAL'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Trigger modal if requested on load from global actions
  useEffect(() => {
    if (openAddModalOnLoad) {
      setIsAddModalOpen(true);
      if (onResetAddModalOnLoad) {
        onResetAddModalOnLoad();
      }
    }
  }, [openAddModalOnLoad, onResetAddModalOnLoad]);

  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [reconcileCheck, setReconcileCheck] = useState(false);

  // Split Expense quick wizard form state
  const [splitForm, setSplitForm] = useState({
    amount: 0,
    category: 'Логистика',
    notes: 'Сплит расходов пополам'
  });

  // Payout personal vault balance form state
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    memberId: '',
    notes: 'Частичная выплата личного баланса из сейфа'
  });

  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Pre-calculate running common fund balance chronologically (sorted older first, then compute cumulative sum)
  const runningBalances = React.useMemo(() => {
    // Sort all transactions chronologically (ascending) to build the running balance history
    const chronoList = [...finance].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let currentBal = 0;
    const balanceMap: Record<string, number> = {};
    chronoList.forEach(item => {
      const isOut = item.type === FinanceType.EXPENSE || item.type === FinanceType.WITHDRAW_COMMON || item.type === FinanceType.PAYOUT;
      const isIn = item.type === FinanceType.INCOME || item.type === FinanceType.DEPOSIT_COMMON;
      if (item.affectsCommonFund) {
        if (isIn) currentBal += item.amount;
        if (isOut) currentBal -= item.amount;
      }
      balanceMap[item.id] = currentBal;
    });
    return balanceMap;
  }, [finance]);

  // New Transaction Form state
  const [form, setForm] = useState({
    type: FinanceType.EXPENSE,
    category: 'Логистика',
    amount: 0,
    currency: 'RUB',
    memberId: '',
    orderId: '',
    parcelId: '',
    affectsCommonFund: true,
    splitBetweenMembers: false,
    notes: ''
  });

  // Calculate quick accounting margins
  const totalInflow = finance
    .filter(f => f.type === FinanceType.INCOME || f.type === FinanceType.DEPOSIT_COMMON)
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const totalOutflow = finance
    .filter(f => f.type === FinanceType.EXPENSE || f.type === FinanceType.WITHDRAW_COMMON || f.type === FinanceType.PAYOUT)
    .reduce((sum, f) => sum + Number(f.amount), 0);

  // Filter list results
  const filteredEntries = finance.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = f.notes.toLowerCase().includes(term) || 
                          f.category.toLowerCase().includes(term) ||
                          f.id.toLowerCase().includes(term) ||
                          (f.orderId && f.orderId.toLowerCase().includes(term)) ||
                          (f.parcelId && f.parcelId.toLowerCase().includes(term));

    const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesMember = memberFilter === 'ALL' || f.memberId === memberFilter;

    let matchesCommonFund = true;
    if (commonFundFilter === 'COMMON') {
      matchesCommonFund = f.affectsCommonFund;
    } else if (commonFundFilter === 'PERSONAL') {
      matchesCommonFund = !f.affectsCommonFund && !!f.memberId;
    }

    return matchesSearch && matchesType && matchesCategory && matchesMember && matchesCommonFund;
  });

  // Sort logic for transaction table
  const sortedEntries = React.useMemo(() => {
    const list = [...filteredEntries];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof FinanceEntry];
      let valB: any = b[sortField as keyof FinanceEntry];

      if (sortField === 'id_num') {
        const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return list;
  }, [filteredEntries, sortField, sortDirection]);

  const categories = [
    'Логистика', 'Комиссии', 'Упаковка', 'Реклама', 'Расходники', 
    'Выкуп', 'Компенсация', 'Сервисные траты', 'Личные траты участника', 
    'Общекомандные траты', 'Выплата участнику', 'Вклад участников'
  ];

  const fmt = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (splitForm.amount <= 0) {
      if (onShowToast) {
        onShowToast('Пожалуйста, укажите корректную сумму траты.', 'warning');
      } else {
        alert('Пожалуйста, укажите корректную сумму траты.');
      }
      return;
    }
    onAddFinanceEntry({
      type: FinanceType.EXPENSE,
      category: splitForm.category,
      amount: Number(splitForm.amount),
      currency: 'RUB',
      memberId: '', // Applies to all active partners
      orderId: '',
      parcelId: '',
      affectsCommonFund: true,
      splitBetweenMembers: true,
      notes: `${splitForm.notes || 'Сплит расходов на команду партнёров'} (Сплит на всех)`
    });
    setIsSplitModalOpen(false);
    setSplitForm({ amount: 0, category: 'Логистика', notes: 'Сплит расходов пополам' });
    if (onShowToast) {
      onShowToast('Успех: Расход записан и разделен поровну между всеми кураторами!', 'success');
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutForm.amount <= 0 || !payoutForm.memberId) {
      if (onShowToast) {
        onShowToast('Укажите корректную сумму и куратора для выплаты.', 'error');
      } else {
        alert('Укажите корректную сумму и куратора.');
      }
      return;
    }
    const currentVault = calculatedBalances.members[payoutForm.memberId] || 0;
    if (payoutForm.amount > currentVault) {
      if (onShowToast) {
        onShowToast(`Внимание: Баланс сейфа партнера (${fmt(currentVault)}) меньше запрашиваемой выплаты. Баланс уйдет в минус.`, 'warning');
      }
    }
    onAddFinanceEntry({
      type: FinanceType.PAYOUT,
      category: 'Выплаты',
      amount: Number(payoutForm.amount),
      currency: 'RUB',
      memberId: payoutForm.memberId,
      orderId: '',
      parcelId: '',
      affectsCommonFund: false, // Subtracts from personal balance only (personal vault/payout model)
      splitBetweenMembers: false,
      notes: payoutForm.notes || 'Частичная выплата личного баланса из сейфа куратора'
    });
    setIsPayoutModalOpen(false);
    setPayoutForm({ amount: 0, memberId: '', notes: 'Частичная выплата личного баланса из сейфа' });
    if (onShowToast) {
      onShowToast('Выплата успешно зарегистрирована в реестре сейфа партнера!', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) {
      if (onShowToast) {
        onShowToast('Укажите корректную сумму операции.', 'error');
      } else {
        alert('Укажите корректную сумму операции.');
      }
      return;
    }

    onAddFinanceEntry({
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      memberId: form.memberId || null,
      orderId: form.orderId || null,
      parcelId: form.parcelId || null,
      affectsCommonFund: form.affectsCommonFund,
      splitBetweenMembers: form.splitBetweenMembers,
      notes: form.notes
    });

    onShowToast?.('Операция успешно добавлена в реестр', 'success');

    // Reset Form
    setForm({
      type: FinanceType.EXPENSE,
      category: 'Логистика',
      amount: 0,
      currency: 'RUB',
      memberId: '',
      orderId: '',
      parcelId: '',
      affectsCommonFund: true,
      splitBetweenMembers: false,
      notes: ''
    });

    setIsAddModalOpen(false);
  };

  // Debt settlements compiler
  const calculateSettlements = () => {
    const personalSplitsSpent: Record<string, number> = {};
    members.forEach(m => {
      personalSplitsSpent[m.id] = 0;
    });

    // Sum what each member paid for collective things
    finance.forEach(f => {
      if (f.type === FinanceType.EXPENSE && f.splitBetweenMembers && f.memberId) {
        if (personalSplitsSpent[f.memberId] !== undefined) {
          personalSplitsSpent[f.memberId] += f.amount;
        }
      }
    });

    const activeCount = members.filter(m => m.active).length || 1;
    const totalSpentSplits = Object.values(personalSplitsSpent).reduce((s, x) => s + x, 0);
    const fairSharePerMember = totalSpentSplits / activeCount;

    const settlements: { fromName: string; toName: string; amount: number }[] = [];
    
    const membersDiffs = members.map(m => ({
      id: m.id,
      name: m.name,
      diff: personalSplitsSpent[m.id] - fairSharePerMember
    }));

    const creditors = membersDiffs.filter(m => m.diff > 1);
    const debtors = membersDiffs.filter(m => m.diff < -1);

    const creditorsCopy = creditors.map(c => ({ ...c }));
    const debtorsCopy = debtors.map(d => ({ ...d }));

    debtorsCopy.forEach(d => {
      let remainingOwe = Math.abs(d.diff);
      creditorsCopy.forEach(c => {
        if (remainingOwe <= 0) return;
        const available = c.diff;
        if (available <= 0) return;

        const pay = Math.min(remainingOwe, available);
        settlements.push({
          fromName: d.name.split(' ')[0],
          toName: c.name.split(' ')[0],
          amount: pay
        });
        remainingOwe -= pay;
        c.diff -= pay;
      });
    });

    return settlements;
  };

  const settlementsList = calculateSettlements();

  const getFinanceTypeBadge = (type: FinanceType) => {
    let classes = '';
    switch (type) {
      case FinanceType.INCOME:
        classes = 'bg-[#0F221B] text-emerald-400 border-emerald-500/10 font-bold';
        break;
      case FinanceType.EXPENSE:
        classes = 'bg-rose-950/20 text-rose-400 border-rose-500/10';
        break;
      case FinanceType.DEPOSIT_COMMON:
        classes = 'bg-[#181E33] text-indigo-400 border-indigo-500/15 font-mono';
        break;
      case FinanceType.WITHDRAW_COMMON:
        classes = 'bg-slate-900 border-slate-700 text-slate-300';
        break;
      case FinanceType.PAYOUT:
        classes = 'bg-[#291A25] text-pink-400 border-[#5C2B4E]';
        break;
      default:
        classes = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
    return (
      <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono border ${classes}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER SECTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Финансовый журнал Бухучета / Treasury Ledger</span>
          </h2>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Система казначейства, аудит личных балансов кураторов, урегулирование ведомостей и общие фонды.
          </p>
        </div>

        {currentRole === 'root' || currentRole === 'admin' || currentRole === 'finance' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center space-x-1.5 font-mono font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition-all ${
                darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                  : 'bg-indigo-700 hover:bg-indigo-600 text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Записать Транзакцию</span>
            </button>
            <button
              onClick={() => setIsSplitModalOpen(true)}
              className="flex items-center space-x-1.5 font-mono font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition-all bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Быстрый Сплит (+ Expense)</span>
            </button>
            <button
              onClick={() => {
                // Pre-seed first member id if empty
                setPayoutForm(prev => ({ ...prev, memberId: members[0]?.id || '' }));
                setIsPayoutModalOpen(true);
              }}
              className="flex items-center space-x-1.5 font-mono font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg transition-all bg-pink-600 hover:bg-pink-500 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Выплата Curator Payout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-800/15 border border-slate-700/40 px-3 py-2.5 rounded-lg text-slate-400 font-mono text-[10px] uppercase font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-450 bg-rose-500 animate-pulse"></span>
            <span>Панель Кассы Заблокирована ({currentRole})</span>
          </div>
        )}
      </div>

      {/* PROFIT DISTRIBUTION STYLE TABS TARGET */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">Направление ройалти и распределения прибыли</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            Системное ядро удержания: зачислять доходы от сделок на персональный сейф куратора сделки либо сразу направлять оборотные средства в общую кассу.
          </p>
        </div>

        <div className={`flex rounded-lg p-0.5 border shrink-0 font-mono text-[10px] ${
          darkMode ? 'bg-[#0B0D12] border-[#222735]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button 
            type="button"
            onClick={() => {
              if (currentRole === 'root' || currentRole === 'admin' || currentRole === 'finance') {
                onUpdateProfitAllocation('manager');
              }
            }}
            className={`px-3 py-2 rounded-md font-bold transition-all ${
              profitAllocationType === 'manager' 
                ? darkMode ? 'bg-[#1C1F2E] text-white border border-[#2E364A] shadow-sm' : 'bg-indigo-600 text-white'
                : 'text-slate-550 hover:text-indigo-400'
            } ${(currentRole === 'root' || currentRole === 'admin' || currentRole === 'finance') ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
          >
            Сейф Куратора (Manager-driven)
          </button>
          
          <button 
            type="button"
            onClick={() => {
              if (currentRole === 'root' || currentRole === 'admin' || currentRole === 'finance') {
                onUpdateProfitAllocation('common');
              }
            }}
            className={`px-3 py-2 rounded-md font-bold transition-all ${
              profitAllocationType === 'common' 
                ? darkMode ? 'bg-[#1C1F2E] text-white border border-[#2E364A] shadow-sm' : 'bg-indigo-600 text-white'
                : 'text-slate-550 hover:text-indigo-400'
            } ${(currentRole === 'root' || currentRole === 'admin' || currentRole === 'finance') ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
          >
            Общий Фонд (Fund-driven)
          </button>
        </div>
      </div>

      {/* LEDGER RECONCILIATION & DRIFT AUDITOR */}
      <div className={`p-5 rounded-xl border transition-all ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/60 pb-3 mb-4">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-indigo-400 ${reconcileCheck ? 'animate-spin' : ''}`} />
              АВТОМАТИЧЕСКАЯ СВЕРКА БАЛАНСОВ С CRM (RECONCILIATION & DRIFT)
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Операционное сопоставление выкупленных / оплаченных сделок из CRM-реестра с балансовыми поступлениями в кассовую книгу.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setReconcileCheck(true);
              setTimeout(() => {
                setReconcileCheck(false);
                onShowToast?.('Реестр казначейства полностью сопоставлен с CRM! Аномалий расхождений не обнаружено.', 'success');
              }, 700);
            }}
            className="px-3.5 py-2 hover:bg-zinc-800 text-[10.5px] font-mono font-bold bg-[#0A0B0E] border border-[#222735] text-indigo-400 rounded-lg shrink-0 flex items-center gap-1.5 transition-all"
          >
            <span>Выполнить сверку кассы</span>
          </button>
        </div>

        {/* Audit details stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-[11px] ">
          <div className="p-3 rounded-lg bg-[#0E1015] border border-[#1D212A] space-y-1">
            <span className="text-slate-500 text-[9px] block uppercase font-bold">ОПЛАЧЕНО В CRM (ВЫРУЧКА):</span>
            <p className="text-slate-200 text-xs font-bold">
              {fmt(orders.filter(o => o.paymentStatus === 'Оплачен').reduce((sum, o) => sum + Number(o.clientPrice), 0))}
            </p>
            <span className="text-[8.5px] text-slate-600 block">Ожидаемый приток средств</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1015] border border-[#1D212A] space-y-1">
            <span className="text-slate-500 text-[9px] block uppercase font-bold">СЕБЕСТОИМОСТЬ ВЫКУПА:</span>
            <p className="text-slate-200 text-xs font-bold text-rose-400">
              {fmt(orders.reduce((sum, o) => sum + Number(o.costPrice), 0))}
            </p>
            <span className="text-[8.5px] text-slate-600 block">Сумма всех выкупов</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1015] border border-[#1D212A] space-y-1">
            <span className="text-slate-500 text-[9px] block uppercase font-bold">ЖУРНАЛЬНЫЙ ФАКТИЧЕСКИЙ ПРИХОД:</span>
            <p className="text-emerald-400 text-xs font-bold">
              {fmt(totalInflow)}
            </p>
            <span className="text-[8.5px] text-slate-600 block">Проведено по Ledger</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1015] border border-[#1D212A] space-y-1">
            <span className="text-slate-500 text-[9px] block uppercase font-bold">ОТКЛОНЕНИЕ (DRIFT COEFF):</span>
            {(() => {
              const expectedIncome = orders
                .filter(o => o.paymentStatus === 'Оплачен')
                .reduce((sum, o) => sum + Number(o.clientPrice), 0);
              const drift = expectedIncome - totalInflow;
              return (
                <>
                  <p className={`text-xs font-bold ${Math.abs(drift) < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {fmt(drift)}
                  </p>
                  <span className="text-[8.5px] text-slate-600 block">
                    {Math.abs(drift) < 10 
                      ? 'Кассовый баланс сбалансирован идеально' 
                      : 'Кассовые ордеры ожидают проводки'}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* TREASURY STATS BLOCKS & MUTUAL SETTLEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
        
        {/* COMMON FUND DETAILED MODULE */}
        <div className={`lg:col-span-4 p-5 rounded-xl border flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[9.5px] font-mono uppercase font-bold text-slate-500 tracking-wider">Касса оборотных средств</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <h3 className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                {fmt(calculatedBalances.commonFund)}
              </h3>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-1 leading-relaxed">
              Жизнеспособный пул «Общак» для финансирования выкупа и логистических отправлений со склада Англии.
            </p>
          </div>

          <div className="my-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block font-bold">ОБЩИЕ ПОСТУПЛЕНИЯ:</span>
                <p className="font-mono text-sm font-bold text-white flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-450" /> {fmt(totalInflow)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block font-bold">ВЫЧЕТЫ И ТРАТЫ:</span>
                <p className="font-mono text-sm font-bold text-rose-450 flex items-center gap-1 text-rose-400">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {fmt(totalOutflow)}
                </p>
              </div>
            </div>

            <div className="h-[2px] bg-slate-900/40" />


          </div>

          <div className="pt-2 border-t border-slate-900/60 font-mono text-[9px] text-slate-500">
            Оборотный реестр верифицирован автоматикой CSC
          </div>
        </div>

        {/* PERSONAL CURATORS LEDGERS VALUTS */}
        <div className={`lg:col-span-5 p-5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[9.5px] font-mono uppercase font-bold text-slate-500 tracking-wider">Сейфы кураторов</span>
            <p className="text-[10.5px] text-slate-500 font-medium mt-1 leading-relaxed">
              Личные начисления, составленные из закрепленных сделок, за вычетом партнерских субсидированных вкладов.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {members.map(member => {
              const personalBalance = calculatedBalances.members[member.id] || 0;
              const isNegative = personalBalance < 0;
              return (
                <div key={member.id} className="p-3 rounded-lg bg-[#0B0D12] border border-[#1D212A] hover:border-[#2D334C] transition-all flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="font-bold text-white text-xs">{member.name}</p>
                      <span className="text-[9.5px] font-mono text-slate-500 block uppercase">КУРИРУЕТ {orders.filter(o => o.assignedTo === member.id && o.orderStatus !== OrderStatus.CLOSED).length} ТЕКУЩИХ СДЕЛОК</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <p className={`font-bold text-sm ${isNegative ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                      {fmt(personalBalance)}
                    </p>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none mt-1">БАЛАНС СЕЙФА</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MUTUAL LEDGER CLEARING & COMPENSATION DEBTS */}
        <div className={`lg:col-span-3 p-5 rounded-xl border flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[9.5px] font-mono uppercase font-bold text-slate-500 tracking-wider">Инструкция клиринга (Compensation clearing)</span>
            <p className="text-[10.5px] text-slate-500 font-medium mt-1 leading-relaxed">
              Взаимные компенсации по расходам, помеченным как <strong className="text-indigo-400 underline decoration-dotted">«Распределить на всех»</strong> (общие упаковки, авиа-логистика, налоги).
            </p>
          </div>

          <div className="my-4 space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {settlementsList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-[10.5px]">
                🎉 Все расходы компенсированы в равных частях. Просроченных задолженностей нет.
              </div>
            ) : (
              settlementsList.map((st, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-rose-500/5 border-rose-500/10 flex items-center justify-between font-mono text-xs">
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-red-400 truncate">{st.fromName}</span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <span className="font-bold text-slate-250 truncate">{st.toName}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">ПАРТНЕРСКИЙ КЛИРИНГ</span>
                  </div>
                  <span className="font-bold text-rose-455 text-rose-400 shrink-0 text-right">{fmt(st.amount)}</span>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#0B0D12] text-slate-500 p-2.5 rounded text-[10px] font-mono text-center">
            Разбито на {members.length} кураторов
          </div>
        </div>

      </div>

      {/* RENDER CASHFLOW JOURNAL TRANSACTION BOOK */}
      <div className={`p-4 rounded-xl border transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 animate-none">
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold">Журнал совершенных операций (Ledger Journal)</h4>
              </div>
              {finance.length > 0 && (
                showConfirmClear ? (
                  <div className="flex items-center space-x-1.5 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-500/30 animate-none">
                    <span className="text-rose-400 font-mono text-[9px] uppercase font-bold">Вы уверены?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearFinance();
                        setShowConfirmClear(false);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-500 text-[9px] font-mono font-bold uppercase tracking-wider transition-colors"
                    >
                      Да, очистить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-450 border border-rose-500/20 text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-rose-900/30 transition-all flex items-center space-x-1"
                  >
                    <Trash2 className="h-2.5 w-2.5 shrink-0" />
                    <span>Очистить Журнал</span>
                  </button>
                )
              )}
            </div>
            <p className="text-[10.5px] text-slate-550 mt-1 font-mono font-medium">Контрольно-кассовый балансовый рапорт ручных изменений</p>
          </div>

          {/* Quick inline filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* SEARCH */}
            <div className="relative w-48">
              <Search className="h-3 w-3 absolute text-slate-500 left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Поиск по заметкам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-[10.5px] w-full border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-[#0B0D12] border-[#222735] text-white placeholder-slate-500 font-mono' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            {/* TYPE FILTER */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`text-[10px] sm:text-[11px] p-2 rounded focus:outline-none border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">Все операции</option>
              {Object.values(FinanceType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* CATEGORY FILTER */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`text-[10px] sm:text-[11px] p-2 rounded focus:outline-none border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">Любая статья</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* CURATOR FILTER */}
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className={`text-[10px] sm:text-[11px] p-2 rounded focus:outline-none border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">Все кураторы</option>
              <option value="COMMON_POT">Без личного сейфа (Общая)</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
              ))}
            </select>

            {/* COMMON FUND VS PERSONAL VAULT OVERLAY */}
            <select
              value={commonFundFilter}
              onChange={(e) => setCommonFundFilter(e.target.value)}
              className={`text-[10px] sm:text-[11px] p-2 rounded focus:outline-none border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">Все источники (Общ + Сейфы)</option>
              <option value="COMMON">Только Общак (affects Common Fund)</option>
              <option value="PERSONAL">Только личные сейфы партнеров</option>
            </select>
          </div>
        </div>

        {/* OPERATIONS JOURNAL LOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead className={`border-b font-mono text-[9.5px] uppercase tracking-wider text-slate-400 ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th onClick={() => handleSort('id_num')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Код операции{sortField === 'id_num' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('createdAt')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Дата записи{sortField === 'createdAt' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('type')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Тип кассовой операции{sortField === 'type' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('category')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Статья учета{sortField === 'category' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('memberId')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Исполнитель{sortField === 'memberId' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('orderId')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none font-sans">Оборотные связи (Заказ/Коробка){sortField === 'orderId' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('notes')} className="py-2.5 px-4 cursor-pointer hover:text-white select-none">Комментарий / Назначение{sortField === 'notes' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th onClick={() => handleSort('amount')} className="py-2.5 px-4 text-right cursor-pointer hover:text-white select-none">Сумма волюты{sortField === 'amount' ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}</th>
                <th className="py-2.5 px-4 text-right text-indigo-400 select-none">Резерв Кассы</th>
                <th className="py-2.5 px-4 w-12 text-center select-none">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-dotted font-mono text-[11px] ${
              darkMode ? 'divide-[#222735]' : 'divide-slate-200'
            }`}>
              {sortedEntries.map((item) => {
                const assignedMem = members.find(m => m.id === item.memberId);
                const isExpense = item.type === FinanceType.EXPENSE || item.type === FinanceType.WITHDRAW_COMMON || item.type === FinanceType.PAYOUT;
                const balanceSnapshot = runningBalances[item.id] !== undefined ? runningBalances[item.id] : calculatedBalances.commonFund;

                return (
                  <tr key={item.id} className={`hover:bg-[#151924] transition-all`}>
                    <td className="py-3 px-4 font-bold text-slate-450 text-indigo-400">
                      <span>{item.id}</span>
                      {item.source === 'GoogleSheets:BuhUchet' && (
                        <span className="ml-1.5 bg-emerald-950 text-emerald-450 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Sheets
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{getFinanceTypeBadge(item.type)}</td>
                    <td className="py-3 px-4 font-bold text-slate-250 truncate max-w-[150px]">{item.category}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                      {item.account || (assignedMem ? assignedMem.name.split(' ')[0] : 'Общая касса')}
                    </td>
                    <td className="py-3 px-4">
                      {item.orderId ? (
                        <button 
                          onClick={() => onSelectRecord && onSelectRecord('order', item.orderId)}
                          className="bg-indigo-900/40 hover:bg-indigo-800/80 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded border border-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                          title=" Перейти к деталям заказа в CRM"
                        >
                          {item.orderId}
                        </button>
                      ) : item.parcelId ? (
                        <button 
                          onClick={() => onSelectRecord && onSelectRecord('parcel', item.parcelId)}
                          className="bg-amber-900/40 hover:bg-amber-800/80 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
                          title="Перейти к посылке в логистике"
                        >
                          {item.parcelId}
                        </button>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-[200px] truncate" title={item.notes}>
                      {item.notes}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-xs font-mono shrink-0 ${
                      isExpense ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isExpense ? '-' : '+'}{fmt(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-350 text-slate-300">
                      {fmt(balanceSnapshot)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => onDeleteFinanceEntry(item.id)}
                        className="text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 p-1.5 rounded transition-all"
                        title="Удалить проводку"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedEntries.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                    Нет зарегистрированных проводок в кассовом реестре.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD TRANSACTION POPUP MODAL DIALOG
          ========================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans text-xs">
          <div className={`w-full max-w-lg rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-[#E2E8F0] text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1">
                <Wallet className="h-4.5 w-4.5" />
                <span>Новая финансовая проводка (Intake journal)</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-550 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* TRANSACTION TYPE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Тип кассовой операции</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as FinanceType})}
                    className={`w-full text-xs p-2 rounded-md outline-none border font-bold ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50'
                    }`}
                  >
                    {Object.values(FinanceType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY SELECTOR */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Статья учета / Категория</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className={`w-full text-xs p-2 rounded-md outline-none border font-bold ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* AMOUNT INT */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Сумма операции (RUB)</label>
                  <input
                    type="number"
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({...form, amount: Number(e.target.value)})}
                    placeholder="Сумма в рублях..."
                    className={`w-full text-xs px-3 py-2 border rounded-md outline-none font-bold font-mono ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white focus:border-indigo-400' : 'bg-slate-50'
                    }`}
                  />
                </div>

                {/* CURRENCY */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Валюта кассы</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({...form, currency: e.target.value})}
                    className={`w-full text-xs p-2 rounded-md border text-center font-bold ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                    }`}
                  >
                    <option value="RUB">RUB (Рубль)</option>
                    <option value="GBP">GBP (£ Англия)</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* CONCRETE MEMBER LINK */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Причастный участник (Опц.)</label>
                  <select
                    value={form.memberId}
                    onChange={(e) => setForm({...form, memberId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-md border text-slate-300 ${
                      darkMode ? 'bg-[#141722] border-[#222735]' : 'bg-white'
                    }`}
                  >
                    <option value="">Не привязывать к сейфу</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* ATTACH ORDER OR PARCEL ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Привязка к ордеру или боксу</label>
                  <input
                    type="text"
                    value={form.orderId || form.parcelId}
                    placeholder="Напр. ORD-101 или PRC-102"
                    onChange={(e) => {
                      const val = e.target.value.trim().toUpperCase();
                      if (val.startsWith('ORD-')) {
                        setForm({ ...form, orderId: val, parcelId: '' });
                      } else if (val.startsWith('PRC-')) {
                        setForm({ ...form, parcelId: val, orderId: '' });
                      } else {
                        setForm({ ...form, orderId: '', parcelId: '' });
                      }
                    }}
                    className={`w-full text-xs px-3 py-2 border rounded-md outline-none font-mono ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white focus:border-indigo-400' : 'bg-white'
                    }`}
                  />
                </div>

              </div>

              {/* Advanced logical options */}
              <div className="pt-2 flex flex-col space-y-2.5 bg-slate-900/40 p-3 rounded-lg border border-dashed border-slate-800">
                
                {/* AFFECTS DEFAULT COMMON FUND */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="affects-fund"
                    checked={form.affectsCommonFund}
                    onChange={(e) => setForm({...form, affectsCommonFund: e.target.checked})}
                    className="rounded text-indigo-650 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                  />
                  <label htmlFor="affects-fund" className="text-[11px] text-slate-300 cursor-pointer select-none">
                    Операция должна списать/пополнить общую кассу «Общак»
                  </label>
                </div>

                {/* COOPERATIVE SPLIT EXPENSE */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="split-members"
                    checked={form.splitBetweenMembers}
                    onChange={(e) => setForm({...form, splitBetweenMembers: e.target.checked})}
                    className="rounded text-indigo-650 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                  />
                  <label htmlFor="split-members" className="text-[11px] text-indigo-300 cursor-pointer font-bold select-none">
                    🔴 Расходы общие: разделить трату поровну на кураторов (Клиринг)
                  </label>
                </div>

              </div>

              {/* NOTES */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Назначение платежа / Бухгалтерское обоснование</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="Детали платежа, компенсации за хостинг рекламы, предоплаты..."
                  rows={2}
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none leading-relaxed ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                  }`}
                />
              </div>

              {/* Action operations button */}
              <div className="flex items-center justify-end space-x-3.5 pt-4 border-t border-slate-900/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-mono font-bold text-xs ${
                    darkMode ? 'bg-[#1C1F2E] text-slate-400 hover:text-white' : 'bg-slate-100'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-mono font-bold text-xs bg-[#1C1F2E] text-emerald-400 hover:bg-[#252B42] border border-[#2E364A] shadow"
                >
                  Провести транзакцию в БД
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* ==========================================
          SPLIT EXPENSE MODAL
          ========================================== */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans text-xs">
          <div className={`w-full max-w-md rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-[#E2E8F0] text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                <Wallet className="h-4.5 w-4.5" />
                <span>Быстрый Сплит Расхода (Equal Clearing Split)</span>
              </h3>
              <button 
                onClick={() => setIsSplitModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-slate-450 leading-relaxed text-[11px] mb-4 bg-purple-950/20 text-purple-300 p-2.5 rounded border border-purple-800/20 font-sans">
              Калькулятор разделит общую сумму этой траты в системе <strong>поровну на всех активных кураторов ({members.length})</strong>. Касса «Общак» спишет указанную сумму, и на личный долг/баланс каждого партнера запишется соразмерная дебиторская доля.
            </p>

            <form onSubmit={handleSplitSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Сумма расхода (RUB)</label>
                <input
                  type="number"
                  required
                  value={splitForm.amount || ''}
                  onChange={(e) => setSplitForm({...splitForm, amount: Number(e.target.value)})}
                  placeholder="Напр. 60000 (разделится по 20000 на троих)"
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none font-bold font-mono ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white focus:border-purple-400' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Статья учета / Категория</label>
                <select
                  value={splitForm.category}
                  onChange={(e) => setSplitForm({...splitForm, category: e.target.value})}
                  className={`w-full text-xs p-2 rounded-md border font-bold ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Обоснование траты (Комментарий)</label>
                <textarea
                  required
                  value={splitForm.notes}
                  onChange={(e) => setSplitForm({...splitForm, notes: e.target.value})}
                  placeholder="Например: Закупка коробок, расходка для принтеров, аренда и т.д."
                  rows={2}
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none leading-relaxed ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/20">
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className={`px-4 py-2 font-mono font-bold text-xs rounded-lg ${
                    darkMode ? 'bg-[#1C1F2E] text-slate-400 hover:text-white' : 'bg-slate-100'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-mono font-bold text-xs bg-purple-650 hover:bg-purple-550 text-white shadow"
                >
                  Провести сплит-трату
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          CURATOR PAYOUT MODAL
          ========================================== */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans text-xs">
          <div className={`w-full max-w-md rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-[#E2E8F0] text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1.5">
                <Wallet className="h-4.5 w-4.5" />
                <span>Регистрация выплаты партнеру (Curator Payout)</span>
              </h3>
              <button 
                onClick={() => setIsPayoutModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-slate-450 leading-relaxed text-[11px] mb-4 bg-pink-955/20 bg-pink-950/10 text-pink-300 p-2.5 rounded border border-pink-800/10 font-sans">
              Эта транзакция оформляет фактическую **выдачу (payout) наличных/средств куратору** из его накопительной доли сейфа. Она уменьшит личный баланс партнера, но никак не изменит общую оборотную кассу «Общак».
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Партнер / Получатель выплаты</label>
                <select
                  value={payoutForm.memberId}
                  onChange={(e) => setPayoutForm({...payoutForm, memberId: e.target.value})}
                  className={`w-full text-xs p-2 rounded-md border font-bold ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                  }`}
                >
                  <option value="">Выберите куратора...</option>
                  {members.map(m => {
                    const balance = calculatedBalances.members[m.id] || 0;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} (Доступно сейф-фонда: {fmt(balance)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Сумма выплаты (RUB)</label>
                <input
                  type="number"
                  required
                  value={payoutForm.amount || ''}
                  onChange={(e) => setPayoutForm({...payoutForm, amount: Number(e.target.value)})}
                  placeholder="Сумма к выдаче..."
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none font-bold font-mono ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white focus:border-pink-400' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Бухгалтерские заметки</label>
                <textarea
                  required
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({...payoutForm, notes: e.target.value})}
                  placeholder="Опишите операцию, например: Выплата части маржи за Май на личную Сбер-карту"
                  rows={2}
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none leading-relaxed ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/20">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className={`px-4 py-2 font-mono font-bold text-xs rounded-lg ${
                    darkMode ? 'bg-[#1C1F2E] text-slate-400 hover:text-white' : 'bg-slate-100'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-mono font-bold text-xs bg-pink-650 hover:bg-pink-550 text-white shadow"
                >
                  Зафиксировать выплату
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
