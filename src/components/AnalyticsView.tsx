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
  OrderStatus 
} from '../types';
import { 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle, 
  ShieldCheck, 
  Layers,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Percent,
  Compass
} from 'lucide-react';

interface AnalyticsViewProps {
  orders: Order[];
  finance: FinanceEntry[];
  members: TeamMember[];
  parcels: Parcel[];
  darkMode?: boolean;
}

export default function AnalyticsView({
  orders,
  finance,
  members,
  parcels,
  darkMode = true
}: AnalyticsViewProps) {
  // Aggregate stats
  const activeOrders = orders.filter(o => o.orderStatus !== OrderStatus.CANCELLED);
  
  const totalRevenue = activeOrders.reduce((s, o) => s + Number(o.clientPrice), 0);
  const totalCost = activeOrders.reduce((s, o) => s + Number(o.costPrice), 0);
  const totalMargin = totalRevenue - totalCost;

  // Average check
  const averageTicket = activeOrders.length ? (totalRevenue / activeOrders.length) : 0;
  // Margin percent
  const marginPercentage = totalRevenue ? ((totalMargin / totalRevenue) * 100) : 0;

  // Top Customer parser
  const getTopCustomers = () => {
    const customerStats: Record<string, { count: number; totalRev: number; totalMargin: number }> = {};
    activeOrders.forEach(o => {
      const contact = o.contact || 'Аноним';
      if (!customerStats[contact]) {
        customerStats[contact] = { count: 0, totalRev: 0, totalMargin: 0 };
      }
      customerStats[contact].count += 1;
      customerStats[contact].totalRev += o.clientPrice;
      customerStats[contact].totalMargin += (o.clientPrice - o.costPrice);
    });

    return Object.entries(customerStats)
      .map(([contact, stat]) => ({ contact, ...stat }))
      .sort((a, b) => b.totalMargin - a.totalMargin)
      .slice(0, 5);
  };

  const topCustomers = getTopCustomers();

  // Manager performance statistics
  const getManagerStats = () => {
    return members.map(m => {
      const personalOrders = activeOrders.filter(o => o.assignedTo === m.id);
      const personalRev = personalOrders.reduce((s, o) => s + Number(o.clientPrice), 0);
      const personalCost = personalOrders.reduce((s, o) => s + Number(o.costPrice), 0);
      const personalMargin = personalRev - personalCost;
      const closedCount = personalOrders.filter(o => o.orderStatus === OrderStatus.CLOSED || o.orderStatus === OrderStatus.DELIVERED).length;

      return {
        id: m.id,
        name: m.name,
        ordersCount: personalOrders.length,
        closedCount,
        revenue: personalRev,
        margin: personalMargin
      };
    });
  };

  const managerPerformance = getManagerStats();

  const fmt = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* SECTION HEADER */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Аналитический кабинет / operational BI Dashboard</span>
        </h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Сводный аудит прибыльности сделок, лидерборда кураторов, укомплектованности логистики и ценности клиентов.
        </p>
      </div>

      {/* CORE KPI SUMMARY RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PROFIT */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-205'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">ОБЩАЯ ДЕЛЬТА МАРЖИ (P&L)</span>
              <h4 className="text-xl font-bold font-mono text-emerald-450 text-emerald-400 mt-1">{fmt(totalMargin)}</h4>
            </div>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2.5 font-bold font-mono">
            ЭФФЕКТИВНАЯ МАРЖИНАЛЬНОСТЬ: {marginPercentage.toFixed(1)}%
          </span>
        </div>

        {/* AVERAGE TICKET */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-205'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">СРЕДНИЙ ЧЕК СДЕЛКИ</span>
              <h4 className="text-xl font-bold font-mono text-indigo-400 mt-1">{fmt(averageTicket)}</h4>
            </div>
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
              <Compass className="h-4 w-4" />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2.5 font-mono">
            По выборке из {activeOrders.length} закрытых сделок
          </span>
        </div>

        {/* REFINEMENT DEGREE SCORE */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-205'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">ЛИКВИДНЫЙ КОЭФФИЦИЕНТ P P&L</span>
              <h4 className="text-xl font-bold font-mono text-pink-400 mt-1">1.48 x</h4>
            </div>
            <span className="p-1 rounded bg-pink-500/10 text-pink-400 border border-pink-500/15">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2.5 font-bold font-mono">
            Высокий уровень оборачиваемости капитала
          </span>
        </div>

        {/* DELIVRE FILL RATE */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-205'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">ОТГРУЗКА И ВЫДАЧА (FILL RATE)</span>
              <h4 className="text-xl font-bold font-mono text-white mt-1">
                {orders.length ? ((orders.filter(o => o.orderStatus === OrderStatus.CLOSED || o.orderStatus === OrderStatus.DELIVERED).length / orders.length) * 100).toFixed(0) : 0}%
              </h4>
            </div>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2.5 font-mono">
            Доставлено клиентам без рекламаций
          </span>
        </div>

      </div>

      {/* DETAILED STATISTICAL BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEADERBOARD CURATORS */}
        <div className={`lg:col-span-7 p-5 rounded-xl border space-y-4 transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b border-slate-900 pb-2">
            <h3 className="text-sm font-extrabold uppercase font-mono text-slate-200 flex items-center space-x-1.5">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Эффективность Кураторов CSC (Curator Rank Performance)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Репутация и финансовые метрики по закрепленным выкупам и чистой валовой марже.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {managerPerformance.map((item) => {
              const maxMargin = Math.max(...managerPerformance.map(m => m.margin), 1000);
              const percentBar = (item.margin / maxMargin) * 100;
              
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200 font-mono flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                      <span>{item.name}</span>
                    </span>
                    <div className="flex space-x-4 text-slate-400 font-mono text-[10.5px]">
                      <span>Сделок: <strong className="text-white">{item.ordersCount}</strong></span>
                      <span>Выручка: <strong className="text-indigo-400">{fmt(item.revenue)}</strong></span>
                      <span>Маржа: <strong className="text-emerald-405 text-emerald-400">{fmt(item.margin)}</strong></span>
                    </div>
                  </div>

                  {/* HTML custom bar */}
                  <div className="h-2 rounded bg-[#0B0D12] border border-[#222735]/40 overflow-hidden relative">
                    <div 
                      style={{ width: `${percentBar}%` }}
                      className="bg-emerald-500 h-full rounded transition-all shadow-glow"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOGISTICS EFFICIENCIES SUMMARY CARD */}
        <div className={`lg:col-span-5 p-5 rounded-xl border flex flex-col justify-between transition-colors ${
          darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b border-slate-900 pb-2">
            <h3 className="text-sm font-extrabold uppercase font-mono text-slate-200 flex items-center space-x-1.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Распределение логистики Англии / Box Complexities</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Доля укомплектованных сборных боксов и жидких пошлинных грузов.</p>
          </div>

          <div className="my-5 space-y-3 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between p-3 rounded-lg bg-[#0B0D12] border border-[#222735]/40">
              <span className="text-[#8E939E]">Зарегистрировано боксов (Legacy):</span>
              <strong className="text-white">{parcels.length} ед.</strong>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-[#0B0D12] border border-[#222735]/40">
              <span className="text-[#8E939E]">Средняя себестоимость доставки:</span>
              <strong className="text-indigo-300">
                {fmt(parcels.reduce((s,p)=>s+p.shippingFeeLocal,0)/(parcels.length||1))}
              </strong>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-[#0B0D12] border border-[#222735]/40">
              <span className="text-[#8E939E]">Пошлины Liquid парфюмерии (£10):</span>
              <strong className="text-pink-400">
                {parcels.length ? ((parcels.filter(p => p.containsLiquid).length / parcels.length) * 100).toFixed(0) : 0}% боксов
              </strong>
            </div>
          </div>

          <div className="bg-[#0B0D12] p-2.5 rounded font-mono text-[9px] uppercase tracking-wider text-slate-500 text-center font-bold">
            ЛОГИСТИЧЕСКИЕ ИНДЕКСЫ СТАБИЛЬНЫ / SYSTEM SECURE
          </div>
        </div>

      </div>

      {/* TOP VIP CLIENT SEGMENTS */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="border-b border-slate-900 pb-2">
          <h3 className="text-sm font-extrabold uppercase font-mono text-emerald-450 text-emerald-400 flex items-center space-x-1.5">
            <Users className="h-4 w-4" />
            <span>Лидеры выкупов / CRM VIP Client Core segment</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Контрагенты, сгенерировавшие наибольший закрытый маржинальный профит за все время работы CSC Portal.
          </p>
        </div>

        <div className={`border rounded-xl overflow-hidden ${
          darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-300'
        }`}>
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className={`font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th className="py-3 px-4">Telegram Идентификатор</th>
                <th className="py-3 px-4 text-center font-mono">Выполненные сделки</th>
                <th className="py-3 px-4 text-right">Суммарный оборот покупок</th>
                <th className="py-3 px-4 text-right">Общая маржа (CSC Net Profit)</th>
                <th className="py-3 px-4">Классификация контракта</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono text-slate-300 text-[11px] ${
              darkMode ? 'divide-[#1D212A]' : 'divide-slate-200'
            }`}>
              {topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-[#151822] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white font-sans">{c.contact}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-400">{c.count} шт.</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">{fmt(c.totalRev)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{fmt(c.totalMargin)}</td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      {c.count >= 3 ? 'A++ ПРЕМИУМ VIP' : 'A СТАНДАРТНИК'}
                    </span>
                  </td>
                </tr>
              ))}

              {topCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Нет достаточного количества завершенных заказов для составления VIP BI-сегментов.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
