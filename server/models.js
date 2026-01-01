import mongoose from 'mongoose';

// --- 1. לקוחות (Tenants) - Customers.tsx ---
const CustomerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, default: 'בני ברק' },
  street: String,
  houseNumber: String,
  officePhone: String,
  subscriptionType: { type: String, enum: ['demo', 'paid', 'yearly', 'paused'], default: 'demo' },
  status: { type: String, enum: ['active', 'pending', 'rejected', 'inactive'], default: 'pending' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  contacts: [{
    id: String, name: String, phone: String, email: String, hasWhatsApp: Boolean, role: String
  }],
  users: [Object],
  clearingSettings: {
    bit: { mode: { type: String, default: 'manual' }, manualPhones: [String] },
    paybox: { mode: { type: String, default: 'manual' }, manualPhones: [String] },
    transfer: { bankDetails: String },
    check: { payableTo: String }
  }
}, { minimize: false });

// --- 2. קמפיינים - Campaigns.tsx ---
const CampaignSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  goal: { type: Number, default: 0 },
  raised: { type: Number, default: 0 },
  startDate: String,
  endDate: String,
  status: { type: String, default: 'active' },
  currency: { type: String, default: 'ILS' },
  color: { type: String, default: '#2563eb' },
  logo: String,
  images: [String],
  videos: [String],
  customButtons: [{ name: String, icon: String, amount: Number }]
}, { minimize: false });

// --- 3. הוצאות - ExpensesPage.tsx ---
const ExpenseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'כללי' },
  description: String,
  date: String,
  campaignId: String
});

// --- 4. תורמים (CRM) - CRM.tsx ---
const DonorSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  firstName: String,
  lastName: String,
  phone: String,
  city: String,
  street: String,
  building: String,
  floor: String,
  apartment: String,
  preferences: [String],
  connectionType: String,
  potentialRank: { type: Number, default: 3 },
  notes: String,
  assignedRepIds: [String],
  treatmentStatus: { type: String, default: 'available' },
  campaignId: String
});

// --- 5. תרומות - DonationsPage.tsx & CashManagement.tsx ---
const DonationSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  donorName: String,
  donorPhone: String,
  amount: Number,
  representativeId: String,
  representativeName: String,
  timestamp: String,
  method: String,
  status: String,
  source: { type: String, default: 'system' },
  bitTargetPhone: String,
  referenceNumber: String,
  verifiedBy: String,
  verifiedAt: String,
  campaignId: String
});

// --- 6. משתמשים ומנהלי תחום - Representatives.tsx ---
const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  username: { type: String, unique: true },
  password: { type: String },
  phone: String,
  role: String, // ADMIN, CAMPAIGN_MANAGER, REPRESENTATIVE
  managerArea: String, // תחום ניהול (מנהלי תחום)
  allowedPages: [String], // דפים מורשים
  groupId: String,
  personalGoal: { type: Number, default: 0 },
  totalRaised: { type: Number, default: 0 },
  otpOnly: { type: Boolean, default: false }
});

// --- 7. קבוצות, סיירות, תגמולים והודעות ---
const GroupSchema = new mongoose.Schema({ id: String, name: String, color: String, shnaton: String });
const PatrolSchema = new mongoose.Schema({ id: String, name: String, city: String, repIds: [String], type: String });
const RankSchema = new mongoose.Schema({ id: String, name: String, minAmount: Number, color: String, image: String, icon: String });
const GiftSchema = new mongoose.Schema({ id: String, name: String, description: String, milestoneAmount: Number, image: String });
const LotterySchema = new mongoose.Schema({ id: String, title: String, description: String, drawDate: String, drawTime: String, minThreshold: Number, status: String, image: String });
const SystemMessageSchema = new mongoose.Schema({ id: String, title: String, content: String, type: String, targetType: String, targetIds: [String], targetGroup: String, timestamp: String });

export const Customer = mongoose.model('Customer', CustomerSchema);
export const Campaign = mongoose.model('Campaign', CampaignSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const Donor = mongoose.model('Donor', DonorSchema);
export const Donation = mongoose.model('Donation', DonationSchema);
export const User = mongoose.model('User', UserSchema);
export const Group = mongoose.model('Group', GroupSchema);
export const Patrol = mongoose.model('Patrol', PatrolSchema);
export const Rank = mongoose.model('Rank', RankSchema);
export const Gift = mongoose.model('Gift', GiftSchema);
export const Lottery = mongoose.model('Lottery', LotterySchema);
export const SystemMessage = mongoose.model('SystemMessage', SystemMessageSchema);