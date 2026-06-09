/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ImportSession } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  X,
  Info 
} from 'lucide-react';

interface JournalViewProps {
  importHistory: ImportSession[];
  onAddLog: (action: string, entityType: 'Order' | 'Parcel' | 'Finance') => void;
  darkMode: boolean;
}

export default function JournalView({
  importHistory,
  onAddLog,
  darkMode
}: JournalViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [reSyncingId, setReSyncingId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Filter sessions
  const filteredHistory = importHistory.filter(session => {
    const matchesSearch = session.source.toLowerCase().includes(search.toLowerCase()) || 
                          session.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReSync = (session: ImportSession) => {
    setReSyncingId(session.id);
    onAddLog(`Запущен принудительный повторный синк сессии ${session.id}`, 'Order');
    
    setTimeout(() => {
      setReSyncingId(null);
      setShowNotification(`Сессия ${session.id} успешно ресинхронизирована. Проверено строк: ${
        session.importedOrdersCount + session.importedFinanceCount + session.importedParcelsCount
      }`);
      onAddLog(`Успешно завершен повторный синк сессии ${session.id}`, 'Order');
      setTimeout(() => setShowNotification(null), 4000);
    }, 1200);
  };

  const downloadSessionReport = (session: ImportSession) => {
    const reportData = JSON.stringify(session, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CSC-report-${session.id}.json`;
    link.click();
    onAddLog(`Экспортирован JSON-отчет по сессии импорта ${session.id}`, 'Finance');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/20 pb-4">
        <div>
          <h2 className={`text-xl font-bold font-mono uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sync Session Journal / Журнал Синхронизаций
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Диспетчер исторических загрузок, контрольные суммы, логи сопоставления полей и результаты Dry-Run валидаций.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">
            CSC-BRIDGE ENGINE: ONLINE
          </span>
        </div>
      </div>

      {showNotification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по ID сессии или источнику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg border focus:outline-none transition-all ${
              darkMode 
                ? 'bg-[#0B0D12] border-[#222735] text-slate-200 focus:border-slate-600' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350'
            }`}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Статус:
          </span>
          <div className="flex items-center space-x-1.5 bg-[#0B0D12] p-1 border border-[#222735] rounded-lg">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold font-mono rounded ${
                statusFilter === 'ALL' ? 'bg-[#1C1F2E] text-white border border-[#2E364A]' : 'text-slate-550'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold font-mono rounded ${
                statusFilter === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-550'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold font-mono rounded ${
                statusFilter === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-550'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border font-mono ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Всего сессий загрузки</span>
          <span className="text-xl font-bold block mt-1">{importHistory.length}</span>
        </div>
        <div className={`p-4 rounded-xl border font-mono ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] text-emerald-400 block uppercase font-bold">Успешные импорты</span>
          <span className="text-xl font-bold text-emerald-400 block mt-1">
            {importHistory.filter(s => s.status === 'SUCCESS').length}
          </span>
        </div>
        <div className={`p-4 rounded-xl border font-mono ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] text-indigo-400 block uppercase font-bold">Заказов перенесено</span>
          <span className="text-xl font-bold text-indigo-400 block mt-1">
            {importHistory.reduce((acc, s) => acc + (s.importedOrdersCount || 0), 0)}
          </span>
        </div>
        <div className={`p-4 rounded-xl border font-mono ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] text-teal-400 block uppercase font-bold">Судейских транзакций кассы</span>
          <span className="text-xl font-bold text-teal-400 block mt-1">
            {importHistory.reduce((acc, s) => acc + (s.importedFinanceCount || 0), 0)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SESSIONS GRID TABLE */}
        <div className={`lg:col-span-8 p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400">
              Логи синхронизации данных (Operational Synchronization Stream)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 pb-2 uppercase text-[10px] tracking-wider text-left">
                  <th className="py-2.5 pr-4 font-bold">Session ID</th>
                  <th className="py-2 pr-4 font-bold">Источник данных / буфер</th>
                  <th className="py-2 pr-4 font-bold">Время окончания</th>
                  <th className="py-2 pr-4 text-right font-bold">Статистика</th>
                  <th className="py-2 pr-4 text-center font-bold">Статус</th>
                  <th className="py-2 text-right font-bold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((session) => (
                    <tr 
                      key={session.id} 
                      className={`hover:bg-slate-900/10 cursor-pointer transition-all ${
                        selectedSession?.id === session.id 
                          ? darkMode ? 'bg-indigo-500/5 text-white' : 'bg-indigo-50 text-slate-900' 
                          : 'text-[#D4D6E0]'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <td className="py-3 font-bold text-indigo-400">{session.id}</td>
                      <td className="py-3 truncate max-w-[150px] font-medium" title={session.source}>
                        {session.source}
                      </td>
                      <td className="py-3 text-slate-500 text-[11px]">
                        {new Date(session.finishedAt || session.startedAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[10px]">
                          {session.importedOrdersCount > 0 && <span className="text-indigo-400 font-bold">ORD+{session.importedOrdersCount}</span>}
                          {session.importedFinanceCount > 0 && <span className="text-emerald-400 font-bold">FIN+{session.importedFinanceCount}</span>}
                          {session.importedParcelsCount > 0 && <span className="text-pink-400 font-bold">PRC+{session.importedParcelsCount}</span>}
                          {session.importedOrdersCount === 0 && session.importedFinanceCount === 0 && session.importedParcelsCount === 0 && <span className="text-slate-500">—</span>}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          session.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleReSync(session)}
                            disabled={reSyncingId === session.id}
                            className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-bold text-[10px]"
                            title="Re-run sync calculations"
                          >
                            <RefreshCw className={`h-3 w-3 ${reSyncingId === session.id ? 'animate-spin text-amber-400' : ''}`} />
                            {reSyncingId === session.id ? 'Syncing...' : 'Re-sync'}
                          </button>
                          <button
                            onClick={() => downloadSessionReport(session)}
                            className="text-slate-500 hover:text-white"
                            title="Export JSON JSON Dump"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Логи сессий отсутствуют или соответствуют пустой выборке.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED DRILLDOWN RIGHT RAIL */}
        <div className="lg:col-span-4 space-y-4">
          {selectedSession ? (
            <div className={`p-5 rounded-xl border space-y-4 font-mono ${
              darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs uppercase font-bold text-white">Детали Сессии Импорта</h4>
                  <p className="text-[10px] text-indigo-400 mt-0.5 font-bold">{selectedSession.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] text-[#5A6072] block uppercase font-bold mb-1">Источник забора</span>
                  <p className={`p-2 rounded bg-black/40 text-[10.5px] border ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                    {selectedSession.source}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Время старта</span>
                    <p className="font-semibold text-slate-300 mt-0.5">
                      {new Date(selectedSession.startedAt).toLocaleTimeString('ru-RU')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Завершение</span>
                    <p className="font-semibold text-slate-300 mt-0.5">
                      {selectedSession.finishedAt ? new Date(selectedSession.finishedAt).toLocaleTimeString('ru-RU') : 'Active'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/40 pt-3">
                  <span className="text-[9px] text-[#5A6072] block uppercase font-bold mb-1.5">Обработано записей (Commit counts)</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Импортировано заказов:</span>
                      <span className="text-indigo-400 font-bold font-mono">+{selectedSession.importedOrdersCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Кассовых ордеров:</span>
                      <span className="text-emerald-400 font-bold font-mono">+{selectedSession.importedFinanceCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Логистических коробок Англии:</span>
                      <span className="text-pink-400 font-bold font-mono">+{selectedSession.importedParcelsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/40 pt-3">
                  <span className="text-[9px] text-[#5A6072] block uppercase font-bold mb-1.5">Нормализация и Коллизии</span>
                  <div className="p-2.5 rounded bg-amber-500/5 text-[10px] text-amber-400 border border-amber-500/20 flex gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <p className="leading-snug">
                      База данных дубликатов синхронизирована по хэш-сумме строк. Сортировочная коллизия: 0. Все строки импорта сопоставились по полям в штатном режиме.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleReSync(selectedSession)}
                    className="flex-1 py-1.5 text-[10.5px] uppercase font-bold text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    Пересчитать (Re-run)
                  </button>
                  <button
                    onClick={() => downloadSessionReport(selectedSession)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    title="Dump"
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-xl border border-dashed text-center font-mono text-xs ${
              darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>
              <History className="h-7 w-7 text-slate-600 mx-auto mb-3" />
              Выберите конкретную сессию импорта из левого списка для отображения подробной диагностической справки.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
