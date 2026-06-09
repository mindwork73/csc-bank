/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Wallet, 
  PieChart, 
  Import, 
  Settings, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Search,
  Bell,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Globe,
  ChevronDown,
  Sparkles,
  Command,
  History,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  children: React.ReactNode;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  pendingAlertsCount: number;
  gbpExchangeRate?: number;
  currentRole: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly';
  onChangeRole: (role: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly') => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  children,
  globalSearch,
  setGlobalSearch,
  pendingAlertsCount,
  gbpExchangeRate,
  currentRole,
  onChangeRole
}: SidebarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('только что');
  
  // Dynamic sync age timer
  useEffect(() => {
    const intervals = ['только что', '1 мин назад', '3 мин назад', '5 мин назад', '10 мин назад'];
    let idx = 0;
    const intervalId = setInterval(() => {
      if (idx < intervals.length - 1) {
        idx++;
        setLastSyncTime(intervals[idx]);
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Global Ctrl+K trigger binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Grouped Navigation Items matching instructions
  const navigationGroups = [
    {
      title: 'Операции',
      items: [
        { id: 'dashboard', label: 'Консоль / Cockpit', icon: TrendingUp },
        { id: 'orders', label: 'Заказы / CRM', icon: ShoppingCart },
        { id: 'parcels', label: 'Логистика Англии', icon: Package },
      ]
    },
    {
      title: 'Финансы и Анализ',
      items: [
        { id: 'finance', label: 'Бухучет / Ledger', icon: Wallet },
        { id: 'analytics', label: 'Аналитика маржи', icon: PieChart },
      ]
    },
    {
      title: 'Контроль и Аудит',
      items: [
        { id: 'journal', label: 'Sync Журнал', icon: History },
        { id: 'audit', label: 'Аудит систем', icon: ClipboardList },
      ]
    },
    {
      title: 'Конфигурация',
      items: [
        { id: 'import', label: 'Импорт Списков', icon: Import },
        { id: 'settings', label: 'Настройки системы', icon: Settings },
      ]
    }
  ];

  const getActiveTabTitle = () => {
    for (const group of navigationGroups) {
      const match = group.items.find(item => item.id === currentTab);
      if (match) return match.label;
    }
    return 'Панель управления';
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#090A0E] text-[#D4D6E0]' 
        : 'bg-[#F4F6F9] text-[#1E2229]'
    }`}>
      {/* Container holding Sidebar and Main Area */}
      <div className="flex min-h-screen">
        
        {/* SIDEBAR NAVIGATION - COMPANION INSPIRED DESIGN */}
        <aside className={`w-64 border-r shrink-0 hidden md:flex flex-col sticky top-0 h-screen transition-colors duration-300 ${
          darkMode 
            ? 'bg-[#0E1015] border-[#1D212A]' 
            : 'bg-white border-[#E2E8F0]'
        }`}>
          
          {/* Logo / Brand Header */}
          <div className={`p-5 flex items-center justify-between border-b ${
            darkMode ? 'border-[#1D212A]' : 'border-[#EDF2F7]'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm shadow-sm tracking-wider">
                CSC
              </div>
              <div className="leading-tight">
                <span className={`block font-bold text-xs font-sans tracking-widest uppercase ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>CSC GROUP</span>
                <span className="text-[10px] font-mono text-emerald-500/80 font-bold tracking-tight">OPERATIONAL PLATFORM</span>
              </div>
            </div>
            
            {/* Quick status dot */}
            <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border border-emerald-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="block text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase pl-3 mb-2">
                  {group.title}
                </span>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const IconComp = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                          isActive
                            ? darkMode
                              ? 'bg-[#181C26] border-[#2E364A] text-white shadow-sm'
                              : 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                            : darkMode 
                              ? 'text-[#8E939E] border-transparent hover:bg-white/5 hover:text-white'
                              : 'text-[#4A5568] border-transparent hover:bg-[#EDF2F7] hover:text-[#1A202C]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComp className={`h-4 w-4 ${
                            isActive 
                              ? 'text-emerald-400' 
                              : darkMode ? 'text-[#585E6A]' : 'text-slate-500'
                          }`} />
                          <span>{item.label}</span>
                        </div>

                        {/* Sparkle or counts if active to look extra finished */}
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Embedded live indicators & Exchange rates */}
          <div className={`p-4 border-t font-mono text-[10px] space-y-2.5 ${
            darkMode ? 'border-[#1D212A] text-[#8E939E] bg-[#0A0B0E]/50' : 'border-[#EDF2F7] text-slate-500 bg-slate-50'
          }`}>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-[9px] uppercase">
                <Globe className="h-3 w-3 text-slate-500" /> Среда:
              </span>
              <span className={`text-[9px] font-bold font-mono px-1 py-0.5 rounded ${
                darkMode ? 'bg-slate-800/60 text-slate-350' : 'bg-slate-200 text-slate-700'
              }`}>CSC-PROD</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-[9px] uppercase">
                <Globe className="h-3 w-3 text-slate-500" /> Связь:
              </span>
              <span className={`font-bold uppercase ${darkMode ? 'text-zinc-200' : 'text-slate-850'}`}>UK Hub 🌐</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-[9px] uppercase">
                <Database className="h-3 w-3 text-slate-500" /> Синк:
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>100% (актив.)</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-[9px] text-[#5A6072]">
              <span>ОБНОВЛЕНО:</span>
              <span>{lastSyncTime}</span>
            </div>

            <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-700/20">
              <span>RATE GBP➔RUB:</span>
              <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[9px] ${
                darkMode ? 'bg-[#181C26] text-emerald-400 border border-[#2E364A]' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>{gbpExchangeRate ? gbpExchangeRate.toFixed(2) : '122.50'} ₽</span>
            </div>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HIGH-END TOP BAR HEADER */}
          <header className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-md transition-colors duration-300 ${
            darkMode 
              ? 'bg-[#0E1015]/90 border-[#1D212A]' 
              : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            
            {/* Global Search input & Premium hotkey indicator */}
            <div className="relative w-80 max-w-xs cursor-pointer" onClick={() => setShowPalette(true)}>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#585E6A]">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                readOnly
                placeholder="Поиск / терминал (Ctrl+K)..."
                value={globalSearch}
                className={`w-full cursor-pointer pl-9 pr-12 py-2 border rounded-lg text-xs font-medium font-mono tracking-tight focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                  darkMode 
                    ? 'bg-[#141722] border-[#222735] text-[#ECEFF4] placeholder-[#5A6072] focus:border-slate-500' 
                    : 'bg-[#F2F4F8] border-[#E2E8F0] text-slate-800 placeholder-slate-400 focus:border-slate-350'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                  darkMode ? 'bg-black/40 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <Command className="h-2.5 w-2.5" /> K
                </span>
              </div>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center space-x-3.5">
              
              {/* Active Tab Identifier Name badge (Looks extra custom!) */}
              <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono leading-none ${
                darkMode ? 'bg-[#141722]/60 border-[#222735] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                <span className="font-semibold">{getActiveTabTitle()}</span>
              </div>

              {/* Alert notification widget drawer */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg border relative transition-all duration-150 ${
                    darkMode 
                      ? 'bg-[#141722] border-[#222735] text-[#ECEFF4] hover:bg-[#1C2030]' 
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-[#F2F4F8]'
                  }`}
                  title="Уведомления систем"
                >
                  <Bell className="h-4 w-4 text-slate-400" />
                  {pendingAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-[9px] text-white font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse border border-[#0E1015]">
                      {pendingAlertsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 mt-2.5 w-80 rounded-xl border p-4 shadow-xl z-50 transition-all font-sans ${
                    darkMode ? 'bg-[#11131A] border-[#222735] text-[#ECEFF4]' : 'bg-white border-[#E2E8F0] text-slate-800'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-800/10">
                      <h3 className="font-bold text-xs uppercase tracking-wider flex items-center text-rose-500">
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Внимание (Alerts)
                      </h3>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-550 hover:text-slate-400">
                        <span className="text-xs font-mono">закрыть</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs font-medium">
                      {pendingAlertsCount === 0 ? (
                        <p className="text-[#8E939E] text-center py-2">Все системы в зеленой зоне. Заказы и посылки обрабатываются в штатном режиме.</p>
                      ) : (
                        <>
                          {pendingAlertsCount > 0 && (
                            <div className={`p-2.5 rounded-lg border ${
                              darkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'
                            }`}>
                              <p className="font-bold text-rose-500 text-[11px]">Проблемные позиции на радаре!</p>
                              <p className={`text-[10px] mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Один или более заказов помечены статусом «Проблемный» и требуют урегулирования с покупателем.
                              </p>
                            </div>
                          )}
                          <div className={`p-2.5 rounded-lg border ${
                            darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'
                          }`}>
                            <p className="font-bold text-amber-500 text-[11px]">Логистические позиции</p>
                            <p className={`text-[10px] mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Имеются сборные коробки Великобритании, ожидающие комплектации и отправки.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg border transition-all duration-150 ${
                  darkMode 
                    ? 'bg-[#141722] border-[#222735] text-amber-400 hover:bg-[#1C2030]' 
                    : 'bg-white border-[#E2E8F0] hover:bg-[#F2F4F8]'
                }`}
                title={darkMode ? 'Активировать светлую тему' : 'Активировать тёмную тему'}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-550" />}
              </button>

              {/* Mini User Profile Badge - Elevated details with interactive role-model */}
              <div className={`flex items-center space-x-2.5 pl-3 border-l ${
                darkMode ? 'border-[#1D212A]' : 'border-[#E2E8F0]'
              }`}>
                <div className="h-8 w-8 rounded-lg font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center uppercase shadow-sm">
                  {currentRole.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-[8.5px] font-mono font-semibold text-slate-500 block uppercase leading-none mb-0.5">Доступ в системе:</span>
                  <select
                    value={currentRole}
                    onChange={(e) => onChangeRole(e.target.value as any)}
                    className={`block w-full bg-transparent border-0 p-0 text-xs font-bold font-mono focus:ring-0 cursor-pointer focus:outline-none ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    <option className="bg-[#0E1015] text-white" value="root">⚙️ ROOT SYSTEM</option>
                    <option className="bg-[#0E1015] text-white" value="admin">💼 ADMIN PORTAL</option>
                    <option className="bg-[#0E1015] text-white" value="finance">📊 FINANCE LEDGER</option>
                    <option className="bg-[#0E1015] text-white" value="operations">🚚 OPERATIONS CRM</option>
                    <option className="bg-[#0E1015] text-white" value="logistics">🇬🇧 UK WAREHOUSE</option>
                    <option className="bg-[#0E1015] text-white" value="readonly">👁️ READONLY AUDIT</option>
                  </select>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* COMMAND PALETTE DIALOG */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm transition-all">
          <div className={`w-full max-w-xl rounded-xl border shadow-2xl p-4 overflow-hidden font-sans ${
            darkMode ? 'bg-[#11131A] border-[#2E364A] text-white' : 'bg-white border-[#E2E8F0] text-slate-800'
          }`}>
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/20">
              <Command className="h-5 w-5 text-emerald-400 animate-pulse" />
              <input
                type="text"
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Что искать? (заказ, транзакцию, вкладку, сменить роль...)"
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs font-mono placeholder-slate-500"
              />
              <button 
                onClick={() => { setShowPalette(false); setPaletteQuery(''); }}
                className="text-[9px] uppercase font-mono px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 font-bold"
              >
                закрыть [esc]
              </button>
            </div>

            {/* List options based on paletteQuery */}
            <div className="max-h-80 overflow-y-auto mt-3 space-y-4">
              {/* Commands */}
              <div>
                <span className="block text-[9px] font-mono tracking-widest text-[#5A6072] uppercase font-bold mb-1.5">
                  БЫСТРЫЕ ПЕРЕХОДЫ И РАЗДЕЛЫ ПОДДЕРЖКИ
                </span>
                <div className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Консоль / Cockpit - Сводные показатели группы', kw: 'консоль cockpit метрики dashboard', icon: TrendingUp },
                    { id: 'orders', label: 'Заказы / CRM - Реестр и фильтры заказов', kw: 'заказы crm реестр ордера клиенты', icon: ShoppingCart },
                    { id: 'parcels', label: 'Логистика Англии - Сводные боксы и брокер', kw: 'логистика англии посылки коробки лондон borker', icon: Package },
                    { id: 'finance', label: 'Бухучет / Ledger - Логи транзакций и общак', kw: 'бухучет ledger финансы касса общак', icon: Wallet },
                    { id: 'analytics', label: 'Аналитика маржи - Анализ маржинальности P&L', kw: 'аналитика маржи маржинальность pnl', icon: PieChart },
                    { id: 'journal', label: 'Sync Журнал - Логи импорта из Google Sheets', kw: 'sync журнал импорт листы сессии сеансы', icon: History },
                    { id: 'audit', label: 'Аудит систем - Логирование действий операторов', kw: 'аудит систем безопасность логи audit', icon: ClipboardList },
                    { id: 'import', label: 'Импорт Списков - Ручная загрузка и парсинг', kw: 'импорт списков google таблицы csv xlsx', icon: Import },
                    { id: 'settings', label: 'Настройки системы - Курс валют и кураторы', kw: 'настройки системы курс exchange rate', icon: Settings },
                  ]
                    .filter(cmd => !paletteQuery || cmd.label.toLowerCase().includes(paletteQuery.toLowerCase()) || cmd.kw.toLowerCase().includes(paletteQuery.toLowerCase()))
                    .map(cmd => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            setCurrentTab(cmd.id);
                            setShowPalette(false);
                            setPaletteQuery('');
                          }}
                          className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
                            darkMode ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <Icon className="h-4 w-4 text-slate-500" />
                            <span>{cmd.label}</span>
                          </div>
                          <span className="text-[9px] font-mono text-[#5A6072] uppercase font-semibold">перейти</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Roles switcher */}
              <div>
                <span className="block text-[9px] font-mono tracking-widest text-[#5A6072] uppercase font-bold mb-1.5">
                  УСТАНОВИТЬ РЕЖИМ ДОСТУПА В СИСТЕМЕ
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'root', label: '⚙️ ROOT SYSTEM', kw: 'root рут суперадмин' },
                    { id: 'admin', label: '💼 ADMIN PORTAL', kw: 'admin админ администратор' },
                    { id: 'finance', label: '📊 FINANCE LEDGER', kw: 'finance бухгалтер кассир финансы' },
                    { id: 'operations', label: '🚚 OPERATIONS CRM', kw: 'operations куратор менеджер продажи' },
                    { id: 'logistics', label: '🇬🇧 UK WAREHOUSE', kw: 'logistics склад англия упаковка box' },
                    { id: 'readonly', label: '👁️ READONLY AUDIT', kw: 'readonly просмотр аудит только чтение' },
                  ]
                    .filter(r => !paletteQuery || r.label.toLowerCase().includes(paletteQuery.toLowerCase()) || r.kw.toLowerCase().includes(paletteQuery.toLowerCase()))
                    .map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onChangeRole(r.id as any);
                          setShowPalette(false);
                          setPaletteQuery('');
                        }}
                        className={`text-left p-2 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                          currentRole === r.id
                            ? darkMode ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : darkMode ? 'bg-slate-900/65 border-[#222735] text-slate-400 hover:border-slate-700 hover:text-white' : 'bg-slate-55 shadow-sm border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Theme toggle command */}
              {(!paletteQuery || 'тема'.includes(paletteQuery.toLowerCase()) || 'theme'.includes(paletteQuery.toLowerCase()) || 'светлая'.includes(paletteQuery.toLowerCase()) || 'темная'.includes(paletteQuery.toLowerCase())) && (
                <div>
                  <span className="block text-[9px] font-mono tracking-widest text-[#5A6072] uppercase font-bold mb-1.5">
                    БЛЕНДИНГ ИНТЕРФЕЙСА
                  </span>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      setShowPalette(false);
                      setPaletteQuery('');
                    }}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
                      darkMode ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
                      <span>Переключить тему ({darkMode ? 'на Светлую' : 'на Тёмную'})</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#5A6072] uppercase">сменить</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-700/20 pt-2 px-1 mt-3 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>Для быстрого вызова используйте Ctrl+K или клик по поиску</span>
              <span>CSC Terminal v1.6</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
