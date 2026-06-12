/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Order, 
  Parcel, 
  TeamMember, 
  OrderStatus, 
  PaymentStatus 
} from '../types';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Package, 
  Eye, 
  Check,
  Calendar,
  AlertCircle
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
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  crmStatusFilter?: string;
  setCrmStatusFilter?: (val: string) => void;
  crmPaymentFilter?: string;
  setCrmPaymentFilter?: (val: string) => void;
  crmNegativeMarginFilter?: boolean;
  setCrmNegativeMarginFilter?: (value: boolean) => void;
  openAddModalOnLoad?: boolean;
  onResetAddModalOnLoad?: () => void;
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
  currentRole = 'root',
  onShowToast,
  openAddModalOnLoad = false,
  onResetAddModalOnLoad
}: OrdersViewProps) {
  
  // Local simple filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Modal and drawer controls
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State for Adding
  const [addForm, setAddForm] = useState({
    contact: '',
    productName: '',
    costPrice: '',
    clientPrice: '',
    orderStatus: OrderStatus.NEW,
    paymentStatus: PaymentStatus.UNPAID,
    notes: '',
    assignedTo: 'mem-ilya',
    parcelId: ''
  });

  useEffect(() => {
    if (openAddModalOnLoad) {
      setIsAddModalOpen(true);
      onResetAddModalOnLoad?.();
    }
  }, [openAddModalOnLoad, onResetAddModalOnLoad]);

  // Combined search and basic filter logic
  const searchNormalized = (searchTerm || globalSearch).toLowerCase().trim();
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.id.toLowerCase().includes(searchNormalized) ||
        o.contact.toLowerCase().includes(searchNormalized) ||
        o.productName.toLowerCase().includes(searchNormalized) ||
        (o.notes && o.notes.toLowerCase().includes(searchNormalized));

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Новый') matchesStatus = o.orderStatus === OrderStatus.NEW;
        else if (statusFilter === 'В работе') matchesStatus = o.orderStatus === OrderStatus.IN_PROGRESS;
        else if (statusFilter === 'Закрыт') matchesStatus = o.orderStatus === OrderStatus.CLOSED;
      }

      let matchesPayment = true;
      if (paymentFilter !== 'ALL') {
        if (paymentFilter === 'Оплачен') matchesPayment = o.paymentStatus === PaymentStatus.PAID;
        else if (paymentFilter === 'Не оплачен') matchesPayment = o.paymentStatus === PaymentStatus.UNPAID;
      }

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchNormalized, statusFilter, paymentFilter]);

  // Handle Form changes
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.contact.trim() || !addForm.productName.trim()) {
      onShowToast?.('Заполните поле Контакт и Товар', 'warning');
      return;
    }

    onAddOrder({
      contact: addForm.contact,
      productName: addForm.productName,
      costPrice: Number(addForm.costPrice) || 0,
      clientPrice: Number(addForm.clientPrice) || 0,
      orderStatus: addForm.orderStatus,
      paymentStatus: addForm.paymentStatus,
      shippingStatus: addForm.orderStatus === OrderStatus.CLOSED ? 'Выдан' as any : 'Не отправлен' as any,
      shippingType: 'Англия',
      hasLiquid: false,
      notes: addForm.notes,
      assignedTo: addForm.assignedTo,
      parcelId: addForm.parcelId || null,
      tags: [],
      source: 'CRM'
    });

    onShowToast?.('Заказ добавлен', 'success');
    setIsAddModalOpen(false);
    
    // Reset form
    setAddForm({
      contact: '',
      productName: '',
      costPrice: '',
      clientPrice: '',
      orderStatus: OrderStatus.NEW,
      paymentStatus: PaymentStatus.UNPAID,
      notes: '',
      assignedTo: 'mem-ilya',
      parcelId: ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    onUpdateOrder(selectedOrder);
    setIsEditMode(false);
    onShowToast?.('Заказ обновлен', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите безвозвратно удалить этот заказ?')) {
      onDeleteOrder(id);
      setSelectedOrder(null);
      onShowToast?.('Заказ удален', 'info');
    }
  };

  const fmt = (num: number | undefined) => {
    if (num === undefined || isNaN(num) || num === 0) return '—';
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const formatProductLabel = (name: string): string => {
    if (!name) return '—';
    const trimmed = name.trim();
    if (!trimmed) return '—';

    // Break by common delimiters to see if there are multiple lines or product separators
    const parts = trimmed.split(/[\n,;+]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const first = parts[0];
      const truncFirst = first.length > 25 ? first.slice(0, 25) + '...' : first;
      const count = parts.length - 1;
      return `${truncFirst} + ${count} шт`;
    }

    if (trimmed.length > 40) {
      return trimmed.slice(0, 37) + '...';
    }
    return trimmed;
  };

  return (
    <div className="space-y-4">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            База заказов
          </h2>
          <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Ваш простой интерактивный блокнот для ведения сбыта, цен выкупа, общих маржинальных долей и привязки к посылкам.
          </p>
        </div>

        {currentRole !== 'readonly' ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Создать заказ</span>
          </button>
        ) : (
          <div className="text-[10px] font-mono text-slate-505 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            Доступ только на чтение ({currentRole})
          </div>
        )}
      </div>

      {/* MINI STATS / OVERVIEW (QUITE & SMALL STATUS BAR) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[10.5px] font-mono font-medium text-slate-500 py-1 border-b border-slate-800/10">
        <div>
          Реестр: <span className="text-indigo-400 font-semibold">{filteredOrders.length} строк</span>
        </div>
        <div className="text-[10px] text-slate-600">
          Кликните на любую строку, чтобы открыть полную карточку заказа
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 transition-colors ${
        darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по контакту или товару..."
            className={`w-full pl-8 pr-3 py-1.25 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 ${
              darkMode ? 'bg-[#141722] border-[#222735] text-white placeholder-slate-650' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`text-xs px-2.5 py-1.25 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <option value="ALL">Любой статус заказа</option>
          <option value="Новый">Новый</option>
          <option value="В работе">В работе</option>
          <option value="Закрыт">Закрыт</option>
        </select>

        {/* Payment */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={`text-xs px-2.5 py-1.25 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkMode ? 'bg-[#141722] border-[#222735] text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <option value="ALL">Любой статус оплаты</option>
          <option value="Оплачен">Оплачен</option>
          <option value="Не оплачен">Не оплачен</option>
        </select>
      </div>

      {/* TABLE */}
      <div className={`border rounded-xl overflow-hidden ${
        darkMode ? 'border-[#1D212A] bg-[#0E1015]' : 'border-slate-200 bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b text-slate-500 text-[10px] uppercase font-mono tracking-wider sticky top-0 z-10 ${
              darkMode ? 'bg-[#141722] border-[#1D212A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="py-2.5 px-3 w-12 text-center text-slate-500 font-bold">Код</th>
                <th className="py-2.5 px-3">Контакт</th>
                <th className="py-2.5 px-3">Товар / услуга</th>
                <th className="py-2.5 px-3 text-right">Себестоимость</th>
                <th className="py-2.5 px-3 text-right">Цена клиента</th>
                <th className="py-2.5 px-3 text-right">Маржа</th>
                <th className="py-2.5 px-3">Посылка</th>
                <th className="py-2.5 px-3">Комментарий</th>
                <th className="py-2.5 px-3">Дата</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#1D212A]/50' : 'divide-slate-200'}`}>
              {filteredOrders.map((o) => {
                const margin = o.clientPrice - o.costPrice;
                const hasMarginDiff = (o.clientPrice !== 0 && o.costPrice !== 0);

                return (
                  <tr 
                    key={o.id}
                    onClick={() => { setSelectedOrder(o); setIsEditMode(false); }}
                    className={`cursor-pointer transition-colors border-b select-none ${
                      darkMode 
                        ? 'border-[#141722] hover:bg-[#141722]/60' 
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-500 text-center text-[11px]">
                      {o.id.replace('ORD-', '')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white font-mono text-[11.5px] max-w-[120px] truncate" title={o.contact}>
                      {o.contact || <span className="text-slate-600 font-normal">—</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-medium text-[11.5px] max-w-[200px] truncate" title={o.productName}>
                      {formatProductLabel(o.productName)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400 text-[11.5px]">
                      {o.costPrice ? fmt(o.costPrice) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#4ade80] font-bold text-[11.5px]">
                      {o.clientPrice ? fmt(o.clientPrice) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold text-[11.5px] ${
                      margin >= 0 ? 'text-indigo-400' : 'text-rose-450'
                    }`}>
                      {hasMarginDiff ? fmt(margin) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px]">
                      {o.parcelId ? (
                        <span className="bg-indigo-950/40 text-indigo-400 border border-indigo-500/15 px-1.5 py-0.5 rounded font-bold">
                          {o.parcelId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 truncate max-w-[130px] text-[11px]" title={o.notes}>
                      {o.notes || <span className="text-slate-650">—</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedOrder(o); setIsEditMode(false); }}
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded transition-all active:scale-95 border ${
                          darkMode 
                            ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 hover:text-white hover:bg-indigo-600 hover:border-indigo-600' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:text-white hover:bg-indigo-600 hover:border-indigo-600'
                        }`}
                        title="Посмотреть подробности"
                      >
                        <Eye className="h-3 w-3" />
                        <span className="text-[9.5px] uppercase font-mono font-bold tracking-tight">Детали</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 italic font-mono">
                    Заказы не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`w-full max-w-md rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#222735] text-white' : 'bg-white border-slate-250 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-divider border-slate-700/20 pb-3 mb-4">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-400">
                Создать новый заказ
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Контакт (Telegram или имя):</label>
                <input
                  type="text"
                  required
                  value={addForm.contact}
                  onChange={(e) => setAddForm({...addForm, contact: e.target.value})}
                  placeholder="Например, @tim_vetrov"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Товар / услуга:</label>
                <input
                  type="text"
                  required
                  value={addForm.productName}
                  onChange={(e) => setAddForm({...addForm, productName: e.target.value})}
                  placeholder="Например, Celine Triomphe Sunglasses"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Себестоимость выкупа (руб):</label>
                  <input
                    type="number"
                    value={addForm.costPrice}
                    onChange={(e) => setAddForm({...addForm, costPrice: e.target.value})}
                    placeholder="Напр. 9500"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Цена для клиента (руб):</label>
                  <input
                    type="number"
                    value={addForm.clientPrice}
                    onChange={(e) => setAddForm({...addForm, clientPrice: e.target.value})}
                    placeholder="Напр. 13500"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Статус заказа:</label>
                  <select
                    value={addForm.orderStatus}
                    onChange={(e) => setAddForm({...addForm, orderStatus: e.target.value as OrderStatus})}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-slate-200' : 'bg-slate-50 border border-slate-250'
                    }`}
                  >
                    <option value={OrderStatus.NEW}>Новый</option>
                    <option value={OrderStatus.IN_PROGRESS}>В работе</option>
                    <option value={OrderStatus.CLOSED}>Закрыт</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-250 block font-bold">Оплата:</label>
                  <select
                    value={addForm.paymentStatus}
                    onChange={(e) => setAddForm({...addForm, paymentStatus: e.target.value as PaymentStatus})}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-slate-200' : 'bg-slate-50 border border-slate-250'
                    }`}
                  >
                    <option value={PaymentStatus.UNPAID}>Не оплачен</option>
                    <option value={PaymentStatus.PAID}>Оплачен</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Куратор:</label>
                <select
                  value={addForm.assignedTo}
                  onChange={(e) => setAddForm({...addForm, assignedTo: e.target.value})}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg focus:outline-none ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-slate-200' : 'bg-slate-50 border border-slate-250'
                  }`}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Связать с коробкой Англии:</label>
                <select
                  value={addForm.parcelId}
                  onChange={(e) => setAddForm({...addForm, parcelId: e.target.value})}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg focus:outline-none ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-slate-200' : 'bg-slate-50 border border-slate-250'
                  }`}
                >
                  <option value="">Без сборной посылки</option>
                  {parcels.map(p => (
                    <option key={p.id} value={p.id}>{p.id} ({p.title})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Комментарий:</label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({...addForm, notes: e.target.value})}
                  placeholder="Дополнительные детали..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="flex gap-3.5 pt-3.5 border-t border-slate-700/20 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                    darkMode ? 'bg-zinc-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg text-xs font-semibold text-white"
                >
                  Создать заказ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SIDE DRAWER FOR DETAILED INSPECTION & EDIT */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="flex-1" onClick={() => setSelectedOrder(null)} />
          
          <div className={`w-full max-w-sm h-full flex flex-col justify-between p-6 shadow-xl border-l ${
            darkMode ? 'bg-[#0E1015] border-[#1D212A] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <form onSubmit={handleEditSubmit} className="h-full flex flex-col justify-between">
              
              <div className="space-y-5 overflow-y-auto pr-1">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/20">
                  <span className="text-xs uppercase font-mono font-bold text-indigo-400">
                    Детали заказа ({selectedOrder.id})
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedOrder(null)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {isEditMode ? (
                  // EDITING IN DRAWER
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Контакт:</label>
                      <input
                        type="text"
                        required
                        value={selectedOrder.contact}
                        onChange={(e) => setSelectedOrder({...selectedOrder, contact: e.target.value})}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Товар / услуга:</label>
                      <input
                        type="text"
                        required
                        value={selectedOrder.productName}
                        onChange={(e) => setSelectedOrder({...selectedOrder, productName: e.target.value})}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold font-bold">Себестоимость:</label>
                        <input
                          type="number"
                          value={selectedOrder.costPrice}
                          onChange={(e) => setSelectedOrder({...selectedOrder, costPrice: Number(e.target.value)})}
                          className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Цена клиента:</label>
                        <input
                          type="number"
                          value={selectedOrder.clientPrice}
                          onChange={(e) => setSelectedOrder({...selectedOrder, clientPrice: Number(e.target.value)})}
                          className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white font-bold text-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Статус заказа:</label>
                        <select
                          value={selectedOrder.orderStatus}
                          onChange={(e) => setSelectedOrder({...selectedOrder, orderStatus: e.target.value as OrderStatus})}
                          className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                        >
                          <option value={OrderStatus.NEW}>Новый</option>
                          <option value={OrderStatus.IN_PROGRESS}>В работе</option>
                          <option value={OrderStatus.CLOSED}>Закрыт</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Оплата:</label>
                        <select
                          value={selectedOrder.paymentStatus}
                          onChange={(e) => setSelectedOrder({...selectedOrder, paymentStatus: e.target.value as PaymentStatus})}
                          className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                        >
                          <option value={PaymentStatus.UNPAID}>Не оплачен</option>
                          <option value={PaymentStatus.PAID}>Оплачен</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Связанная коробка:</label>
                      <select
                        value={selectedOrder.parcelId || ''}
                        onChange={(e) => setSelectedOrder({...selectedOrder, parcelId: e.target.value || null})}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white font-mono"
                      >
                        <option value="">Без сборной посылки</option>
                        {parcels.map(p => (
                          <option key={p.id} value={p.id}>{p.id} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Комментарий:</label>
                      <textarea
                        value={selectedOrder.notes || ''}
                        onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                        rows={3}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#141722] border border-[#222735] rounded-lg text-white"
                      />
                    </div>
                  </div>
                ) : (
                  // READ-ONLY DISPLAY IN DRAWER
                  <div className="space-y-4 text-xs font-sans">
                    
                    <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Покупатель:</span>
                      <p className="font-bold text-white text-sm mt-0.5 font-mono">{selectedOrder.contact}</p>
                    </div>

                    <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Товар / Услуга (Полное наименование):</span>
                      <p className="text-slate-200 text-xs font-medium mt-1 leading-relaxed bg-[#0E1015] p-2 rounded border border-[#2D3343]/30 whitespace-pre-wrap select-all font-mono">
                        {selectedOrder.productName}
                      </p>
                    </div>

                    <div className="p-3 bg-[#141722] rounded-lg border border-[#222735] space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Себестоимость выкупа:</span>
                        <span className="font-mono text-white font-semibold">{fmt(selectedOrder.costPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Стоимость продажи:</span>
                        <span className="font-mono text-emerald-400 font-bold">{fmt(selectedOrder.clientPrice)}</span>
                      </div>
                      <div className="h-px bg-slate-800/60" />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">Чистая Маржа:</span>
                          <span className={`font-mono ${
                            (selectedOrder.clientPrice - selectedOrder.costPrice) >= 0 ? 'text-indigo-400' : 'text-rose-400'
                          }`}>
                            {fmt(selectedOrder.clientPrice - selectedOrder.costPrice)}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-500 text-right leading-none">
                          Формула: {selectedOrder.clientPrice || 0} ₽ - {selectedOrder.costPrice || 0} ₽
                        </div>
                        {selectedOrder.clientPrice > 0 && (
                          <div className="text-[9.5px] font-mono text-indigo-400/80 text-right leading-none pt-1">
                            Рентабельность: {(((selectedOrder.clientPrice - selectedOrder.costPrice) / selectedOrder.clientPrice) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                        <span className="text-[10px] uppercase font-mono text-slate-550 block font-semibold">Статус заказа:</span>
                        <span className="text-indigo-400 font-bold font-mono text-xs block mt-1">{selectedOrder.orderStatus}</span>
                      </div>
                      <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                        <span className="text-[10px] uppercase font-mono text-slate-550 block font-semibold">Оплата:</span>
                        <span className="text-emerald-400 font-bold font-mono text-xs block mt-1">{selectedOrder.paymentStatus}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                      <span className="text-[10px] uppercase font-mono text-slate-550 block font-semibold">Связанная коробка Англии:</span>
                      <span className="font-mono text-slate-200 mt-1 block">
                        {selectedOrder.parcelId ? (
                          <span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                            📦 {selectedOrder.parcelId}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">Не привязан к коробке</span>
                        )}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141722] rounded-lg border border-[#222735]">
                      <span className="text-[10px] uppercase font-mono text-slate-550 block font-semibold">Источник данных:</span>
                      <span className="font-mono text-slate-350 block mt-1">
                        {selectedOrder.source === 'SHEET' ? (
                          <span className="text-amber-400 font-semibold">📊 Google Таблица / Импорт</span>
                        ) : (
                          <span className="text-sky-400 font-semibold">💻 Добавлено вручную</span>
                        )}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Бухгалтерские пометки / Комментарии:</span>
                      <p className="text-slate-300 mt-1 italic whitespace-pre-wrap">{selectedOrder.notes || '—'}</p>
                    </div>

                  </div>
                )}
                
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-slate-700/20 pt-4 flex items-center justify-between">
                {currentRole !== 'readonly' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedOrder.id)}
                    className="flex items-center space-x-1 text-xs text-rose-500 hover:text-rose-400 font-bold font-mono transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Удалить</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2 font-mono">
                  {isEditMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className={`text-xs px-3 py-1.5 rounded font-bold ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded"
                      >
                        Сохранить
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className={`text-xs px-3 py-1.5 rounded font-bold ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Закрыть
                      </button>
                      
                      {currentRole !== 'readonly' && (
                        <button
                          type="button"
                          onClick={() => setIsEditMode(true)}
                          className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded"
                        >
                          Редактировать
                        </button>
                      )}
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
