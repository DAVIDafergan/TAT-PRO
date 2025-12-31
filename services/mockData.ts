
import { Customer, UserRole, ContactRole } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 'cust1',
    name: 'ישיבת אורייתא',
    city: 'ירושלים',
    street: 'חגי',
    houseNumber: '12',
    officePhone: '02-1234567',
    email: 'office@oryta.org',
    subscriptionType: 'paid',
    createdAt: '2024-01-10T10:00:00Z',
    status: 'active',
    contacts: [
      {
        id: 'con1',
        name: 'שמואל פרידמן',
        phone: '054-1112233',
        email: 'shmuel@oryta.org',
        hasWhatsApp: true,
        role: 'מנהל ישיבה'
      }
    ],
    users: [
      { id: 'u_cust1_1', name: 'אדמין אורייתא', username: 'oryta_admin', role: UserRole.SUPER_ADMIN, otpOnly: false }
    ]
  },
  {
    id: 'cust2',
    name: 'ת"ת עטרת שלמה',
    city: 'בני ברק',
    street: 'רבי עקיבא',
    houseNumber: '50',
    officePhone: '03-5556677',
    email: 'contact@ateret.org',
    subscriptionType: 'yearly',
    createdAt: '2024-02-15T12:00:00Z',
    status: 'active',
    contacts: [
      {
        id: 'con3',
        name: 'יוסי לוי',
        phone: '052-7654321',
        email: 'yossi@ateret.org',
        hasWhatsApp: false,
        role: 'חבר ת"ת'
      }
    ],
    users: [
      { id: 'u_cust2_1', name: 'צופה עטרת', username: 'ateret_view', role: UserRole.VIEWER, otpOnly: false }
    ]
  },
  {
    id: 'cust3',
    name: 'ישיבת בית מאיר',
    city: 'בני ברק',
    street: 'דסלר',
    houseNumber: '7',
    officePhone: '03-9998877',
    email: 'office@beirmeir.org',
    subscriptionType: 'demo',
    createdAt: new Date().toISOString(),
    status: 'pending',
    contacts: [
      {
        id: 'con4',
        name: 'אברהם פריד',
        phone: '054-5556667',
        email: 'avraham@beirmeir.org',
        hasWhatsApp: true,
        role: 'מנהל ישיבה'
      }
    ],
    users: [
      { id: 'u_cust3_1', name: 'אברהם פריד', username: 'beirmeir_admin', role: UserRole.SUPER_ADMIN, otpOnly: true }
    ]
  }
];

// Re-exporting all existing mocks to maintain compatibility
import { Campaign, Representative, Donation, Donor, RankDefinition, Gift, SystemMessage, Lottery, Path, CallList } from '../types';

export const mockRanks: RankDefinition[] = [
  { id: '1', name: 'מתחיל', minAmount: 0, color: '#94a3b8', icon: 'Sprout' },
  { id: '2', name: 'ברונזה', minAmount: 5000, color: '#b45309', icon: 'Award' },
  { id: '3', name: 'כסף', minAmount: 15000, color: '#94a3b8', icon: 'Award' },
  { id: '4', name: 'זהב', minAmount: 35000, color: '#eab308', icon: 'Trophy' },
  { id: '5', name: 'פלטינה', minAmount: 75000, color: '#2dd4bf', icon: 'Sparkles' },
  { id: '6', name: 'יהלום', minAmount: 150000, color: '#3b82f6', icon: 'Gem' },
];

export const mockGifts: Gift[] = [
  { id: 'g1', name: 'אוזניות JBL', milestoneAmount: 10000, description: 'אוזניות אלחוטיות איכותיות לנציגים מצטיינים', eligibilityType: 'personal_goal' },
  { id: 'g2', name: 'טאבלט סמסונג', milestoneAmount: 40000, description: 'טאבלט 10 אינץ לניהול שטח חכם', eligibilityType: 'personal_goal' },
  { id: 'g3', name: 'סופ"ש זוגי', milestoneAmount: 100000, description: 'אירוח יוקרתי במלון וולדורף אסטוריה', eligibilityType: 'personal_goal' },
];

export const mockLotteries: Lottery[] = [
  { id: 'l1', title: 'הגרלת סופ"ש מפנק', description: 'כל מי שמגייס מעל 5,000 ש"ח נכנס להגרלה על חופשה במלון יוקרה', drawDate: '2024-04-15', drawTime: '20:00', minThreshold: 5000, status: 'active', eligibilityCriteria: 'personal_goal', autoActivate: true },
  { id: 'l2', title: 'בונוס מהירות: אייפון 15 Pro', description: 'הגרלה יומית בין כל מי שיגייס היום מעל 1,500 ש"ח', drawDate: '2024-03-30', drawTime: '22:00', minThreshold: 1500, status: 'active', eligibilityCriteria: 'daily_amount', autoActivate: true }
];

export const mockSystemMessages: SystemMessage[] = [
  { id: 'm1', title: 'בוקר טוב צוות מנצח!', content: 'היום יוצאים למבצע שטח מוגבר בבני ברק. שימו לב ליעדים האישיים שלכם. בהצלחה!', timestamp: new Date().toISOString(), type: 'info', targetType: 'all' },
  { id: 'm2', title: 'יעד ביניים הושג!', content: 'עברנו את ה-150,000 ש"ח! כל הכבוד לכל הנציגים. ממשיכים בכל הכוח.', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'success', targetType: 'all' },
  { id: 'm3', title: 'הנחיית בטיחות', content: 'נא לא להיכנס לבניינים ללא תאורה בחדר המדרגות. בטיחותכם מעל הכל.', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'urgent', targetType: 'all' },
];

export const mockCampaigns: Campaign[] = [
  { 
    id: '1', 
    name: 'קמפיין קרן הבניין - תשפ"ד', 
    goal: 5000000, 
    raised: 174450, 
    startDate: '2024-01-01', 
    endDate: '2024-12-31', 
    status: 'active', 
    currency: 'ILS', 
    color: '#2563eb',
    logo: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80'
    ]
  }
];

export const mockRepresentatives: Representative[] = [
  { id: 'r1', name: 'איתמר לוי', username: 'itamar', password: '123', phone: '0501112233', role: UserRole.REPRESENTATIVE, personalGoal: 100000, totalRaised: 155500, rank: 'יהלום', status: 'active', group: 'ישיבת פוניבז\'', groupId: 'g1', loginMethod: 'credentials', campaignId: '1' },
  { id: 'r2', name: 'יונתן רפאלי', username: 'yonatan', password: '123', phone: '0524445566', role: UserRole.REPRESENTATIVE, personalGoal: 100000, totalRaised: 3400, rank: 'מתחיל', status: 'active', group: 'ישיבת מיר', groupId: 'g2', loginMethod: 'phone', campaignId: '1' },
  { id: 'r3', name: 'נועם אברהמי', username: 'noam', password: '123', phone: '0547778899', role: UserRole.REPRESENTATIVE, personalGoal: 80000, totalRaised: 1200, rank: 'מתחיל', status: 'active', group: 'ישיבת חברון', groupId: 'g3', loginMethod: 'credentials', campaignId: '1' },
  { id: 'r4', name: 'אלעד שטיינר', username: 'elad', password: '123', phone: '0581234567', role: UserRole.REPRESENTATIVE, personalGoal: 50000, totalRaised: 13350, rank: 'ברונזה', status: 'active', group: 'ישיבת פוניבז\'', groupId: 'g1', loginMethod: 'none', campaignId: '1' },
  { id: 'r5', name: 'אריאל זילבר', username: 'ariel', password: '123', phone: '0539876543', role: UserRole.REPRESENTATIVE, personalGoal: 60000, totalRaised: 1000, rank: 'מתחיל', status: 'active', group: 'ישיבת מיר', groupId: 'g2', loginMethod: 'phone', campaignId: '1' }
];

export const mockDonors: Donor[] = [
  { id: '1', firstName: 'אברהם', lastName: 'כהן', city: 'בני ברק', street: 'חזון איש', building: '15', floor: '2', apartment: '4', phone: '0501234567', preferences: ['general_visit'], totalDonated: 500, lastVisit: '2024-03-01', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: 'תורם קבוע', campaignId: '1' },
  { id: '2', firstName: 'משה', lastName: 'לוי', city: 'בני ברק', street: 'רבי עקיבא', building: '50', floor: '1', apartment: '2', phone: '0527654321', preferences: ['general_visit'], totalDonated: 1200, lastVisit: '2024-03-15', status: 'potential', potentialRank: 4, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '3', firstName: 'יצחק', lastName: 'גולד', city: 'בני ברק', street: 'רבי עקיבא', building: '12', floor: '5', apartment: '18', phone: '0541112223', preferences: ['telephonic'], totalDonated: 5000, lastVisit: '', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: 'תורם גדול', campaignId: '1' },
  { id: '4', firstName: 'יעקב', lastName: 'פרידמן', city: 'בני ברק', street: 'חזון איש', building: '5', floor: '0', apartment: '1', phone: '0523333333', preferences: ['general_visit'], totalDonated: 2500, lastVisit: '', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: '', campaignId: '1' },
  { id: '5', firstName: 'יוסף', lastName: 'אדלר', city: 'בני ברק', street: 'אור החיים', building: '2', floor: '2', apartment: '6', phone: '0584444444', preferences: ['general_visit'], totalDonated: 150, lastVisit: '', status: 'potential', potentialRank: 2, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '6', firstName: 'פנחס', lastName: 'וייס', city: 'בני ברק', street: 'עזרא', building: '4', floor: '1', apartment: '3', phone: '0507777777', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '7', firstName: 'דוד', lastName: 'שפירא', city: 'בני ברק', street: 'נחמיה', building: '20', floor: '0', apartment: '1', phone: '0535556667', preferences: ['telephonic'], totalDonated: 1000, lastVisit: '', status: 'potential', potentialRank: 4, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '8', firstName: 'שמואל', lastName: 'רוזן', city: 'בני ברק', street: 'חזון איש', building: '6', floor: '3', apartment: '11', phone: '0549999999', preferences: ['general_visit'], totalDonated: 1200, lastVisit: '', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '9', firstName: 'אלעזר', lastName: 'זילבר', city: 'ירושלים', street: 'הקבלן', building: '34', floor: '5', apartment: '15', phone: '0528889990', preferences: ['telephonic'], totalDonated: 900, lastVisit: '', status: 'potential', potentialRank: 4, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '10', firstName: 'חנניה', lastName: 'ביטון', city: 'ירושלים', street: 'פנים מאירות', building: '8', floor: '2', apartment: '5', phone: '0500000000', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '11', firstName: 'חיים', lastName: 'מזרחי', city: 'בני ברק', street: 'יונה הנביא', building: '7', floor: '1', apartment: '2', phone: '0501111111', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: '', campaignId: '1' },
  { id: '12', firstName: 'שלמה', lastName: 'מלכה', city: 'בני ברק', street: 'דסלר', building: '19', floor: '3', apartment: '9', phone: '0522222222', preferences: ['general_visit'], totalDonated: 300, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '13', firstName: 'מרדכי', lastName: 'אטיאס', city: 'בני ברק', street: 'בן זכאי', building: '2', floor: '2', apartment: '4', phone: '0543333333', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 4, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: '', campaignId: '1' },
  { id: '14', firstName: 'אהרון', lastName: 'ברנד', city: 'בני ברק', street: 'סוקולוב', building: '44', floor: '4', apartment: '12', phone: '0504444444', preferences: ['general_visit'], totalDonated: 1500, lastVisit: '', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '15', firstName: 'אפרים', lastName: 'קורן', city: 'בני ברק', street: 'הירקון', building: '10', floor: '1', apartment: '1', phone: '0525555555', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 2, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '16', firstName: 'דניאל', lastName: 'ששון', city: 'בני ברק', street: 'ירושלים', building: '101', floor: '6', apartment: '22', phone: '0546666666', preferences: ['telephonic'], totalDonated: 250, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: '', campaignId: '1' },
  { id: '17', firstName: 'נתנאל', lastName: 'אבז', city: 'בני ברק', street: 'רמב"ם', building: '3', floor: '1', apartment: '3', phone: '0507777777', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '18', firstName: 'יהודה', lastName: 'שיין', city: 'בני ברק', street: 'חברון', building: '14', floor: '2', apartment: '5', phone: '0528888888', preferences: ['purim_day'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 4, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'alumnus', notes: '', campaignId: '1' },
  { id: '19', firstName: 'מנחם', lastName: 'כהן', city: 'בני ברק', street: 'שפת אמת', building: '5', floor: '0', apartment: '2', phone: '0549999999', preferences: ['purim_day'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 5, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' },
  { id: '20', firstName: 'ישראל', lastName: 'מאיר', city: 'בני ברק', street: 'קהילות יעקב', building: '11', floor: '4', apartment: '15', phone: '0501234567', preferences: ['general_visit'], totalDonated: 0, lastVisit: '', status: 'potential', potentialRank: 3, assignmentStatus: 'available', visitStatus: 'not_visited', connectionType: 'general', notes: '', campaignId: '1' }
];

export const mockPaths: Path[] = [
  {
    id: 'p1',
    name: 'סבב ערב - רמת אהרון',
    city: 'בני ברק',
    startTime: '18:00',
    endTime: '22:00',
    assignedRepIds: ['r1'],
    addresses: [mockDonors[0], mockDonors[3], mockDonors[7]],
    startAddress: 'רחוב הרב שך 10, בני ברק',
    transitInstructions: {
      0: [{ instruction: 'הליכה של 5 דק לחזון איש 15', duration: '5 דק', type: 'WALKING' }],
      1: [{ instruction: 'המשך ישר לחזון איש 5', duration: '3 דק', type: 'WALKING' }],
      2: [{ instruction: 'פנייה שמאלה לחזון איש 6', duration: '2 דק', type: 'WALKING' }]
    }
  }
];

export const mockCallLists: CallList[] = [
  {
    id: 'cl1',
    name: 'שיחות בוגרים - בני ברק',
    assignedRepIds: ['r1', 'r2'],
    donors: [mockDonors[2], mockDonors[6], mockDonors[15]]
  }
];

export const mockDonations: Donation[] = [
  { id: 'd1', donorName: 'אברהם כהן', amount: 500, representativeId: 'r1', representativeName: 'איתמר לוי', timestamp: new Date().toISOString(), method: 'online', campaignId: '1', status: 'confirmed', source: 'system' },
  { id: 'd2', donorName: 'יעקב לוי', amount: 350, representativeId: 'r1', representativeName: 'איתמר לוי', timestamp: new Date(Date.now() - 86400000).toISOString(), method: 'cash', campaignId: '1', status: 'confirmed', source: 'system' },
  { id: 'd3', donorName: 'שלמה מזרחי', amount: 1000, representativeId: 'r2', representativeName: 'יונתן רפאלי', timestamp: new Date(Date.now() - 172800000).toISOString(), method: 'cash', campaignId: '1', status: 'confirmed', source: 'system' },
  { id: 'd4', donorName: 'דוד אטיאס', amount: 200, representativeId: 'r4', representativeName: 'אלעד שטיינר', timestamp: new Date(Date.now() - 43200000).toISOString(), method: 'cash', campaignId: '1', status: 'confirmed', source: 'system' },
  { id: 'd5', donorName: 'מנחם גולד', amount: 450, representativeId: 'r1', representativeName: 'איתמר לוי', timestamp: new Date().toISOString(), method: 'cash', campaignId: '1', status: 'pending_cash', source: 'system' },
  { id: 'd6', donorName: 'יהושע וייס', amount: 1200, representativeId: 'r3', representativeName: 'נועם אברהמי', timestamp: new Date().toISOString(), method: 'cash', campaignId: '1', status: 'pending_cash', source: 'system' },
  { id: 'd7', donorName: 'אהרון מלכה', amount: 300, representativeId: 'r3', representativeName: 'נועם אברהמי', timestamp: new Date().toISOString(), method: 'cash', campaignId: '1', status: 'pending_cash', source: 'system' }
];
