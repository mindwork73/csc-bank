/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Order, 
  Parcel, 
  FinanceEntry, 
  TeamMember, 
  OrderStatus, 
  PaymentStatus, 
  ParcelStatus, 
  AuditLog,
  FinanceType
} from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  AlertTriangle, 
  Package, 
  Activity, 
  ArrowRight,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CircleAlert
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
  onUpdateOrder?: (order: Order) => void;
  onSelectOrder?: (orderId: string) => void;
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
  currentRole = 'root',
  onSelectOrder
}: DashboardViewProps) {

  // 1. Calculations basing on sheets logic
  const nonCancelledOrders = orders.filter(o => o.orderStatus !== OrderStatus.CANCELLED);
  
  // Total Revenue: sum of client prices of non-cancelled orders
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + Number(o.clientPrice || 0), 0);
  
  // Total Cost Price: sum of our purchase prices of non-cancelled orders
  const totalCostPrice = nonCancelledOrders.reduce((sum, o) => sum + Number(o.costPrice || 0), 0);

  // Profit Formula: revenue minus costPrice, then subtract individual parcel logistics fees
  const calculateTotalNetProfit = () => {
    let tempProfit = 0;
    nonCancelledOrders.forEach(order => {
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

  // Common Fund Cash/Balance
  const commonFundBalance = calculatedBalances.commonFund;

  // Counts
  const problemOrdersCount = orders.filter(o => o.orderStatus === OrderStatus.PROBLEM).length;
  const unpaidOrdersCount = orders.filter(o => o.paymentStatus === PaymentStatus.UNPAID).length;
  const parcelsInTransitCount = parcels.filter(p => 
    p.status === ParcelStatus.SENT || p.status === ParcelStatus.IN_TRANSIT
  ).length;

  const fmt = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  // Get last 5 entities for lists
  const lastOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lastFinance = [...finance]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lastLogs = [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-7xl mx-auto">
      
      {/* 2. Compact Title Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-white font-sans flex items-center space-x-1.5">
            <Activity className="h-4.5 w-4.5 text-indigo-400" />
            <span>Панель Управления / CSC Dashboard</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Сводные операционные показатели и кассовый баланс, основанные на данных реестров.
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-800/40 px-2 py-1 rounded text-[10px] font-mono text-slate-350 border border-slate-700/30">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Канал обновлен: 2026-06-10 (Sheets Live)</span>
        </div>
      </div>

      {/* 3. Compact KPI Box Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* REVENUE */}
        <div 
          onClick={() => onSwitchTab('orders')}
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-150 hover:scale-[1.01] ${
            darkMode ? 'bg-[#0E1015] border-[#222735] hover:border-indigo-500/40 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Общая Выручка</span>
            <span className="p-1 px-1.5 rounded text-[10px] font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-500/10">CRM</span>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-white">
            {fmt(totalRevenue)}
          </div>
          <div className="mt-1 text-[9px] font-mono text-slate-500 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Оборот по всем сделкам ({nonCancelledOrders.length} шт)</span>
          </div>
        </div>

        {/* COST PRICE */}
        <div 
          onClick={() => onSwitchTab('orders')}
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-150 hover:scale-[1.01] ${
            darkMode ? 'bg-[#0E1015] border-[#222735] hover:border-slate-500/40 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Выкуп / Себестоимость</span>
            <span className="p-1 px-1.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700/30 text-slate-400">Закупки</span>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-white">
            {fmt(totalCostPrice)}
          </div>
          <div className="mt-1 text-[9px] font-mono text-slate-500 flex items-center space-x-1">
            <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
            <span>Общий объем затрат на выкупы из Китая/ЕС</span>
          </div>
        </div>

        {/* PROFIT */}
        <div 
          onClick={() => onSwitchTab('orders')}
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-150 hover:scale-[1.01] ${
            darkMode ? 'bg-[#0E1015] border-[#222735] hover:border-emerald-500/40 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Чистая Прибыль (P&L)</span>
            <span className="p-1 px-1.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-555/5 border-emerald-500/10">Маржа</span>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-emerald-400">
            {fmt(totalNetProfit)}
          </div>
          <div className="mt-1 text-[9px] font-mono text-slate-500 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>С учетом вычетов логистики посылок Великобритании</span>
          </div>
        </div>

        {/* COMMON FUND */}
        <div 
          onClick={() => onSwitchTab('finance')}
          className={`p-4 rounded-xl border relative cursor-pointer group transition-all duration-150 hover:scale-[1.01] ${
            darkMode ? 'bg-[#0E1015] border-[#222735] hover:border-amber-500/40 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Касса «Общак» CSC</span>
            <span className="p-1 px-1.5 rounded text-[10px] font-mono bg-amber-950/40 text-amber-500 border border-amber-500/10">Ledger</span>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-amber-400">
            {fmt(commonFundBalance)}
          </div>
          <div className="mt-1 text-[9px] font-mono text-slate-500 flex items-center space-x-1">
            <Wallet className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Оборотные средства троих партнеров на закупку</span>
          </div>
        </div>

      </div>

      {/* 4. Compact Secondary Metrics (Filters shortcut / Status Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* PROBLEM ORDERS CARD */}
        <div 
          onClick={() => {
            if (onSelectOrder) {
              onSelectOrder('status:PROBLEM');
            } else {
              onSwitchTab('orders');
            }
          }}
          className={`p-3.5 rounded-lg border flex items-center space-x-3.5 cursor-pointer hover:bg-rose-950/10 transition-all ${
            problemOrdersCount > 0 
              ? 'border-rose-500/30 bg-rose-950/10 text-rose-300' 
              : 'border-slate-800 text-slate-400'
          }`}
        >
          <div className={`p-2 rounded-md ${problemOrdersCount > 0 ? 'bg-rose-950 text-rose-450 text-rose-400' : 'bg-slate-900 text-slate-500'}`}>
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-450 font-bold">Критический риск</div>
            <div className="font-bold flex items-center space-x-1 mt-0.5">
              <span>{problemOrdersCount} {problemOrdersCount === 1 ? 'заказ требует' : 'заказов требуют'} урегулирования</span>
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* UNPAID ORDERS */}
        <div 
          onClick={() => onSwitchTab('orders')}
          className="p-3.5 rounded-lg border border-slate-800 flex items-center space-x-3.5 cursor-pointer hover:bg-[#151922] transition-all"
        >
          <div className="p-2 rounded-md bg-slate-900 text-amber-400">
            <CircleAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-450 font-bold">Оплата клиентов</div>
            <div className="font-bold text-white flex items-center space-x-1 mt-0.5">
              <span>{unpaidOrdersCount} неоплаченных ордеров</span>
              <ArrowRight className="h-3 w-3 text-slate-550" />
            </div>
          </div>
        </div>

        {/* PARCELS IN TRANSIT */}
        <div 
          onClick={() => onSwitchTab('parcels')}
          className="p-3.5 rounded-lg border border-slate-800 flex items-center space-x-3.5 cursor-pointer hover:bg-[#151922] transition-all"
        >
          <div className="p-2 rounded-md bg-slate-900 text-indigo-400">
            <Package className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-450 font-bold">Логистика Англия</div>
            <div className="font-bold text-white flex items-center space-x-1 mt-0.5">
              <span>{parcelsInTransitCount} посылок в Англии/В пути</span>
              <ArrowRight className="h-3 w-3 text-slate-550" />
            </div>
          </div>
        </div>

      </div>

      {/* 5. Compact Operation Lists (Core workspace entries) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* RECENT ORDERS LIST */}
        <div className={`p-4 rounded-xl border space-y-3.5 ${
          darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-800/50">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Последние Заказы клиентов (CRM)</span>
            </h3>
            <button 
              onClick={() => onSwitchTab('orders')}
              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
            >
              <span>Посмотреть все</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {lastOrders.map(order => {
              const profit = Number(order.clientPrice) - Number(order.costPrice);
              const orderDateStr = new Date(order.createdAt).toLocaleDateString('ru-RU');
              return (
                <div 
                  key={order.id} 
                  className={`p-2.5 rounded border flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs transition-all ${
                    darkMode ? 'bg-[#151822] border-slate-800/40 hover:bg-slate-900/60' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">{order.id}</span>
                      <span className="font-bold text-white">{order.contact}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[280px]">
                      {order.productName}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:self-center">
                    <div className="text-right mr-2">
                      <div className="font-bold text-white font-mono text-[11px]">{fmt(order.clientPrice)}</div>
                      <div className={`text-[9px] font-mono font-semibold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        маржа: {fmt(profit)}
                      </div>
                    </div>
                    
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide shrink-0 ${
                      order.orderStatus === OrderStatus.PROBLEM 
                        ? 'bg-rose-950/50 text-rose-450 text-rose-400 border border-rose-500/20' 
                        : 'bg-slate-900 border border-slate-700/30 text-slate-400'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT FINANCIAL OPERATIONS */}
        <div className={`p-4 rounded-xl border space-y-3.5 ${
          darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-800/50">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Последние Фин. Проводки (BuhUchet)</span>
            </h3>
            <button 
              onClick={() => onSwitchTab('finance')}
              className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition-colors"
            >
              <span>Контроль кассы</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {lastFinance.map(fin => {
              const sign = (fin.type === FinanceType.EXPENSE || fin.type === FinanceType.WITHDRAW_COMMON || fin.type === FinanceType.PAYOUT) ? '-' : '+';
              const colorClass = sign === '-' ? 'text-rose-400' : 'text-emerald-400';
              const memberName = members.find(m => m.id === fin.memberId)?.name || 'Общая';
              
              return (
                <div 
                  key={fin.id} 
                  className={`p-2.5 rounded border flex items-center justify-between text-xs transition-all ${
                    darkMode ? 'bg-[#151822] border-slate-800/40 hover:bg-slate-900/60' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[9px] text-slate-550 text-slate-500">{fin.id}</span>
                      <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1 py-0.2 rounded font-bold">
                        {fin.category}
                      </span>
                      <span className="text-slate-450 text-[10px] text-slate-400 font-mono">({memberName})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[280px]">
                      {fin.notes}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold font-mono text-[11px] ${colorClass}`}>
                      {sign}{fmt(fin.amount)}
                    </div>
                    {fin.affectsCommonFund && (
                      <span className="text-[8px] tracking-wide font-mono uppercase bg-amber-950/40 border border-amber-500/10 text-amber-500 font-bold rounded px-1 py-0.2">
                        общак
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 6. Recent Audit System Events / Logs Row */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white'
      }`}>
        <div className="border-b pb-2 border-slate-800/50 flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>Журнал Изменений в Системе</span>
          </h3>
          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Последние 5 сигналов</span>
        </div>

        <div className="divide-y divide-slate-800/40">
          {lastLogs.map(log => {
            const dateStr = new Date(log.createdAt).toLocaleTimeString('ru-RU');
            return (
              <div key={log.id} className="py-2 flex items-start justify-between text-[11px] gap-4">
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-400 font-mono shrink-0">[{dateStr}]</span>
                  <span className="text-slate-300 leading-relaxed">{log.action}</span>
                </div>
                <span className="text-slate-500 font-mono text-[9px] shrink-0 uppercase tracking-widest font-bold">
                  {log.entityType}:{log.entityId}
                </span>
              </div>
            );
          })}
          {lastLogs.length === 0 && (
            <div className="text-center py-4 text-slate-500 text-[11px] font-mono">
              История изменений пуста
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
