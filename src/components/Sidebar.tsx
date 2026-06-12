/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Wallet, 
  Import, 
  Sun, 
  Moon, 
  Search,
  Plus,
  RefreshCw
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
  currentRole?: string;
  onChangeRole?: (role: any) => void;
  onNewOrderClick?: () => void;
  onNewExpenseClick?: () => void;
  onSyncClick?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  children,
  globalSearch,
  setGlobalSearch,
  gbpExchangeRate = 122.50,
  onNewOrderClick,
  onNewExpenseClick,
  onSyncClick
}: SidebarProps) {
  
  const navigationItems = [
    { id: 'orders', label: 'Заказы', icon: ShoppingCart },
    { id: 'finance', label: 'Бухучет', icon: Wallet },
    { id: 'parcels', label: 'Посылки', icon: Package },
    { id: 'import', label: 'Импорт данных', icon: Import },
  ];

  const getActiveTabTitle = () => {
    const match = navigationItems.find(item => item.id === currentTab);
    return match ? match.label : 'Портал CSC';
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${
      darkMode 
        ? 'bg-[#090A0E] text-[#D4D6E0]' 
        : 'bg-[#F4F6F9] text-[#1E2229]'
    }`}>
      <div className="flex min-h-screen">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`w-60 border-r shrink-0 hidden md:flex flex-col sticky top-0 h-screen transition-colors duration-200 ${
          darkMode 
            ? 'bg-[#0E1015] border-[#1D212A]' 
            : 'bg-white border-[#E2E8F0]'
        }`}>
          
          {/* CSC Portal Header */}
          <div className={`p-5 flex items-center justify-between border-b ${
            darkMode ? 'border-[#1D212A]' : 'border-[#EDF2F7]'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                CSC
              </div>
              <div>
                <span className={`block font-bold text-[13px] tracking-wide uppercase ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>CSC Portal</span>
                <span className="text-[10px] text-slate-500 font-medium">внутренний портал</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <span className="block text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase pl-3 mb-2">
              НАВИГАЦИЯ
            </span>
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                    isActive
                      ? darkMode
                        ? 'bg-[#181C26] border-[#2E364A] text-white'
                        : 'bg-emerald-600 border-emerald-600 text-white'
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
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Custom Actions */}
          <div className="mx-3 mb-3 space-y-2 pt-3 border-t border-dashed border-[#1D212A]">
            <button 
              onClick={onNewOrderClick}
              className="w-full flex items-center space-x-2 px-2.5 py-2.5 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/10 active:scale-95 transition-all text-left"
            >
              <Plus className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Создать заказ</span>
            </button>
            <button 
              onClick={onNewExpenseClick}
              className="w-full flex items-center space-x-2 px-2.5 py-2.5 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/10 active:scale-95 transition-all text-left"
            >
              <Plus className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>Новый расход</span>
            </button>
            <button 
              onClick={onSyncClick}
              className="w-full flex items-center space-x-2 px-2.5 py-2.5 bg-amber-950/15 hover:bg-amber-900/20 text-amber-400 rounded-lg text-xs font-semibold border border-amber-500/10 active:scale-95 transition-all text-left"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>Синхро таблиц</span>
            </button>
          </div>

          {/* Rate status footer */}
          <div className={`p-4 border-t font-mono text-[10px] space-y-1.5 ${
            darkMode ? 'border-[#1D212A] text-[#8E939E] bg-[#0A0B0E]/30' : 'border-[#EDF2F7] text-slate-500 bg-slate-50'
          }`}>
            <div className="flex justify-between items-center text-[10px]">
              <span>Курс GBP/RUB:</span>
              <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                darkMode ? 'bg-[#181C26] text-emerald-400' : 'bg-emerald-50 text-emerald-700'
              }`}>{gbpExchangeRate.toFixed(2)} ₽</span>
            </div>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOP HEADER */}
          <header className={`h-14 border-b flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-md transition-colors duration-200 ${
            darkMode 
              ? 'bg-[#0E1015]/95 border-[#1D212A]' 
              : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            
            {/* Search Input */}
            <div className="relative w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-520 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Быстрый поиск заказа..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                  darkMode 
                    ? 'bg-[#141722] border-[#222735] text-[#ECEFF4] placeholder-[#5A6072]' 
                    : 'bg-[#F2F4F8] border-[#E2E8F0] text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Active page design description & theme toggle */}
            <div className="flex items-center space-x-3">
              <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[11px] font-mono leading-none ${
                darkMode ? 'bg-[#141722]/60 border-[#222735] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                <span className="font-semibold">{getActiveTabTitle()}</span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg border transition-all duration-200 focus:outline-none ${
                  darkMode 
                    ? 'bg-[#141722] border-[#222735] text-amber-400 hover:bg-[#1C2030]' 
                    : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-[#F2F4F8]'
                }`}
                title={darkMode ? 'Активировать светлую тему' : 'Активировать тёмную тему'}
              >
                {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
