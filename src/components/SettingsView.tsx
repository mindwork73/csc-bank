/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TeamMember, 
  AppSettings, 
  AuditLog,
  Order,
  FinanceEntry,
  FinanceType
} from '../types';
import { 
  Settings, 
  Users, 
  Coins, 
  History, 
  Save,
  Lock,
  Unlock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  DollarSign,
  Briefcase,
  Layers,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  members: TeamMember[];
  orders?: Order[];
  finance?: FinanceEntry[];
  calculatedBalances?: {
    commonFund: number;
    members: Record<string, number>;
  };
  onAddFinanceEntry?: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  auditLogs: AuditLog[];
  darkMode?: boolean;
  currentRole?: string;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function SettingsView({
  settings,
  members,
  orders = [],
  finance = [],
  calculatedBalances = { commonFund: 0, members: {} },
  onAddFinanceEntry,
  onUpdateSettings,
  onUpdateMembers,
  auditLogs,
  darkMode = true,
  currentRole = 'root',
  onShowToast
}: SettingsViewProps) {
  // Check role-based capabilities
  const isPrivileged = currentRole === 'root' || currentRole === 'admin';

  const [exchangeRate, setExchangeRate] = useState(settings.gbpExchangeRate);
  const [regularGbp, setRegularGbp] = useState(settings.defaultFeeRegularGbp);
  const [liquidGbp, setLiquidGbp] = useState(settings.defaultFeeLiquidGbp);

  // Members mutable state
  const [partnerShares, setPartnerShares] = useState(
    members.map(m => ({ id: m.id, name: m.name, share: m.sharePercent, active: m.active }))
  );

  // Expanded detailed workspace for specific curator to view linked items
  const [activeDetailCurator, setActiveDetailCurator] = useState<string | null>(null);

  // Payout creation modal / state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    memberId: '',
    amount: 0,
    reasonCode: 'Плановый вывод прибыли',
    notes: ''
  });

  // Sync state if members prop changes
  React.useEffect(() => {
    setPartnerShares(members.map(m => ({ id: m.id, name: m.name, share: m.sharePercent, active: m.active })));
  }, [members]);

  // Live validator metrics
  const totalSharesSum = partnerShares.reduce((s, p) => s + (p.active ? Number(p.share) : 0), 0);
  const sharesAreValid = Math.abs(totalSharesSum - 100) < 0.01;

  const handleSaveForex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrivileged) {
      onShowToast?.('Доступ заблокирован. Только ROOT / ADMIN могут редактировать курсы валют.', 'error');
      return;
    }

    onUpdateSettings({
      gbpExchangeRate: Number(exchangeRate) || 122.5,
      defaultFeeRegularGbp: Number(regularGbp) || 5,
      defaultFeeLiquidGbp: Number(liquidGbp) || 10
    });
    onShowToast?.('Системные курсы успешно зафиксированы в казначействе.', 'success');
  };

  const handleUpdateShare = (id: string, field: 'share' | 'active', value: any) => {
    if (!isPrivileged) {
      onShowToast?.('Доступ заблокирован. Редактирование долей доступно только ROOT / ADMIN.', 'error');
      return;
    }
    setPartnerShares(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSaveTeam = () => {
    if (!isPrivileged) {
      onShowToast?.('Доступ заблокирован. Изменение долей запрещено вашим уровнем доступа.', 'error');
      return;
    }

    // Strict validation: total MUST equal 100%
    if (!sharesAreValid) {
      onShowToast?.(`Нельзя сохранить! Сумма долей активных партнеров составляет ${totalSharesSum.toFixed(2)}% (должна быть строго 100%).`, 'error');
      return;
    }

    const updated = members.map(m => {
      const match = partnerShares.find(p => p.id === m.id);
      if (match) {
        return {
          ...m,
          sharePercent: Number(match.share) || 0,
          active: match.active
        };
      }
      return m;
    });

    onUpdateMembers(updated);
    onShowToast?.('Доли команды зафиксированы в P&L реестре.', 'success');
  };

  // Open payout window helper
  const openPayoutForm = (memberId: string) => {
    const curBalance = calculatedBalances.members[memberId] || 0;
    setPayoutForm({
      memberId,
      amount: curBalance > 0 ? Math.floor(curBalance) : 0,
      reasonCode: 'Плановый вывод прибыли',
      notes: ''
    });
    setShowPayoutModal(true);
  };

  // Submit curator payout handler (creates real Finance entries)
  const submitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutForm.amount <= 0) {
      onShowToast?.('Сумма выплаты должна быть строго больше нуля.', 'error');
      return;
    }

    const curator = members.find(m => m.id === payoutForm.memberId);
    if (!curator) return;

    if (!onAddFinanceEntry) {
      onShowToast?.('Ошибка адаптера: метод проводки кассы не настроен.', 'error');
      return;
    }

    // Create payout ledger entry
    onAddFinanceEntry({
      type: FinanceType.PAYOUT,
      category: 'Выплата участнику',
      amount: payoutForm.amount,
      currency: 'RUB',
      memberId: payoutForm.memberId,
      orderId: null,
      parcelId: null,
      affectsCommonFund: true, // deducts from common pool cash-out
      splitBetweenMembers: false,
      notes: `[Выплата куратору ${curator.name}] Код: ${payoutForm.reasonCode}. ${payoutForm.notes}`
    });

    onShowToast?.(`Выплата ${payoutForm.amount.toLocaleString()} ₽ успешно проведена для куратора ${curator.name}.`, 'success');
    setShowPayoutModal(false);
  };

  const fmt = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  // Process history of team share changes from audit log dynamically
  const shareChangeHistory = auditLogs.filter(log => 
    log.entityType === 'TeamMember' || 
    log.action.toLowerCase().includes('доли') || 
    log.action.toLowerCase().includes('партн')
  );

  // Drilldown related data arrays
  const curatorOrders = orders.filter(o => o.assignedTo === activeDetailCurator);
  const curatorFinance = finance.filter(f => f.memberId === activeDetailCurator);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/20 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center space-x-2.5 uppercase">
            <Settings className="h-5 w-5 text-indigo-400" />
            <span>Панель Управления P&L и Долями / Curation & Treasury</span>
          </h2>
          <p className={`text-xs mt-1 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Контроль судейских балансов кураторов CSC, распределение маржинального сплита 100% и выплата удержаний.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          {!isPrivileged ? (
            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold">
              <Lock className="h-3.5 w-3.5 animate-pulse" /> readonly
            </span>
          ) : (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold">
              <Unlock className="h-3.5 w-3.5" /> root-access
            </span>
          )}
        </div>
      </div>

      {!isPrivileged && (
        <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <Lock className="h-4.5 w-4.5 shrink-0 animate-bounce" />
          <div>
            <span className="font-bold">Вы вошли в режиме только для чтения:</span> изменения пошлин, обменных ставок казначейства и сплит-долей партнеров CSC Group заблокированы. Для проведения изменений переключите роль доступа в правом верхнем угле терминала.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CURRENCY & FOREX SETTING (4 cols) */}
        <div className={`lg:col-span-4 p-5 rounded-xl border space-y-4 transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5 text-indigo-400 border-b border-slate-800 pb-2.5">
            <Coins className="h-4.5 w-4.5" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Константы Валют</h3>
          </div>

          <form onSubmit={handleSaveForex} className="space-y-4.5 text-xs font-sans">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Курс GBP/RUB для автоматики CSC *</label>
              <div className="relative">
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={exchangeRate}
                  step="0.01"
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className={`w-full p-2.5 rounded font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-550 ${
                    darkMode ? 'bg-[#0B0D12] border-[#222735] text-[#ECEFF4] disabled:opacity-50' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 font-mono text-[10px] text-slate-500 font-bold">₽ за £1</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-mono">
                Используется при зачислении накладных логистических расходов по UK Box в общие леджеры.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Тариф regular (£)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={regularGbp}
                  onChange={(e) => setRegularGbp(Number(e.target.value) || 5)}
                  className={`w-full p-2.5 rounded font-mono border focus:outline-none ${
                    darkMode ? 'bg-[#0B0D12] border-[#222735] text-white disabled:opacity-50' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Тариф liquid (£)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={liquidGbp}
                  onChange={(e) => setLiquidGbp(Number(e.target.value) || 10)}
                  className={`w-full p-2.5 rounded font-mono border focus:outline-none ${
                    darkMode ? 'bg-[#0B0D12] border-[#222735] text-white disabled:opacity-50' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPrivileged}
              className={`w-full font-mono font-bold transition-all text-xs py-2.5 rounded-lg border flex items-center justify-center space-x-2 ${
                isPrivileged 
                  ? 'bg-[#1C1F2E] border-[#2E364A] text-slate-200 hover:bg-[#252B42] hover:text-white' 
                  : 'bg-slate-900 border-transparent text-slate-655 cursor-not-allowed opacity-50'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>Зафиксировать обменные пошлины</span>
            </button>
          </form>
        </div>

        {/* TEAM & SHARES CONFIG WITH DYNAMIC REAL BALANCES (8 cols) */}
        <div className={`lg:col-span-8 p-5 rounded-xl border space-y-4 transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2.5 text-emerald-400">
              <Users className="h-4.5 w-4.5" />
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Сплит-Лимиты партнеров и балансы кураторов</h3>
            </div>

            {/* Live share percentage sum tracker status box */}
            <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
              sharesAreValid
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-450'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sharesAreValid ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
              <span>СУММА ДОЛЕЙ: {totalSharesSum.toFixed(2)}% {sharesAreValid ? '(Валидно)' : '(ОШИБКА 100%)'}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-mono leading-relaxed mt-1">
            Каждый проведенный заказ по CRM-базе, отмеченный как "Оплачен", автоматически зачисляет долю чистой прибыли на личный баланс ответственного куратора в соответствии с зафиксированным сплитом.
          </p>

          <div className="space-y-3.5">
            {partnerShares.map((p) => {
              const personalBalance = calculatedBalances.members[p.id] || 0;
              const isSelected = activeDetailCurator === p.id;

              return (
                <div key={p.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  isSelected 
                    ? darkMode ? 'bg-indigo-500/5 border-indigo-500/35 shadow-indigo-950/20 shadow-lg' : 'bg-indigo-50 border-indigo-200'
                    : darkMode ? 'bg-[#0E1015] border-[#1D212A] hover:border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <input
                      type="checkbox"
                      disabled={!isPrivileged}
                      id={`active-${p.id}`}
                      checked={p.active}
                      onChange={(e) => handleUpdateShare(p.id, 'active', e.target.checked)}
                      className="rounded text-indigo-650 focus:ring-0 h-4.5 w-4.5 bg-[#141722] border-[#222735] disabled:opacity-40"
                    />
                    <div className="leading-tight">
                      <label htmlFor={`active-${p.id}`} className="font-bold text-[#ECEFF4] cursor-pointer select-none font-mono text-xs flex items-center gap-1.5">
                        {p.name}
                        {p.active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                        )}
                      </label>
                      <span className="text-[10px] text-slate-500 font-bold block font-mono">ID: {p.id.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Profit Share Input */}
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-550 uppercase text-[9px] font-bold">Доля прибыли:</span>
                    <input
                      type="number"
                      disabled={!p.active || !isPrivileged}
                      value={p.share}
                      onChange={(e) => handleUpdateShare(p.id, 'share', Number(e.target.value))}
                      className={`w-14 p-1 rounded border text-center font-bold font-mono focus:ring-1 focus:ring-indigo-550 focus:outline-none ${
                        darkMode ? 'bg-[#141722] border-[#222735] text-white disabled:opacity-40' : 'bg-white'
                      }`}
                    />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>

                  {/* Dynamic Calculated Balance Badge */}
                  <div className="font-mono text-right shrink-0">
                    <span className="text-slate-550 text-[9px] uppercase font-bold block">Свободный баланс:</span>
                    <span className={`text-[13px] font-extrabold block ${personalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fmt(personalBalance)}
                    </span>
                  </div>

                  {/* Actions specific to member */}
                  <div className="flex items-center gap-2 w-full sm:w-auto font-mono">
                    <button
                      onClick={() => openPayoutForm(p.id)}
                      disabled={!p.active}
                      className="flex-1 sm:flex-initial text-[10px] font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1.5 rounded transition-all flex items-center justify-center gap-1 disabled:opacity-45"
                      title="Выплатить удержание или выдать аванс"
                    >
                      <DollarSign className="h-3 w-3" /> Payout
                    </button>
                    <button
                      onClick={() => setActiveDetailCurator(isSelected ? null : p.id)}
                      className="flex-1 sm:flex-initial text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-705 border border-slate-700 px-2.5 py-1.5 rounded transition-all text-center"
                    >
                      {isSelected ? 'Закрыть реестр' : 'Связи / Ledger'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSaveTeam}
            disabled={!isPrivileged || !sharesAreValid}
            className={`w-full font-mono font-bold transition-all text-xs py-2.5 rounded-lg border flex items-center justify-center space-x-2 ${
              isPrivileged && sharesAreValid
                ? 'bg-emerald-600 border-emerald-600 hover:bg-emerald-505 text-white shadow shadow-emerald-500/10' 
                : 'bg-slate-900 border-transparent text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Зафиксировать коэффициенты сплита в системе</span>
          </button>
        </div>

      </div>

      {/* CURATOR LINKED ITEMS DRILLDOWN REPORT SHEET */}
      {activeDetailCurator && (
        <div className={`p-5 rounded-xl border font-mono space-y-4 animate-slideIn ${
          darkMode ? 'bg-[#11131A] border-indigo-500/25' : 'bg-white border-indigo-300'
        }`}>
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
            <h4 className="text-xs uppercase font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Briefcase className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>СВЯЗАННЫЙ ИНВЕНТАРЬ ПАРТНЕРА: <span className="text-indigo-400">
                {members.find(m => m.id === activeDetailCurator)?.name.toUpperCase()}
              </span></span>
            </h4>
            <button 
              onClick={() => setActiveDetailCurator(null)}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-white"
            >
              Закрыть реестр ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Orders bound to this curator */}
            <div className="space-y-3.5">
              <h5 className="text-[10px] text-[#A1A5B3] font-bold uppercase border-b border-slate-800 pb-1.5 tracking-wider">
                Закрепленные CRM Заказы ({curatorOrders.length})
              </h5>
              
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {curatorOrders.length > 0 ? (
                  curatorOrders.map(order => (
                    <div key={order.id} className="p-2.5 rounded bg-black/40 border border-slate-800/60 hover:border-slate-700 transition-colors flex justify-between items-center text-[11px]">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-indigo-400 font-mono font-bold leading-none">{order.id}</span>
                          <span className="text-slate-300 truncate max-w-[150px] leading-none">{order.productName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Клиент: {order.contact} | {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold block">{fmt(order.clientPrice - order.costPrice)} маржа</span>
                        <span className="text-[9.5px] text-slate-500 uppercase font-black">{order.orderStatus}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-[10px] py-3 text-center">Заказы куратора на этапе выкупа не зафиксированы.</p>
                )}
              </div>
            </div>

            {/* Financial ledger transactions bound to this curator */}
            <div className="space-y-3.5">
              <h5 className="text-[10px] text-[#A1A5B3] font-bold uppercase border-b border-slate-800 pb-1.5 tracking-wider">
                История выплат и начислений ({curatorFinance.length})
              </h5>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {curatorFinance.length > 0 ? (
                  curatorFinance.map(log => (
                    <div key={log.id} className="p-2.5 rounded bg-black/40 border border-slate-800/60 hover:border-slate-700 transition-colors flex justify-between items-center text-[11px]">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-indigo-400 font-bold font-mono">{log.id}</span>
                          <span className="text-slate-350">{log.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]" title={log.notes}>
                          {log.notes}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold block ${
                          log.type === FinanceType.EXPENSE || log.type === FinanceType.PAYOUT 
                            ? 'text-rose-450' 
                            : 'text-emerald-400'
                        }`}>
                          {log.type === FinanceType.EXPENSE || log.type === FinanceType.PAYOUT ? '-' : '+'}{fmt(log.amount)}
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-bold block uppercase">{log.type}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-[10px] py-3 text-center">Казначейские транзакции не обнаружены.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL AUDIT LOGGER SECTION OR REGISTER CHANGES */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5 text-slate-200 border-b border-slate-850 pb-2.5 justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Хроника аудита долей и P&L настроек системы</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Засечено изменений: {shareChangeHistory.length}</span>
        </div>

        <div className={`border rounded-xl overflow-hidden font-mono text-[11px] ${
          darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-300'
        }`}>
          <table className="w-full text-left border-collapse">
            <thead className={`text-[10.5px] uppercase border-b ${
              darkMode ? 'bg-[#141722] border-[#1D212A] text-slate-400' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th className="py-2.5 px-4 font-bold">Временной штамп</th>
                <th className="py-2.5 px-4 font-bold">Сущность</th>
                <th className="py-2.5 px-4 font-bold">Параметр изменений</th>
                <th className="py-2.5 px-4 font-bold">Класс проводки / Лог-запись</th>
                <th className="py-2.5 px-4 font-bold">Администратор</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-slate-350 ${darkMode ? 'divide-[#1D212A]' : 'divide-slate-200'}`}>
              {shareChangeHistory.length > 0 ? (
                shareChangeHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-[#151822] transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-indigo-400">{log.entityType}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-bold">{log.entityId}</td>
                    <td className="py-2.5 px-4 font-sans font-bold text-[#ECEFF4] text-[11.5px]">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans text-[10px]">{log.userId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-550 italic">
                    Записи изменений системных констант и долей партнеров не зафиксированы в текущем сеансе.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYOUT ACTION DIALOG MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl border p-5 font-mono shadow-2xl animate-scaleUp ${
            darkMode ? 'bg-[#11131A] border-[#2E364A] text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800 mb-4">
              <h4 className="text-xs uppercase font-extrabold flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                <span>Проводка Выплаты Куратору</span>
              </h4>
              <button 
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitPayout} className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">ФИО Партнера:</span>
                <p className="p-2.5 rounded bg-black/35 font-bold text-slate-250 border border-slate-800">
                  {members.find(m => m.id === payoutForm.memberId)?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Свободно к выводу:</span>
                  <p className="p-2 bg-[#0E1015] border border-slate-800 rounded font-bold text-emerald-400">
                    {fmt(calculatedBalances.members[payoutForm.memberId] || 0)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Код выплаты (Reason):</span>
                  <select
                    value={payoutForm.reasonCode}
                    onChange={(e) => setPayoutForm({ ...payoutForm, reasonCode: e.target.value })}
                    className="w-full p-2 rounded bg-black/45 border border-slate-800 focus:outline-none focus:border-slate-600 text-[11px] font-bold"
                  >
                    <option value="Плановый вывод прибыли">Плановый вывод прибыли</option>
                    <option value="Экстренный аванс">Экстренный аванс</option>
                    <option value="Компенсация расходов">Компенсация расходов</option>
                    <option value="Корректировка сальдо">Корректировка сальдо</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Служебное примечание (Notes):</label>
                <textarea
                  required
                  placeholder="Укажите реквизиты карты (например, СБП Тинькофф) и комментарии..."
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full p-2.5 h-16 rounded bg-black/35 border border-slate-800 text-xs focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A1A5B3] uppercase font-bold block mb-1">СВОБОДНАЯ СУММА К ВЫДАЧЕ (RUB) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0B0D12] border border-[#222735] font-extrabold text-white text-sm tracking-tight rounded duration-100 uppercase"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-555 font-bold">₽</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded"
                >
                  Провести выплату в Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-300 text-xs font-bold uppercase rounded"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
