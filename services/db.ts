import { Customer, Campaign, Representative, Donation, Donor, Expense, Path, CallList, CampaignGroup, User, Patrol, RankDefinition, Gift, Lottery, UserRole, RepToAdminMessage, RepTask, DailyReport, SystemMessage, ClearingSettings } from '../types';
import { mockCampaigns, mockRepresentatives, mockDonors, mockDonations, mockRanks, mockGifts, mockLotteries, mockPaths, mockCallLists, mockSystemMessages, mockCustomers } from './mockData';

const DB_KEY = 'tat_pro_db_v1';
const SYNC_CHANNEL = 'tat_pro_sync_channel';
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
    try {
      const [
        donors, donations, campaigns, users, paths, patrols, groups, expenses, customers, ranks, gifts, lotteries, messages, callLists, repToAdminMessages
      ] = await Promise.all([
        fetchFromApi('donors'),
        fetchFromApi('donations'),
        fetchFromApi('campaigns'),
        fetchFromApi('users'),
        fetchFromApi('paths'),
        fetchFromApi('patrols'),
        fetchFromApi('groups'),
        fetchFromApi('expenses'),
        fetchFromApi('customers'),
        fetchFromApi('ranks'),
        fetchFromApi('gifts'),
        fetchFromApi('lotteries'),
        fetchFromApi('systemMessages'),
        fetchFromApi('callLists'),
        fetchFromApi('repToAdminMessages')
      ]);

      // תיקון: בדיקה אם השרת ענה (גם אם הרשימות ריקות) כדי למנוע חזרה אוטומטית לנתוני המוק
      if (donors !== null || campaigns !== null || users !== null) {
        return {
          donors: donors || [],
          donations: donations || [],
          campaigns: campaigns || [],
          representatives: (users || []).filter((u: any) => u.role === UserRole.REPRESENTATIVE),
          managers: (users || []).filter((u: any) => u.role !== UserRole.REPRESENTATIVE),
          paths: paths || [],
          patrols: patrols || [],
          groups: groups || [],
          expenses: expenses || [],
          customers: customers || [],
          ranks: ranks || mockRanks,
          gifts: gifts || mockGifts,
          lotteries: lotteries || mockLotteries,
          systemMessages: messages || mockSystemMessages,
          repToAdminMessages: repToAdminMessages || [],
          repTasks: [],
          dailyReports: [],
          callLists: callLists || [],
          clearingSettings: initialClearingSettings
        };
      }
    } catch (e) {
      console.warn("Cloud DB partially reachable, falling back to local");
    }

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
      db.saveAll(initialStore);
      return initialStore;
    }
    return JSON.parse(localData);
  },

  saveAll: async (store: DBStore) => {
    localStorage.setItem(DB_KEY, JSON.stringify(store));
    syncChannel.postMessage('db_updated');

    const syncTasks = [
      ...store.donors.map(d => saveToApi('donors', d)),
      ...store.donations.map(d => saveToApi('donations', d)),
      ...store.campaigns.map(c => saveToApi('campaigns', c)),
      ...store.representatives.map(r => saveToApi('users', r)),
      ...store.managers.map(m => saveToApi('users', m)),
      ...store.groups.map(g => saveToApi('groups', g)),
      ...store.patrols.map(p => saveToApi('patrols', p)),
      ...store.paths.map(p => saveToApi('paths', p)),
      ...store.callLists.map(cl => saveToApi('callLists', cl)),
      ...store.ranks.map(r => saveToApi('ranks', r)),
      ...store.gifts.map(g => saveToApi('gifts', g)),
      ...store.lotteries.map(l => saveToApi('lotteries', l)),
      ...store.systemMessages.map(m => saveToApi('systemMessages', m)),
      ...store.repToAdminMessages.map(rm => saveToApi('repToAdminMessages', rm)),
      ...store.expenses.map(e => saveToApi('expenses', e)),
      ...store.customers.map(c => saveToApi('customers', c))
    ];
    
    try {
      await Promise.all(syncTasks);
    } catch (e) {
      console.error("Failed to sync all data to MongoDB");
    }
  },

  saveDonor: async (donor: Donor) => {
    const local = localStorage.getItem(DB_KEY);
    if (local) {
      const store = JSON.parse(local) as DBStore;
      store.donors = store.donors.map(d => d.id === donor.id ? donor : d);
      localStorage.setItem(DB_KEY, JSON.stringify(store));
      syncChannel.postMessage('db_updated');
    }
    return saveToApi('donors', donor);
  },

  addDonation: (donation: Donation) => saveToApi('donations', donation),
  saveUser: (user: User) => saveToApi('users', user),
  saveCampaign: (campaign: Campaign) => saveToApi('campaigns', campaign),
  saveGroup: (group: CampaignGroup) => saveToApi('groups', group),
  savePatrol: (patrol: Patrol) => saveToApi('patrols', patrol),
  saveRank: (rank: RankDefinition) => saveToApi('ranks', rank),
  saveGift: (gift: Gift) => saveToApi('gifts', gift),
  saveLottery: (lottery: Lottery) => saveToApi('lotteries', lottery),
  saveExpense: (expense: Expense) => saveToApi('expenses', expense),
  savePath: (path: Path) => saveToApi('paths', path),
  saveCallList: (cl: CallList) => saveToApi('callLists', cl),
  saveRepToAdminMessage: (msg: RepToAdminMessage) => saveToApi('repToAdminMessages', msg),

  onSync: (callback: () => void) => {
    syncChannel.onmessage = (event) => {
      if (event.data === 'db_updated') callback();
    };
  }
};