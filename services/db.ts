import { Customer, Campaign, Representative, Donation, Donor, Expense, Path, CallList, CampaignGroup, User, Patrol, RankDefinition, Gift, Lottery, UserRole, RepToAdminMessage, RepTask, DailyReport, SystemMessage, ClearingSettings } from '../types';
import { mockCampaigns, mockRepresentatives, mockDonors, mockDonations, mockRanks, mockGifts, mockLotteries, mockPaths, mockCallLists, mockSystemMessages, mockCustomers } from './mockData';

const DB_KEY = 'tat_pro_db_v1';
const SYNC_CHANNEL = 'tat_pro_sync_channel';
// כתובת השרת ב-Railway (תתעדכן אוטומטית לפי ה-Deploy)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/data';

const syncChannel = new BroadcastChannel(SYNC_CHANNEL);

interface DBStore {
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

const charidyMocks: Donation[] = [
  { id: 'ch1', donorName: 'ישראל אברהם', amount: 1800, representativeId: 'r1', representativeName: 'איתמר לוי', timestamp: new Date(Date.now() - 3600000).toISOString(), method: 'online', campaignId: '1', status: 'confirmed', source: 'charidy' },
  { id: 'ch2', donorName: 'משפחת גולדשטיין', amount: 360, representativeId: 'r2', representativeName: 'יונתן רפאלי', timestamp: new Date(Date.now() - 7200000).toISOString(), method: 'bit', campaignId: '1', status: 'confirmed', source: 'charidy' },
  { id: 'ch3', donorName: 'תורם אנונימי', amount: 500, representativeId: 'r1', representativeName: 'איתמר לוי', timestamp: new Date(Date.now() - 10800000).toISOString(), method: 'online', campaignId: '1', status: 'confirmed', source: 'charidy' },
  { id: 'ch4', donorName: 'יוסף כהן - מנצ׳סטר', amount: 1200, representativeId: 'r4', representativeName: 'אלעד שטיינר', timestamp: new Date(Date.now() - 14400000).toISOString(), method: 'online', campaignId: '1', status: 'confirmed', source: 'charidy' }
];

export const db = {
  loadAll: async (): Promise<DBStore> => {
    // 1. ניסיון טעינה מ-MongoDB
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const remoteData = await response.json();
        if (remoteData) return remoteData;
      }
    } catch (e) {
      console.warn("MongoDB not reachable, using local data");
    }

    // 2. לוגיקת LocalStorage המקורית (ללא שינוי אות אחת)
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      const initialStore: DBStore = {
        campaigns: mockCampaigns,
        representatives: mockRepresentatives,
        donors: mockDonors,
        donations: [...mockDonations, ...charidyMocks],
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
        managers: [
          { 
            id: 'm1', 
            name: 'ישראל כהן', 
            username: 'israel', 
            password: '123', 
            role: UserRole.CAMPAIGN_MANAGER, 
            managerArea: 'כספים ובקרה', 
            allowedPages: ['dashboard', 'donations', 'cash_management', 'expenses'] 
          },
          { 
            id: 'm2', 
            name: 'משה לוי', 
            username: 'moshe', 
            password: '123', 
            role: UserRole.CAMPAIGN_MANAGER, 
            managerArea: 'לוגיסטיקה שטח', 
            allowedPages: ['dashboard', 'crm', 'war_room'] 
          },
          { 
            id: 'm3', 
            name: 'אברהם פריד', 
            username: 'avraham', 
            password: '123', 
            role: UserRole.CAMPAIGN_MANAGER, 
            managerArea: 'ניהול תגמולים', 
            allowedPages: ['dashboard', 'rewards', 'messages'] 
          }
        ],
        ranks: mockRanks,
        gifts: mockGifts,
        lotteries: mockLotteries,
        patrols: [
          { id: 'p1', name: 'סיירת מרכז - בני ברק', city: 'בני ברק', repIds: ['r1', 'r4'], type: 'regular' },
          { id: 'p2', name: 'סיירת פורים - ירושלים', city: 'ירושלים', repIds: ['r2', 'r5'], type: 'purim_day' },
          { id: 'p3', name: 'סיירת דרום - נתיבות', city: 'נתיבות', repIds: ['r3'], type: 'purim_day' },
          { id: 'p4', name: 'סיירת צפון - צפת', city: 'צפת', repIds: [], type: 'purim_day' }
        ],
        repToAdminMessages: [
          { id: 'msg1', repId: 'r1', repName: 'איתמר לוי', content: 'הגעתי לכתובת בחזון איש 15 אבל אין מענה בפעמון, להמשיך הלאה?', timestamp: new Date(Date.now() - 300000).toISOString(), status: 'new' },
          { id: 'msg2', repId: 'r2', repName: 'יונתן רפאלי', content: 'התורם שאל אם אפשר לקבל קבלה של 46, אמרתי לו שתבדקו.', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'new' }
        ],
        repTasks: [
          { id: 't1', title: 'גיוס ראשון היום', description: 'דווח על תרומה ראשונה לפני השעה 12:00', rewardPoints: 50, status: 'open', category: 'daily' },
          { id: 't2', title: 'שיתוף בסטטוס', description: 'שתף את הלינק האישי שלך בסטטוס הוואטסאפ ושלח צילום מסך', rewardPoints: 20, status: 'open', category: 'special' }
        ],
        dailyReports: [],
        systemMessages: mockSystemMessages,
        clearingSettings: initialClearingSettings
      };
      db.saveAll(initialStore);
      return initialStore;
    }
    const parsed = JSON.parse(data);
    if (!parsed.customers) parsed.customers = mockCustomers;
    if (!parsed.clearingSettings) parsed.clearingSettings = initialClearingSettings;
    return parsed;
  },

  saveAll: async (store: DBStore) => {
    // 1. שמירה ל-LocalStorage (ללא שינוי)
    localStorage.setItem(DB_KEY, JSON.stringify(store));
    syncChannel.postMessage('db_updated');

    // 2. שמירה ל-MongoDB בענן
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store)
      });
    } catch (e) {
      console.error("Failed to sync with MongoDB");
    }
  },

  onSync: (callback: () => void) => {
    syncChannel.onmessage = (event) => {
      if (event.data === 'db_updated') {
        callback();
      }
    };
  }
};