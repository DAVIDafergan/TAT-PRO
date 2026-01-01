import { Customer, Campaign, Representative, Donation, Donor, Expense, Path, CallList, CampaignGroup, User, Patrol, RankDefinition, Gift, Lottery, UserRole, RepToAdminMessage, RepTask, DailyReport, SystemMessage, ClearingSettings } from '../types';
import { mockCampaigns, mockRepresentatives, mockDonors, mockDonations, mockRanks, mockGifts, mockLotteries, mockPaths, mockCallLists, mockSystemMessages, mockCustomers } from './mockData';

const DB_KEY = 'tat_pro_db_v1';
const SYNC_CHANNEL = 'tat_pro_sync_channel';
// כתובת ה-API הבסיסית (השרת שבנינו יודע לנתב לפי שם הקולקשן)
const API_BASE = '/api';

const syncChannel = new BroadcastChannel(SYNC_CHANNEL);

export interface DBStore {
  campaigns: Campaign[];
  representatives: Representative[];
  donors: Donor[];
  donations: Donation[];
  expenses: Expense[];
  paths: Path[];
  callLists: CallList[];
  groups: CampaignGroup[];
  managers: User[];
  ranks: RankDefinition[];
  gifts: Gift[];
  lotteries: Lottery[];
  patrols: Patrol[];
  repToAdminMessages: RepToAdminMessage[];
  repTasks: RepTask[];
  dailyReports: DailyReport[];
  systemMessages: SystemMessage[];
  customers: Customer[];
  clearingSettings: ClearingSettings;
}

const initialClearingSettings: ClearingSettings = {
  transfer: { bankDetails: 'בנק פאג"י (52), סניף בני ברק (182), חשבון 123456' },
  check: { payableTo: 'מוסדות התורה והחסד' },
  bit: { mode: 'manual', manualPhones: ['0501112233', '0524445566'] },
  paybox: { mode: 'manual', manualPhones: ['0547778899'] }
};

// פונקציית עזר לקריאות API מסודרות
const fetchFromApi = async (collection: string) => {
  try {
    const res = await fetch(`${API_BASE}/${collection}`);
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
};

const saveToApi = async (collection: string, data: any) => {
  try {
    await fetch(`${API_BASE}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error(`Sync failed for ${collection}`);
  }
};

export const db = {
  loadAll: async (): Promise<DBStore> => {
    // 1. ניסיון טעינה מסודרת מה-MongoDB (כל טבלה בנפרד)
    try {
      const [
        donors, donations, campaigns, users, paths, patrols, groups, expenses, customers
      ] = await Promise.all([
        fetchFromApi('donors'),
        fetchFromApi('donations'),
        fetchFromApi('campaigns'),
        fetchFromApi('users'),
        fetchFromApi('paths'),
        fetchFromApi('patrols'),
        fetchFromApi('groups'),
        fetchFromApi('expenses'),
        fetchFromApi('customers')
      ]);

      // אם הצלחנו למשוך נתונים (לפחות תורמים), נחזיר את הנתונים מהענן
      if (donors && donors.length > 0) {
        return {
          donors,
          donations: donations || [],
          campaigns: campaigns || [],
          representatives: (users || []).filter((u: any) => u.role === 'REPRESENTATIVE'),
          managers: (users || []).filter((u: any) => u.role !== 'REPRESENTATIVE'),
          paths: paths || [],
          patrols: patrols || [],
          groups: groups || [],
          expenses: expenses || [],
          customers: customers || [],
          // שאר השדות יישארו מה-Mocks או מ-LocalStorage אם אין בענן
          ranks: mockRanks,
          gifts: mockGifts,
          lotteries: mockLotteries,
          repToAdminMessages: [],
          repTasks: [],
          dailyReports: [],
          systemMessages: mockSystemMessages,
          clearingSettings: initialClearingSettings
        };
      }
    } catch (e) {
      console.warn("Cloud DB partially reachable, falling back to local");
    }

    // 2. לוגיקת LocalStorage המקורית כגיבוי (Fallback)
    const localData = localStorage.getItem(DB_KEY);
    if (!localData) {
      const initialStore: DBStore = {
        campaigns: mockCampaigns,
        representatives: mockRepresentatives,
        donors: mockDonors,
        donations: mockDonations,
        expenses: [],
        paths: mockPaths,
        callLists: mockCallLists,
        customers: mockCustomers,
        groups: [
          { id: 'g1', name: 'שיעור א\'', color: '#2563eb', shnaton: 'תשפ"ו' },
          { id: 'g2', name: 'שיעור ב\'', color: '#8b5cf6', shnaton: 'תשפ"ה' },
          { id: 'g3', name: 'שיעור ג\'', color: '#f59e0b', shnaton: 'תשפ"ד' },
          { id: 'g4', name: 'שיעור ד\'', color: '#10b981', shnaton: 'תשפ"ג' },
          { id: 'g5', name: 'ועד', color: '#f43f5e', shnaton: 'תשפ"ב' },
          { id: 'g6', name: 'אברכים', color: '#475569', shnaton: 'תשפ"א' }
        ],
        managers: [],
        ranks: mockRanks,
        gifts: mockGifts,
        lotteries: mockLotteries,
        patrols: [],
        repToAdminMessages: [],
        repTasks: [],
        dailyReports: [],
        systemMessages: mockSystemMessages,
        clearingSettings: initialClearingSettings
      };
      return initialStore;
    }
    return JSON.parse(localData);
  },

  // שמירה "מסודרת" - כל חלק נשמר לטבלה שלו ב-MongoDB
  saveAll: async (store: DBStore) => {
    // שמירה מקומית (ללא שינוי)
    localStorage.setItem(DB_KEY, JSON.stringify(store));
    syncChannel.postMessage('db_updated');

    // שמירה לענן בצורה מאורגנת (כל קולקשן בנפרד)
    // השרת שבנינו יודע לקחת את ה-id ולבצע update או create
    await Promise.all([
      ...store.donors.map(d => saveToApi('donors', d)),
      ...store.donations.map(d => saveToApi('donations', d)),
      ...store.campaigns.map(c => saveToApi('campaigns', c)),
      ...store.representatives.map(r => saveToApi('users', r)),
      ...store.managers.map(m => saveToApi('users', m)),
      ...store.paths.map(p => saveToApi('paths', p)),
      ...store.expenses.map(e => saveToApi('expenses', e))
    ]);
  },

  // פונקציות עזר לשמירה של פריט בודד (לביצועים טובים יותר)
  saveDonor: (donor: Donor) => saveToApi('donors', donor),
  addDonation: (donation: Donation) => saveToApi('donations', donation),
  saveUser: (user: User) => saveToApi('users', user),

  onSync: (callback: () => void) => {
    syncChannel.onmessage = (event) => {
      if (event.data === 'db_updated') callback();
    };
  }
};