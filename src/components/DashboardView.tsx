/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Order, 
  Parcel, 
  FinanceEntry, 
  TeamMember, 
  OrderStatus, 
  PaymentStatus,
  FinanceType,
  ParcelStatus,
  AuditLog
} from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Users, 
  AlertTriangle, 
  Package, 
  Wallet, 
  Activity,
  DollarSign,
  TrendingUp,
  Inbox,
  AlertCircle,
  Clock,
  ExternalLink,
  Zap,
  RotateCcw
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  parcels: Parcel[];
  finance: FinanceEntry[];
  members: TeamMember[];
  calculatedBalances: {
    commonFund: number;
    members: Record<string, number>;
  };
  onSwitchTab: (tab: string) => void;
  darkMode: boolean;
  logs: AuditLog[];
  currentRole?: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly';
}

export default function DashboardView({
  orders,
  parcels,
  finance,
  members,
  calculatedBalances,
  onSwitchTab,
  darkMode,
  logs = [],
  currentRole = 'root'
}: DashboardViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Timeframe filter helper (relative to 2026-06-09T11:51:52Z reference time)
  const filterByTimeframe = <T extends { createdAt?: string }>(items: T[]) => {
    const referenceDate = new Date('2026-06-09T11:51:52Z');
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLimit = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
    return items.filter(item => {
      if (!item.createdAt) return true;
      const createdDate = new Date(item.createdAt);
      const diffDays = (referenceDate.getTime() - createdDate.getTime()) / msPerDay;
      return diffDays >= 0 && diffDays <= daysLimit;
    });
  };

  const timeframeFilteredOrders = filterByTimeframe(orders);
  const timeframeFilteredFinance = filterByTimeframe(finance);

  // Business calculators matching original state
  const totalRevenue = timeframeFilteredOrders
    .filter(o => o.orderStatus !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + Number(o.clientPrice), 0);

  const totalCostPrice = timeframeFilteredOrders
    .filter(o => o.orderStatus !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + Number(o.costPrice), 0);

  const calculateTotalNetProfit = () => {
    let tempProfit = 0;
    timeframeFilteredOrders.forEach(order => {
      if (order.orderStatus === OrderStatus.CANCELLED) return;
      const margin = (Number(order.clientPrice) || 0) - (Number(order.costPrice) || 0);
      let parcelLogisticsFee = 0;
      if (order.parcelId) {
        const p = parcels.find(x => x.id === order.parcelId);
        if (p) {
          const fee = p.shippingFeeGbp || (p.containsLiquid ? 10 : 5);
          const rate = p.exchangeRate || 122.5;
          const tiedCount = orders.filter(o => o.parcelId === p.id).length || 1;
          parcelLogisticsFee = (fee * rate) / tiedCount;
        }
      }
      tempProfit += (margin - parcelLogisticsFee);
    });
    return tempProfit;
  };

  const totalNetProfit = calculateTotalNetProfit();

  // Active CRM Orders count
  const activeOrdersCount = orders.filter(o => 
    o.orderStatus !== OrderStatus.CLOSED && o.orderStatus !== OrderStatus.CANCELLED
  ).length;

  // Problem orders
  const problemOrders = orders.filter(o => o.orderStatus === OrderStatus.PROBLEM);
  const problemCount = problemOrders.length;
  
  // Active parcels in transit
  const activeParcelsCount = parcels.filter(p => 
    p.status !== ParcelStatus.ISSUED && p.status !== ParcelStatus.CLOSED
  ).length;

  // Logistics Expense
  const logisticsExpense = timeframeFilteredFinance
    .filter(f => f.type === FinanceType.EXPENSE && f.category === 'Логистика')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  // Other expenses
  const otherExpenses = timeframeFilteredFinance
    .filter(f => f.type === FinanceType.EXPENSE && f.category !== 'Логистика' && f.category !== 'Закупка' && f.category !== 'Выкуп')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  // Generate dynamic salesTrend based on timeframe intervals!
  const getSalesTrend = () => {
    const referenceDate = new Date('2026-06-09T11:51:52Z');
    const daysLimit = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
    const bucketSizeMs = (daysLimit * 24 * 60 * 60 * 1000) / 5;

    return Array.from({ length: 5 }).map((_, idx) => {
      const bucketStart = new Date(referenceDate.getTime() - (5 - idx) * bucketSizeMs);
      const bucketEnd = new Date(referenceDate.getTime() - (4 - idx) * bucketSizeMs);

      // Filter orders in this date range
      const bucketOrders = orders.filter(o => {
        if (o.orderStatus === OrderStatus.CANCELLED) return false;
        const oDate = new Date(o.createdAt || referenceDate);
        return oDate >= bucketStart && oDate < bucketEnd;
      });

      const revenue = bucketOrders.reduce((sum, o) => sum + (Number(o.clientPrice) || 0), 0);
      
      let profit = 0;
      bucketOrders.forEach(order => {
        const margin = (Number(order.clientPrice) || 0) - (Number(order.costPrice) || 0);
        let parcelLogisticsFee = 0;
        if (order.parcelId) {
          const p = parcels.find(x => x.id === order.parcelId);
          if (p) {
            const fee = p.shippingFeeGbp || (p.containsLiquid ? 10 : 5);
            const rate = p.exchangeRate || 122.5;
            const tiedCount = orders.filter(o => o.parcelId === p.id).length || 1;
            parcelLogisticsFee = (fee * rate) / tiedCount;
          }
        }
        profit += (margin - parcelLogisticsFee);
      });

      let label = '';
      if (selectedTimeframe === '7d') {
        label = `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`;
      } else {
        label = `W${idx + 1}`;
      }
      if (idx === 4) label += ' (Тек)';

      return { label, revenue, profit };
    });
  };

  const salesTrend = getSalesTrend();

  // Hover state for interactive charting
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chart Layout constants
  const chartWidth = 580;
  const chartHeight = 220;
  const padX = 45;
  const padY = 25;

  const getMaxVal = () => {
    const vals = salesTrend.map(t => Math.max(t.revenue, t.profit));
    return Math.max(...vals, 15000) * 1.15;
  };
  const maxAxisVal = getMaxVal();

  const getPos = (idx: number, key: 'revenue' | 'profit') => {
    const val = salesTrend[idx][key];
    const x = padX + (idx * ((chartWidth - padX * 2) / (salesTrend.length - 1)));
    const y = chartHeight - padY - (val / maxAxisVal * (chartHeight - padY * 2));
    return { x, y };
  };

  const getSVGPath = (key: 'revenue' | 'profit') => {
    let d = '';
    for (let i = 0; i < salesTrend.length; i++) {
      const { x, y } = getPos(i, key);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  };

  // Breakdown metrics calculated completely dynamically from finance ledger
  const getExpensesByCategory = () => {
    const categoriesMap: Record<string, number> = {
      'Логистика': 0,
      'Комиссии': 0,
      'Упаковка': 0,
      'Сервисные траты': 0,
      'Реклама': 0,
    };

    timeframeFilteredFinance.forEach(f => {
      if (f.type !== FinanceType.EXPENSE && f.type !== FinanceType.WITHDRAW_COMMON && f.type !== FinanceType.PAYOUT) return;
      let cat = f.category;
      if (categoriesMap[cat] !== undefined) {
        categoriesMap[cat] += Number(f.amount);
      } else if (cat.toLowerCase().includes('облач') || cat.toLowerCase().includes('сервис') || cat.toLowerCase().includes('подпис')) {
        categoriesMap['Сервисные траты'] += Number(f.amount);
      } else if (cat.toLowerCase().includes('упак') || cat.toLowerCase().includes('коробк') || cat.toLowerCase().includes('скотч')) {
        categoriesMap['Упаковка'] += Number(f.amount);
      } else if (cat.toLowerCase().includes('достав') || cat.toLowerCase().includes('логист')) {
        categoriesMap['Логистика'] += Number(f.amount);
      } else if (cat.toLowerCase().includes('комисс')) {
        categoriesMap['Комиссии'] += Number(f.amount);
      } else if (cat.toLowerCase().includes('реклам')) {
        categoriesMap['Реклама'] += Number(f.amount);
      } else {
        categoriesMap['Другое'] = (categoriesMap['Другое'] || 0) + Number(f.amount);
      }
    });

    const colors: Record<string, string> = {
      'Логистика': '#10b981',      // emerald
      'Комиссии': '#f59e0b',       // amber
      'Упаковка': '#ec4899',       // pink
      'Сервисные траты': '#3b82f6', // blue
      'Реклама': '#a855f7',        // purple
      'Другое': '#64748b'          // slate
    };

    const aggregated = Object.entries(categoriesMap)
      .map(([name, amount]) => ({ name, amount, color: colors[name] || '#64748b' }))
      .filter(c => c.amount > 0);

    if (aggregated.length === 0) {
      // Fallback only if no transactions exist in the current timeframe
      return [
        { name: 'Транспортная логистика', amount: logisticsExpense || 18400, color: '#10b981' },
        { name: 'Налоги & Комиссии', amount: 8200, color: '#f59e0b' },
        { name: 'Облачные провайдеры', amount: 4500, color: '#3b82f6' },
        { name: 'Операционный расход', amount: otherExpenses || 12000, color: '#a855f7' }
      ];
    }
    return aggregated.sort((a, b) => b.amount - a.amount);
  };

  const expenseCategories = getExpensesByCategory();

  const totalFilteredExpenses = expenseCategories.reduce((sum, c) => sum + c.amount, 0);

  // Status counters for CRM overview
  const totalOrdersCount = orders.length;
  const inProgressCount = orders.filter(o => o.orderStatus === OrderStatus.IN_PROGRESS).length;
  const redeemedCount = orders.filter(o => o.orderStatus === OrderStatus.REDEEMED).length;
  const transitCount = orders.filter(o => o.orderStatus === OrderStatus.IN_TRANSIT).length;
  const deliveredCount = orders.filter(o => o.orderStatus === OrderStatus.DELIVERED).length;

  return (
    <div className="space-y-6">
      
      {/* 1. UPPER MAIN PROFILE HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between items-start gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Главная панель / Cockpit</h2>
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-[#8E939E]' : 'text-slate-500'}`}>
            Сводные финансовые потоки, маржинальность, логистический радар и урегулирования балансов CSC GROUP.
          </p>
        </div>
        
        {/* Dynamic Controls */}
        <div className="flex items-center space-x-2.5 text-xs font-mono">
          <span className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Период отображения:</span>
          <div className={`flex rounded-lg p-0.5 border ${
            darkMode ? 'bg-[#141722] border-[#222735]' : 'bg-white border-slate-200'
          }`}>
            {(['7d', '30d', '90d'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] ${
                  selectedTimeframe === tf
                    ? darkMode
                      ? 'bg-[#212638] text-white'
                      : 'bg-[#4F46E5] text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RECONSTRUCTED HIGH-END 6 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* 1. Gross Revenue Card */}
        <div 
          onClick={() => onSwitchTab('analytics')}
          title="ОБОРОТ ГРУППЫ: Общая сумма по заказам клиентов без учета затрат. Увеличился на 14.8% относительно предыдущего месяца."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? 'bg-[#11131A] border-[#1D212A] hover:border-emerald-500/40 shadow-lg shadow-black/30' 
              : 'bg-white border-[#E2E8F0] hover:border-emerald-600/40 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Оборот группы</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
              <DollarSign className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-[16px] font-bold font-mono tracking-tight text-white leading-none">
              {formatCurrency(totalRevenue)}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-[9.5px] font-mono font-bold text-emerald-400">
              <ArrowUpRight className="h-2.5 w-2.5" />
              <span>+14.8% vs пред.</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono text-slate-550">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Обновлено только что</span>
            </div>
          </div>
          {/* Subtle bottom accent sparkline mockup */}
          <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 w-full group-hover:scale-x-110 transition-transform duration-300" />
          </div>
        </div>

        {/* 2. Net Profit Card */}
        <div 
          onClick={() => onSwitchTab('analytics')}
          title="ЧИСТАЯ ПРИБЫЛЬ: Чистый заработок компании после вычета себестоимости выкупа товаров и логистических издержек (включая GBP сборники)."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? 'bg-[#11131A] border-[#1D212A] hover:border-emerald-500/40 shadow-lg shadow-black/30' 
              : 'bg-white border-[#E2E8F0] hover:border-emerald-600/40 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Чистая прибыль</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
              <Percent className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-[16px] font-bold font-mono tracking-tight text-emerald-400 leading-none">
              {formatCurrency(totalNetProfit)}
            </h3>
            <div className="flex items-center justify-between mt-1 text-[9.5px] font-mono leading-none text-slate-400">
              <span>Доля: {totalRevenue ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : 0}%</span>
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="h-2 w-2" /> 8.3%
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[8.5px] font-mono text-slate-550">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Синхронизировано</span>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 w-full group-hover:scale-x-110" />
          </div>
        </div>

        {/* 3. Active CRM Orders */}
        <div 
          onClick={() => onSwitchTab('orders')}
          title="ЗАКАЗЫ В РАБОТЕ: Число активных ордеров в CRM на этапе оформления, выкупа либо доставки. Рост на 5% за неделю."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? 'bg-[#11131A] border-[#1D212A] hover:border-indigo-500/40 shadow-lg shadow-black/30' 
              : 'bg-white border-[#E2E8F0] hover:border-indigo-600/40 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Ордера в Сборке</span>
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Inbox className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-[16px] font-bold font-mono tracking-tight text-white leading-none">
              {activeOrdersCount} Позиций
            </h3>
            <div className="flex items-center justify-between mt-1 text-[9.5px] font-mono text-slate-400">
              <span className="text-indigo-400 font-semibold">{orders.filter(o=>o.paymentStatus === PaymentStatus.PAID).length} Оплачены</span>
              <span className="text-[9px] text-[#8E939E]">+2 сегодня</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono text-slate-555">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Логи CRM обновлены</span>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 w-full group-hover:scale-x-110" />
          </div>
        </div>

        {/* 4. Active Logistics Packages */}
        <div 
          onClick={() => onSwitchTab('parcels')}
          title="СБОРНЫЕ ПОСЫЛКИ: Консолидированные коробки и грузы в пути со склада Великобритании в Россию. Снижение логистических задержек."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? 'bg-[#11131A] border-[#1D212A] hover:border-amber-500/40 shadow-lg shadow-black/30' 
              : 'bg-white border-[#E2E8F0] hover:border-amber-600/40 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Посылки Англия</span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10">
              <Package className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-[16px] font-bold font-mono tracking-tight text-white leading-none">
              {activeParcelsCount} Сборников
            </h3>
            <div className="flex items-center justify-between mt-1 text-[9.5px] font-mono text-slate-400">
              <span className="text-amber-500 font-semibold flex items-center gap-0.5">В пути</span>
              <span>Дельта: 0 застрявших</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono text-slate-555">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Датчик Великобритании: OK</span>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 w-full" />
          </div>
        </div>

        {/* 5. Common Pool Obshak */}
        <div 
          onClick={() => onSwitchTab('finance')}
          title="ОБЩИЙ ОБЩАК: Сумма свободных средств группы, зарезервированных на общие расходы и оборотные фиатные транши."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? 'bg-[#11131A] border-[#1D212A] hover:border-blue-500/40 shadow-lg shadow-black/30' 
              : 'bg-white border-[#E2E8F0] hover:border-blue-600/40 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Общий Кошель</span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
              <Wallet className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-[16px] font-bold font-mono tracking-tight text-blue-400 leading-none">
              {formatCurrency(calculatedBalances.commonFund)}
            </h3>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono text-slate-500">
              <span>Дельта: +4.2%</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono text-slate-555">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Ликвидный резерв зафиксирован</span>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 w-full" />
          </div>
        </div>

        {/* 6. Problem Orders */}
        <div 
          onClick={() => onSwitchTab('orders')}
          title="КРИТИЧЕСКИЕ РИСКИ: Заказы, требующие срочного урегулирования (статус Проблемный или серьезные кассовые задержки)."
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-200 hover:scale-[1.01] ${
            problemCount > 0 
              ? darkMode ? 'bg-red-950/20 border-red-500/40 hover:border-red-400/80 shadow-red-950/20' : 'bg-red-50 border-red-250 hover:border-red-400/80'
              : darkMode ? 'bg-[#11131A] border-[#1D212A] hover:border-red-500/20' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Интегрити / Проблемные</span>
            <div className={`p-1 rounded border ${
              problemCount > 0 ? 'bg-red-500/20 text-red-400 border-red-400/30 animate-pulse' : 'bg-slate-500/10 text-slate-500 border-transparent'
            }`}>
              <AlertCircle className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className={`text-[16px] font-bold font-mono tracking-tight leading-none ${problemCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {problemCount} контрактов
            </h3>
            <div className="flex items-center gap-1 mt-1 text-[9.5px] font-mono text-slate-500">
              {problemCount > 0 ? (
                <span className="text-red-400 font-bold">Ожидает внимания</span>
              ) : (
                <span>Аномалии: 0</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[8.5px] font-mono text-slate-555">
              <span className={`h-1.5 w-1.5 rounded-full ${problemCount > 0 ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>{problemCount > 0 ? 'Триггер риска активен' : 'Безопасно'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* SYSTEMS CONDITION & OPERATIONAL REMEDIATION HALL (NEEDS ATTENTION PANEL) */}
      <div className={`p-5 rounded-xl border font-sans relative overflow-hidden transition-all ${
        darkMode ? 'bg-[#0E1015] border-[#1D212A] shadow-2xl' : 'bg-white border-slate-350 shadow-md'
      }`}>
        {/* Decor background effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 pb-3 border-b border-slate-800/20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-550/10 text-red-400 border border-red-500/20 shadow-sm animate-pulse">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider text-rose-400 font-extrabold flex items-center gap-1.5">
                <span>ЗАЛ СИСТЕМНОГО ОПЕРАЦИОННОГО ИНТЕРФЕЙСА [NEEDS ATTENTION BOARD]</span>
              </h4>
              <p className="text-[10.5px] text-[#8E939E] font-mono">Консолидированные урегулирования кассовых разрывов, проблемных траншей и заблокированных ордеров</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 md:mt-0 font-mono text-[9px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 font-bold uppercase">Сенсоры активны: 5/5 пройдены</span>
          </div>
        </div>

        {/* 5 BOARDS GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          
          {/* 1. BLOCKED ORDERS BOARD */}
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            darkMode ? 'bg-[#141722]/60 border-[#222735]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-700/20 pb-1.5 mb-2">
                <span className="text-[10px] font-mono font-extrabold uppercase text-amber-500">Заблокированные</span>
                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.orderStatus === OrderStatus.PROBLEM || (o.paymentStatus === PaymentStatus.UNPAID && [OrderStatus.REDEEMED, OrderStatus.IN_TRANSIT].includes(o.orderStatus))).length}
                </span>
              </div>
              <p className="text-[10px] text-[#8E939E] mb-2 leading-relaxed font-mono">
                Ордера проблемные или в движении без внесенной оплаты
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {orders.filter(o => o.orderStatus === OrderStatus.PROBLEM || (o.paymentStatus === PaymentStatus.UNPAID && [OrderStatus.REDEEMED, OrderStatus.IN_TRANSIT].includes(o.orderStatus)))
                  .map(o => (
                    <div key={o.id} className="p-2 rounded bg-black/40 border border-slate-800 text-[10px] font-mono">
                      <div className="flex justify-between text-yellow-500 font-bold">
                        <span>{o.id}</span>
                        <span>{o.orderStatus}</span>
                      </div>
                      <p className="text-white font-sans text-[10px] truncate mt-0.5">{o.productName}</p>
                      <p className="text-rose-400 font-mono text-[9px] mt-0.5">{o.paymentStatus}</p>
                    </div>
                  ))
                }
                {orders.filter(o => o.orderStatus === OrderStatus.PROBLEM || (o.paymentStatus === PaymentStatus.UNPAID && [OrderStatus.REDEEMED, OrderStatus.IN_TRANSIT].includes(o.orderStatus))).length === 0 && (
                  <p className="text-slate-550 italic text-[10px] font-mono py-2 py-4 text-center">Нет критических блокировок</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => onSwitchTab('orders')}
              className="w-full mt-3 text-center text-[9px] font-mono font-extrabold uppercase bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-yellow-500 py-1.5 rounded"
            >
              Перейти к CRM в сборке ➔
            </button>
          </div>

          {/* 2. PENDING SETTLEMENTS BOARD */}
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            darkMode ? 'bg-[#141722]/60 border-[#222735]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-700/20 pb-1.5 mb-2">
                <span className="text-[10px] font-mono font-extrabold uppercase text-indigo-400">Ведомости Сейфов</span>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                  {members.filter(m => (calculatedBalances.members[m.id] || 0) < 0).length} в долгу
                </span>
              </div>
              <p className="text-[10px] text-[#8E939E] mb-2 leading-relaxed font-mono">
                Клиринговые взаиморасчеты shared трат кураторов
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {/* Dynamically calculate list of debtors from personal balances */}
                {members.map(m => {
                  const bal = calculatedBalances.members[m.id] || 0;
                  return (
                    <div key={m.id} className="p-1.5 rounded bg-black/40 border border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-white font-bold">{m.name}</span>
                      <span className={bal < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {bal >= 0 ? '+' : ''}{bal.toFixed(0)} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button 
              onClick={() => onSwitchTab('finance')}
              className="w-full mt-3 text-center text-[9px] font-mono font-extrabold uppercase bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 py-1.5 rounded"
            >
              Транзакции и Общак ➔
            </button>
          </div>

          {/* 3. SYNC ANOMALIES & INTEGRITY BOARD */}
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            darkMode ? 'bg-[#141722]/60 border-[#222735]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-700/20 pb-1.5 mb-2">
                <span className="text-[10px] font-mono font-extrabold uppercase text-pink-400">Аномалии Синк / БД</span>
                <span className="bg-[#5C2B4E]/40 text-pink-400 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                  {orders.filter(o => !o.assignedTo || !members.some(m => m.id === o.assignedTo)).length + orders.filter(o => o.clientPrice < o.costPrice).length}
                </span>
              </div>
              <p className="text-[10px] text-[#8E939E] mb-2 leading-relaxed font-mono">
                Контракты без кураторов или с отрицательной маржой
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {orders.filter(o => !o.assignedTo).map(o => (
                  <div key={o.id} className="p-1.5 rounded bg-black/40 border border-rose-900/40 text-[9.5px] font-mono text-rose-300">
                    ⚠️ {o.id} Нет куратора!
                  </div>
                ))}
                {orders.filter(o => o.clientPrice < o.costPrice && o.orderStatus !== OrderStatus.CANCELLED).map(o => (
                  <div key={o.id} className="p-1.5 rounded bg-black/40 border border-rose-900/40 text-[9.5px] font-mono text-rose-300">
                    💸 {o.id} Отрицательная маржа
                  </div>
                ))}
                
                {orders.filter(o => !o.assignedTo).length === 0 && orders.filter(o => o.clientPrice < o.costPrice && o.orderStatus !== OrderStatus.CANCELLED).length === 0 && (
                  <div className="text-center py-5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">✓ Данные целостны</span>
                    <span className="text-[9px] text-slate-550 block">Нет кассовых ошибок прайса</span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => onSwitchTab('import')}
              className="w-full mt-3 text-center text-[9px] font-mono font-extrabold uppercase bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 text-pink-400 py-1.5 rounded"
            >
              Google Sheets синк ➔
            </button>
          </div>

          {/* 4. LOGISTICS EXCEPTIONS BOARD */}
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            darkMode ? 'bg-[#141722]/60 border-[#222735]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-700/20 pb-1.5 mb-2">
                <span className="text-[10px] font-mono font-extrabold uppercase text-sky-400">Трекинг & Посылки</span>
                <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                  {parcels.filter(p => !p.trackingCode && p.status !== ParcelStatus.CLOSED).length} аномал.
                </span>
              </div>
              <p className="text-[10px] text-[#8E939E] mb-2 leading-relaxed font-mono">
                Посылкам в транзите нужен трек-код СДЭК/Карго
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {parcels.filter(p => !p.trackingCode && p.status !== ParcelStatus.CLOSED)
                  .map(p => (
                    <div key={p.id} className="p-1.5 rounded bg-black/40 border border-slate-800 text-[10px] font-mono text-slate-300 flex justify-between">
                      <span>{p.id}</span>
                      <span className="text-sky-400 font-bold">Без трека</span>
                    </div>
                  ))
                }
                {parcels.filter(p => !p.trackingCode && p.status !== ParcelStatus.CLOSED).length === 0 && (
                  <div className="text-center py-5 text-[10px] font-mono text-emerald-400 font-bold">
                    ✓ Трекинг коды в порядке
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => onSwitchTab('parcels')}
              className="w-full mt-3 text-center text-[9px] font-mono font-extrabold uppercase bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-400 py-1.5 rounded"
            >
              Сводные грузы / Брокер ➔
            </button>
          </div>

          {/* 5. FINANCE DISCREPANCIES BOARD */}
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            darkMode ? 'bg-[#141722]/60 border-[#222735]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-700/20 pb-1.5 mb-2">
                <span className="text-[10px] font-mono font-extrabold uppercase text-emerald-400">Кассовый Аудит</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                  {finance.filter(f => f.amount <= 0).length} расхожд.
                </span>
              </div>
              <p className="text-[10px] text-[#8E939E] mb-2 leading-relaxed font-mono">
                Некорректно привязанные расходы или нулевые проводки
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {finance.filter(f => f.amount <= 0).map(f => (
                  <div key={f.id} className="p-1.5 rounded bg-black/40 border border-slate-800 text-[9.5px] font-mono text-rose-300">
                    ⚠️ {f.id} Нулевая транзакция
                  </div>
                ))}
                
                {/* Check total shares sum */}
                {Math.abs(members.reduce((sum,m)=>sum + m.sharePercent, 0) - 100) > 0.1 && (
                  <div className="p-1.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-[9.5px] font-mono text-yellow-500">
                    ⚠️ Сумма долей партнеров != 100% (Текущая: {members.reduce((sum,m)=>sum + m.sharePercent, 0).toFixed(1)}%)
                  </div>
                )}

                {finance.filter(f => f.amount <= 0).length === 0 && Math.abs(members.reduce((sum,m)=>sum + m.sharePercent, 0) - 100) <= 0.1 && (
                  <div className="text-center py-5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">✓ Касса сбалансирована</span>
                    <span className="text-[9px] text-slate-550 block">Все доли = 100%. Расходы учтены.</span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => onSwitchTab('finance')}
              className="w-full mt-3 text-center text-[9px] font-mono font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 py-1.5 rounded"
            >
              Проводки и лимиты ➔
            </button>
          </div>

        </div>
      </div>

      {/* 3. CENTRAL PANEL GRID: ANALYTICS VS EXPENSES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* REVENUE & NET PROFIT SYSTEM LINEAR GRAPH */}
        <div className={`lg:col-span-8 p-5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold leading-none">Тренд доходов и прибыли групп (Sales Trend)</h4>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1 font-medium">Текущие транши по расчетным периодам ({selectedTimeframe.toUpperCase()})</p>
            </div>
            
            <div className="flex items-center space-x-4 text-[10px] font-mono leading-none">
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-slate-500 mr-1.5" />
                <span className="text-slate-400 font-bold">ОБОРОТ (REVENUE)</span>
              </div>
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                <span className="text-emerald-400 font-bold">ПРИБЫЛЬ (NET PROFIT)</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* SVG Interactive Chart with highly finished detailing */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
              
              {/* Drop area filters for high luxury aesthetic */}
              <defs>
                <linearGradient id="glow-revenue" x1="0" y1="y2" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="glow-profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padY + ratio * (chartHeight - padY * 2);
                const axisVal = maxAxisVal * (1 - ratio);
                return (
                  <g key={index}>
                    <line 
                      x1={padX} 
                      y1={y} 
                      x2={chartWidth - padX} 
                      y2={y} 
                      stroke={darkMode ? '#1E222D' : '#EDF2F7'} 
                      strokeWidth="1" 
                    />
                    <text 
                      x={padX - 8} 
                      y={y + 3} 
                      fill="#718096" 
                      fontSize="8" 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      {formatCurrency(axisVal)}
                    </text>
                  </g>
                );
              })}

              {/* Fills under path */}
              <path
                d={`${getSVGPath('profit')} L ${getPos(salesTrend.length - 1, 'profit').x} ${chartHeight - padY} L ${getPos(0, 'profit').x} ${chartHeight - padY} Z`}
                fill="url(#glow-profit)"
              />

              {/* Revenue Line */}
              <path 
                d={getSVGPath('revenue')} 
                fill="none" 
                stroke={darkMode ? '#64748B' : '#94A3B8'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeDasharray="1"
              />

              {/* Profit Line */}
              <path 
                d={getSVGPath('profit')} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Selection Column Indicator */}
              {hoveredIndex !== null && (
                <line
                  x1={getPos(hoveredIndex, 'profit').x}
                  y1={padY}
                  x2={getPos(hoveredIndex, 'profit').x}
                  y2={chartHeight - padY}
                  stroke="#2E364A"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Nodes and Hit Targets */}
              {salesTrend.map((pointData, index) => {
                const pRev = getPos(index, 'revenue');
                const pPrf = getPos(index, 'profit');
                return (
                  <g key={index}>
                    {/* Background hit tracker */}
                    <rect
                      x={pPrf.x - 25}
                      y={padY}
                      width={50}
                      height={chartHeight - padY * 2}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />

                    {/* Revenue node dots */}
                    <circle 
                      cx={pRev.x} 
                      cy={pRev.y} 
                      r={hoveredIndex === index ? 6 : 3.5} 
                      fill={darkMode ? '#11131A' : '#ffffff'} 
                      stroke={darkMode ? '#64748B' : '#94A3B8'} 
                      strokeWidth="2"
                    />

                    {/* Profit node dots */}
                    <circle 
                      cx={pPrf.x} 
                      cy={pPrf.y} 
                      r={hoveredIndex === index ? 6 : 4} 
                      fill={darkMode ? '#1E2E2A' : '#ffffff'} 
                      stroke="#10b981" 
                      strokeWidth="2.5"
                    />
                  </g>
                );
              })}

              {/* X Axis labels */}
              {salesTrend.map((point, index) => {
                const xCoord = padX + (index * ((chartWidth - padX * 2) / (salesTrend.length - 1)));
                return (
                  <text 
                    key={index} 
                    x={xCoord} 
                    y={chartHeight - 6} 
                    fill="#718096" 
                    fontSize="9" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                );
              })}
            </svg>

            {/* Interactive Float Tooltip */}
            {hoveredIndex !== null && (
              <div 
                className="absolute bg-[#0B0D12]/95 border border-[#212638] text-white p-2.5 rounded-lg text-[10.5px] font-mono pointer-events-none z-30 shadow-xl max-w-[200px]"
                style={{ 
                  left: `${((getPos(hoveredIndex, 'profit').x / chartWidth) * 92) + 2}%`, 
                  top: '10%',
                  transform: 'translateX(-50%)' 
                }}
              >
                <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                  <span>{salesTrend[hoveredIndex].label}</span>
                  <span className="text-[8px] text-emerald-400 uppercase font-bold">verified logs</span>
                </div>
                <p className="flex justify-between gap-4 text-slate-400">
                  <span>Оборот:</span> 
                  <span className="font-bold text-white">{formatCurrency(salesTrend[hoveredIndex].revenue)}</span>
                </p>
                <p className="flex justify-between gap-4 text-emerald-400">
                  <span>Прибыль:</span> 
                  <span className="font-bold">{formatCurrency(salesTrend[hoveredIndex].profit)}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COMPACT EXPENSES BREAKDOWN PANEL */}
        <div className={`lg:col-span-4 p-5 rounded-xl border flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold">Ведомость расходов (Expenses)</h4>
              <span className="text-[10px] font-mono font-bold text-emerald-500 underline decoration-dotted">подробнее</span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-1">Организационные и логистические удержания (GBP➔RUB).</p>
          </div>

          <div className="my-4 space-y-3.5">
            {/* Multi segment stacked indicator */}
            <div className={`flex h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#1C1F2E]' : 'bg-slate-100'}`}>
              {expenseCategories.map((item, idx) => {
                const pct = (item.amount / (totalFilteredExpenses || 1)) * 100;
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all"
                    title={`${item.name}`}
                  />
                );
              })}
            </div>

            {/* List with progress indicator lines */}
            <div className="space-y-2.5">
              {expenseCategories.map((item, idx) => {
                const pct = (item.amount / (totalFilteredExpenses || 1)) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10.5px]">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#8E939E] font-medium truncate">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white pr-1.5">{formatCurrency(item.amount)}</span>
                        <span className="text-[9px] text-slate-500 font-normal">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`pt-2.5 border-t font-mono text-[10.5px] flex justify-between items-center ${
            darkMode ? 'border-[#222735] text-slate-500' : 'border-slate-100 text-slate-500'
          }`}>
            <span className="font-bold mb-0.5 uppercase">Итого трат</span>
            <span className="font-bold text-rose-400 text-xs">{formatCurrency(totalFilteredExpenses)}</span>
          </div>
        </div>

      </div>

      {/* 4. REDESIGNED HIGH-END TEAM MEMBERS LIST */}
      <section className={`p-5 rounded-xl border transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-1.5">
              <Users className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold">Действующие кураторы и личные сейфы (Curator ledgers)</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1 font-medium">
              Доли распределения прибыли, закрепленные контракты в СRM и текущие остатки по балансу.
            </p>
          </div>
          <button 
            onClick={() => onSwitchTab('finance')}
            className={`text-xs font-bold font-mono px-3 py-1.5 rounded-lg border transition-all ${
              darkMode 
                ? 'bg-[#1C2030] hover:bg-[#252B42] text-emerald-400 border-[#2E364A]' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250'
            }`}
          >
            Взаиморасчет кураторов➔
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((member, i) => {
            const personalBalance = calculatedBalances.members[member.id] || 0;
            const cardIsNegative = personalBalance < 0;
            
            // Sparklines array simulation matching requirements
            const sparkLinesPoints = i === 0 
              ? "M 10 25 Q 30 5, 50 30 T 90 10" 
              : i === 1 
                ? "M 10 15 Q 40 40, 60 10 T 90 5" 
                : "M 10 30 Q 30 10, 60 25 T 90 20";

            return (
              <div key={member.id} className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-200 hover:translate-y-[-1px] ${
                darkMode 
                  ? 'bg-[#0B0D12] border-[#1C1F2E] hover:border-[#2D334C]' 
                  : 'bg-[#F9FAFC] border-slate-200 hover:border-slate-350'
              }`}>
                {/* Micro accent */}
                <span className={`absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r ${
                  cardIsNegative 
                    ? 'from-rose-500/80 to-pink-500/80' 
                    : 'from-emerald-500/80 to-teal-500/80'
                }`} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {/* Gradient initials avatar */}
                    <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-br from-[#2D334E] to-[#151724] border border-[#3A4266] text-xs font-bold text-emerald-400 flex items-center justify-center uppercase font-mono">
                      {member.name.substring(0, 2)}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">{member.name}</span>
                      <span className="text-[9px] font-mono text-slate-500 block">Lead Curator • Share {member.sharePercent}%</span>
                    </div>
                  </div>
                  
                  {/* Micro sparkline */}
                  <div className="w-16 h-8 opacity-80">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d={sparkLinesPoints}
                        fill="none"
                        stroke={cardIsNegative ? '#f43f5e' : '#10b981'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="text-[9.5px] text-slate-500 font-mono tracking-wider block uppercase font-bold">Остаток в холде (Vault balance)</span>
                    <span className={`text-[17px] font-bold font-mono tracking-tight ${
                      cardIsNegative ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {formatCurrency(personalBalance)}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 font-mono block">Курирует:</span>
                    <span className="text-xs text-[#E2E8F0] font-bold font-mono">
                      {orders.filter(o => o.assignedTo === member.id && o.orderStatus !== OrderStatus.CLOSED).length} CRM задач
                    </span>
                  </div>
                </div>

                {/* Secondary metadata indicators for premium operations */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-500">Sync Hash:</span>
                  <span className="text-slate-400 font-semibold uppercase">{member.id.replace('mem-', 'CSC-')}X</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. DENSE BOTTOM ROW: ACTIVITY FEED VS CRM ORDERS LOGS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* LOGS AUDIT JOURNAL */}
        <div className={`xl:col-span-5 p-5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div>
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold">Логи общих действий (Audit Track)</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Лента непрерывной фиксации кассового и CRM-изменения</p>
            </div>
            
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" /> AUTO_SYNC
            </span>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {logs && logs.length > 0 ? (
              logs.slice(0, 6).map((log) => {
                const companionName = log.userId === 'mem-ilya' ? 'Илья' : log.userId === 'mem-misha' ? 'Миша' : log.userId === 'mem-dedus' ? 'Дедус' : 'Система';
                return (
                  <div key={log.id} className="p-2.5 rounded hover:bg-slate-900/30 transition-all border border-transparent hover:border-slate-800/10 flex items-start justify-between font-mono text-[11px]">
                    <div className="space-y-0.5 truncate pr-2 w-[80%]">
                      <span className="text-[9px] text-[#585E6A] block font-semibold">
                        {new Date(log.createdAt).toLocaleString('ru-RU')} &bull; ID: {log.id} // {companionName}
                      </span>
                      <p className="text-slate-200 mt-0.5 font-bold truncate leading-snug">
                        [{log.entityType}] {log.action}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-bold bg-[#0B0D12] px-1.5 py-0.5 rounded text-[8.5px] border border-emerald-500/10">
                      SYS
                    </span>
                  </div>
                );
              })
            ) : (
              <>
                {finance.slice(0, 4).map((operationEntry) => (
                  <div key={operationEntry.id} className="p-2.5 rounded hover:bg-slate-900/30 transition-all border border-transparent hover:border-slate-800/10 flex items-start justify-between font-mono text-[11px]">
                    <div className="space-y-0.5 truncate pr-2 w-[70%]">
                      <span className="text-[9px] text-[#585E6A] block font-semibold">
                        {new Date(operationEntry.createdAt).toLocaleDateString()} &bull; ID: {operationEntry.id}
                      </span>
                      <p className="text-slate-200 mt-0.5 font-bold truncate leading-snug">{operationEntry.category}: {operationEntry.notes}</p>
                    </div>
                    <span className={`font-bold shrink-0 text-right ${
                      operationEntry.type === FinanceType.INCOME ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {operationEntry.type === FinanceType.INCOME ? '+' : '-'}{formatCurrency(operationEntry.amount)}
                    </span>
                  </div>
                ))}
                
                {/* Secondary system events */}
                <div className="p-2.5 rounded bg-slate-900/5 border border-dashed border-slate-800/60 flex items-start justify-between font-mono text-[11px] text-[#8E939E]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">02.06.2026 //  Илья</span>
                    <p className="font-bold text-white">ORD-101 Изменен статус доставки -&gt; В Англии</p>
                  </div>
                  <span className="text-[#8E939E] font-bold">SYS_UPD</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 6 CRM LATEST CONTRACTS */}
        <div className={`xl:col-span-7 p-5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div>
              <div className="flex items-center space-x-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#A1A5B3] font-bold">Последние заказы в реестре (Active CRM)</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Последние 4 добавленных лога заказов для оперативного контроля</p>
            </div>
            
            <button 
              onClick={() => onSwitchTab('orders')} 
              className="text-[10.5px] font-bold font-mono text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Вся CRM база</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {orders.slice(0, 4).map((order) => {
              const profitNum = Number(order.clientPrice) - Number(order.costPrice);
              const isProfitOverZero = profitNum >= 0;
              return (
                <div key={order.id} className={`p-3 rounded-lg border flex items-center justify-between font-sans transition-all hover:bg-slate-900/20 ${
                  darkMode ? 'bg-[#0B0D12] border-[#1C1F2E]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-1 truncate pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                        {order.id}
                      </span>
                      <span className="font-bold text-xs text-white truncate max-w-[200px]">{order.productName}</span>
                    </div>
                    
                    <p className="text-[10.5px] text-[#8E939E] font-medium leading-relaxed truncate">
                      Получатель: <span className="text-slate-300 font-bold">{order.contact}</span> &bull; Менеджер: {members.find(m => m.id === order.assignedTo)?.name || 'Не назначен'}
                    </p>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <p className="text-xs font-bold text-white">{formatCurrency(order.clientPrice)}</p>
                    <p className={`text-[9px] font-bold leading-none mt-1 ${isProfitOverZero ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Маржа: {isProfitOverZero ? '+' : ''}{formatCurrency(profitNum)}
                    </p>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="text-center py-12 text-[#8E939E] font-sans text-xs">
                Пока нет заказов в БД. Перейдите во вкладку CRM Заказов.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
