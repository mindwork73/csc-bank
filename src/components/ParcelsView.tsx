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
  Trash2, 
  X, 
  Search, 
  Eye, 
  Check, 
  Calendar,
  AlertCircle
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

  brokerItems?: BrokerItem[];
  brokerShipments?: BrokerShipment[];
  onAddBrokerItem?: (item: Omit<BrokerItem, 'id'>) => void;
  onUpdateBrokerItem?: (item: BrokerItem) => void;
  onDeleteBrokerItem?: (id: string) => void;
  onAddBrokerShipment?: (shipment: Omit<BrokerShipment, 'id' | 'createdAt'>) => void;
  onUpdateBrokerShipment?: (shipment: BrokerShipment) => void;
  onDeleteBrokerShipment?: (id: string) => void;
  currentRole?: 'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly';
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
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
  currentRole = 'root',
  onShowToast
}: ParcelsViewProps) {
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  // Form State
  const [addForm, setAddForm] = useState({
    title: '',
    parcelType: 'regular' as 'regular' | 'liquid',
    shippingFeeGbp: 5,
    exchangeRate: defaultExchangeRate,
    notes: '',
    trackingCode: '',
    status: ParcelStatus.CREATED
  });

  // Filter logic
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchesText = 
        p.id.toLowerCase().includes(term) ||
        p.title.toLowerCase().includes(term) ||
        (p.notes && p.notes.toLowerCase().includes(term));
      return matchesText;
    });
  }, [parcels, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      onShowToast?.('Укажите название посылки', 'warning');
      return;
    }

    onAddParcel({
      title: addForm.title,
      parcelType: addForm.parcelType,
      shippingFeeGbp: Number(addForm.shippingFeeGbp) || 5,
      exchangeRate: Number(addForm.exchangeRate) || defaultExchangeRate,
      containsLiquid: addForm.parcelType === 'liquid',
      status: addForm.status,
      notes: addForm.notes,
      assignedTo: 'mem-ilya',
      trackingCode: addForm.trackingCode || null as any,
      sentAt: null,
      arrivedAt: null
    });

    onShowToast?.('Посылка добавлена в справочник', 'success');
    setIsAddModalOpen(false);

    // reset
    setAddForm({
      title: '',
      parcelType: 'regular',
      shippingFeeGbp: 5,
      exchangeRate: defaultExchangeRate,
      notes: '',
      trackingCode: '',
      status: ParcelStatus.CREATED
    });
  };

  const getLinkedOrders = (parcelId: string) => {
    return orders.filter(o => o.parcelId === parcelId);
  };

  const fmtGbp = (num: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  const fmtRub = (num: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="space-y-4">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Посылки через Англию
          </h2>
          <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Сводный реестр транспортируемых коробок, сборов поставщиков и привязка к ним клиентских заказов.
          </p>
        </div>

        {currentRole !== 'readonly' ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Создать посылку</span>
          </button>
        ) : null}
      </div>

      {/* MINI STATS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[11px] font-mono font-medium text-slate-500 py-1.5 border-b border-slate-800/20">
        <div>
          Всего посылок: <span className="text-indigo-400 font-semibold">{filteredParcels.length}</span>
        </div>
        <div className="text-slate-500">
          Сборов всего: <span className="text-amber-400 font-semibold">{fmtGbp(filteredParcels.reduce((sum, p) => sum + (p.shippingFeeGbp || 0), 0))}</span>
        </div>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 transition-colors ${
        darkMode ? 'bg-[#0E1015] border-[#1D212A]' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по коду (PRC-XXX), названию или комментарию..."
            className={`w-full pl-8 pr-3 py-1.25 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 ${
              darkMode ? 'bg-[#141722] border-[#222735] text-white placeholder-slate-650' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
      </div>

      {/* PARCEL COLLECTION / TABLE */}
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
                <th className="py-2.5 px-3">Коробка / Описание</th>
                <th className="py-2.5 px-3">Тип доставки</th>
                <th className="py-2.5 px-3 text-right">Сбор посредника</th>
                <th className="py-2.5 px-3 text-right">Сбор в рублях</th>
                <th className="py-2.5 px-3">Связанные заказы</th>
                <th className="py-2.5 px-3">Комментарий</th>
                <th className="py-2.5 px-3">Статус коробки</th>
                {currentRole !== 'readonly' ? <th className="py-2.5 px-3 w-10 text-center"></th> : null}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#1D212A]/50' : 'divide-slate-200'}`}>
              {filteredParcels.map((p) => {
                const linkedOrders = getLinkedOrders(p.id);
                const exRate = p.exchangeRate || defaultExchangeRate;
                const costInRub = p.shippingFeeGbp * exRate;

                return (
                  <tr key={p.id} className={`border-b select-none ${darkMode ? 'border-[#141722] hover:bg-[#141722]/60' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-400 text-center text-[11px]">
                      {p.id}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white text-[11.5px]">
                      {p.title}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {p.parcelType === 'liquid' ? (
                        <span className="text-amber-400">💧 Жидкости / Авиа</span>
                      ) : (
                        <span className="text-sky-400">📦 Стандарт / Авиа</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 text-[11.5px]">
                      {fmtGbp(p.shippingFeeGbp)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300 text-[11px]">
                      {fmtRub(costInRub)} <span className="text-[10px] text-slate-650">(@{exRate})</span>
                    </td>
                    <td className="py-2 px-3">
                      {linkedOrders.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedOrders.map(o => (
                            <span 
                              key={o.id} 
                              className="bg-indigo-950/40 text-indigo-400 border border-indigo-500/15 px-1.5 py-0.25 rounded text-[9.5px] font-mono"
                              title={`${o.contact}: ${o.productName}`}
                            >
                              {o.contact}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">Коробка пуста</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 truncate max-w-[110px] text-[11px]" title={p.notes}>
                      {p.notes || <span className="text-slate-650">—</span>}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10.5px]">
                      <span className="px-1.5 py-0.25 rounded font-semibold border border-emerald-500/15 bg-emerald-500/5 text-emerald-450">
                        {p.status}
                      </span>
                    </td>
                    
                    {currentRole !== 'readonly' ? (
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (confirm('Вы уверены, что хотите удалить эту сборную коробку?')) {
                              onDeleteParcel(p.id);
                              onShowToast?.('Посылка удалена', 'info');
                            }
                          }}
                          className="text-rose-500 hover:text-rose-400 p-1 rounded transition-all active:scale-90"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}

              {filteredParcels.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 italic font-mono">
                    Сборные посылки не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: CREATE PARCEL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans text-xs">
          <div className={`w-full max-w-sm rounded-xl border p-5 ${
            darkMode ? 'bg-[#0E1015] border-[#222735] text-white' : 'bg-white border-slate-250 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/20">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-450">
                Зарегистрировать новую сборную коробку
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 block font-bold">Название коробки / Описание:</label>
                <input
                  type="text"
                  required
                  value={addForm.title}
                  onChange={(e) => setAddForm({...addForm, title: e.target.value})}
                  placeholder="Например, Коробка Dyson Май"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 block font-bold">Тип груза:</label>
                  <select
                    value={addForm.parcelType}
                    onChange={(e) => setAddForm({...addForm, parcelType: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-slate-350' : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <option value="regular">Обычный (5 GBP)</option>
                    <option value="liquid">Жидкости/Парфюм (10 GBP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 block font-bold">Сбор (GBP):</label>
                  <input
                    type="number"
                    value={addForm.shippingFeeGbp}
                    onChange={(e) => setAddForm({...addForm, shippingFeeGbp: Number(e.target.value)})}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 block font-bold">Текущий курс фунта к рублю:</label>
                  <input
                    type="number"
                    value={addForm.exchangeRate}
                    onChange={(e) => setAddForm({...addForm, exchangeRate: Number(e.target.value)})}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 block font-bold">Статус отправления:</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({...addForm, status: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg focus:outline-none ${
                      darkMode ? 'bg-[#141722] border border-[#222735] text-slate-350' : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <option value={ParcelStatus.CREATED}>Создан</option>
                    <option value={ParcelStatus.ARRIVED}>Прибыл в МСК</option>
                    <option value={ParcelStatus.CLOSED}>Закрыт</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 block font-bold">Трекинг накладная (Авиа):</label>
                <input
                  type="text"
                  value={addForm.trackingCode}
                  onChange={(e) => setAddForm({...addForm, trackingCode: e.target.value})}
                  placeholder="Например, AWB-404099"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
                    darkMode ? 'bg-[#141722] border border-[#222735] text-white' : 'bg-slate-50 border border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-550 block font-bold">Комментарий:</label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({...addForm, notes: e.target.value})}
                  placeholder="Дополнительные примечания по грузу..."
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
                  Создать коробку
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
