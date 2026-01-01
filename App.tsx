import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { User, UserRole, Campaign, Representative, Donation, Donor, Path, CallList, AssignmentStatus, SystemMessage, RepToAdminMessage, Lottery, Expense, CampaignGroup, Patrol, RankDefinition, Gift, RepTask, DailyReport, Customer, ClearingSettings } from './types';
import { db } from './services/db';
import { mockPaths, mockCallLists, mockDonors, mockRepresentatives, mockCampaigns } from './services/mockData';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampaignManager from './pages/Campaigns';
import RepresentativesPage from './pages/Representatives';
import RepPortal from './pages/RepPortal';
import ProjectionScreen from './pages/ProjectionScreen';
import WarRoom from './pages/WarRoom';
import CRMPage from './pages/CRM';
import RewardsManager from './pages/RewardsManager';
import MessagesManager from './pages/MessagesManager';
import DonationsPage from './pages/DonationsPage';
import CashManagement from './pages/CashManagement';
import ExpensesPage from './pages/ExpensesPage';
import Studio from './pages/Studio';
import SettingsPage from './pages/Settings';
import CustomersPage from './pages/Customers';
import Registration from './pages/Registration';
import DevHandoff from './pages/DevHandoff';
import TaskCreationPage from './pages/TaskCreationPage'; // הוספת הייבוא החדש
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>('');
  const [allRepresentatives, setAllRepresentatives] = useState<Representative[]>([]);
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allPaths, setAllPaths] = useState<Path[]>([]);
  const [allCallLists, setAllCallLists] = useState<CallList[]>([]);
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [ranks, setRanks] = useState<RankDefinition[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [repToAdminMessages, setRepToAdminMessages] = useState<RepToAdminMessage[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [repTasks, setRepTasks] = useState<RepTask[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [clearingSettings, setClearingSettings] = useState<ClearingSettings>({
    transfer: { bankDetails: '' },
    check: { payableTo: '' },
    bit: { mode: 'manual', manualPhones: [] },
    paybox: { mode: 'manual', manualPhones: [] }
  });

  const [activeLotteryForProjection, setActiveLotteryForProjection] = useState<Lottery | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tat_pro_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentPage, setCurrentPage] = useState<string>(user ? (user.role === UserRole.REPRESENTATIVE ? 'rep_portal' : 'dashboard') : 'login');
  const [isSyncing, setIsSyncing] = useState(false);
  const isLoaded = useRef(false);

  const refreshFromDB = useCallback(() => {
    setIsSyncing(true);
    const data = db.loadAll();
    
    setCampaigns(data.campaigns || mockCampaigns);
    if (!activeCampaignId && data.campaigns?.length > 0) setActiveCampaignId(data.campaigns[0].id);
    else if (!activeCampaignId) setActiveCampaignId('1');

    setAllRepresentatives(data.representatives || mockRepresentatives);
    setAllDonors(data.donors || mockDonors);
    setAllDonations(data.donations || []);
    setAllExpenses(data.expenses || []);
    setAllPaths(data.paths || mockPaths);
    setAllCallLists(data.callLists || mockCallLists);
    setCampaignGroups(data.groups || []);
    setManagers(data.managers || []);
    setRanks(data.ranks || []);
    setGifts(data.gifts || []);
    setLotteries(data.lotteries || []);
    setPatrols(data.patrols || []);
    setRepToAdminMessages(data.repToAdminMessages || []);
    setRepTasks(data.repTasks || []);
    setDailyReports(data.dailyReports || []);
    setSystemMessages(data.systemMessages || []);
    setAllCustomers(data.customers || []);
    setClearingSettings(data.clearingSettings);
    
    isLoaded.current = true;
    setTimeout(() => setIsSyncing(false), 300);
  }, [activeCampaignId]);

  useEffect(() => {
    refreshFromDB();
    db.onSync(() => refreshFromDB());
  }, [refreshFromDB]);

  useEffect(() => {
    if (isLoaded.current && (campaigns.length > 0 || allCustomers.length > 0)) {
      db.saveAll({
        campaigns, representatives: allRepresentatives, donors: allDonors, donations: allDonations,
        expenses: allExpenses, paths: allPaths, callLists: allCallLists,
        groups: campaignGroups, managers, ranks, gifts, lotteries, patrols, repToAdminMessages,
        repTasks, dailyReports, systemMessages, customers: allCustomers, clearingSettings
      });
    }
  }, [campaigns, allRepresentatives, allDonors, allDonations, allExpenses, allPaths, allCallLists, campaignGroups, managers, ranks, gifts, lotteries, patrols, repToAdminMessages, repTasks, dailyReports, systemMessages, allCustomers, clearingSettings]);

  const filteredDonors = useMemo(() => allDonors.filter(d => d.campaignId === activeCampaignId || !d.campaignId), [allDonors, activeCampaignId]);
  const filteredReps = useMemo(() => allRepresentatives.filter(r => r.campaignId === activeCampaignId || !r.campaignId), [allRepresentatives, activeCampaignId]);
  const filteredDonations = useMemo(() => allDonations.filter(d => d.campaignId === activeCampaignId), [allDonations, activeCampaignId]);
  const activeCampaign = useMemo(() => campaigns.find(c => c.id === activeCampaignId) || campaigns[0], [campaigns, activeCampaignId]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('tat_pro_user', JSON.stringify(u));
    setCurrentPage(u.role === UserRole.REPRESENTATIVE ? 'rep_portal' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tat_pro_user');
    setCurrentPage('login');
  };

  const addDonation = (donation: Donation) => {
    const isCash = donation.method === 'cash';
    const donationWithStatus: Donation = { ...donation, status: isCash ? 'pending_cash' : 'confirmed', campaignId: activeCampaignId, source: donation.source || 'system' };
    setAllDonations(prev => [donationWithStatus, ...prev]);
    if (!isCash) {
      setCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, raised: (c.raised || 0) + donation.amount } : c));
      setAllRepresentatives(prev => prev.map(r => r.id === donation.representativeId ? { ...r, totalRaised: (r.totalRaised || 0) + donation.amount } : r));
    }
  };

  const triggerLottery = (l: Lottery) => {
    setActiveLotteryForProjection(l);
    setCurrentPage('projection');
  };

  const showSidebar = user && user.role !== UserRole.REPRESENTATIVE && currentPage !== 'projection' && currentPage !== 'rep_portal' && currentPage !== 'registration' && currentPage !== 'dev_handoff';

  return (
    <APIProvider apiKey="AIzaSyBqQrlwQ1ypTJhZidjTmLzL1t6Dv0phR4I" libraries={['places', 'routes', 'geometry', 'marker']}>
      <div className="flex min-h-screen bg-[#F9FAFB] overflow-x-hidden font-sans relative">
        {showSidebar && (
          <Sidebar activePage={currentPage} setPage={setCurrentPage} onLogout={handleLogout} user={user!} isSyncing={isSyncing} />
        )}
        <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:pr-72' : ''}`}>
          <div className="max-w-[1600px] mx-auto min-h-screen relative">
            {currentPage === 'registration' ? (
                <Registration onRegister={(c) => setAllCustomers(prev => [c, ...prev])} onBack={() => setCurrentPage('login')} />
            ) : currentPage === 'dev_handoff' ? (
                <DevHandoff />
            ) : user ? (
                currentPage === 'dashboard' ? <Dashboard campaigns={campaigns} donations={filteredDonations.filter(d => d.status === 'confirmed')} representatives={filteredReps} setCurrentPage={setCurrentPage} /> :
                currentPage === 'customers' ? <CustomersPage customers={allCustomers} setCustomers={setAllCustomers} /> :
                currentPage === 'campaigns' ? <CampaignManager campaigns={campaigns} setCampaigns={setCampaigns} activeCampaignId={activeCampaignId} setActiveCampaignId={setActiveCampaignId} donors={filteredDonors} setDonors={setAllDonors} reps={filteredReps} setReps={setAllRepresentatives} /> :
                currentPage === 'reps' ? <RepresentativesPage reps={filteredReps} setReps={setAllRepresentatives} activeCampaignId={activeCampaignId} managers={managers} setManagers={setManagers} groups={campaignGroups} setGroups={setCampaignGroups} patrols={patrols} setPatrols={setPatrols} /> :
                currentPage === 'donations' ? <DonationsPage donations={filteredDonations} addDonation={addDonation} reps={filteredReps} campaigns={campaigns} activeCampaignId={activeCampaignId} donors={filteredDonors} groups={campaignGroups} /> :
                currentPage === 'cash_management' ? <CashManagement donations={filteredDonations} representatives={filteredReps} onConfirm={(rid, famt, pids) => {
                    setAllDonations(prev => prev.map(d => pids.includes(d.id) ? { ...d, status: 'confirmed', verifiedBy: user.name, verifiedAt: new Date().toLocaleTimeString('he-IL') } : d));
                    setCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, raised: (c.raised || 0) + famt } : c));
                    setAllRepresentatives(prev => prev.map(r => r.id === rid ? { ...r, totalRaised: (r.totalRaised || 0) + famt } : r));
                }} /> :
                currentPage === 'expenses' ? <ExpensesPage expenses={allExpenses} setExpenses={setAllExpenses} donations={filteredDonations.filter(d => d.status === 'confirmed')} campaigns={campaigns} activeCampaignId={activeCampaignId} /> :
                currentPage === 'rep_portal' ? <RepPortal rep={allRepresentatives.find(r => r.id === user?.id) || (user as any)} patrols={patrols} allReps={allRepresentatives} donations={allDonations} addDonation={addDonation} paths={allPaths} callLists={allCallLists} updateDonorStatus={(did, s) => setAllDonors(prev => prev.map(d => d.id === did ? {...d, assignmentStatus: s} : d))} systemMessages={systemMessages} sendRepMessage={(c) => {}} donors={allDonors} onLogout={handleLogout} onBackToAdmin={() => setCurrentPage('dashboard')} clearingSettings={clearingSettings} /> :
                currentPage === 'projection' ? <ProjectionScreen campaign={activeCampaign} representatives={filteredReps} donations={filteredDonations.filter(d => d.status === 'confirmed')} onBack={() => {setCurrentPage('dashboard'); setActiveLotteryForProjection(null);}} activeLottery={activeLotteryForProjection} allLotteries={lotteries} onLotteryComplete={(id, winner) => setLotteries(prev => prev.map(l => l.id === id ? {...l, winnerName: winner, status: 'completed'} : l))} groups={campaignGroups} /> :
                currentPage === 'crm' ? <CRMPage donors={allDonors} setDonors={setAllDonors} activeCampaignId={activeCampaignId} reps={filteredReps} paths={allPaths} callLists={allCallLists} /> :
                currentPage === 'task_creation' ? <TaskCreationPage donors={allDonors} setDonors={setAllDonors} reps={filteredReps} patrols={patrols} setPaths={setAllPaths} setCallLists={setAllCallLists} activeCampaignId={activeCampaignId} /> :
                currentPage === 'rewards' ? <RewardsManager lotteries={lotteries} setLotteries={setLotteries} ranks={ranks} setRanks={setRanks} gifts={gifts} setGifts={setGifts} onTriggerDraw={triggerLottery} representatives={filteredReps} donations={filteredDonations} /> :
                currentPage === 'settings' ? <SettingsPage setCurrentPage={setCurrentPage} user={user} clearingSettings={clearingSettings} setClearingSettings={setClearingSettings} /> :
                currentPage === 'war_room' ? <WarRoom representatives={filteredReps} donors={allDonors} donations={filteredDonations} paths={allPaths} /> :
                currentPage === 'messages' ? <MessagesManager reps={filteredReps} sendSystemMessage={(msg) => setSystemMessages(prev => [{...msg, id: Math.random().toString(36).substr(2,9), timestamp: new Date().toISOString()}, ...prev])} incomingMessages={repToAdminMessages} setIncomingMessages={setRepToAdminMessages} /> :
                <Dashboard campaigns={campaigns} donations={filteredDonations.filter(d => d.status === 'confirmed')} representatives={filteredReps} setCurrentPage={setCurrentPage} />
            ) : (
                <Login onLogin={handleLogin} managers={managers} allReps={allRepresentatives} onRegisterClick={() => setCurrentPage('registration')} />
            )}
          </div>
        </main>
      </div>
    </APIProvider>
  );
};

export default App;