/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TeamMember, 
  AppSettings, 
  AuditLog 
} from '../types';
import { 
  Settings, 
  Users, 
  Coins, 
  History, 
  Save,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  members: TeamMember[];
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  auditLogs: AuditLog[];
  darkMode?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function SettingsView({
  settings,
  members,
  onUpdateSettings,
  onUpdateMembers,
  auditLogs,
  darkMode = true,
  onShowToast
}: SettingsViewProps) {
  const [exchangeRate, setExchangeRate] = useState(settings.gbpExchangeRate);
  const [regularGbp, setRegularGbp] = useState(settings.defaultFeeRegularGbp);
  const [liquidGbp, setLiquidGbp] = useState(settings.defaultFeeLiquidGbp);

  // Members mutable state
  const [partnerShares, setPartnerShares] = useState(
    members.map(m => ({ id: m.id, name: m.name, share: m.sharePercent, active: m.active }))
  );

  // Sync state if members prop changes (e.g. after a storage restore or migration)
  React.useEffect(() => {
    setPartnerShares(members.map(m => ({ id: m.id, name: m.name, share: m.sharePercent, active: m.active })));
  }, [members]);

  const handleSaveForex = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      gbpExchangeRate: Number(exchangeRate) || 122.5,
      defaultFeeRegularGbp: Number(regularGbp) || 5,
      defaultFeeLiquidGbp: Number(liquidGbp) || 10
    });
    if (onShowToast) {
      onShowToast('Системные курсы успешно зафиксированы.', 'success');
    } else {
      alert('Системные курсы успешно зафиксированы.');
    }
  };

  const handleUpdateShare = (id: string, field: 'share' | 'active', value: any) => {
    setPartnerShares(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSaveTeam = () => {
    // Validate total sum is 100%
    const total = partnerShares.reduce((s, p) => s + (p.active ? Number(p.share) : 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      if (onShowToast) {
        onShowToast(`Внимание: Сумма долей активных участников составляет ${total}%, а не 100%. Это может нарушить автоматический split расходов.`, 'warning');
      } else {
        if (!confirm(`Внимание: Сумма долей активных участников составляет ${total}%, а не 100%. Это может нарушить автоматический split расходов. Сохранить все равно?`)) {
          return;
        }
      }
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
    if (onShowToast) {
      onShowToast('Доли команды зафиксированы в P&L реестре.', 'success');
    } else {
      alert('Доли команды зафиксированы в P&L реестре.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER ROW */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Реестр настроек аккаунта / System configuration</span>
        </h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Конфигурация логистических тарифов по пошлинам, глобальные курсы фунта и доли соучастников команды.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* CURRENCY & FOREX SETTING */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5 text-indigo-400 border-b border-slate-900 pb-2">
            <Coins className="h-5 w-5" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Курсы & Ликвидностные коэффициенты</h3>
          </div>

          <form onSubmit={handleSaveForex} className="space-y-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Базовый расчетный курс GBP/RUB *</label>
              <input
                type="number"
                value={exchangeRate}
                step="0.01"
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className={`w-full p-2.5 rounded font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-550 ${
                  darkMode ? 'bg-[#0B0D12] border-[#222735] text-[#ECEFF4]' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <span className="text-[10px] text-slate-500 leading-none">Используется автоматикой CSC для перевода GBP в рублевые балансы.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Тариф regular (£)</label>
                <input
                  type="number"
                  value={regularGbp}
                  onChange={(e) => setRegularGbp(Number(e.target.value) || 5)}
                  className={`w-full p-2.5 rounded font-mono border focus:outline-none ${
                    darkMode ? 'bg-[#0B0D12] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">Тариф liquid (£)</label>
                <input
                  type="number"
                  value={liquidGbp}
                  onChange={(e) => setLiquidGbp(Number(e.target.value) || 10)}
                  className={`w-full p-2.5 rounded font-mono border focus:outline-none ${
                    darkMode ? 'bg-[#0B0D12] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1C1F2E] border border-[#2E364A] text-slate-250 hover:bg-[#252B42] hover:text-white font-mono font-bold transition-all text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Зафиксировать системные курсы</span>
            </button>
          </form>
        </div>

        {/* TEAM & SHARES CONFIG */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5 text-emerald-400 border-b border-slate-900 pb-2">
            <Users className="h-5 w-5" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Состав команды CSC & Доли P&L</h3>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-3">
              {partnerShares.map((p) => (
                <div key={p.id} className={`p-3 p.5 rounded-lg border flex items-center justify-between gap-4 transition-colors ${
                  darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      id={`active-${p.id}`}
                      checked={p.active}
                      onChange={(e) => handleUpdateShare(p.id, 'active', e.target.checked)}
                      className="rounded text-indigo-650 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                    />
                    <label htmlFor={`active-${p.id}`} className="font-bold text-[#ECEFF4] cursor-pointer select-none font-mono">
                      {p.name}
                    </label>
                  </div>

                  <div className="flex items-center space-x-1 font-mono text-xs">
                    <span className="text-slate-500 mr-2 uppercase text-[9px] font-bold">Доля прибыли:</span>
                    <input
                      type="number"
                      value={p.share}
                      disabled={!p.active}
                      onChange={(e) => handleUpdateShare(p.id, 'share', Number(e.target.value))}
                      className={`w-14 p-1 rounded border text-center font-bold focus:outline-none ${
                        darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-white'
                      }`}
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveTeam}
              className="w-full bg-[#1C1F2E] border border-[#2E364A] text-slate-250 hover:bg-[#252B42] hover:text-white font-mono font-bold transition-all text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Зафиксировать состав и доли</span>
            </button>
          </div>
        </div>

      </div>

      {/* CHRONOLOGICAL AUDIT LOGGER SECTION */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5 text-slate-200 border-b border-slate-900 pb-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[#A1A5B3]">Журнал ревизии действий администраторов (Audit logs)</h3>
        </div>

        <div className={`border rounded-xl overflow-hidden font-mono text-[11px] ${
          darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-300'
        }`}>
          <table className="w-full text-left border-collapse">
            <thead className={`text-[10px] uppercase border-b ${
              darkMode ? 'bg-[#141722] border-[#1D212A] text-slate-400' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th className="py-2.5 px-4 font-bold">Временной штамп</th>
                <th className="py-2.5 px-4 font-bold">Класс сущности</th>
                <th className="py-2.5 px-4 font-bold">Индекс сущности</th>
                <th className="py-2.5 px-4 font-bold">Совершенное действие</th>
                <th className="py-2.5 px-4 font-bold">Администратор</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-slate-350 ${darkMode ? 'divide-[#1D212A]' : 'divide-slate-200'}`}>
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#151822] transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-[#8E939E]">{log.entityType}</td>
                  <td className="py-2.5 px-4 text-slate-300">{log.entityId}</td>
                  <td className="py-2.5 px-4 font-sans font-bold text-[#ECEFF4]">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans text-[10px]">{log.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
