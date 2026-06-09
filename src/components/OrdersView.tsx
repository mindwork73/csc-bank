/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Order, 
  Parcel, 
  TeamMember, 
  OrderStatus, 
  PaymentStatus, 
  ShippingStatus 
} from '../types';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  X, 
  Clock, 
  Tag, 
  User, 
  Edit, 
  DollarSign, 
  Eye,
  Paperclip,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  parcels: Parcel[];
  members: TeamMember[];
  onAddOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'margin' | 'profit'>) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  globalSearch: string;
  darkMode?: boolean;
  currentRole?: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly';
}

export default function OrdersView({
  orders,
  parcels,
  members,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  globalSearch,
  darkMode = true,
  currentRole = 'root'
}: OrdersViewProps) {
  // Local Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [liquidFilter, setLiquidFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Dynamically extract all available months of orders
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    orders.forEach(o => {
      if (o.createdAt) {
        const date = new Date(o.createdAt);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM
          const yyyymm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthsSet.add(yyyymm);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse(); // descending order
  }, [orders]);

  const formatMonthName = (yyyymm: string) => {
    const [year, month] = yyyymm.split('-');
    const mNum = parseInt(month, 10);
    const monthsRu = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${monthsRu[mNum - 1]} ${year}`;
  };
  
  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Slider/Drawer & Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // New Order Form state
  const [newOrderForm, setNewOrderForm] = useState({
    contact: '',
    productName: '',
    costPrice: 0,
    clientPrice: 0,
    orderStatus: OrderStatus.NEW,
    paymentStatus: PaymentStatus.UNPAID,
    shippingStatus: ShippingStatus.NOT_SHIPPED,
    shippingType: 'Англия Экспресс',
    hasLiquid: false,
    notes: '',
    assignedTo: 'mem-ilya',
    parcelId: '',
    rawTags: '',
    source: 'Telegram'
  });

  // Calculate coordinates and metrics
  const searchNormalized = (searchTerm || globalSearch).toLowerCase().trim();
  
  const filteredOrders = orders.filter(o => {
    // 1. Search text
    const matchesSearch = 
      o.id.toLowerCase().includes(searchNormalized) ||
      o.contact.toLowerCase().includes(searchNormalized) ||
      o.productName.toLowerCase().includes(searchNormalized) ||
      (o.notes && o.notes.toLowerCase().includes(searchNormalized)) ||
      o.tags.some(t => t.toLowerCase().includes(searchNormalized));
    
    // 2. Status Match
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    
    // 3. Payment Match
    const matchesPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;

    // 4. Manager Match
    const matchesManager = managerFilter === 'ALL' || o.assignedTo === managerFilter;

    // 5. Liquid Match
    const matchesLiquid = 
      liquidFilter === 'ALL' || 
      (liquidFilter === 'YES' && o.hasLiquid) || 
      (liquidFilter === 'NO' && !o.hasLiquid);

    // 6. Month Match
    let matchesMonth = true;
    if (monthFilter !== 'ALL' && o.createdAt) {
      const date = new Date(o.createdAt);
      if (!isNaN(date.getTime())) {
        const yyyymm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = yyyymm === monthFilter;
      } else {
        matchesMonth = false;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesManager && matchesLiquid && matchesMonth;
  });

  // KPI Calculations inside tab
  const totalVolumeInRub = filteredOrders.reduce((s,o) => s + Number(o.clientPrice), 0);
  const totalCostInRub = filteredOrders.reduce((s,o) => s + Number(o.costPrice), 0);
  const calculatedMargin = totalVolumeInRub - totalCostInRub;

  // Handle mass/bulk actions
  const handleBulkStatusChange = (status: OrderStatus) => {
    selectedOrderIds.forEach(id => {
      const o = orders.find(x => x.id === id);
      if (o) {
        onUpdateOrder({
          ...o,
          orderStatus: status,
          updatedAt: new Date().toISOString()
        });
      }
    });
    setSelectedOrderIds([]);
  };

  const handleBulkPaymentChange = (status: PaymentStatus) => {
    selectedOrderIds.forEach(id => {
      const o = orders.find(x => x.id === id);
      if (o) {
        onUpdateOrder({
          ...o,
          paymentStatus: status,
          updatedAt: new Date().toISOString()
        });
      }
    });
    setSelectedOrderIds([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleRowSelect = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(x => x !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Click on order triggers rich side drawer view
  const triggerOrderDrawer = (order: Order) => {
    setSelectedOrder(order);
    setIsEditMode(false);
  };

  // Handle Form changes for new order
  const submitNewOrderForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.contact || !newOrderForm.productName) {
      alert('Пожалуйста, заполните ФИО контакта и Название товара.');
      return;
    }

    const tagsArray = newOrderForm.rawTags
      ? newOrderForm.rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    onAddOrder({
      contact: newOrderForm.contact,
      productName: newOrderForm.productName,
      costPrice: Number(newOrderForm.costPrice) || 0,
      clientPrice: Number(newOrderForm.clientPrice) || 0,
      orderStatus: newOrderForm.orderStatus,
      paymentStatus: newOrderForm.paymentStatus,
      shippingStatus: newOrderForm.shippingStatus,
      shippingType: newOrderForm.shippingType,
      hasLiquid: newOrderForm.hasLiquid,
      notes: newOrderForm.notes,
      assignedTo: newOrderForm.assignedTo,
      parcelId: newOrderForm.parcelId || null,
      tags: tagsArray,
      source: newOrderForm.source
    });

    // Reset Form
    setNewOrderForm({
      contact: '',
      productName: '',
      costPrice: 0,
      clientPrice: 0,
      orderStatus: OrderStatus.NEW,
      paymentStatus: PaymentStatus.UNPAID,
      shippingStatus: ShippingStatus.NOT_SHIPPED,
      shippingType: 'Англия Экспресс',
      hasLiquid: false,
      notes: '',
      assignedTo: 'mem-ilya',
      parcelId: '',
      rawTags: '',
      source: 'Telegram'
    });

    setIsAddModalOpen(false);
  };

  // Edit action from the slide detail panel
  const saveDrawerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    onUpdateOrder({
      ...selectedOrder,
      updatedAt: new Date().toISOString()
    });
    setIsEditMode(false);
    setSelectedOrder(null);
  };

  const triggerDeleteFromDrawer = () => {
    if (!selectedOrder) return;
    if (confirm(`Вы уверены, что хотите удалить заказ ${selectedOrder.id} без возможности восстановления?`)) {
      onDeleteOrder(selectedOrder.id);
      setSelectedOrder(null);
    }
  };

  // Helper currency formatters
  const fmt = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  // Premium badge look mapping matching requirements
  const getOrderStatusBadge = (status: OrderStatus) => {
    let colors = '';
    switch (status) {
      case OrderStatus.NEW: 
        colors = 'bg-[#1D2130] text-[#4ea8de] border-[#2C3854]'; 
        break;
      case OrderStatus.IN_PROGRESS: 
        colors = 'bg-[#181C26] text-indigo-400 border-[#2E364A] font-bold'; 
        break;
      case OrderStatus.REDEEMED: 
        colors = 'bg-[#26201B] text-amber-500 border-[#4D3A2B]'; 
        break;
      case OrderStatus.IN_TRANSIT: 
        colors = 'bg-[#291A25] text-pink-400 border-[#5C2B4E]'; 
        break;
      case OrderStatus.WAREHOUSE: 
        colors = 'bg-[#20172B] text-purple-400 border-[#46286B]'; 
        break;
      case OrderStatus.DELIVERED: 
        colors = 'bg-[#0F2220] text-emerald-400 border-[#1C4D44]'; 
        break;
      case OrderStatus.CLOSED: 
        colors = 'bg-[#161719] text-[#8E939E] border-[#292B2F]'; 
        break;
      case OrderStatus.CANCELLED: 
        colors = 'bg-rose-950/20 text-rose-450 border-rose-900/30 line-through'; 
        break;
      case OrderStatus.PROBLEM: 
        colors = 'bg-red-950/40 text-red-400 border-red-800/40 animate-pulse font-bold'; 
        break;
      default: 
        colors = 'bg-slate-900 text-slate-400 border-slate-700';
    }
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold tracking-tight border ${colors}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (p: PaymentStatus) => {
    let style = '';
    switch (p) {
      case PaymentStatus.PAID: 
        style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'; 
        break;
      case PaymentStatus.PARTIALLY_PAID: 
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; 
        break;
      case PaymentStatus.UNPAID: 
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold'; 
        break;
      case PaymentStatus.DEFERRED: 
        style = 'bg-sky-500/10 text-sky-400 border-sky-500/25'; 
        break;
      case PaymentStatus.REFUNDED: 
        style = 'bg-zinc-800 text-zinc-400 border-zinc-700'; 
        break;
      default: 
        style = 'bg-slate-950 text-slate-400 border-transparent';
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${style}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER & CONTROL ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>База Заказов клиентов / CRM</span>
          </h2>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Управление заказами, выкупами, финансами, привязкой к посылкам и логистическими кураторами.
          </p>
        </div>

        {currentRole === 'readonly' || currentRole === 'logistics' ? (
          <div className="flex items-center space-x-2 bg-slate-800/25 border border-slate-700/50 px-3 py-2.5 rounded-lg text-slate-400 font-mono text-[10px] uppercase font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Режим редактирования ограничен ({currentRole})</span>
          </div>
        ) : (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center space-x-2 font-mono font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all ${
              darkMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/10' 
                : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-800/10'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Добавить Заказ в CRM</span>
          </button>
        )}
      </div>

      {/* STATISTICAL LEDGER RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Позиций найдено</span>
          <h4 className="text-xl font-bold font-mono text-white mt-1">{filteredOrders.length} / {orders.length} шт.</h4>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Активная выборка фильтра</span>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Выручка (Объем продаж)</span>
          <h4 className="text-xl font-bold font-mono text-white mt-1">{fmt(totalVolumeInRub)}</h4>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Сумма прайса клиентов</span>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Стоимость Выкупа</span>
          <h4 className="text-xl font-bold font-mono text-[#A1A5B3] mt-1">{fmt(totalCostInRub)}</h4>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Сумма себестоимости выкупа</span>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-250'}`}>
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Дельта прибыли (Маржа)</span>
          <h4 className={`text-xl font-bold font-mono mt-1 ${calculatedMargin >= 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
            {fmt(calculatedMargin)}
          </h4>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">До налога и логистической пошлины</span>
        </div>
      </div>

      {/* ADVANCED RE-STYLED FILTER PANEL */}
      <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
        darkMode ? 'bg-[#11131A] border-[#1D212A]' : 'bg-white border-slate-300'
      }`}>
        <div className="flex items-center space-x-2 text-slate-350 text-xs font-mono font-bold uppercase pb-1 border-b border-dashed border-slate-700/20">
          <Filter className="h-3.5 w-3.5 text-emerald-400" />
          <span>Быстрые фильтры оператора:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Search Input */}
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#585E6A]">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по контакту, ID, тегам..."
              className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-[#ECEFF4] placeholder-[#5A6072]' : 'bg-slate-50 border-[#E2E8F0]'
              }`}
            />
          </div>

          {/* Status Select Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg focus:outline-none border font-semibold ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-[#E2E8F0]'
              }`}
            >
              <option value="ALL">Все статусы заказа ({orders.length})</option>
              {Object.values(OrderStatus).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg focus:outline-none border font-semibold ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-[#E2E8F0]'
              }`}
            >
              <option value="ALL">Вся оплата</option>
              {Object.values(PaymentStatus).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Curator Manager Filter */}
          <div>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg focus:outline-none border font-semibold ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-[#E2E8F0]'
              }`}
            >
              <option value="ALL">Все кураторы</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Has Liquid filter */}
          <div>
            <select
              value={liquidFilter}
              onChange={(e) => setLiquidFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg focus:outline-none border font-semibold ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-slate-300' : 'bg-slate-50 border-[#E2E8F0]'
              }`}
            >
              <option value="ALL">Жидкость: Любая</option>
              <option value="YES">Да (Liquid items only)</option>
              <option value="NO">Нет (Regular items only)</option>
            </select>
          </div>

          {/* Month Period Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg focus:outline-none border font-semibold ${
                darkMode ? 'bg-[#0B0D12] border-[#222735] text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 border-[#E2E8F0] text-emerald-700'
              }`}
            >
              <option value="ALL">Все периоды (За все время)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthName(m)}</option>
              ))}
            </select>
          </div>

        </div>

        {/* BULK ACTION PANEL (Only displayed on selections) */}
        {selectedOrderIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg text-xs font-mono border bg-indigo-950/25 border-indigo-500/20 text-[#D4D6E0] animate-fadeIn">
            <div className="flex items-center space-x-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>ВЫБРАННЫЕ ДЛЯ ГРУППОВОЙ КОРРЕКТИРОВКИ: <strong>{selectedOrderIds.length} ПОЗИЦИЙ</strong></span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[10px] mr-1">ЛОГ СТАТУС:</span>
                <button 
                  onClick={() => handleBulkStatusChange(OrderStatus.REDEEMED)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white px-2 py-1 rounded transition-colors"
                >
                  Выкуплен
                </button>
                <button 
                  onClick={() => handleBulkStatusChange(OrderStatus.IN_TRANSIT)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white px-2 py-1 rounded transition-colors"
                >
                  В пути
                </button>
                <button 
                  onClick={() => handleBulkStatusChange(OrderStatus.DELIVERED)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white px-2 py-1 rounded transition-colors"
                >
                  Выдан
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[10px] mr-1">ОПЛАТА:</span>
                <button 
                  onClick={() => handleBulkPaymentChange(PaymentStatus.PAID)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white px-2 py-1 rounded transition-colors"
                >
                  Оплачен
                </button>
                <button 
                  onClick={() => handleBulkPaymentChange(PaymentStatus.UNPAID)}
                  className="bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white px-2 py-1 rounded transition-colors"
                >
                  УбратьОплату
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CRM HIGH-RESOLUTION OPERATIONS TABLE */}
      <div className={`border rounded-xl overflow-hidden transition-colors ${
        darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-350 bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead className={`border-b text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-[#F9FAFC] border-[#E2E8F0]'
            }`}>
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    className={`rounded focus:ring-0 ${
                      darkMode ? 'border-[#2D354B] bg-[#0A0B0E] text-white' : 'border-slate-350 bg-white text-emerald-600'
                    }`}
                  />
                </th>
                <th className="py-3.5 px-3">Индекс</th>
                <th className="py-3.5 px-4">Клиент в Telegram / CRM</th>
                <th className="py-3.5 px-4">Товары и опции</th>
                <th className="py-3.5 px-4 text-right">Выкуп</th>
                <th className="py-3.5 px-4 text-right">Цена для клиента</th>
                <th className="py-3.5 px-4 text-right">Чистая Дельта</th>
                <th className="py-3.5 px-4">Статус Заказа</th>
                <th className="py-3.5 px-4">Статус Кассы</th>
                <th className="py-3.5 px-4">Куратор</th>
                <th className="py-3.5 px-4 w-12 text-center">Управление</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#1D212A]' : 'divide-[#ECEFF4]'}`}>
              {filteredOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const assignedMember = members.find(m => m.id === order.assignedTo);
                const margin = order.clientPrice - order.costPrice;
                const isUnprofitable = margin < 0;

                return (
                  <tr 
                    key={order.id} 
                    className={`transition-all ${
                      darkMode
                        ? isSelected 
                          ? 'bg-emerald-500/5' 
                          : 'hover:bg-[#151822]'
                        : isSelected 
                          ? 'bg-[#EBFDF5]' 
                          : 'hover:bg-slate-50 shadow-inner'
                    } ${isUnprofitable ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}
                  >
                    {/* Row Selector check */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(order.id)}
                        className={`rounded ${
                          darkMode ? 'border-[#2D354B] bg-[#0A0B0E] text-white' : 'border-slate-350 bg-white text-emerald-650'
                        }`}
                      />
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      <span className="flex flex-col">
                        <span>{order.id}</span>
                        {order.hasLiquid && (
                          <span className="text-[8px] tracking-wide font-extrabold uppercase font-mono text-emerald-400 mt-1">
                            💧 LIQUID
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Client contact info */}
                    <td className="py-3.5 px-4 font-mono">
                      <div>
                        <p className="font-bold text-slate-200">{order.contact}</p>
                        <span className="text-[10px] text-slate-500">Канал: {order.source}</span>
                      </div>
                    </td>

                    {/* Product Name & Tags */}
                    <td className="py-3.5 px-4 font-medium max-w-[220px] truncate">
                      <div>
                        <p className="text-[#ECEFF4] font-bold truncate">{order.productName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.tags.map((tg, i) => (
                            <span key={i} className="text-[8px] bg-[#1E2332] text-slate-400 border border-[#2E364A] px-1.5 py-0.5 rounded font-mono uppercase">
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Cost Purchased */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#8E939E] font-medium">
                      {fmt(order.costPrice)}
                    </td>

                    {/* Sold Cost */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-450 text-emerald-400">
                      {fmt(order.clientPrice)}
                    </td>

                    {/* Net Earnings Markup */}
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${isUnprofitable ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {fmt(margin)}
                    </td>

                    {/* Order Status Badge */}
                    <td className="py-3.5 px-4">
                      {getOrderStatusBadge(order.orderStatus)}
                    </td>

                    {/* Payment Cash Badge */}
                    <td className="py-3.5 px-4">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>

                    {/* Assigned Curator Manager */}
                    <td className="py-3.5 px-4 text-[#8E939E] font-mono font-semibold">
                      <span className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>{assignedMember?.name || 'НЕТ КУРАТОРА'}</span>
                      </span>
                    </td>

                    {/* Interactive Side Drawer Trigger button */}
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => triggerOrderDrawer(order)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          darkMode ? 'bg-[#141722] border-[#222735] hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500 font-mono text-xs">
                    Ни одного контракта не удовлетворяет условиям селекционных фильтров.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD CRM ORDER GLASS-MODAL DIALOG
          ========================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`w-full max-w-xl rounded-xl border p-6 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-[#E2E8F0] text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-sm uppercase font-mono font-bold tracking-wider text-emerald-450 text-emerald-400">
                Новый контракт клиента / CRM Add
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitNewOrderForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Client Nickname/Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">ФИО Клиента / Логин @Telegram</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.contact}
                    onChange={(e) => setNewOrderForm({...newOrderForm, contact: e.target.value})}
                    placeholder="Иван Петров или @PetrovTg"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Источник заказа</label>
                  <select
                    value={newOrderForm.source}
                    onChange={(e) => setNewOrderForm({...newOrderForm, source: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Telegram">Telegram канал</option>
                    <option value="WhatsApp">WhatsApp Messenger</option>
                    <option value="Direct">Личный контакт / Direct</option>
                    <option value="Sheets Import">Sheets Импорт</option>
                  </select>
                </div>
              </div>

              {/* Product Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Наименование товара / Комплектация</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.productName}
                  onChange={(e) => setNewOrderForm({...newOrderForm, productName: e.target.value})}
                  placeholder="Напр. Dyson Airwrap HS05 Complete Long"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cost price Purchasing */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Себестоимость выкупа (руб)</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.costPrice || ''}
                    onChange={(e) => setNewOrderForm({...newOrderForm, costPrice: Number(e.target.value)})}
                    placeholder="24500"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Client Selling Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Цена продажи клиенту (руб)</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.clientPrice || ''}
                    onChange={(e) => setNewOrderForm({...newOrderForm, clientPrice: Number(e.target.value)})}
                    placeholder="38000"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Order Status selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Статус на старте</label>
                  <select
                    value={newOrderForm.orderStatus}
                    onChange={(e) => setNewOrderForm({...newOrderForm, orderStatus: e.target.value as OrderStatus})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {Object.values(OrderStatus).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Start Payment status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Текущий платеж</label>
                  <select
                    value={newOrderForm.paymentStatus}
                    onChange={(e) => setNewOrderForm({...newOrderForm, paymentStatus: e.target.value as PaymentStatus})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {Object.values(PaymentStatus).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Curator Assign */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Куратор сделки</label>
                  <select
                    value={newOrderForm.assignedTo}
                    onChange={(e) => setNewOrderForm({...newOrderForm, assignedTo: e.target.value})}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Sub-elements, tags, liquid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has-liquid"
                    checked={newOrderForm.hasLiquid}
                    onChange={(e) => setNewOrderForm({...newOrderForm, hasLiquid: e.target.checked})}
                    className="rounded text-emerald-600 focus:ring-0 h-4 w-4 bg-[#141722] border-[#222735]"
                  />
                  <label htmlFor="has-liquid" className="text-xs font-mono text-slate-350 cursor-pointer select-none">
                    💧 Содержит парфюм / жидкости (Liquid parcel logic)
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Раздельные теги по умолчанию</label>
                  <input
                    type="text"
                    value={newOrderForm.rawTags}
                    onChange={(e) => setNewOrderForm({...newOrderForm, rawTags: e.target.value})}
                    placeholder="dyson, airwrap, москва"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      darkMode ? 'bg-[#141722] border-[#222735] text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-slate-500">Короткие заметки для СRM / Логистики</label>
                <textarea
                  value={newOrderForm.notes}
                  onChange={(e) => setNewOrderForm({...newOrderForm, notes: e.target.value})}
                  placeholder="Уточнения по выкупу, авиадоставке либо упаковке заменяемых деталей..."
                  rows={2}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                    darkMode ? 'bg-[#141722] border-[#222735] text-white animate-fadeIn' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3.5 pt-4 border-t border-slate-700/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                    darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-700/10"
                >
                  Записать контрагента в БД
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          LATERAL SLIDE PANEL DRAWER (CRM DETAILS)
          ========================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs animate-fadeIn">
          
          {/* Closer container overlay */}
          <div className="flex-1" onClick={() => setSelectedOrder(null)} />

          {/* Drawer sheet container */}
          <div className={`w-full max-w-lg h-full border-l flex flex-col justify-between p-6 shadow-2xl relative ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-slate-300'
          }`}>
            
            {/* Form wrapping whole page for seamless live mutations */}
            <form onSubmit={saveDrawerEdit} className="h-full flex flex-col justify-between">
              
              <div>
                {/* Brand header panel of order */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/20">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15 px-2 py-0.5 rounded">
                      CRM_DET_WIDGET
                    </span>
                    <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-[#A1A5B3]">
                      Сделка {selectedOrder.id}
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded bg-[#141722] hover:bg-slate-800 text-slate-400 border border-[#222735]"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Sub-body parameters */}
                <div className="py-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                  
                  {isEditMode ? (
                    // ====== EDIT MODE FORM FIELD INTERFACES ======
                    <div className="space-y-4 animate-fadeIn font-sans text-xs">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">ФИО / Контакт Telegram</label>
                        <input 
                          type="text" 
                          required
                          value={selectedOrder.contact}
                          onChange={(e) => setSelectedOrder({...selectedOrder, contact: e.target.value})}
                          className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md outline-none focus:border-indigo-400 text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Выкупаемый товар</label>
                        <input 
                          type="text" 
                          required
                          value={selectedOrder.productName}
                          onChange={(e) => setSelectedOrder({...selectedOrder, productName: e.target.value})}
                          className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md outline-none focus:border-indigo-400 text-white font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Себестоимость (RUB)</label>
                          <input 
                            type="number" 
                            required
                            value={selectedOrder.costPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSelectedOrder({
                                ...selectedOrder, 
                                costPrice: val,
                                margin: selectedOrder.clientPrice - val
                              });
                            }}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md outline-none text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Прайс клиента (RUB)</label>
                          <input 
                            type="number" 
                            required
                            value={selectedOrder.clientPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSelectedOrder({
                                ...selectedOrder, 
                                clientPrice: val,
                                margin: val - selectedOrder.costPrice
                              });
                            }}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md outline-none text-white font-mono font-bold text-emerald-450"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-[#A1A5B3]">Менеджер сделки</label>
                          <select
                            value={selectedOrder.assignedTo}
                            onChange={(e) => setSelectedOrder({...selectedOrder, assignedTo: e.target.value})}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md text-slate-200 outline-none"
                          >
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-[#A1A5B3]">Сборная коробка ID</label>
                          <select
                            value={selectedOrder.parcelId || ''}
                            onChange={(e) => setSelectedOrder({...selectedOrder, parcelId: e.target.value || null})}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md text-slate-200 outline-none font-mono"
                          >
                            <option value="">Без сборной посылки</option>
                            {parcels.map(p => (
                              <option key={p.id} value={p.id}>{p.id} - {p.title.slice(0, 20)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-500">Lifecycle статус</label>
                          <select
                            value={selectedOrder.orderStatus}
                            onChange={(e) => setSelectedOrder({...selectedOrder, orderStatus: e.target.value as OrderStatus})}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md text-slate-200 text-xs font-semibold"
                          >
                            {Object.values(OrderStatus).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-500">Статус Оплаты</label>
                          <select
                            value={selectedOrder.paymentStatus}
                            onChange={(e) => setSelectedOrder({...selectedOrder, paymentStatus: e.target.value as PaymentStatus})}
                            className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md text-white font-semibold"
                          >
                            {Object.values(PaymentStatus).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-500">Заметки оператора</label>
                        <textarea
                          value={selectedOrder.notes || ''}
                          onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-[#141722] border border-[#222735] rounded-md text-slate-200 outline-none text-xs"
                        />
                      </div>

                    </div>
                  ) : (
                    // ====== READ ONLY METADATA INSPECTOR ======
                    <div className="space-y-5 animate-fadeIn font-mono text-[11px]">
                      
                      {/* Grid representing basic business telemetry */}
                      <div className="bg-[#141722] border border-[#222735] rounded-xl p-4 space-y-3.5">
                        <h4 className="font-bold text-xs text-white border-b border-[#222735] pb-1.5 flex items-center justify-between">
                          <span>ОПЕРАЦИОННЫЙ ЛИСТ</span> 
                          <span className="text-[9px] text-[#8E939E]">CSC-AUDIT_v1</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Получатель в Telegram:</span>
                            <span className="text-slate-200 text-xs font-bold font-sans mt-0.5 block">{selectedOrder.contact}</span>
                          </div>
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Индекс куратора:</span>
                            <span className="text-slate-200 mt-0.5 block font-bold">{members.find(m => m.id === selectedOrder.assignedTo)?.name || 'Не назначен'}</span>
                          </div>
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Канал привлечения:</span>
                            <span className="text-slate-400 mt-0.5 block">{selectedOrder.source}</span>
                          </div>
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Сборный грузовой бокс:</span>
                            <span className="text-indigo-400 mt-0.5 block font-bold">
                              {selectedOrder.parcelId ? `${selectedOrder.parcelId} 📦` : 'ОЖИДАЕТ РАСПРЕДЕЛЕНИЯ'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Тип Авиа-Доставки:</span>
                            <span className="text-pink-400 mt-0.5 block font-bold">{selectedOrder.shippingType}</span>
                          </div>
                          <div>
                            <span className="text-[#585E6A] block text-[9px] font-bold uppercase">Опции Парфюмерии:</span>
                            <span className="text-slate-300 mt-0.5 block">
                              {selectedOrder.hasLiquid ? '🔴 СОДЕРЖИТ СБОРНУЮ ЖИДКОСТЬ' : 'Regular cargo box'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial billing ledger */}
                      <div className="bg-[#141722] border border-[#222735] rounded-xl p-4 space-y-3.5">
                        <h4 className="font-bold text-xs text-white border-b border-[#222735] pb-1.5">ФИНАНСОВЫЙ БЮДЖЕТ (MONETARY BALANCE)</h4>
                        
                        <div className="space-y-2 text-xs font-sans">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Стоимость выкупа (Себестоимость):</span>
                            <span className="font-mono font-bold text-white">{fmt(selectedOrder.costPrice)}</span>
                          </div>

                          <div className="flex justify-between items-center text-slate-400">
                            <span>Прайс для клиента (Выручка):</span>
                            <span className="font-mono font-bold text-indigo-300">{fmt(selectedOrder.clientPrice)}</span>
                          </div>

                          <div className="h-0.5 bg-[#222735]" />

                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">Вычисленная маржа (Валовая прибыль):</span>
                            <span className={`font-mono font-bold text-sm ${
                              (selectedOrder.clientPrice - selectedOrder.costPrice) >= 0 ? 'text-emerald-450 text-emerald-400' : 'text-rose-455 text-rose-400'
                            }`}>
                              {fmt(selectedOrder.clientPrice - selectedOrder.costPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Display Status indicators */}
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-slate-500 font-bold block pb-1 text-[9px] uppercase">СТАТУС ИСПОЛНЕНИЯ:</span>
                          <div className="pt-1.5">{getOrderStatusBadge(selectedOrder.orderStatus)}</div>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-500 font-bold block pb-1 text-[9px] uppercase">ИНКАССАЦИОННЫЙ СТАТУС:</span>
                          <div className="pt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                        </div>
                      </div>

                      {/* Display notes */}
                      <div className="bg-slate-900/45 p-3 rounded-lg border border-dashed border-slate-800">
                        <span className="text-slate-500 block text-[9.5px] font-bold uppercase mb-1">МЕМОРАНДУМ ОПЕРАТОРА (NOTES)</span>
                        <p className="text-slate-350 text-xs font-sans leading-relaxed">
                          {selectedOrder.notes || 'Дополнительные операционные пометки отсутствуют. Запись верифицирована.'}
                        </p>
                      </div>

                    </div>
                  )}

                  {/* Operational audits logs stamps */}
                  <div className="pt-3 border-t border-slate-900 font-mono text-[9px] text-slate-500 space-y-1">
                    <p>СОЗДАН: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    {selectedOrder.updatedAt && (
                      <p>ИЗМЕНЕН ОПЕРАТОРОМ: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                    )}
                  </div>

                </div>
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="border-t border-slate-700/20 pt-4 flex items-center justify-between">
                
                {/* Trash delete button */}
                <button
                  type="button"
                  onClick={triggerDeleteFromDrawer}
                  className="flex items-center space-x-1.5 text-xs text-rose-500 hover:text-rose-400 font-mono font-bold transition-colors"
                  title="Удалить безвозвратно"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Уничтожить</span>
                </button>

                <div className="flex items-center space-x-3 font-mono">
                  {isEditMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className={`text-xs px-3.5 py-2.5 rounded-lg font-bold transition-all ${
                          darkMode ? 'bg-zinc-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="text-xs px-4 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-700/10"
                      >
                        Сохранить в реестр
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className={`text-xs px-3.5 py-2.5 rounded-lg font-bold transition-all ${
                          darkMode ? 'bg-zinc-850 hover:bg-zinc-800 text-[#8E939E]' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Закрыть панель
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="text-xs px-4  py-2.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
                      >
                        Редактировать
                      </button>
                    </>
                  )}
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
