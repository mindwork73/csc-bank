/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getStoredState, 
  saveState, 
  calculateBalances, 
  CSCState 
} from './dataStore';
import { 
  Order, 
  Parcel, 
  FinanceEntry, 
  TeamMember, 
  AppSettings, 
  AuditLog,
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
  BrokerItem,
  BrokerShipment,
  ImportSession
} from './types';

// Page imports
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import ParcelsView from './components/ParcelsView';
import FinanceView from './components/FinanceView';
import AnalyticsView from './components/AnalyticsView';
import ImportView from './components/ImportView';
import SettingsView from './components/SettingsView';
import JournalView from './components/JournalView';
import AuditView from './components/AuditView';

export default function App() {
  // Primary persistent state
  const [state, setState] = useState<CSCState>(() => getStoredState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<'root' | 'admin' | 'finance' | 'operations' | 'logistics' | 'readonly'>('root');

  // Unified persistent toasts system for iframe-safe user alert replacement
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Persist state updates on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Recalculate partner metrics dynamically
  const calculatedBalances = calculateBalances(state);

  // Reminders metrics (e.g. tracking items labeled with problems)
  const problemCount = state.orders.filter(o => o.orderStatus === OrderStatus.PROBLEM).length;
  const awaitingShipmentCount = state.parcels.filter(p => p.status === 'Ожидает отправки').length;
  const totalPendingAlerts = problemCount + awaitingShipmentCount;

  // LOGGER WRAPPER
  const addAuditLog = (action: string, entityType: 'Order' | 'Parcel' | 'Finance' | 'TeamMember', entityId: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      entityType,
      entityId,
      action,
      before: '',
      after: '',
      createdAt: new Date().toISOString(),
      userId: 'Администратор CSC'
    };
    setState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 50) // keep last 50 logs for stability
    }));
  };

  // ==========================================
  // ORDERS PORTFOLIO ACTION HANDLERS
  // ==========================================
  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'margin' | 'profit'>) => {
    const nextIdNum = state.orders.length ? Math.max(...state.orders.map(o => {
      const match = o.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) + 1 : 101;

    const margin = newOrderData.clientPrice - newOrderData.costPrice;

    const newOrder: Order = {
      ...newOrderData,
      id: `ORD-${nextIdNum}`,
      margin,
      profit: margin, // profit calculations occur inside indicators calling calculators
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      orders: [newOrder, ...prev.orders]
    }));
    addAuditLog(`Создан новый контракт: ${newOrder.productName}`, 'Order', newOrder.id);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    }));
    addAuditLog(`Обновлен заказ: ${updatedOrder.productName} (Статус: ${updatedOrder.orderStatus})`, 'Order', updatedOrder.id);
  };

  const handleDeleteOrder = (id: string) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== id)
    }));
    addAuditLog(`Безвозвратно удален заказ со всеми логами`, 'Order', id);
  };

  // ==========================================
  // PARCELS LOGISTICS ACTION HANDLERS
  // ==========================================
  const handleAddParcel = (newParcelData: Omit<Parcel, 'id' | 'createdAt' | 'shippingFeeLocal'>) => {
    const nextIdNum = state.parcels.length ? Math.max(...state.parcels.map(p => {
      const match = p.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) + 1 : 101;

    const shippingFeeLocal = newParcelData.shippingFeeGbp * newParcelData.exchangeRate;

    const newParcel: Parcel = {
      ...newParcelData,
      id: `PRC-${nextIdNum}`,
      shippingFeeLocal,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      parcels: [newParcel, ...prev.parcels]
    }));
    addAuditLog(`Сборная Англия-Посылка создана: ${newParcel.title}`, 'Parcel', newParcel.id);
  };

  const handleUpdateParcel = (updatedParcel: Parcel) => {
    const shippingFeeLocal = updatedParcel.shippingFeeGbp * updatedParcel.exchangeRate;
    const item = { ...updatedParcel, shippingFeeLocal };

    setState(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => p.id === updatedParcel.id ? item : p)
    }));
    addAuditLog(`Изменены параметры посылки: ${updatedParcel.title}`, 'Parcel', updatedParcel.id);
  };

  const handleDeleteParcel = (id: string) => {
    // Unbind any orders pointing to this parcel
    const unboundOrders = state.orders.map(o => o.parcelId === id ? { ...o, parcelId: null } : o);
    
    setState(prev => ({
      ...prev,
      parcels: prev.parcels.filter(p => p.id !== id),
      orders: unboundOrders
    }));
    addAuditLog(`Логистическая коробка аннулирована. Инвентарь отвязан.`, 'Parcel', id);
  };

  // ==========================================
  // BROKER LOGISTICS ACTION HANDLERS
  // ==========================================
  const handleAddBrokerItem = (newItemData: Omit<BrokerItem, 'id'>) => {
    const nextIdNum = state.brokerItems.length ? Math.max(...state.brokerItems.map(item => {
      const match = item.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) + 1 : 101;

    const newItem: BrokerItem = {
      ...newItemData,
      id: `BRK-${nextIdNum}`
    };

    setState(prev => ({
      ...prev,
      brokerItems: [newItem, ...prev.brokerItems]
    }));
    addAuditLog(`Товар получен на склад посредника: ${newItem.title}`, 'Parcel', newItem.id);
  };

  const handleUpdateBrokerItem = (updatedItem: BrokerItem) => {
    setState(prev => ({
      ...prev,
      brokerItems: prev.brokerItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    }));
    addAuditLog(`Обновлена позиция у посредника: ${updatedItem.title}`, 'Parcel', updatedItem.id);
  };

  const handleDeleteBrokerItem = (id: string) => {
    setState(prev => ({
      ...prev,
      brokerItems: prev.brokerItems.filter(item => item.id !== id)
    }));
    addAuditLog(`Удалена позиция товара у посредника`, 'Parcel', id);
  };

  const handleAddBrokerShipment = (newShipmentData: Omit<BrokerShipment, 'id' | 'createdAt'>) => {
    const nextIdNum = state.brokerShipments.length ? Math.max(...state.brokerShipments.map(s => {
      const match = s.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) + 1 : 101;

    const newShipment: BrokerShipment = {
      ...newShipmentData,
      id: `SHP-${nextIdNum}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setState(prev => ({
      ...prev,
      brokerShipments: [newShipment, ...prev.brokerShipments]
    }));
    addAuditLog(`Создана отправка: ${newShipment.id}`, 'Parcel', newShipment.id);
  };

  const handleUpdateBrokerShipment = (updatedShipment: BrokerShipment) => {
    setState(prev => ({
      ...prev,
      brokerShipments: prev.brokerShipments.map(s => s.id === updatedShipment.id ? updatedShipment : s)
    }));
    addAuditLog(`Обновлен статус отправки: ${updatedShipment.id}`, 'Parcel', updatedShipment.id);
  };

  const handleDeleteBrokerShipment = (id: string) => {
    setState(prev => ({
      ...prev,
      brokerItems: prev.brokerItems.map(item => item.shipmentId === id ? { ...item, shipmentId: null } : item),
      brokerShipments: prev.brokerShipments.filter(s => s.id !== id)
    }));
    addAuditLog(`Аннулирована отправка ${id}`, 'Parcel', id);
  };

  // ==========================================
  // FINANCIAL LEDGER CONSOLE HANDLERS
  // ==========================================
  const handleAddFinanceEntry = (newEntryData: Omit<FinanceEntry, 'id' | 'createdAt'>) => {
    const num = state.finance.length ? Math.max(...state.finance.map(f => {
      const match = f.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) + 1 : 101;

    const newEntry: FinanceEntry = {
      ...newEntryData,
      id: `FIN-${num}`,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      finance: [newEntry, ...prev.finance]
    }));
    addAuditLog(`Проводка занесена в ledger: ${newEntry.category} на сумму ${newEntry.amount} руб`, 'Finance', newEntry.id);
  };

  const handleDeleteFinanceEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      finance: prev.finance.filter(f => f.id !== id)
    }));
    addAuditLog(`Проводка удалена из реестра.`, 'Finance', id);
  };

  const handleClearFinance = () => {
    setState(prev => ({
      ...prev,
      finance: []
    }));
    addAuditLog(`Журнал совершенных операций полностью очищен`, 'Finance', 'RESET_ALL');
  };

  // ==========================================
  // GOOGLE SINC IMPORT LOADER
  // ==========================================
  const handleImportOrders = (newOrders: Order[]) => {
    setState(prev => {
      const orderMap = new Map(prev.orders.map(o => [o.id, o]));
      newOrders.forEach(o => orderMap.set(o.id, o));
      return {
        ...prev,
        orders: Array.from(orderMap.values())
      };
    });
  };

  const handleImportParcels = (newParcels: Parcel[]) => {
    setState(prev => {
      const parcelMap = new Map(prev.parcels.map(p => [p.id, p]));
      newParcels.forEach(p => parcelMap.set(p.id, p));
      return {
        ...prev,
        parcels: Array.from(parcelMap.values())
      };
    });
  };

  const handleImportFinance = (newFinance: FinanceEntry[]) => {
    setState(prev => {
      const financeMap = new Map(prev.finance.map(f => [f.id, f]));
      newFinance.forEach(f => financeMap.set(f.id, f));
      return {
        ...prev,
        finance: Array.from(financeMap.values())
      };
    });
  };

  // ==========================================
  // SETTINGS RECONFIGURATORS
  // ==========================================
  const handleUpdateSettings = (newSettingsConfig: AppSettings) => {
    setState(prev => ({
      ...prev,
      settings: newSettingsConfig
    }));
    addAuditLog(`Изменен курс обмена и ставки комиссионных: Rub/Gbp -> ${newSettingsConfig.gbpExchangeRate}`, 'TeamMember', 'SETTINGS');
  };

  const handleUpdateMembers = (newMembersList: TeamMember[]) => {
    setState(prev => ({
      ...prev,
      members: newMembersList
    }));
    addAuditLog(`Переприняты доли партнеров в P&L реестре`, 'TeamMember', 'TEAM');
  };

  const handleAddImportSession = (newSession: ImportSession) => {
    setState(prev => ({
      ...prev,
      importHistory: [newSession, ...(prev.importHistory || [])]
    }));
  };

  // Tab routing selection
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView 
            orders={state.orders}
            parcels={state.parcels}
            finance={state.finance}
            members={state.members}
            calculatedBalances={calculatedBalances}
            onSwitchTab={setCurrentTab}
            darkMode={darkMode}
            logs={state.logs || []}
            currentRole={currentRole}
          />
        );
      case 'orders':
        return (
          <OrdersView 
            orders={state.orders}
            parcels={state.parcels}
            members={state.members}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            globalSearch={globalSearch}
            darkMode={darkMode}
            currentRole={currentRole}
            onShowToast={showToast}
          />
        );
      case 'parcels':
        return (
          <ParcelsView 
            parcels={state.parcels}
            orders={state.orders}
            members={state.members}
            onAddParcel={handleAddParcel}
            onUpdateParcel={handleUpdateParcel}
            onDeleteParcel={handleDeleteParcel}
            defaultExchangeRate={state.settings.gbpExchangeRate}
            darkMode={darkMode}
            brokerItems={state.brokerItems}
            brokerShipments={state.brokerShipments}
            onAddBrokerItem={handleAddBrokerItem}
            onUpdateBrokerItem={handleUpdateBrokerItem}
            onDeleteBrokerItem={handleDeleteBrokerItem}
            onAddBrokerShipment={handleAddBrokerShipment}
            onUpdateBrokerShipment={handleUpdateBrokerShipment}
            onDeleteBrokerShipment={handleDeleteBrokerShipment}
            currentRole={currentRole}
            onShowToast={showToast}
          />
        );
      case 'finance':
        return (
          <FinanceView 
            finance={state.finance}
            members={state.members}
            orders={state.orders}
            parcels={state.parcels}
            calculatedBalances={calculatedBalances}
            onAddFinanceEntry={handleAddFinanceEntry}
            onDeleteFinanceEntry={handleDeleteFinanceEntry}
            onClearFinance={handleClearFinance}
            profitAllocationType={state.profitAllocationType}
            onUpdateProfitAllocation={(type) => setState(prev => ({ ...prev, profitAllocationType: type }))}
            darkMode={darkMode}
            currentRole={currentRole}
            onShowToast={showToast}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            orders={state.orders}
            finance={state.finance}
            members={state.members}
            parcels={state.parcels}
            darkMode={darkMode}
          />
        );
      case 'import':
        return (
          <ImportView 
            onImportOrders={handleImportOrders}
            onImportParcels={handleImportParcels}
            onImportFinance={handleImportFinance}
            onClearFinance={handleClearFinance}
            onAddLog={(action, type) => addAuditLog(action, type, 'IMPORT_SESSION')}
            darkMode={darkMode}
            importHistory={state.importHistory || []}
            onAddImportSession={handleAddImportSession}
            currentRole={currentRole}
            onShowToast={showToast}
          />
        );
      case 'journal':
        return (
          <JournalView
            importHistory={state.importHistory || []}
            onAddLog={(action, type) => addAuditLog(action, type ?? 'Order', 'IMPORT_SESSION')}
            darkMode={darkMode}
          />
        );
      case 'audit':
        return (
          <AuditView
            logs={state.logs || []}
            darkMode={darkMode}
            onClearLogs={() => {
              setState(prev => ({ ...prev, logs: [] }));
              addAuditLog('Журнал аудита очищен пользователем', 'TeamMember', 'SYSTEM');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            settings={state.settings}
            members={state.members}
            orders={state.orders}
            finance={state.finance}
            calculatedBalances={calculatedBalances}
            onAddFinanceEntry={handleAddFinanceEntry}
            onUpdateSettings={handleUpdateSettings}
            onUpdateMembers={handleUpdateMembers}
            auditLogs={state.logs}
            darkMode={darkMode}
            currentRole={currentRole}
            onShowToast={showToast}
          />
        );
      default:
        return <div className="text-center font-mono py-12">Tab not found</div>;
    }
  };

  return (
    <>
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        pendingAlertsCount={totalPendingAlerts}
        gbpExchangeRate={state.settings.gbpExchangeRate}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
      >
        {renderTabContent()}
      </Sidebar>

      {/* FLOATING SYSTEM TOAST PANEL */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';
          return (
            <div
              key={t.id}
              className={`p-3 rounded-lg border shadow-2xl flex items-center justify-between font-sans text-xs font-semibold pointer-events-auto transition-all ${
                darkMode
                  ? isError
                    ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
                    : isWarning
                      ? 'bg-amber-950/95 border-amber-500/40 text-amber-200'
                      : isInfo
                        ? 'bg-indigo-950/95 border-indigo-505/40 text-indigo-200'
                        : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-250'
                  : isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : isWarning
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : isInfo
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  isError ? 'bg-rose-500 animate-ping' : isWarning ? 'bg-amber-400' : isInfo ? 'bg-blue-400' : 'bg-emerald-400 shadow shadow-emerald-400'
                }`} />
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-xs ml-4 hover:opacity-75 text-slate-400 font-mono focus:outline-none"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
