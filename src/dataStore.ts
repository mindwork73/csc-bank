/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Order, 
  Parcel, 
  FinanceEntry, 
  TeamMember, 
  OrderStatus, 
  PaymentStatus, 
  ShippingStatus, 
  ParcelStatus, 
  FinanceType,
  AuditLog,
  ImportSession,
  AppSettings,
  BrokerItem,
  BrokerShipment
} from './types';

// Initial pre-seeded team members reflecting the CSC partners
export const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'mem-ilya', name: 'Илья', sharePercent: 33.33, active: true, balance: 0 },
  { id: 'mem-misha', name: 'Миша', sharePercent: 33.33, active: true, balance: 0 },
  { id: 'mem-dedus', name: 'Дедус', sharePercent: 33.33, active: true, balance: 0 },
];

export const INITIAL_SETTINGS: AppSettings = {
  gbpExchangeRate: 122.5,
  defaultFeeRegularGbp: 5,
  defaultFeeLiquidGbp: 10,
};

// Seed sample orders based on standard Russian-oriented clothing/tech requests
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    contact: '@kirill_v',
    productName: 'Jordan 4 Retro Military Blue (43 EU)',
    costPrice: 18500,
    clientPrice: 24500,
    margin: 6000,
    profit: 5387.5, // margin minus £5 (612.5 RUB) logistics
    orderStatus: OrderStatus.REDEEMED,
    paymentStatus: PaymentStatus.PAID,
    shippingStatus: ShippingStatus.UK_WAREHOUSE,
    shippingType: 'Англия Экспресс',
    hasLiquid: false,
    notes: 'Размер 43, коробка целая. Выкуплен с Poison.',
    assignedTo: 'mem-ilya',
    parcelId: 'PRC-101',
    createdAt: '2026-05-18T10:15:00Z',
    updatedAt: '2026-06-02T14:30:00Z',
    tags: ['Обувь', 'Poison'],
    source: 'Telegram'
  },
  {
    id: 'ORD-102',
    contact: '@daria_nov',
    productName: 'Dyson Airwrap Styler Special Edition',
    costPrice: 42000,
    clientPrice: 51200,
    margin: 9200,
    profit: 7975, // margin minus £10 (1225 RUB) logistics coz cosmetics liquid
    orderStatus: OrderStatus.IN_TRANSIT,
    paymentStatus: PaymentStatus.PAID,
    shippingStatus: ShippingStatus.TRANSIT,
    shippingType: 'Англия Экспресс',
    hasLiquid: true,
    notes: 'Европейская вилка. Нужен переходник.',
    assignedTo: 'mem-misha',
    parcelId: 'PRC-102',
    createdAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-06-03T16:15:00Z',
    tags: ['Техника', 'Подарки'],
    source: 'Instagram'
  },
  {
    id: 'ORD-103',
    contact: '@serg_shev',
    productName: 'Supreme Box Logo Tee Grey L',
    costPrice: 6200,
    clientPrice: 9000,
    margin: 2800,
    profit: 2800,
    orderStatus: OrderStatus.NEW,
    paymentStatus: PaymentStatus.PARTIALLY_PAID,
    shippingStatus: ShippingStatus.FORMING,
    shippingType: 'Обычная (Авиа)',
    hasLiquid: false,
    notes: 'Предоплата 50%',
    assignedTo: 'mem-dedus',
    parcelId: null,
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-06-05T09:05:00Z',
    tags: ['Одежда', 'Supreme'],
    source: 'Telegram'
  },
  {
    id: 'ORD-104',
    contact: '@mash_g',
    productName: 'Optimum Nutrition Gold Standard Whey 2.27kg + Shaker',
    costPrice: 5800,
    clientPrice: 8500,
    margin: 2700,
    profit: 2087.5, // minus £5
    orderStatus: OrderStatus.WAREHOUSE,
    paymentStatus: PaymentStatus.PAID,
    shippingStatus: ShippingStatus.ARRIVED,
    shippingType: 'Англия Экспресс',
    hasLiquid: false,
    notes: 'Вкус Шоколадный Кокос. Посылка получена в Мск.',
    assignedTo: 'mem-ilya',
    parcelId: 'PRC-101',
    createdAt: '2026-05-22T14:20:00Z',
    updatedAt: '2026-06-08T11:00:00Z',
    tags: ['Спортпит', 'UK-Import'],
    source: 'Referral'
  },
  {
    id: 'ORD-105',
    contact: '@alex_m',
    productName: 'Marshall Major V Wireless Headphones Black',
    costPrice: 11500,
    clientPrice: 16900,
    margin: 5400,
    profit: 4787.5,
    orderStatus: OrderStatus.PROBLEM,
    paymentStatus: PaymentStatus.UNPAID,
    shippingStatus: ShippingStatus.UK_WAREHOUSE,
    shippingType: 'Англия Экспресс',
    hasLiquid: false,
    notes: 'Клиент задерживает оплату, зависла на складе.',
    assignedTo: 'mem-dedus',
    parcelId: 'PRC-103',
    createdAt: '2026-05-25T17:30:00Z',
    updatedAt: '2026-06-07T12:00:00Z',
    tags: ['Аудио', 'Задержка'],
    source: 'Telegram'
  }
];

// Seed sample parcels
export const INITIAL_PARCELS: Parcel[] = [
  {
    id: 'PRC-101',
    title: 'UK Container Box #24 (Sneakers & Vitamins)',
    parcelType: 'regular',
    shippingFeeGbp: 5,
    exchangeRate: 122.5,
    shippingFeeLocal: 612.5,
    containsLiquid: false,
    status: ParcelStatus.ARRIVED,
    notes: 'Сборный бокс. Прибыл успешно на склад СДЭК.',
    createdAt: '2026-05-19T08:00:00Z',
    sentAt: '2026-05-24T12:00:00Z',
    arrivedAt: '2026-06-06T15:00:00Z',
    assignedTo: 'mem-ilya',
    trackingCode: 'CSC-UK-75924'
  },
  {
    id: 'PRC-102',
    title: 'UK Cosmetics Liquid Box #25',
    parcelType: 'liquid',
    shippingFeeGbp: 10,
    exchangeRate: 122.5,
    shippingFeeLocal: 1225.0,
    containsLiquid: true,
    status: ParcelStatus.IN_TRANSIT,
    notes: 'Содержит жидкие гели и Dyson (содержит спреи). Особая ставка логистики.',
    createdAt: '2026-05-21T09:30:00Z',
    sentAt: '2026-05-27T10:00:00Z',
    arrivedAt: null,
    assignedTo: 'mem-misha',
    trackingCode: 'CSC-UK-75925'
  },
  {
    id: 'PRC-103',
    title: 'Weekly Batch Box #26',
    parcelType: 'regular',
    shippingFeeGbp: 5,
    exchangeRate: 122.5,
    shippingFeeLocal: 612.5,
    containsLiquid: false,
    status: ParcelStatus.UK_WAREHOUSE,
    notes: 'Формируется на складе в Лондоне.',
    createdAt: '2026-05-26T11:00:00Z',
    sentAt: null,
    arrivedAt: null,
    assignedTo: 'mem-dedus',
    trackingCode: 'CSC-UK-75926'
  }
];

// Seed sample finance entries
export const INITIAL_FINANCE_ENTRIES: FinanceEntry[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-101',
    entityType: 'Order',
    entityId: 'ORD-101',
    action: 'Заказ создан',
    before: '{}',
    after: JSON.stringify(INITIAL_ORDERS[0]),
    createdAt: '2026-05-18T10:15:00Z',
    userId: 'Илья'
  },
  {
    id: 'LOG-102',
    entityType: 'Order',
    entityId: 'ORD-101',
    action: 'Изменен статус оплаты -> Оплачен',
    before: 'Не оплачен',
    after: 'Оплачен',
    createdAt: '2026-05-18T10:30:00Z',
    userId: 'Система'
  }
];

// Seed sample broker items and shipments
export const INITIAL_BROKER_ITEMS: BrokerItem[] = [
  {
    id: 'BRK-101',
    title: 'Nike Air Max 90 Sneakers',
    contact: '@kirill_v',
    orderId: 'ORD-101',
    quantity: 1,
    comment: 'Размер 43, коробка целая',
    arrivalDate: '2026-06-01',
    paid: true,
    itemType: 'normal',
    feeGbp: 5,
    assignedTo: 'mem-ilya',
    shipmentId: 'SHP-101'
  },
  {
    id: 'BRK-102',
    title: 'Dyson Airwrap (Cosmetics set)',
    contact: '@daria_nov',
    orderId: 'ORD-102',
    quantity: 1,
    comment: 'Жидкости внутри набора',
    arrivalDate: '2026-06-03',
    paid: false,
    itemType: 'liquid',
    feeGbp: 10,
    assignedTo: 'mem-misha',
    shipmentId: null
  },
  {
    id: 'BRK-103',
    title: 'Vitamins (Omega 3 & D3)',
    contact: '@mash_g',
    orderId: 'ORD-104',
    quantity: 2,
    comment: 'В коробке со спортивным питанием',
    arrivalDate: '2026-06-05',
    paid: true,
    itemType: 'normal',
    feeGbp: 5,
    assignedTo: 'mem-ilya',
    shipmentId: 'SHP-101'
  },
  {
    id: 'BRK-104',
    title: 'Heated Eye Mask & Liquid Serum',
    contact: '@alex_m',
    orderId: 'ORD-105',
    quantity: 1,
    comment: 'Жидкая сыворотка, дорогая коробка',
    arrivalDate: '2026-06-07',
    paid: false,
    itemType: 'liquid',
    feeGbp: 10,
    assignedTo: 'mem-dedus',
    shipmentId: null
  }
];

export const INITIAL_BROKER_SHIPMENTS: BrokerShipment[] = [
  {
    id: 'SHP-101',
    createdAt: '2026-06-04',
    status: 'Отправлена',
    assignedTo: 'mem-ilya',
    shippingFeeGbp: 21,
    notes: 'Первая сводная авиа-отправка июня. Собраны Nike и витамины.'
  }
];

export interface CSCState {
  orders: Order[];
  parcels: Parcel[];
  finance: FinanceEntry[];
  members: TeamMember[];
  logs: AuditLog[];
  settings: AppSettings;
  importHistory: ImportSession[];
  profitAllocationType: 'common' | 'manager'; // determines where order profit is credited
  brokerItems: BrokerItem[];
  brokerShipments: BrokerShipment[];
}

// Deeply load state or fallback to seeded data
export function getStoredState(): CSCState {
  try {
    const data = localStorage.getItem('csc_portal_state_v1');
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure all arrays exist
      if (parsed.orders && parsed.parcels && parsed.finance && parsed.members) {
        // Migration to clean up team members names and ensure they are only Илья, Миша, Дедус
        const validIds = ['mem-ilya', 'mem-misha', 'mem-dedus'];
        const needsRestruct = parsed.members.length !== 3 || 
          parsed.members.some((m: any) => !validIds.includes(m.id)) ||
          parsed.members.some((m: any) => m.name !== 'Илья' && m.name !== 'Миша' && m.name !== 'Дедус');

        if (needsRestruct) {
          parsed.members = INITIAL_MEMBERS;
          try {
            localStorage.setItem('csc_portal_state_v1', JSON.stringify(parsed));
          } catch (err) {
            console.error('Failed to save migrated state: ', err);
          }
        }

        if (!parsed.brokerItems) {
          parsed.brokerItems = INITIAL_BROKER_ITEMS;
          try {
            localStorage.setItem('csc_portal_state_v1', JSON.stringify(parsed));
          } catch (err) {}
        }
        if (!parsed.brokerShipments) {
          parsed.brokerShipments = INITIAL_BROKER_SHIPMENTS;
          try {
            localStorage.setItem('csc_portal_state_v1', JSON.stringify(parsed));
          } catch (err) {}
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load storage state: ', e);
  }

  // Populate dynamic balances in initial load
  const state: CSCState = {
    orders: INITIAL_ORDERS,
    parcels: INITIAL_PARCELS,
    finance: INITIAL_FINANCE_ENTRIES,
    members: INITIAL_MEMBERS,
    logs: INITIAL_AUDIT_LOGS,
    settings: INITIAL_SETTINGS,
    importHistory: [],
    profitAllocationType: 'manager', // By default, order profit credits to assigned manager
    brokerItems: INITIAL_BROKER_ITEMS,
    brokerShipments: INITIAL_BROKER_SHIPMENTS
  };
  saveState(state);
  return state;
}

export function saveState(state: CSCState) {
  try {
    localStorage.setItem('csc_portal_state_v1', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

/**
 * Recalculate financial balances for each team member and common fund
 * based on all orders and financial log transactions.
 */
export function calculateBalances(state: CSCState) {
  let commonFundBalance = 0;
  
  // Start with default starting shares / manual deposits
  const memberBalances: Record<string, number> = {};
  state.members.forEach(m => {
    memberBalances[m.id] = 0;
  });

  const hasBuhUchet = state.finance.some(f => f.source === 'GoogleSheets:BuhUchet' || !!f.account);

  if (hasBuhUchet) {
    // If Buh Uchet entries are loaded, compute balances strictly using the actual ledger per-account transactions
    state.finance.forEach(entry => {
      const amount = Number(entry.amount) || 0;
      const account = entry.account || (entry.memberId ? (entry.memberId === 'mem-ilya' ? 'Илья' : entry.memberId === 'mem-misha' ? 'Миша' : entry.memberId === 'mem-dedus' ? 'Дедус' : '') : 'Общак');
      const isExpense = entry.type === FinanceType.EXPENSE || entry.type === FinanceType.WITHDRAW_COMMON || entry.type === FinanceType.PAYOUT;

      const delta = isExpense ? -amount : amount;

      if (account === 'Общак') {
        commonFundBalance += delta;
      } else {
        const mId = account === 'Илья' ? 'mem-ilya' : account === 'Миша' ? 'mem-misha' : account === 'Дедус' ? 'mem-dedus' : entry.memberId;
        if (mId && memberBalances[mId] !== undefined) {
          memberBalances[mId] += delta;
        }
      }
    });
  } else {
    // 1. Process standard Financial entries
    state.finance.forEach(entry => {
      const amount = Number(entry.amount) || 0;
      
      // Deposit / withdraw touches Common Fund directly
      if (entry.type === FinanceType.DEPOSIT_COMMON) {
        commonFundBalance += amount;
      } else if (entry.type === FinanceType.WITHDRAW_COMMON) {
        commonFundBalance -= amount;
      } else if (entry.type === FinanceType.PAYOUT) {
        // Payout withdrawals can deduct from common fund or personal
        if (entry.affectsCommonFund) {
          commonFundBalance -= amount;
        }
        if (entry.memberId && memberBalances[entry.memberId] !== undefined) {
          memberBalances[entry.memberId] -= amount;
        }
      } else if (entry.type === FinanceType.EXPENSE) {
        if (entry.affectsCommonFund) {
          commonFundBalance -= amount;
        }
        
        if (entry.splitBetweenMembers) {
          // Shared item: splits equally among of all active members
          const activeMembers = state.members.filter(m => m.active);
          const count = activeMembers.length || 1;
          const splitAmount = amount / count;
          
          activeMembers.forEach(m => {
            memberBalances[m.id] -= splitAmount;
          });
        } else if (entry.memberId && memberBalances[entry.memberId] !== undefined) {
          // Individual member's expense
          memberBalances[entry.memberId] -= amount;
        }
      } else if (entry.type === FinanceType.INCOME) {
        if (entry.affectsCommonFund) {
          commonFundBalance += amount;
        } else if (entry.memberId && memberBalances[entry.memberId] !== undefined) {
          memberBalances[entry.memberId] += amount;
        }
      }
    });

    // 2. Process Order revenue and logistics deductions
    state.orders.forEach(order => {
      const clientPrice = Number(order.clientPrice) || 0;
      const costPrice = Number(order.costPrice) || 0;
      const margin = clientPrice - costPrice;

      // Deduct linked shipping fee if parcel is attached
      let shippingDeduction = 0;
      if (order.parcelId) {
        const p = state.parcels.find(x => x.id === order.parcelId);
        if (p) {
          // UK shipping rates helper: GBP rate * exchangeRate config
          const feeGbp = p.shippingFeeGbp || (p.containsLiquid ? state.settings.defaultFeeLiquidGbp : state.settings.defaultFeeRegularGbp);
          const rate = p.exchangeRate || state.settings.gbpExchangeRate;
          // Divide parcel total cost by the number of orders tied to this parcel
          const tiedOrdersCount = state.orders.filter(o => o.parcelId === p.id).length || 1;
          shippingDeduction = (feeGbp * rate) / tiedOrdersCount;
        }
      }

      const netProfit = margin - shippingDeduction;

      // Only count financial impact if the order is PAID / partially paid
      // Let's assume paid orders contribute 100% margin-profit to balance
      if (order.orderStatus !== OrderStatus.CANCELLED) {
        if (order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIALLY_PAID) {
          const coefficient = order.paymentStatus === PaymentStatus.PARTIALLY_PAID ? 0.5 : 1.0;
          const profitToAdd = netProfit * coefficient;
          
          if (state.profitAllocationType === 'common') {
            // Add directly to common pool
            commonFundBalance += profitToAdd;
          } else if (order.assignedTo && memberBalances[order.assignedTo] !== undefined) {
            // Add to curator's balance
            memberBalances[order.assignedTo] += profitToAdd;
          }
        }
      }
    });
  }

  return {
    commonFund: commonFundBalance,
    members: memberBalances
  };
}

// Quick CSV parsing function for importing Google Sheets exports
export interface ParsedRow {
  [key: string]: string;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines: string[] = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',') {
      if (inQuotes) {
        row[row.length - 1] += c;
      } else {
        row.push("");
      }
    } else if (c === '\r' || c === '\n') {
      if (inQuotes) {
        row[row.length - 1] += c;
      } else {
        if (c === '\r' && next === '\n') {
          i++; // Skip \n
        }
        lines.push(JSON.stringify(row));
        row = [""];
      }
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(JSON.stringify(row));
  }

  if (lines.length < 2) return [];

  const headers = JSON.parse(lines[0]) as string[];
  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = JSON.parse(lines[i]) as string[];
    if (currentLine.length === 1 && currentLine[0] === "") continue; // skip blank rows
    
    const rowObj: ParsedRow = {};
    headers.forEach((header, index) => {
      rowObj[header.trim()] = currentLine[index] ? currentLine[index].trim() : "";
    });
    results.push(rowObj);
  }

  return results;
}

/**
 * Generate standard export links for direct CSV download.
 * Google sheet urls must have format:
 * https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>
 * Or via gviz/tq endpoint which parses public spreadsheets beautifully.
 */
export function getGoogleSheetsCSVUrl(spreadsheetUrl: string, sheetName: string): string {
  try {
    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return spreadsheetUrl;
    const key = match[1];
    return `https://docs.google.com/spreadsheets/d/${key}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  } catch (e) {
    return spreadsheetUrl;
  }
}
