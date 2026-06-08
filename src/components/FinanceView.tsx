/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  darkMode = true
}: FinanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

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
    const matchesSearch = f.notes.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) {
      alert('Укажите корректную сумму операции.');
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`flex items-center space-x-2 font-mono font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all ${
            darkMode 
              ? 'bg-indigo-650 hover:bg-indigo-550 bg-indigo-600 text-white' 
              : 'bg-indigo-700 hover:bg-indigo-600 text-white'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Записать Транзакцию</span>
        </button>
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
            onClick={() => onUpdateProfitAllocation('manager')}
            className={`px-3 py-2 rounded-md font-bold transition-all ${
              profitAllocationType === 'manager' 
                ? darkMode ? 'bg-[#1C1F2E] text-white border border-[#2E364A] shadow-sm' : 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Сейф Куратора (Manager-driven)
          </button>
          
          <button 
            type="button"
            onClick={() => onUpdateProfitAllocation('common')}
            className={`px-3 py-2 rounded-md font-bold transition-all ${
              profitAllocationType === 'common' 
                ? darkMode ? 'bg-[#1C1F2E] text-white border border-[#2E364A] shadow-sm' : 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Общий Фонд (Fund-driven)
          </button>
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
              <option value="ALL">Любой Отвод</option>
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
          </div>
        </div>

        {/* OPERATIONS JOURNAL LOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead className={`border-b font-mono text-[9.5px] uppercase tracking-wider text-slate-400 ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th className="py-2.5 px-4">Код операции</th>
                <th className="py-2.5 px-4 col-span-2">Дата записи</th>
                <th className="py-2.5 px-4">Тип кассовой операции</th>
                <th className="py-2.5 px-4">Статья учета / Категория</th>
                <th className="py-2.5 px-4">Исполнитель</th>
                <th className="py-2.5 px-4">Оборотные связи (Заказ/Коробка)</th>
                <th className="py-2.5 px-4">Комментарий / Назначение</th>
                <th className="py-2.5 px-4 text-right">Сумма волюты</th>
                <th className="py-2.5 px-4 w-12 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-dotted font-mono text-[11px] ${
              darkMode ? 'divide-[#222735]' : 'divide-slate-200'
            }`}>
              {filteredEntries.map((item) => {
                const assignedMem = members.find(m => m.id === item.memberId);
                const isExpense = item.type === FinanceType.EXPENSE || item.type === FinanceType.WITHDRAW_COMMON || item.type === FinanceType.PAYOUT;

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
                        <span className="bg-indigo-900/40 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded border border-indigo-500/10">
                          {item.orderId}
                        </span>
                      ) : item.parcelId ? (
                        <span className="bg-amber-900/40 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/10">
                          {item.parcelId}
                        </span>
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

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
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

    </div>
  );
}
