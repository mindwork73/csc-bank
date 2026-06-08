/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Parcel, 
  ParcelStatus, 
  Order, 
  TeamMember,
  BrokerItem,
  BrokerShipment
} from '../types';
import { 
  Package, 
  Plus, 
  Grid, 
  List, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  User, 
  Coins, 
  CheckCircle,
  X,
  Search,
  Filter,
  Check,
  Trash2,
  Edit,
  Layers,
  ArrowRight,
  Truck,
  FileText,
  CheckSquare,
  Square,
  Activity
} from 'lucide-react';

interface ParcelsViewProps {
  parcels: Parcel[];
  orders: Order[];
  members: TeamMember[];
  onAddParcel: (parcel: Omit<Parcel, 'id' | 'createdAt' | 'shippingFeeLocal'>) => void;
  onUpdateParcel: (parcel: Parcel) => void;
  onDeleteParcel: (id: string) => void;
  defaultExchangeRate: number;
  darkMode?: boolean;

  brokerItems: BrokerItem[];
  brokerShipments: BrokerShipment[];
  onAddBrokerItem: (item: Omit<BrokerItem, 'id'>) => void;
  onUpdateBrokerItem: (item: BrokerItem) => void;
  onDeleteBrokerItem: (id: string) => void;
  onAddBrokerShipment: (shipment: Omit<BrokerShipment, 'id' | 'createdAt'>) => void;
  onUpdateBrokerShipment: (shipment: BrokerShipment) => void;
  onDeleteBrokerShipment: (id: string) => void;
}

export default function ParcelsView({
  parcels,
  orders,
  members,
  onAddParcel,
  onUpdateParcel,
  onDeleteParcel,
  defaultExchangeRate,
  darkMode = true,

  brokerItems = [],
  brokerShipments = [],
  onAddBrokerItem,
  onUpdateBrokerItem,
  onDeleteBrokerItem,
  onAddBrokerShipment,
  onUpdateBrokerShipment,
  onDeleteBrokerShipment
}: ParcelsViewProps) {
  // Navigation tabs of Logistics panel
  const [activeTab, setActiveTab] = useState<'warehouse' | 'shipments' | 'legacy-boxes'>('warehouse');

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  // New states for Warehouse Items & Shipments
  const [isAddBrokerItemOpen, setIsAddBrokerItemOpen] = useState(false);
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  const [editingBrokerItem, setEditingBrokerItem] = useState<BrokerItem | null>(null);
  const [editingShipment, setEditingShipment] = useState<BrokerShipment | null>(null);

  // Filter Panels states for Broker Items
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'liquid'>('all');
  const [filterShipment, setFilterShipment] = useState<'all' | 'bound' | 'unbound'>('all');
  const [filterCurator, setFilterCurator] = useState<string>('all');
  const [filterContact, setFilterContact] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Form states for legacy parcel
  const [newParcelForm, setNewParcelForm] = useState({
    title: '',
    parcelType: 'regular' as 'regular' | 'liquid',
    shippingFeeGbp: 5,
    exchangeRate: defaultExchangeRate,
    containsLiquid: false,
    status: ParcelStatus.CREATED,
    notes: '',
    trackingCode: '',
    assignedTo: 'mem-ilya'
  });

  // Form states for Broker Item Intake
  const [newBrokerItemForm, setNewBrokerItemForm] = useState({
    title: '',
    contact: '',
    orderId: '',
    quantity: 1,
    comment: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    paid: false,
    itemType: 'normal' as 'normal' | 'liquid',
    feeGbp: 5,
    assignedTo: 'mem-ilya',
    shipmentId: ''
  });

  // Form states for Shipment Build
  const [newShipmentForm, setNewShipmentForm] = useState({
    status: 'Редактируется' as 'Редактируется' | 'Отправлена' | 'Получена' | 'Закрыта',
    assignedTo: 'mem-ilya',
    shippingFeeGbp: 21,
    notes: ''
  });

  // Helpers
  const getMemberName = (id: string | null) => {
    if (!id) return 'Не назначен';
    return members.find(m => m.id === id)?.name || 'Не назначен';
  };

  const gbpFormat = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
  };

  const rubFormat = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // State calculations for SUMMARY WIDGETS
  const totalArrivedBrokerItems = brokerItems.length;
  const unpaidCount = brokerItems.filter(item => !item.paid).length;
  const paidCount = brokerItems.filter(item => item.paid).length;
  const normalItemsCount = brokerItems.filter(item => item.itemType === 'normal').length;
  const liquidItemsCount = brokerItems.filter(item => item.itemType === 'liquid').length;
  const totalBrokerGbpFees = brokerItems.reduce((sum, item) => sum + (Number(item.feeGbp) || 0), 0);
  const totalShipmentsCount = brokerShipments.length;
  const totalShipmentGbpFees = brokerShipments.reduce((sum, ship) => sum + (Number(ship.shippingFeeGbp) || 0), 0);

  // Filter logic for Broker items
  const filteredBrokerItems = useMemo(() => {
    return brokerItems.filter(item => {
      // 1. Text Search query
      const matchText = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.contact.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchText) return false;

      // 2. Paid status
      if (filterPaid === 'paid' && !item.paid) return false;
      if (filterPaid === 'unpaid' && item.paid) return false;

      // 3. Item type
      if (filterType === 'normal' && item.itemType !== 'normal') return false;
      if (filterType === 'liquid' && item.itemType !== 'liquid') return false;

      // 4. Shipment bounds
      if (filterShipment === 'bound' && !item.shipmentId) return false;
      if (filterShipment === 'unbound' && item.shipmentId) return false;

      // 5. Curator
      if (filterCurator !== 'all' && item.assignedTo !== filterCurator) return false;

      // 6. Contact specifically
      if (filterContact && !item.contact.toLowerCase().includes(filterContact.toLowerCase())) return false;

      // 7. Date period
      if (filterStartDate && item.arrivalDate < filterStartDate) return false;
      if (filterEndDate && item.arrivalDate > filterEndDate) return false;

      return true;
    });
  }, [brokerItems, searchQuery, filterPaid, filterType, filterShipment, filterCurator, filterContact, filterStartDate, filterEndDate]);

  // Legacy box calculations
  const totalFreightCostGbp = parcels.reduce((sum, p) => sum + Number(p.shippingFeeGbp), 0);
  const totalFreightCostRub = parcels.reduce((sum, p) => sum + (Number(p.shippingFeeGbp) * (p.exchangeRate || defaultExchangeRate)), 0);

  const getStatusColor = (status: ParcelStatus) => {
    switch (status) {
      case ParcelStatus.CREATED: return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case ParcelStatus.AWAITING: return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case ParcelStatus.SENT: return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case ParcelStatus.UK_WAREHOUSE: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case ParcelStatus.IN_TRANSIT: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case ParcelStatus.SORTING: return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      case ParcelStatus.ARRIVED: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case ParcelStatus.ISSUED: return 'text-slate-400 bg-slate-500/15 border-slate-500/10';
      case ParcelStatus.CLOSED: return 'text-indigo-300 bg-indigo-500/5 border-indigo-500/10';
      case ParcelStatus.PROBLEM: return 'text-red-400 bg-red-500/15 border-red-500/35';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  // Handlers
  const handleLegacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParcelForm.title) {
      alert('Заполните название посылки!');
      return;
    }

    onAddParcel({
      title: newParcelForm.title,
      parcelType: newParcelForm.parcelType,
      shippingFeeGbp: Number(newParcelForm.shippingFeeGbp) || 5,
      exchangeRate: Number(newParcelForm.exchangeRate) || defaultExchangeRate,
      containsLiquid: newParcelForm.containsLiquid,
      status: newParcelForm.status,
      notes: newParcelForm.notes,
      assignedTo: newParcelForm.assignedTo,
      trackingCode: newParcelForm.trackingCode,
      sentAt: newParcelForm.status === ParcelStatus.SENT ? new Date().toISOString() : null,
      arrivedAt: null
    });

    setNewParcelForm({
      title: '',
      parcelType: 'regular',
      shippingFeeGbp: 5,
      exchangeRate: defaultExchangeRate,
      containsLiquid: false,
      status: ParcelStatus.CREATED,
      notes: '',
      trackingCode: '',
      assignedTo: 'mem-ilya'
    });
    setIsAddModalOpen(false);
  };

  const handleAddBrokerItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrokerItemForm.title) {
      alert('Укажите название поступившего товара!');
      return;
    }

    onAddBrokerItem({
      title: newBrokerItemForm.title,
      contact: newBrokerItemForm.contact || '@unknown',
      orderId: newBrokerItemForm.orderId || null,
      quantity: Number(newBrokerItemForm.quantity) || 1,
      comment: newBrokerItemForm.comment,
      arrivalDate: newBrokerItemForm.arrivalDate,
      paid: newBrokerItemForm.paid,
      itemType: newBrokerItemForm.itemType,
      feeGbp: newBrokerItemForm.itemType === 'liquid' ? 10 : 5,
      assignedTo: newBrokerItemForm.assignedTo,
      shipmentId: newBrokerItemForm.shipmentId || null
    });

    setNewBrokerItemForm({
      title: '',
      contact: '',
      orderId: '',
      quantity: 1,
      comment: '',
      arrivalDate: new Date().toISOString().split('T')[0],
      paid: false,
      itemType: 'normal',
      feeGbp: 5,
      assignedTo: 'mem-ilya',
      shipmentId: ''
    });
    setIsAddBrokerItemOpen(false);
  };

  const handleAddShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBrokerShipment({
      status: newShipmentForm.status,
      assignedTo: newShipmentForm.assignedTo,
      shippingFeeGbp: Number(newShipmentForm.shippingFeeGbp) ?? 21,
      notes: newShipmentForm.notes
    });

    setNewShipmentForm({
      status: 'Редактируется',
      assignedTo: 'mem-ilya',
      shippingFeeGbp: 21,
      notes: ''
    });
    setIsAddShipmentOpen(false);
  };

  const toggleBrokerItemPaid = (item: BrokerItem) => {
    onUpdateBrokerItem({
      ...item,
      paid: !item.paid
    });
  };

  const handleUpdateBrokerItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrokerItem) {
      onUpdateBrokerItem(editingBrokerItem);
      setEditingBrokerItem(null);
    }
  };

  const handleUpdateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShipment) {
      onUpdateBrokerShipment(editingShipment);
      setEditingShipment(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION LOGISTICS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-400" />
            <span>Логистическая консоль Англии / UK Warehouse & Shipments</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Складской учет у посредника в Англии и формирование общих отправлений. Стоимость доставки сборной коробки — <strong className="text-emerald-400 font-mono">£21</strong>. Сбор посредника за позицию — <strong className="text-amber-400 font-mono">£5 / £10 (Regular/Liquid)</strong>.
          </p>
        </div>

        {/* Console Nav Tabs */}
        <div className={`p-0.5 rounded-lg flex border ${darkMode ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-slate-950 border-slate-850'}`}>
          <button 
            onClick={() => setActiveTab('warehouse')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono tracking-tight transition-colors flex items-center space-x-1.5 ${activeTab === 'warehouse' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="h-3 w-3" />
            <span>Склад в Англии ({totalArrivedBrokerItems})</span>
          </button>
          <button 
            onClick={() => setActiveTab('shipments')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono tracking-tight transition-colors flex items-center space-x-1.5 ${activeTab === 'shipments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="h-3 w-3" />
            <span>Общие отправки ({totalShipmentsCount})</span>
          </button>
          <button 
            onClick={() => setActiveTab('legacy-boxes')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono tracking-tight transition-colors flex items-center space-x-1.5 ${activeTab === 'legacy-boxes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Package className="h-3 w-3" />
            <span>Карго боксы (Legacy)</span>
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: WAREHOUSE COUNTERPART INTAKE */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          
          {/* SUMMARY WIDGETS PANEL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Прибыло посреднику</span>
                <h4 className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalArrivedBrokerItems} <span className="text-xs text-slate-400">позиций</span></h4>
              </div>
              <div className="mt-2 flex space-x-2 text-[10px] font-mono text-slate-500">
                <span className="text-sky-400">{normalItemsCount} Normal</span>
                <span>•</span>
                <span className="text-amber-500">{liquidItemsCount} Liquid</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Оплата сборов</span>
                <h4 className="text-2xl font-bold font-mono text-pink-400 mt-1">{unpaidCount} <span className="text-xs text-slate-400">не оплачено</span></h4>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-450 flex items-center space-x-1">
                <span className="bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded text-[9px]">{paidCount} оплачено</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Общие сборы £5 / £10</span>
                <h4 className="text-2xl font-bold font-mono text-amber-400 mt-1">{gbpFormat(totalBrokerGbpFees)}</h4>
              </div>
              <p className="text-[10px] text-slate-550 font-mono mt-1">
                ≈ {rubFormat(totalBrokerGbpFees * defaultExchangeRate)} по базовому курсу
              </p>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Статус отправки</span>
                <h4 className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                  {brokerItems.filter(i => i.shipmentId).length} / {totalArrivedBrokerItems} <span className="text-xs text-slate-400">в пути</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                {brokerItems.filter(i => !i.shipmentId).length} позиций ждут отправки
              </span>
            </div>
          </div>

          {/* CONTROL & FILTER ACTIONS BAR */}
          <div className={`p-4 rounded-xl border space-y-4 ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/20 border-slate-800'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Поиск товара, контакта или коммента..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:border-indigo-500 font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-[#E5E5E5]' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsAddBrokerItemOpen(true)}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg transition-colors font-mono"
                >
                  <Plus className="h-4 w-4" />
                  <span>Принять товар у посредника</span>
                </button>
              </div>
            </div>

            {/* FULL COMPREHENSIVE FILTER LAYOUT */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2 border-t border-dashed border-slate-800/65">
              
              {/* Paid Filter */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">ОПЛАТА</label>
                <select
                  value={filterPaid}
                  onChange={(e) => setFilterPaid(e.target.value as any)}
                  className={`w-full text-[11px] p-2 rounded border focus:outline-none focus:ring-0 font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="all">Все статусы</option>
                  <option value="paid">Оплачено</option>
                  <option value="unpaid">Не оплачено</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">ТИП ТОВАРА</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className={`w-full text-[11px] p-2 rounded border focus:outline-none focus:ring-0 font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="all">Все типы</option>
                  <option value="normal">Обычный (Regular)</option>
                  <option value="liquid">Жидкий (Liquid)</option>
                </select>
              </div>

              {/* Shipment bound filter */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">ОТПРАВЛЕН</label>
                <select
                  value={filterShipment}
                  onChange={(e) => setFilterShipment(e.target.value as any)}
                  className={`w-full text-[11px] p-2 rounded border focus:outline-none focus:ring-0 font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="all">Все</option>
                  <option value="bound">В отправке</option>
                  <option value="unbound">Ожидает отправки</option>
                </select>
              </div>

              {/* Curator/Responsible filter */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">КУРАТОР СДЛ</label>
                <select
                  value={filterCurator}
                  onChange={(e) => setFilterCurator(e.target.value)}
                  className={`w-full text-[11px] p-2 rounded border focus:outline-none focus:ring-0 font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="all">Все кураторы</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Arrival dates */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">С ДАТЫ</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className={`w-full text-[10px] p-1.5 rounded border focus:outline-none font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              {/* Filter by end date */}
              <div>
                <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1">ПО ДАТУ</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className={`w-full text-[10px] p-1.5 rounded border focus:outline-none font-mono ${
                    darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

            </div>

            {/* Quick reset actions if active */}
            {(searchQuery || filterPaid !== 'all' || filterType !== 'all' || filterShipment !== 'all' || filterCurator !== 'all' || filterStartDate || filterEndDate) && (
              <div className="flex items-center justify-between text-[11px] text-indigo-400 font-mono pt-1">
                <span>Найдено результатов: {filteredBrokerItems.length} позиций</span>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterPaid('all');
                    setFilterType('all');
                    setFilterShipment('all');
                    setFilterCurator('all');
                    setFilterContact('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="hover:underline font-bold flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>

          {/* MAIN WAREHOUSE INTAKE TABLE */}
          <div className={`border rounded-xl overflow-hidden ${
            darkMode ? 'border-[#262626] bg-[#0E0E0E]' : 'border-slate-800 bg-slate-900/25'
          }`}>
            <table className="w-full text-left border-collapse text-xs">
              <thead className={`border-b text-slate-400 font-mono text-[9px] uppercase tracking-wider ${
                darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900 border-slate-800'
              }`}>
                <tr>
                  <th className="py-3.5 px-4">Товар</th>
                  <th className="py-3.5 px-4 font-normal">Контакт / Чей</th>
                  <th className="py-3.5 px-4">Связанный заказ</th>
                  <th className="py-3.5 px-4 text-center">Тип</th>
                  <th className="py-3.5 px-4 text-center">Кол-во</th>
                  <th className="py-3.5 px-4 text-center">Сбор GBP</th>
                  <th className="py-3.5 px-4 text-center">Оплата сбора</th>
                  <th className="py-3.5 px-4">Дата прибытия</th>
                  <th className="py-3.5 px-4">Ответственный</th>
                  <th className="py-3.5 px-4">Статус отправки</th>
                  <th className="py-3.5 px-4">Комментарий</th>
                  <th className="py-3.5 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-slate-350 text-[11px] ${darkMode ? 'divide-[#262626]' : 'divide-slate-800/60'}`}>
                {filteredBrokerItems.map((item) => {
                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors group ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-800/10'}`}
                    >
                      <td className="py-3 px-4 font-sans font-bold text-slate-100 max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        <span className="bg-indigo-950/40 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-500/10 hover:bg-indigo-900/30">
                          {item.contact}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.orderId ? (
                          <span className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                            {item.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-550 italic">Свободный</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-[10px]">
                        {item.itemType === 'liquid' ? (
                          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                            LIQUID
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-bold">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-100">{item.quantity} шт</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-300">
                        {gbpFormat(item.feeGbp)}
                      </td>
                      
                      {/* QUICK INTERACTIVE PAYMENT SWITCH BADGE */}
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => toggleBrokerItemPaid(item)}
                          title="Кликните для быстрой смены статуса оплаты"
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer select-none transition-all ${
                            item.paid 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-red-500/15 border-red-500/35 text-red-400 animate-pulse'
                          }`}
                        >
                          {item.paid ? 'Оплачено' : 'НЕ ОПЛАЧЕНО'}
                        </button>
                      </td>

                      <td className="py-3 px-3.5 text-slate-450">{item.arrivalDate}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        {getMemberName(item.assignedTo).split(' ')[0]}
                      </td>
                      
                      {/* BINDING STATUS COL */}
                      <td className="py-3 px-4">
                        {item.shipmentId ? (
                          <div className="flex items-center space-x-1.5 text-sky-400">
                            <span className="font-bold bg-sky-950/50 border border-sky-400/20 rounded px-1.5 py-0.5">
                              {item.shipmentId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic flex items-center space-x-1">
                            <span>В ожидании сборки</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate group-hover:whitespace-normal group-hover:break-all">
                        {item.comment || '—'}
                      </td>

                      {/* ACTIONS ROW */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingBrokerItem(item)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Редактировать товар"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Вы уверены, что хотите удалить товар у посредника?')) {
                                onDeleteBrokerItem(item.id);
                              }
                            }}
                            className="p-1 rounded bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/15"
                            title="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBrokerItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-slate-500 font-sans">
                      Позиций на складе посредника по данным критериям не обнаружено.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: SHIPMENTS / COLLECTIVE LOGISTICS */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          
          {/* SHIPMENT STATS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Собрано отправок</span>
                <h4 className="text-xl font-bold font-mono text-indigo-300 mt-1">{totalShipmentsCount} отправок</h4>
              </div>
              <Truck className="h-8 w-8 text-indigo-400/20" />
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Сумма логистических затрат</span>
                <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">{gbpFormat(totalShipmentGbpFees)}</h4>
              </div>
              <Coins className="h-8 w-8 text-emerald-400/20" />
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Средняя вместимость</span>
                <h4 className="text-xl font-bold font-mono text-slate-200 mt-1">
                  {totalShipmentsCount ? (brokerItems.filter(i => i.shipmentId).length / totalShipmentsCount).toFixed(1) : 0} позиций / коробка
                </h4>
              </div>
              <Layers className="h-8 w-8 text-slate-400/20" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">Реестр Общих Сводных Отправок (Фикс £21)</h3>
            
            <button
              onClick={() => setIsAddShipmentOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg transition-all font-mono"
            >
              <Plus className="h-4 w-4" />
              <span>Создать и Собрать Отправку</span>
            </button>
          </div>

          {/* SHIPMENT ITEMS BULK BLOCKS */}
          <div className="grid grid-cols-1 gap-6">
            {brokerShipments.map(shipment => {
              const itemsInShipment = brokerItems.filter(item => item.shipmentId === shipment.id);
              const totalItemsGbpFee = itemsInShipment.reduce((sum, item) => sum + (Number(item.feeGbp) || 0), 0);
              
              return (
                <div 
                  key={shipment.id} 
                  className={`rounded-xl border p-5 flex flex-col justify-between ${
                    darkMode ? 'border-[#262626] bg-[#141414]' : 'border-slate-800 bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-dashed border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/20 text-indigo-400">
                          {shipment.id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono tracking-tight uppercase border ${
                          shipment.status === 'Получена' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : shipment.status === 'Отправлена' 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                          {shipment.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                        <span className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          Собрана: {shipment.createdAt}
                        </span>
                        <span className="flex items-center">
                          <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          Ответственный: {getMemberName(shipment.assignedTo)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Cost Analysis block */}
                    <div className="flex space-x-4 pr-1">
                      <div className="text-right border-r border-slate-805 pr-4">
                        <span className="text-[10px] text-slate-500 block font-mono">СТОИМОСТЬ ОТПРАВКИ:</span>
                        <strong className="text-sm font-mono text-emerald-400">{gbpFormat(shipment.shippingFeeGbp)}</strong>
                      </div>
                      <div className="text-right border-r border-slate-805 pr-4">
                        <span className="text-[10px] text-slate-500 block font-mono">СБОР С ПОЗИЦИЙ ({itemsInShipment.length} шт):</span>
                        <strong className="text-xs font-mono text-indigo-400">{gbpFormat(totalItemsGbpFee)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-mono font-bold">ИТОГО ЗАТРАТЫ:</span>
                        <strong className="text-sm font-mono text-white">{gbpFormat(Number(shipment.shippingFeeGbp) + totalItemsGbpFee)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Connected items lists */}
                  <div className="mt-4">
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-2">ПОЗИЦИИ СКЛАДА, ВКЛЮЧЕННЫЕ В ДАННУЮ ОТПРАВКУ:</span>
                    
                    <div className="bg-[#0A0A0A]/85 rounded-lg border border-[#212121] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#111] border-b border-[#212121] text-[9px] text-slate-500 uppercase font-mono">
                          <tr>
                            <th className="py-2 px-3">Код товара</th>
                            <th className="py-2 px-3">Название</th>
                            <th className="py-2 px-3">Контакт</th>
                            <th className="py-2 px-3 text-center">Тип</th>
                            <th className="py-2 px-3 text-center">Сбор GBP</th>
                            <th className="py-2 px-3 text-center">Статус Оплаты</th>
                            <th className="py-2 px-3 text-right">Отвязать</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#212121] font-mono text-[11px] text-slate-400">
                          {itemsInShipment.map(it => (
                            <tr key={it.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2 px-3 font-bold text-slate-300">{it.id}</td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-200">{it.title}</td>
                              <td className="py-2 px-3">{it.contact}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  it.itemType === 'liquid' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800'
                                }`}>
                                  {it.itemType}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-indigo-300">{gbpFormat(it.feeGbp)}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  it.paid ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                                }`}>
                                  {it.paid ? 'Оплачено' : 'Ждет оплаты'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => {
                                    onUpdateBrokerItem({
                                      ...it,
                                      shipmentId: null
                                    });
                                  }}
                                  className="text-xs text-red-400 hover:underline"
                                  title="Убрать позицию из отправки"
                                >
                                  Убрать
                                </button>
                              </td>
                            </tr>
                          ))}

                          {itemsInShipment.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-4 text-slate-600 font-sans">
                                Внутри данной отправки пока нет позиций. Зайдите в Склад для привязки.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Shipment comment & general controls */}
                  <div className="mt-4 pt-4 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                    <p className="text-slate-400 italic">
                      {shipment.notes ? `Комментарий: "${shipment.notes}"` : 'Нет комментариев к отправке.'}
                    </p>
                    
                    <div className="flex items-center space-x-3 self-end">
                      <button
                        onClick={() => setEditingShipment(shipment)}
                        className="text-xs text-indigo-400 hover:underline font-bold font-mono"
                      >
                        Редактировать
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить отправку ${shipment.id}? Все позиции склада будут отвязаны.`)) {
                            onDeleteBrokerShipment(shipment.id);
                          }
                        }}
                        className="text-xs text-red-400 hover:underline font-bold font-mono"
                      >
                        Удалить отправку
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {brokerShipments.length === 0 && (
              <div className="p-8 border border-dashed border-slate-800 text-center text-slate-500 rounded-xl">
                Сводных отправлений не зарегистрировано. Создайте отправку через кнопку выше.
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 3: LEGACY BOX CARGO (KEEP ORIGINAL PARCELS SYSTEM) */}
      {activeTab === 'legacy-boxes' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">Системные Сборные Коробки CRM (Исторические данные)</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Классические сборные боксы, привязываемые в CRM заказам.</p>
            </div>

            <div className="flex items-center space-x-3 self-start">
              {/* Toggle buttons board/list */}
              <div className={`p-0.5 rounded-lg flex border ${darkMode ? 'border-[#262626] bg-[#0A0A0A]' : 'border-slate-800 bg-slate-950'}`}>
                <button 
                  onClick={() => setViewMode('board')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center space-x-1.5 ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Grid className="h-3 w-3" />
                  <span>Канбан</span>
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center space-x-1.5 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <List className="h-3 w-3" />
                  <span>Таблица</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Новая Коробка</span>
              </button>
            </div>
          </div>

          {/* QUICK LOGISTICS ANALYSIS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Оценочный Фрахт (GBP)</span>
                <h4 className="text-xl font-bold font-mono text-indigo-300 mt-1">{gbpFormat(totalFreightCostGbp)}</h4>
              </div>
              <Coins className="h-8 w-8 text-indigo-400/20" />
            </div>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Фрахт в Рублях</span>
                <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">{rubFormat(totalFreightCostRub)}</h4>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400/20" />
            </div>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900/40 border-slate-800'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Формируется в Лондоне</span>
                <h4 className="text-xl font-bold text-slate-200 mt-1">
                  {parcels.filter(p => p.status === ParcelStatus.UK_WAREHOUSE || p.status === ParcelStatus.AWAITING).length} коробок
                </h4>
              </div>
              <Package className="h-8 w-8 text-slate-400/20" />
            </div>
          </div>

          {/* KANBAN BOARD VIEW */}
          {viewMode === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parcels.map((parcel) => {
                const parcelOrders = orders.filter(o => o.parcelId === parcel.id);
                const totalClientPrice = parcelOrders.reduce((sum, o) => sum + Number(o.clientPrice), 0);
                
                return (
                  <div 
                    key={parcel.id} 
                    className={`rounded-xl border p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all cursor-pointer relative ${
                      darkMode ? 'border-[#262626] bg-[#141414]' : 'border-slate-800 bg-slate-900/40'
                    }`}
                    onClick={() => setSelectedParcel(parcel)}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`p-1 px-2 rounded-md font-mono text-[9px] font-bold border ${
                          darkMode ? 'bg-[#0D0D0D] border-[#262626] text-slate-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}>
                          {parcel.id}
                        </span>
                        <span className={`text-[9px] font-mono leading-none tracking-wider uppercase px-2 py-1 rounded border ${getStatusColor(parcel.status)}`}>
                          {parcel.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100 mt-3 tracking-tight line-clamp-1">{parcel.title}</h3>
                      <p className="text-[11px] text-slate-400 font-medium font-mono mt-1 text-slate-500">Трэк: {parcel.trackingCode || 'CSC-PENDING'}</p>

                      {/* Pricing rates specs info */}
                      <div className={`mt-4 grid grid-cols-2 gap-2 border-y border-dashed py-3 text-xs font-mono py-2 ${
                        darkMode ? 'border-[#262626]' : 'border-slate-800/80'
                      }`}>
                        <div>
                          <span className="text-[10px] text-slate-500 block">СТАВКА ЛОГИСТИКИ:</span>
                          <strong className="text-slate-300">{gbpFormat(parcel.shippingFeeGbp)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">НАШ КУРС RUB/GBP:</span>
                          <strong className="text-indigo-400 font-bold">{parcel.exchangeRate || defaultExchangeRate} руб</strong>
                        </div>
                      </div>

                      {/* Contains Liquids warnings */}
                      {parcel.containsLiquid && (
                        <div className="mt-3 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 flex items-center space-x-1 font-mono">
                          <AlertTriangle className="h-3 w-3" />
                          <span>ЖИДКОСТЬ // СТАВКА £10 ПРИМЕНЕНА</span>
                        </div>
                      )}

                      {/* Connected Orders sub-list */}
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono uppercase">
                          <span>Вещи клиентов ({parcelOrders.length} шт):</span>
                          <span className="text-slate-300 font-bold">Оборот: {rubFormat(totalClientPrice)}</span>
                        </div>

                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {parcelOrders.map(o => (
                            <div key={o.id} className={`p-1 px-2 rounded border flex justify-between text-[11px] font-mono ${
                              darkMode ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-slate-950 border-slate-850'
                            }`}>
                              <span className="text-slate-400 font-semibold">{o.id} • {o.contact}</span>
                              <span className="text-slate-300 truncate max-w-[120px]">{o.productName}</span>
                            </div>
                          ))}
                          {parcelOrders.length === 0 && (
                            <span className="text-slate-550 font-mono text-[10px] block py-1.5">Пустая посылка. Привяжите заказы в CRM.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-5 pt-3 border-t flex justify-between items-center text-[10px] text-slate-400 font-mono ${
                      darkMode ? 'border-[#262626]' : 'border-slate-800/80'
                    }`}>
                      <span className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        {getMemberName(parcel.assignedTo).split(' ')[0]}
                      </span>
                      <span>Нажать для инспекции →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* STANDARD DETAILED ADMINISTRATIVE LOG TABLE */
            <div className={`border rounded-xl overflow-hidden ${
              darkMode ? 'border-[#262626] bg-[#0D0D0D]' : 'border-slate-800 bg-slate-900/45'
            }`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead className={`border-b text-slate-400 font-mono text-[10px] uppercase ${
                  darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-slate-900 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3 px-4">Код ID</th>
                    <th className="py-3 px-4">Название бокса</th>
                    <th className="py-3 px-4 text-center">Ставка (£)</th>
                    <th className="py-3 px-4 text-center">Курс GBP</th>
                    <th className="py-3 px-4 text-center">Итого в руб.</th>
                    <th className="py-3 px-4 text-center">Тип</th>
                    <th className="py-3 px-4">Трекинг</th>
                    <th className="py-3 px-4">Статус</th>
                    <th className="py-3 px-4">Куратор</th>
                    <th className="py-3 px-4 text-center">Вещей</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${darkMode ? 'divide-[#262626]' : 'divide-slate-800/60'}`}>
                  {parcels.map(p => {
                    const innerOrders = orders.filter(o => o.parcelId === p.id);
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-800/30'}`}
                        onClick={() => setSelectedParcel(p)}
                      >
                        <td className="py-3 px-4 font-bold text-slate-200">{p.id}</td>
                        <td className="py-3 px-4 font-sans font-medium text-slate-350 max-w-xs truncate">{p.title}</td>
                        <td className="py-3 px-4 text-center text-slate-100">{gbpFormat(p.shippingFeeGbp)}</td>
                        <td className="py-3 px-4 text-center text-indigo-400">{p.exchangeRate}</td>
                        <td className="py-3 px-4 text-center text-emerald-400 font-bold">{rubFormat(p.shippingFeeGbp * p.exchangeRate)}</td>
                        <td className="py-3 px-4 text-center">
                          {p.containsLiquid ? (
                            <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">Liquid</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Regular</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{p.trackingCode || 'N/A'}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${getStatusColor(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans">{getMemberName(p.assignedTo).split(' ')[0]}</td>
                        <td className="py-3 px-4 text-center text-indigo-300 font-bold">{innerOrders.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD POSITION TO BROKER WAREHOUSE */}
      {isAddBrokerItemOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                <span>Поступление на склад посредника в Англии</span>
              </h3>
              <button onClick={() => setIsAddBrokerItemOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBrokerItemSubmit} className="mt-5 space-y-4 text-xs">
              
              {/* Product Name */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Название товара *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Jordan 5 Sneakers, Dyson Airwrap, Cream Lotion..."
                  value={newBrokerItemForm.title}
                  onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, title: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none placeholder-slate-650"
                />
              </div>

              {/* Contact / Owner */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Telegram / Контакт получателя *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: @mikhail_t"
                    value={newBrokerItemForm.contact}
                    onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, contact: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                {/* Related Order ID from CRM */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Привязка к заказу (Необязательно)</label>
                  <select
                    value={newBrokerItemForm.orderId}
                    onChange={(e) => {
                      const selectedOrd = orders.find(o => o.id === e.target.value);
                      setNewBrokerItemForm({
                        ...newBrokerItemForm,
                        orderId: e.target.value,
                        // autofill contact if free
                        contact: selectedOrd ? selectedOrd.contact : newBrokerItemForm.contact,
                        title: selectedOrd ? selectedOrd.productName : newBrokerItemForm.title,
                        itemType: selectedOrd?.hasLiquid ? 'liquid' : 'normal'
                      });
                    }}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-350 focus:outline-none font-mono"
                  >
                    <option value="">-- Свободный товар --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.id} ({o.contact} - {o.productName.slice(0, 20)}...)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qty & Arrival Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Количество (шт)</label>
                  <input
                    type="number"
                    min={1}
                    value={newBrokerItemForm.quantity}
                    onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Дата прибытия на склад *</label>
                  <input
                    type="date"
                    required
                    value={newBrokerItemForm.arrivalDate}
                    onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, arrivalDate: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Liquid toggle & Fee logic instruction */}
              <div className="p-3 bg-slate-950/50 border border-slate-850 rounded">
                <div className="flex items-center space-x-2">
                  <input
                    id="add-broker-liquid-checker"
                    type="checkbox"
                    checked={newBrokerItemForm.itemType === 'liquid'}
                    onChange={(e) => {
                      const isLiquid = e.target.checked;
                      setNewBrokerItemForm({
                        ...newBrokerItemForm,
                        itemType: isLiquid ? 'liquid' : 'normal',
                        feeGbp: isLiquid ? 10 : 5
                      });
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="add-broker-liquid-checker" className="font-bold text-slate-200 cursor-pointer text-xs">
                    Товар содержит жидкие компоненты (Liquid Base)
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Если товар содержит жидкости, сбор посредника автоматически переключится на <strong className="text-amber-400 font-bold">£10</strong>. В противном случае сбор равен <strong className="text-emerald-400 font-bold">£5</strong>.
                </p>
              </div>

              {/* Responsible Curator & Paid status & shipment bind */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Куратор</label>
                  <select
                    value={newBrokerItemForm.assignedTo}
                    onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, assignedTo: e.target.value })}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-850 text-slate-400"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Привязка к отправке</label>
                  <select
                    value={newBrokerItemForm.shipmentId}
                    onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, shipmentId: e.target.value })}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-850 text-slate-400 text-[11px] font-mono"
                  >
                    <option value="">-- Вне отправки --</option>
                    {brokerShipments.map(s => (
                      <option key={s.id} value={s.id}>{s.id} (Сб. {s.createdAt})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col items-start justify-center pt-3 pl-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="new-broker-paid"
                      type="checkbox"
                      checked={newBrokerItemForm.paid}
                      onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, paid: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="new-broker-paid" className="font-bold text-slate-300 text-xs cursor-pointer">
                      Сбор Оплачен
                    </label>
                  </div>
                </div>
              </div>

              {/* Comment / notes */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Комментарий посреднику (например, номер ячейки, габариты)</label>
                <textarea
                  placeholder="В ячейку B-3, замерить точный вес перед отправкой..."
                  value={newBrokerItemForm.comment}
                  onChange={(e) => setNewBrokerItemForm({ ...newBrokerItemForm, comment: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 h-16"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddBrokerItemOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2 rounded-lg shadow font-mono"
                >
                  Зафиксировать на складе
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE BULK COLLECTIVE SHIPMENT */}
      {isAddShipmentOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" />
                <span>Сборка новой сводной отправки</span>
              </h3>
              <button onClick={() => setIsAddShipmentOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddShipmentSubmit} className="mt-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Curator */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Ответственный за Сбор</label>
                  <select
                    value={newShipmentForm.assignedTo}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, assignedTo: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-300"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5 font-bold">Статус Отправки</label>
                  <select
                    value={newShipmentForm.status}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-350"
                  >
                    <option value="Редактируется">Редактируется</option>
                    <option value="Отправлена">Отправлена (Англия Экспресс)</option>
                    <option value="Получена">Получена в офисе</option>
                    <option value="Закрыта">Закрыта</option>
                  </select>
                </div>
              </div>

              {/* Cost / default 21 GBP */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Стоимость самой доставки (£ GBP) *</label>
                <input
                  type="number"
                  required
                  value={newShipmentForm.shippingFeeGbp}
                  onChange={(e) => setNewShipmentForm({ ...newShipmentForm, shippingFeeGbp: Number(e.target.value) || 21 })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                />
                <span className="block text-[9px] text-slate-500 mt-1">Стоимость общей карго коробки по умолчанию зафиксирована в £21.</span>
              </div>

              {/* Comment/notes */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Инструкции / Комментарий к грузу</label>
                <textarea
                  placeholder="Инвойс прилагается, авиа-таможенная декларация подписана..."
                  value={newShipmentForm.notes}
                  onChange={(e) => setNewShipmentForm({ ...newShipmentForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 h-18"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddShipmentOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2 rounded shadow font-mono"
                >
                  Инициализировать Отправку
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT BROKER WAREHOUSE ITEM (POP-UP DRAWER) */}
      {editingBrokerItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">Редактирование позиции: {editingBrokerItem.id}</h3>
              <button onClick={() => setEditingBrokerItem(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrokerItemSubmit} className="mt-5 space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Название товара</label>
                <input
                  type="text"
                  required
                  value={editingBrokerItem.title}
                  onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, title: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Контакт получателя</label>
                  <input
                    type="text"
                    required
                    value={editingBrokerItem.contact}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, contact: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Связанный заказ в CRM</label>
                  <select
                    value={editingBrokerItem.orderId || ''}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, orderId: e.target.value || null })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-350 font-mono"
                  >
                    <option value="">-- Свободный товар --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.id} ({o.contact})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Количество (шт)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingBrokerItem.quantity}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Дата прибытия посреднику</label>
                  <input
                    type="date"
                    required
                    value={editingBrokerItem.arrivalDate}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, arrivalDate: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Item type and broker fee config */}
              <div className="p-3 bg-slate-950/55 rounded border border-slate-850 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="edit-broker-liquid-checker"
                    type="checkbox"
                    checked={editingBrokerItem.itemType === 'liquid'}
                    onChange={(e) => {
                      const isL = e.target.checked;
                      setEditingBrokerItem({
                        ...editingBrokerItem,
                        itemType: isL ? 'liquid' : 'normal',
                        feeGbp: isL ? 10 : 5
                      });
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="edit-broker-liquid-checker" className="font-bold text-slate-200 cursor-pointer">
                    Содержит жидкие гели / жидкости (Liquid / Cosmetics)
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 uppercase font-mono mb-1">Сбор посредника за позицию (£ GBP)</label>
                  <input
                    type="number"
                    value={editingBrokerItem.feeGbp}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, feeGbp: Number(e.target.value) || 5 })}
                    className="w-24 p-1 rounded bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Ответственный</label>
                  <select
                    value={editingBrokerItem.assignedTo}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, assignedTo: e.target.value })}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-850 text-slate-300"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Сводная отправка</label>
                  <select
                    value={editingBrokerItem.shipmentId || ''}
                    onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, shipmentId: e.target.value || null })}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-850 text-slate-300 font-mono"
                  >
                    <option value="">-- Вне отправки --</option>
                    {brokerShipments.map(s => (
                      <option key={s.id} value={s.id}>{s.id} (Сб. {s.createdAt})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col items-start justify-center pt-3 pl-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="edit-broker-paid"
                      type="checkbox"
                      checked={editingBrokerItem.paid}
                      onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, paid: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="edit-broker-paid" className="font-bold text-slate-300 cursor-pointer">
                      Сбор Оплачен
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Комментарий</label>
                <textarea
                  value={editingBrokerItem.comment}
                  onChange={(e) => setEditingBrokerItem({ ...editingBrokerItem, comment: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingBrokerItem(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2 rounded-lg font-mono"
                >
                  Сохранить Позицию
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COLLECTIVE SHIPMENT */}
      {editingShipment && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">Редактирование отправки: {editingShipment.id}</h3>
              <button onClick={() => setEditingShipment(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateShipmentSubmit} className="mt-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Ответственный</label>
                  <select
                    value={editingShipment.assignedTo}
                    onChange={(e) => setEditingShipment({ ...editingShipment, assignedTo: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-300"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Статус</label>
                  <select
                    value={editingShipment.status}
                    onChange={(e) => setEditingShipment({ ...editingShipment, status: e.target.value as any })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-300"
                  >
                    <option value="Редактируется">Редактируется</option>
                    <option value="Отправлена">Отправлена</option>
                    <option value="Получена">Получена</option>
                    <option value="Закрыта">Закрыта</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Стоимость самой доставки (£ GBP)</label>
                <input
                  type="number"
                  value={editingShipment.shippingFeeGbp}
                  onChange={(e) => setEditingShipment({ ...editingShipment, shippingFeeGbp: Number(e.target.value) || 21 })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Комментарий</label>
                <textarea
                  value={editingShipment.notes}
                  onChange={(e) => setEditingShipment({ ...editingShipment, notes: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-[#262626] text-slate-150 h-20 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2 rounded-lg font-mono"
                >
                  Сохранить Отправку
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DETAILED EDIT ORIGINAL PARCEL SLIDE-OUT */}
      {selectedParcel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 h-full p-6 shadow-2xl border-l border-slate-800 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold font-mono">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{selectedParcel.id} // {selectedParcel.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Параметры классической посылки</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedParcel(null)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Название Посылки</label>
                  <input
                    type="text"
                    value={selectedParcel.title}
                    onChange={(e) => {
                      onUpdateParcel({
                        ...selectedParcel,
                        title: e.target.value
                      });
                    }}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-250 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Логистическая ставка (GBP)</label>
                    <input
                      type="number"
                      value={selectedParcel.shippingFeeGbp}
                      onChange={(e) => {
                        onUpdateParcel({
                          ...selectedParcel,
                          shippingFeeGbp: Number(e.target.value) || 0
                        });
                      }}
                      className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Конверсионный Курс GBP</label>
                    <input
                      type="number"
                      value={selectedParcel.exchangeRate}
                      onChange={(e) => {
                        onUpdateParcel({
                          ...selectedParcel,
                          exchangeRate: Number(e.target.value) || 0
                        });
                      }}
                      className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Статус посылки</label>
                    <select
                      value={selectedParcel.status}
                      onChange={(e) => {
                        onUpdateParcel({
                          ...selectedParcel,
                          status: e.target.value as ParcelStatus,
                          sentAt: e.target.value === ParcelStatus.SENT ? new Date().toISOString() : selectedParcel.sentAt,
                          arrivedAt: e.target.value === ParcelStatus.ARRIVED ? new Date().toISOString() : selectedParcel.arrivedAt
                        });
                      }}
                      className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
                    >
                      {Object.values(ParcelStatus).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Код Трэкинга</label>
                    <input
                      type="text"
                      placeholder="CSC-UK-XXXX"
                      value={selectedParcel.trackingCode}
                      onChange={(e) => {
                        onUpdateParcel({
                          ...selectedParcel,
                          trackingCode: e.target.value
                        });
                      }}
                      className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 rounded border border-indigo-500/20 flex items-center space-x-3">
                  <input
                    id="edit-legacy-liquid"
                    type="checkbox"
                    checked={selectedParcel.containsLiquid}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onUpdateParcel({
                        ...selectedParcel,
                        containsLiquid: isChecked,
                        shippingFeeGbp: isChecked ? 10 : 5
                      });
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <label htmlFor="edit-legacy-liquid" className="text-xs font-bold text-slate-250 cursor-pointer">
                      Содержит Жидкие средства (Liquid Mode)
                    </label>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Включает стандартную ставку £10.</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Инструкции / Комментарии</label>
                  <textarea
                    value={selectedParcel.notes}
                    onChange={(e) => {
                      onUpdateParcel({
                        ...selectedParcel,
                        notes: e.target.value
                      });
                    }}
                    className="w-full text-xs p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 h-20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-850 flex justify-between items-center">
              <button
                onClick={() => {
                  if (confirm(`Вы действительно хотите удалить посылку ${selectedParcel.id}? связанные заказы не удалятся.`)) {
                    onDeleteParcel(selectedParcel.id);
                    setSelectedParcel(null);
                  }
                }}
                className="text-xs text-red-400 font-semibold bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 rounded-lg border border-red-500/15"
              >
                Удалить Посылку
              </button>

              <button
                onClick={() => setSelectedParcel(null)}
                className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow"
              >
                Закрыть параметры
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE NEW LEGACY PARCEL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">Создание сборной коробки по Англии</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLegacySubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Название Посылки *</label>
                <input
                  type="text"
                  required
                  placeholder="UK-Cargo Batch #42 (Vitamins)"
                  value={newParcelForm.title}
                  onChange={(e) => setNewParcelForm({ ...newParcelForm, title: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Трэкинг Код по Англии</label>
                  <input
                    type="text"
                    placeholder="CSC-UK-759XX"
                    value={newParcelForm.trackingCode}
                    onChange={(e) => setNewParcelForm({ ...newParcelForm, trackingCode: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Ответственный куратор</label>
                  <select
                    value={newParcelForm.assignedTo}
                    onChange={(e) => setNewParcelForm({ ...newParcelForm, assignedTo: e.target.value })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-slate-850 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="new-legacy-liquid"
                    type="checkbox"
                    checked={newParcelForm.containsLiquid}
                    onChange={(e) => {
                      const isCheck = e.target.checked;
                      setNewParcelForm({
                        ...newParcelForm,
                        containsLiquid: isCheck,
                        shippingFeeGbp: isCheck ? 10 : 5
                      });
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="new-legacy-liquid" className="font-bold text-slate-300 cursor-pointer">
                    Посылка содержит жидкие вещества (Liquid)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Ставка Логистики (£ GBP)</label>
                  <input
                    type="number"
                    value={newParcelForm.shippingFeeGbp}
                    onChange={(e) => setNewParcelForm({ ...newParcelForm, shippingFeeGbp: Number(e.target.value) || 5 })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Курс Обмена (RUB/GBP)</label>
                  <input
                    type="number"
                    value={newParcelForm.exchangeRate}
                    onChange={(e) => setNewParcelForm({ ...newParcelForm, exchangeRate: Number(e.target.value) || defaultExchangeRate })}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1.5">Комментарий</label>
                <textarea
                  placeholder="Какие товары планируется сложить в данную коробку..."
                  value={newParcelForm.notes}
                  onChange={(e) => setNewParcelForm({ ...newParcelForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-100 h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-xs px-5 py-2.5 rounded shadow"
                >
                  Создать Коробку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
