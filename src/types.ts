/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
}

export interface TeamMember {
  id: string;
  name: string;
  sharePercent: number; // e.g. 33.33
  active: boolean;
  balance: number; // Personal balance
}

export enum OrderStatus {
  NEW = 'Новый',
  IN_PROGRESS = 'В работе',
  REDEEMED = 'Выкуплен',
  IN_TRANSIT = 'В пути',
  WAREHOUSE = 'Получен на склад',
  DELIVERED = 'Передан клиенту',
  CLOSED = 'Закрыт',
  CANCELLED = 'Отменен',
  PROBLEM = 'Проблемный'
}

export enum PaymentStatus {
  UNPAID = 'Не оплачен',
  PARTIALLY_PAID = 'Частично оплачен',
  PAID = 'Оплачен',
  REFUNDED = 'Возврат',
  DEFERRED = 'Отсрочка'
}

export enum ShippingStatus {
  NOT_SHIPPED = 'Не отправлен',
  FORMING = 'Формируется',
  UK_WAREHOUSE = 'В Англии',
  TRANSIT = 'В транзите',
  ARRIVED = 'Прибыл',
  ISSUED = 'Выдан'
}

export interface Order {
  id: string; // "ORD-XXX"
  contact: string; // Nik / Telegram / Name of client
  productName: string; // What was bought
  costPrice: number; // Cost to us
  clientPrice: number; // Amount client pays
  margin: number; // clientPrice - costPrice
  profit: number; // Realized net profit (can be affected by specific fees)
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingType: string; // Air, Land, Sea, UK Express
  hasLiquid: boolean; // Item contains liquid
  notes: string;
  assignedTo: string; // TeamMember ID
  parcelId: string | null; // Bound Parcel ID
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags: string[];
  source: string; // "Telegram", "Instagram", "Referral", etc.
}

export enum ParcelStatus {
  CREATED = 'Создана',
  AWAITING = 'Ожидает отправки',
  SENT = 'Отправлена',
  UK_WAREHOUSE = 'В Англии',
  IN_TRANSIT = 'В пути',
  SORTING = 'На сортировке',
  ARRIVED = 'Прибыла',
  ISSUED = 'Выдана',
  CLOSED = 'Закрыта',
  PROBLEM = 'Проблема / задержка'
}

export interface Parcel {
  id: string; // "PRC-XXX"
  title: string;
  parcelType: 'regular' | 'liquid'; // "regular" or "liquid"
  shippingFeeGbp: number; // 5 or 10 GBP by default
  exchangeRate: number; // Currency rate to local, e.g. 120 RUB per GBP
  shippingFeeLocal: number; // shippingFeeGbp * exchangeRate
  containsLiquid: boolean;
  status: ParcelStatus;
  notes: string;
  createdAt: string;
  sentAt: string | null;
  arrivedAt: string | null;
  assignedTo: string; // TeamMember ID
  trackingCode: string;
}

export enum FinanceType {
  INCOME = 'Доход',
  EXPENSE = 'Расход',
  TRANSFER = 'Перевод',
  DEPOSIT_COMMON = 'Вклад в общак',
  WITHDRAW_COMMON = 'Списание из общака',
  ADJUSTMENT = 'Корректировка',
  PAYOUT = 'Выплата участнику'
}

export interface FinanceEntry {
  id: string; // "FIN-XXX"
  type: FinanceType;
  category: string; // "Логистика", "Комиссии", "Упаковка", "Выкуп", "Выплата личного баланса", etc.
  amount: number; // In local currency
  currency: string; // RUB, GBP, etc.
  memberId: string | null; // Affected team member (if any)
  orderId: string | null; // Connected order ID (if any)
  parcelId: string | null; // Connected parcel ID (if any)
  affectsCommonFund: boolean; // Does it touch the common fund?
  splitBetweenMembers: boolean; // Should expense be split equally between members (e.g. divided by 3)?
  notes: string;
  createdAt: string;
  account?: string;
  source?: string;
}

export interface CommonFund {
  balance: number;
}

export interface ImportSession {
  id: string;
  source: string; // Sheet URL or local dump
  startedAt: string;
  finishedAt: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  importedOrdersCount: number;
  importedParcelsCount: number;
  importedFinanceCount: number;
  errors: string[];
}

export interface AuditLog {
  id: string;
  entityType: 'Order' | 'Parcel' | 'Finance' | 'TeamMember';
  entityId: string;
  action: string; // "Создан", "Обновлен статус", "Изменена цена"
  before: string; // Snapshot before transition
  after: string; // Snapshot after transition
  createdAt: string;
  userId: string; // Who made the action
}

export interface AppSettings {
  gbpExchangeRate: number; // e.g. 122.5
  defaultFeeRegularGbp: number; // e.g. 5
  defaultFeeLiquidGbp: number; // e.g. 10
}

export interface BrokerItem {
  id: string; // "BRK-XXX"
  title: string;
  contact: string;
  orderId: string | null;
  quantity: number;
  comment: string;
  arrivalDate: string; // YYYY-MM-DD
  paid: boolean;
  itemType: 'normal' | 'liquid';
  feeGbp: number; // 5 for normal, 10 for liquid
  assignedTo: string; // TeamMember ID
  shipmentId: string | null; // connected BrokerShipment ID
}

export interface BrokerShipment {
  id: string; // "SHP-XXX"
  createdAt: string; // YYYY-MM-DD
  status: 'Редактируется' | 'Отправлена' | 'Получена' | 'Закрыта';
  assignedTo: string; // TeamMember ID
  shippingFeeGbp: number; // 21 GBP
  notes: string;
}

