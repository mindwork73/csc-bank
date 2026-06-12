/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FinanceEntry, 
  FinanceType, 
  TeamMember, 
  Order, 
  Parcel 
} from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Calendar,
  Layers,
  DollarSign
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
  openAddModalOnLoad?: boolean;
  onResetAddModalOnLoad?: () => void;
  onSelectRecord?: (type: 'order' | 'parcel', id: string) => void;
}

export default function FinanceView({
  finance,
  members,
  orders,
  calculatedBalances,
  onAddFinanceEntry,
  onDeleteFinanceEntry,
  onClearFinance,
  darkMode = true,
  currentRole = 'root',
  onShowToast
}: FinanceViewProps) {
  
  // Local filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [fundFilter, setFundFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Form State
  const [addForm, setAddForm] = useState({
    type: FinanceType.EXPENSE,
    category: 'Логистика',
    amount: '',
    memberId: '',
    affectsCommonFund: true,
    splitBetweenMembers: false,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categoriesList = [
    'Логистика', 
    'Упаковка', 
    'Выкуп товара', 
    'Комиссия', 
    'Аренда склада', 
    'Личные выплаты', 
    'Инвестиции/Вклад',
    'Прочее'
  ];

  // Filters logic
  const filteredEntries = useMemo(() => {
    return finance.filter(f => {
      const notes = (f.notes || '').toLowerCase();
      const cat = (f.category || '').toLowerCase();
      const termNormalized = searchTerm.toLowerCase().trim();
      
      const matchesSearch = notes.includes(termNormalized) || cat.includes(termNormalized);
      
      let matchesType = true;
      if (typeFilter !== 'ALL') {
        matchesType = f.type === typeFilter;
      }

      let matchesMember = true;
      if (memberFilter !== 'ALL') {
        matchesMember = f.memberId === memberFilter;
      }

      let matchesFund = true;
      if (fundFilter !== 'ALL') {
        if (fundFilter === 'COMMON') matchesFund = f.affectsCommonFund;
        if (fundFilter === 'PERSONAL') matchesFund = !f.affectsCommonFund;
      }

      return matchesSearch && matchesType && matchesMember && matchesFund;
    });
  }, [finance, searchTerm, typeFilter, memberFilter, fundFilter]);

  // Statistics
  const stats = useMemo(() => {
    // Current common fund balance:
    const commonFund = calculatedBalances.commonFund;

    // Participant spent & earned calculations
    const memberStats: Record<string, { spent: number; earned: number }> = {};
    members.forEach(m => {
      memberStats[m.id] = { spent: 0, earned: 0 };
    });

    finance.forEach(f => {
      const mId = f.memberId;
      if (mId && memberStats[mId]) {
        if (f.type === FinanceType.EXPENSE) {
          memberStats[mId].spent += f.amount;
        } else if (f.type === FinanceType.INCOME) {
          memberStats[mId].earned += f.amount;
        }
      }
    });

    return {
      commonFund,
      memberStats
    };
  }, [finance, members, calculatedBalances]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(addForm.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      onShowToast?.('Укажите корректную сумму', 'warning');
      return;
    }

    onAddFinanceEntry({
      type: addForm.type,
      category: addForm.category,
      amount: parsedAmount,
      currency: 'RUB',
      memberId: addForm.memberId || null as any,
      orderId: null,
      parcelId: null,
      affectsCommonFund: addForm.affectsCommonFund,
      splitBetweenMembers: addForm.splitBetweenMembers,
      notes: addForm.notes
    });

    onShowToast?.('Запись добавлена в бух.учет', 'success');
    setIsAddModalOpen(false);

    // reset
    setAddForm({
      type: FinanceType.EXPENSE,
      category: 'Логистика',
      amount: '',
      memberId: '',
      affectsCommonFund: true,
      splitBetweenMembers: false,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const fmt = (num: number | undefined) => {
    if (num === undefined || isNaN(num)) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Бухучет и Касса
          </h2>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Простой рабочий журнал учёта расходов и доходов общака, личных трат и начислений участников команды.
          </p>
        </div>

        {currentRole !== 'readonly' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Создать запись</span>
            </button>
            
            {finance.length > 0 && (
              showClearConfirm ? (
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-rose-950/40 rounded border border-rose-500/30">
                  <span className="text-[10px] text-rose-300 font-bold uppercase">Точно?</span>
                  <button
                    onClick={() => {
                      onClearFinance();
                      setShowClearConfirm(false);
                      onShowToast?.('Все финансовые записи очищены', 'info');
                    }}
                    className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] uppercase font-bold rounded"
                  >
                    Да
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-slate-400 text-[10px] uppercase font-bold px-1"
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-[#222735] rounded-lg text-[11px] font-semibold"
                >
                  Очистить кассу
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* MINI STATS BAR (QUITE & MINI BAR) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-[10.5px] font-mono font-medium text-slate-500 py-1 border-b border-slate-800/10">
        <div>
          Общий баланс кассы: <span className="text-emerald-500/90 font-semibold">{fmt(stats.commonFund)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4">
          {members.map(m => {
            const mStats = stats.memberStats[m.id] || { spent: 0, earned: 0 };
            return (
              <div key={m.id} className="flex items-center space-x-1 border-l border-slate-800/10 pl-3">
                <span className="text-slate-400">{m.name}:</span>
                <span className="text-rose-455 font-normal">{fmt(mStats.spent)}</span>
                <span className="text-slate-600">/</span>
                <span className="text-emerald-455 font-normal">{fmt(mStats.earned)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 transition-colors ${
        darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по статьям или пометкам..."
            className={`w-full pl-8 pr-3 py-1.25 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 ${
              darkMode ? 'bg-[#141722] border-[#222735] text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`text-xs px-2.5 py-1.25 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <option value="ALL">Любой финансовый тип</option>
          <option value={FinanceType.INCOME}>Доход</option>
          <option value={FinanceType.EXPENSE}>Расход</option>
          <option value={FinanceType.DEPOSIT_COMMON}>Вклад в кассу</option>
          <option value={FinanceType.WITHDRAW_COMMON}>Изъятие средств</option>
        </select>

        {/* Member Filter */}
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className={`text-xs px-2.5 py-1.25 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <option value="ALL">Любой участник</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* Fund correlation */}
        <select
          value={fundFilter}
          onChange={(e) => setFundFilter(e.target.value)}
          className={`text-xs px-2.5 py-1.25 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <option value="ALL">Фонд: Все подряд</option>
          <option value="COMMON">Только Общак</option>
          <option value="PERSONAL">Вне общака (Личное)</option>
        </select>
      </div>

      {/* FINANCE JOURNAL TABLE */}
      <div className={`border rounded-xl overflow-hidden ${
        darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-200 bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b text-slate-500 text-[10px] uppercase font-mono tracking-wider sticky top-0 z-10 ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="py-2.5 px-3 w-12 text-center text-slate-500 font-bold">Код</th>
                <th className="py-2.5 px-3">Дата</th>
                <th className="py-2.5 px-3">Операция</th>
                <th className="py-2.5 px-3">Статья / Категория</th>
                <th className="py-2.5 px-3">Участник</th>
                <th className="py-2.5 px-3 text-center">Общак</th>
                <th className="py-2.5 px-3 text-center">Сплит</th>
                <th className="py-2.5 px-3">Комментарий / Обоснование</th>
                <th className="py-2.5 px-3 text-right">Сумма в рублях</th>
                {currentRole !== 'readonly' ? <th className="py-2.5 px-3 w-10 text-center"></th> : null}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#1D212A]/50' : 'divide-slate-200'}`}>
              {filteredEntries.map((item) => {
                const assignedMem = members.find(m => m.id === item.memberId);
                const isExpense = item.type === FinanceType.EXPENSE || item.type === FinanceType.WITHDRAW_COMMON || item.type === FinanceType.PAYOUT;

                return (
                  <tr key={item.id} className={`border-b select-none ${darkMode ? 'border-[#141722] hover:bg-[#141722]/60' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-400 text-center text-[11px]">
                      {item.id}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono border ${
                        item.type === FinanceType.INCOME 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                          : 'bg-rose-950/20 text-rose-400 border-rose-500/10'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-250 text-[11.5px]">
                      {item.category}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-350 text-[11px]">
                      {assignedMem ? assignedMem.name : <span className="text-slate-500 font-normal">Общая касса</span>}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[10.5px]">
                      {item.affectsCommonFund ? (
                        <span className="text-emerald-400/90 font-semibold bg-emerald-950/40 px-1 py-0.25 rounded border border-emerald-500/15">Да</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[10.5px]">
                      {item.splitBetweenMembers ? (
                        <span className="text-purple-400/90 font-semibold bg-purple-950/30 px-1 py-0.25 rounded border border-purple-500/10">3-way</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-[130px] truncate text-[11px]" title={item.notes}>
                      {item.notes || <span className="text-slate-650">—</span>}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold text-[11.5px] ${
                      isExpense ? 'text-rose-450' : 'text-[#4ade80]'
                    }`}>
                      {isExpense ? '-' : '+'}{fmt(item.amount)}
                    </td>
                    
                    {currentRole !== 'readonly' ? (
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (confirm('Удалить эту операцию?')) {
                              onDeleteFinanceEntry(item.id);
                              onShowToast?.('Запись удалена', 'info');
                            }
                          }}
                          className="text-rose-500 hover:text-rose-400 p-1 rounded transition-all active:scale-90"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 italic font-mono">
                    Нет зарегистрированных проводок в кассовом реестре.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: ADD FINANCE JOURNAL ENTRY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans text-xs">
          <div className={`w-full max-w-md rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#222735] text-white' : 'bg-white border-slate-250 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-450">
                Записать финансовую операцию
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Тип операции:</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({...addForm, type: e.target.value as FinanceType})}
                    className={`w-full text-xs p-2 rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <option value={FinanceType.EXPENSE}>Расход</option>
                    <option value={FinanceType.INCOME}>Доход</option>
                    <option value={FinanceType.DEPOSIT_COMMON}>Вклад в кассу</option>
                    <option value={FinanceType.WITHDRAW_COMMON}>Изъятие средств</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Статья учета:</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({...addForm, category: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Сумма операции (руб):</label>
                <input
                  type="number"
                  required
                  value={addForm.amount}
                  onChange={(e) => setAddForm({...addForm, amount: e.target.value})}
                  placeholder="Введите сумму в рублях"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Единоличный участник (Сейф):</label>
                <select
                  value={addForm.memberId}
                  onChange={(e) => setAddForm({...addForm, memberId: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg focus:outline-none ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <option value="">Без личного сейфа (общая)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col space-y-2 bg-[#141722] p-3 rounded-lg border border-[#222735]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add-affects"
                    checked={addForm.affectsCommonFund}
                    onChange={(e) => setAddForm({...addForm, affectsCommonFund: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                  />
                  <label htmlFor="add-affects" className="text-xs cursor-pointer select-none text-slate-300">
                    Относится напрямую к общаку («Общак-канал»)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add-split"
                    checked={addForm.splitBetweenMembers}
                    onChange={(e) => setAddForm({...addForm, splitBetweenMembers: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                  />
                  <label htmlFor="add-split" className="text-xs cursor-pointer select-none text-slate-300">
                    Делится поровну на троих участников (Сплит расхода)
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Бухгалтерский комментарий:</label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({...addForm, notes: e.target.value})}
                  placeholder="Назначение платежа..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="flex gap-3.5 pt-3.5 border-t border-slate-700/20 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                    darkMode ? 'bg-zinc-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg text-xs font-semibold text-white"
                >
                  Записать операцию
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
