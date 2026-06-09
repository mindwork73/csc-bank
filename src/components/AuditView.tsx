/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog } from '../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  User, 
  Tag, 
  Calendar, 
  X, 
  LayoutGrid, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  Info 
} from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
  darkMode: boolean;
  onClearLogs?: () => void;
}

export default function AuditView({
  logs,
  darkMode,
  onClearLogs
}: AuditViewProps) {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Group unique actors for filtering
  const uniqueActors = Array.from(new Set(logs.map(l => l.userId || 'Система')));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                          log.entityId.toLowerCase().includes(search.toLowerCase()) ||
                          log.id.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    const matchesActor = actorFilter === 'ALL' || log.userId === actorFilter;
    return matchesSearch && matchesEntity && matchesActor;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/20 pb-4">
        <div>
          <h2 className={`text-xl font-bold font-mono uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Security & Operations Audit Trail / Инспекция Безопасности
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Автоматическая телеметрия действий пользователей, изменений сущностей CRM, балансовых списаний и поставок Англии.
          </p>
        </div>
        
        {onClearLogs && (
          <button 
            onClick={onClearLogs}
            className="text-[10px] uppercase font-bold font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded border border-rose-500/20 transition-all self-start md:self-auto"
          >
            Очистить трек
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-4 justify-between ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск лога по действию, ID записи или логу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg border focus:outline-none transition-all ${
              darkMode 
                ? 'bg-[#0B0D12] border-[#222735] text-slate-200 focus:border-slate-600' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350'
            }`}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Сущность:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Все типы</option>
              <option value="Order">Заказы (Order)</option>
              <option value="Parcel">Логистика (Parcel)</option>
              <option value="Finance">Финансы (Finance)</option>
              <option value="TeamMember">Пользователи</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Исполнитель:</span>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Все кураторы</option>
              {uniqueActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CORE LOGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LOG LISTING */}
        <div className={`lg:col-span-8 p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs uppercase font-mono font-bold text-slate-400">
              Поток телеметрии (Live Operations Audit Stream)
            </h3>
            <span className="text-[9px] font-mono text-emerald-400 font-bold bg-[#0B0D12] px-2 py-0.5 rounded border border-emerald-500/10">
              {filteredLogs.length} строк отфильтровано
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleString('ru-RU');
              const roleDisplay = log.userId === 'Система' ? 'SYS' : 'USR';
              
              const isSelected = selectedLog?.id === log.id;
              
              return (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer font-mono text-[11px] flex items-start justify-between ${
                    isSelected 
                      ? 'bg-indigo-500/5 border-indigo-500/40 text-white shadow-sm' 
                      : darkMode 
                        ? 'bg-[#0B0D12]/60 hover:bg-slate-900/40 border-transparent' 
                        : 'bg-slate-50 hover:bg-slate-100/60 border-slate-200/50 text-slate-800'
                  }`}
                >
                  <div className="space-y-1 truncate pr-3 w-[85%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-[#585E6A] font-bold">
                        {dateStr} &bull; ID: {log.id}
                      </span>
                      <span className={`px-1 rounded text-[8px] font-bold ${
                        log.entityType === 'Order' ? 'bg-indigo-500/10 text-indigo-400' :
                        log.entityType === 'Finance' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-pink-500/10 text-pink-400'
                      }`}>
                        {log.entityType.toUpperCase()} ({log.entityId})
                      </span>
                      <span className="text-slate-500 text-[9px] font-semibold">// {log.userId}</span>
                    </div>
                    <p className="font-bold text-slate-200 mt-0.5 truncate leading-snug">
                      {log.action}
                    </p>
                  </div>

                  <span className={`shrink-0 font-bold text-[8.5px] px-1.5 py-0.5 rounded border ${
                    roleDisplay === 'SYS' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-[#1C1F2E] text-indigo-400 border-[#2E364A]'
                  }`}>
                    {roleDisplay}
                  </span>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                Записи аудита по заданным параметрам не найдены.
              </div>
            )}
          </div>
        </div>

        {/* LOG METRICS & DETAIL DRAWERS RIGHT */}
        <div className="lg:col-span-4 space-y-4">
          {selectedLog ? (
            <div className={`p-5 rounded-xl border space-y-4 font-mono ${
              darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs uppercase font-bold text-white">Анализ События</h4>
                  <p className="text-[10px] text-indigo-400 mt-0.5 font-bold">Транзакция {selectedLog.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Действие и комментарий</span>
                  <p className="font-bold text-slate-200 mt-1 leading-relaxed bg-[#0B0D12] p-2.5 rounded border border-slate-800">
                    {selectedLog.action}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Дата и Время</span>
                    <p className="font-semibold text-slate-300 mt-0.5 text-[11px]">
                      {new Date(selectedLog.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Инициатор</span>
                    <p className="font-semibold text-indigo-400 mt-0.5 text-[11px]">
                      {selectedLog.userId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Тип Сущности</span>
                    <p className="font-semibold text-pink-400 mt-0.5 text-[11px]">
                      {selectedLog.entityType}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Идентификатор ID</span>
                    <p className="font-semibold text-slate-350 mt-0.5 text-[11px]">
                      {selectedLog.entityId}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/45 pt-3.5 space-y-2">
                  <span className="text-[9px] text-[#5A6072] block uppercase font-bold">Состояние изменений (Before / After Transition)</span>
                  
                  <div className="p-2 bg-[#0B0D12] rounded border border-slate-850 space-y-2.5">
                    <div>
                      <span className="text-[8.5px] text-rose-450 text-rose-400 uppercase font-bold block mb-0.5">- Before</span>
                      <pre className="text-[9.5px] text-slate-400 leading-snug break-all whitespace-pre-wrap">
                        {selectedLog.before ? selectedLog.before : 'N/A (Свежая инициализация сущности)'}
                      </pre>
                    </div>
                    <div className="border-t border-slate-850 pt-2">
                      <span className="text-[8.5px] text-emerald-400 uppercase font-bold block mb-0.5">+ After</span>
                      <pre className="text-[9.5px] text-slate-300 leading-snug break-all whitespace-pre-wrap">
                        {selectedLog.after ? selectedLog.after : 'N/A (Сущность закреплена)'}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/40 pt-3 flex gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5 text-indigo-400" /> Ссылка безопасности: OK
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-xl border border-dashed text-center font-mono text-xs text-slate-500 ${
              darkMode ? 'border-slate-800 bg-slate-900/5' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <ClipboardList className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="font-bold text-white text-[11px] mb-1">Фокус лога безопасности</p>
              Выберите строку из лога операционного аудита слева, чтобы детально рассмотреть состояние полей «До» и «После» операции в инспекторе.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
