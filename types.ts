
export enum UserRole {
  ADMIN = 'ADMIN',
  CAMPAIGN_MANAGER = 'CAMPAIGN_MANAGER',
  REPRESENTATIVE = 'REPRESENTATIVE',
  SUB_USER = 'SUB_USER',
  VIEWER = 'VIEWER',
  DATA_UPDATER = 'DATA_UPDATER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type SubscriptionType = 'demo' | 'paid' | 'paused' | 'yearly';
export type ContactRole = 'מנהל ת"ת' | 'חבר ת"ת' | 'מנהל ישיבה' | 'ראש הישיבה';
export type CustomerStatus = 'active' | 'pending' | 'rejected';

export interface CustomerContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  hasWhatsApp: boolean;
  role: ContactRole;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  street: string;
  houseNumber: string;
  officePhone?: string;
  email?: string;
  subscriptionType: SubscriptionType;
  contacts: CustomerContact[];
  users: User[];
  createdAt: string;
  status: CustomerStatus;
}

export type DonorPreference = 'telephonic' | 'general_visit' | 'purim_day';
export type ConnectionType = 'alumnus' | 'parent' | 'staff_family' | 'student_family' | 'general' | 'other';
export type AssignmentStatus = 'available' | 'in_treatment' | 'completed' | 'call_back' | 'not_donated';
export type VisitStatus = 'visited' | 'not_visited';

export type EligibilityType = 'rank' | 'daily_amount' | 'personal_goal';

export interface CampaignGroup {
  id: string;
  name: string;
  color: string;
  shnaton?: string; 
}

export interface DonationButton {
  name: string;
  icon: string;
  amount: number;
}

export type PaymentMethod = 'online' | 'cash' | 'bit' | 'paybox' | 'credit' | 'check' | 'transfer';

export interface ClearingSettings {
  transfer: { bankDetails: string };
  check: { payableTo: string };
  bit: { mode: 'manual' | 'clearing'; manualPhones: string[] };
  paybox: { mode: 'manual' | 'clearing'; manualPhones: string[] };
}

export interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  addressNotes?: string;
  phone?: string;
  preferences: DonorPreference[];
  connectionType: ConnectionType;
  connectionDetail?: string; 
  totalDonated: number;
  lastVisit: string;
  status: 'potential' | 'donated' | 'not_home' | 'do_not_visit';
  assignmentStatus: AssignmentStatus;
  visitStatus: VisitStatus;
  potentialRank: number;
  notes: string;
  referredByRepId?: string;
  campaignId?: string;
  assignedRepIds?: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  phone?: string;
  email?: string;
  groupId?: string; 
  group?: string; 
  allowedPages?: string[];
  managerArea?: string;
  otpOnly?: boolean;
  status?: 'active' | 'inactive';
  lastLogin?: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: number;
  raised: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'ended';
  currency: string;
  color: string;
  logo?: string;
  images?: string[];
  videos?: string[];
  customButtons?: DonationButton[];
}

export interface Donation {
  id: string;
  donorName: string;
  donorPhone?: string;
  amount: number;
  representativeId: string;
  representativeName: string;
  timestamp: string;
  method: PaymentMethod;
  campaignId: string;
  status: 'confirmed' | 'pending_verification' | 'pending_cash' | 'rejected';
  source: 'system' | 'charidy' | 'manual_rep';
  bitTargetPhone?: string; 
  referenceNumber?: string; 
  verifiedBy?: string; // שם המנהל שאימת
  verifiedAt?: string; // תאריך האימות
  country?: string;
  installments?: number;
  externalLink?: string;
}

export interface Path {
  id: string;
  name: string;
  city: string;
  startTime: string;
  endTime: string;
  assignedRepIds: string[];
  addresses: Donor[];
  startAddress?: string;
  transitInstructions?: Record<number, any[]>;
}

export interface CallList {
  id: string;
  name: string;
  assignedRepIds: string[];
  donors: Donor[];
}

export interface Representative extends User {
  personalGoal: number;
  totalRaised: number;
  rank: string;
  status: 'active' | 'inactive';
  campaignId?: string;
  loginMethod?: 'credentials' | 'phone' | 'none';
  classYear?: string;
}

export interface Patrol {
  id: string;
  name: string;
  city: string;
  repIds: string[];
  type: 'purim_day' | 'regular';
}

export interface RankDefinition {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  icon: string;
  image?: string;
}

export interface Gift {
  id: string;
  name: string;
  milestoneAmount: number;
  description: string;
  eligibilityType: EligibilityType;
  image?: string;
}

export interface Lottery {
  id: string;
  title: string;
  description: string;
  drawDate: string;
  drawTime: string;
  minThreshold: number;
  status: 'active' | 'inactive' | 'completed';
  eligibilityCriteria: EligibilityType;
  winnerName?: string;
  autoActivate?: boolean;
  image?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  campaignId: string;
}

export interface SystemMessage {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  type: 'info' | 'success' | 'urgent';
  targetType: 'all' | 'group' | 'specific';
  targetIds?: string[];
  targetGroup?: string;
}

export interface RepToAdminMessage {
  id: string;
  repId: string;
  repName: string;
  content: string;
  timestamp: string;
  status: 'new' | 'read' | 'replied';
}

export interface RepTask {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  status: 'open' | 'completed';
  category: 'daily' | 'special';
}

export interface DailyReport {
  id: string;
  repId: string;
  date: string;
  text: string;
}
