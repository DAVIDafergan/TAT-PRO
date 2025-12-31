
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Map, 
  useMap, 
  AdvancedMarker, 
  Pin, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { Representative, Donor, Donation, Path } from '../types';
import { 
  Users, TrendingUp, AlertCircle, Crosshair, 
  Target, Navigation, Clock, Zap, Maximize2, MapPin, Search, Filter,
  Activity, Crown, ShieldCheck, DollarSign
} from 'lucide-react';

interface WarRoomProps {
  representatives: Representative[];
  donors: Donor[];
  donations: Donation[];
  paths: Path[];
}

const WarRoom: React.FC<WarRoomProps> = ({ representatives, donors, donations, paths }) => {
  const map = useMap();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState('');
  
  const [infoWindowData, setInfoWindowData] = useState<{ 
    position: { lat: number; lng: number }, 
    title: string, 
    type: 'agent' | 'donor',
    id: string 
  } | null>(null);

  // Filter representatives to only those with assigned paths
  const activeFieldReps = useMemo(() => {
    const assignedIds = new Set(paths.flatMap(p => p.assignedRepIds));
    return representatives.filter(r => assignedIds.has(r.id));
  }, [representatives, paths]);

  const [agentPositions, setAgentPositions] = useState<Record<string, { lat: number, lng: number }>>({});

  useEffect(() => {
    const initial: Record<string, { lat: number, lng: number }> = {};
    activeFieldReps.forEach((rep, idx) => {
      initial[rep.id] = { 
        lat: 31.7683 + (idx * 0.005), 
        lng: 35.2137 + (idx * 0.005) 
      };
    });
    setAgentPositions(initial);

    const interval = setInterval(() => {
      setAgentPositions(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = {
            lat: next[id].lat + (Math.random() - 0.5) * 0.0001,
            lng: next[id].lng + (Math.random() - 0.5) * 0.0001
          };
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeFieldReps]);

  const donorsWithLocation = useMemo(() => donors.slice(0, 15).map((donor, idx) => ({
    ...donor,
    location: { 
      lat: 31.77 + (idx * 0.008), 
      lng: 35.20 + (idx * 0.012) 
    }
  })), [donors]);

  const agentsWithLocation = useMemo(() => activeFieldReps.map(rep => ({
    ...rep,
    location: agentPositions[rep.id] || { lat: 31.7683, lng: 35.2137 }
  })), [activeFieldReps, agentPositions]);

  const filteredAgents = useMemo(() => {
    return agentsWithLocation.filter(a => a.name.toLowerCase().includes(filterTerm.toLowerCase()));
  }, [agentsWithLocation, filterTerm]);

  const selectedAgent = agentsWithLocation.find(a => a.id === selectedAgentId);

  useEffect(() => {
    if (selectedAgent && map) {
      map.panTo(selectedAgent.location);
      if (map.getZoom()! < 14) map.setZoom(15);
    }
  }, [selectedAgentId, map, selectedAgent]);

  const handleMarkerClick = useCallback((position: { lat: number; lng: number }, title: string, type: 'agent' | 'donor', id: string) => {
    setInfoWindowData({ position, title, type, id });
    if (type === 'agent') setSelectedAgentId(id);
  }, []);

  return (
    <div className="p-8 h-screen flex flex-col overflow-hidden bg-[#f8fafc]" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">חדר פיקוד <span className="text-blue-600">TACTICAL LIVE</span></h1>
          <p className="text-slate-500 font-medium text-sm">ניטור כוחות שטח במשימה (מבוסס מסלולים)</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm font-black text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {filteredAgents.length} כוחות במשימה
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
           <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm p-6 flex flex-col h-full overflow-hidden">
              <div className="relative mb-6">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" value={filterTerm} onChange={e => setFilterTerm(e.target.value)} placeholder="חפש כוח במשימה..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-bold outline-none" />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 scroll-hide space-y-3">
                 {filteredAgents.map(rep => (
                    <button key={rep.id} onClick={() => setSelectedAgentId(rep.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedAgentId === rep.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedAgentId === rep.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600'}`}>{rep.name.charAt(0)}</div>
                          <div className="text-right">
                             <p className="text-xs font-black">{rep.name}</p>
                             <p className="text-[8px] font-bold uppercase tracking-widest opacity-70">מסלול פעיל</p>
                          </div>
                       </div>
                       <p className="text-xs font-black tabular-nums">₪{rep.totalRaised.toLocaleString()}</p>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-slate-200 rounded-[45px] overflow-hidden relative border border-slate-300 shadow-2xl">
            <Map
              defaultCenter={{ lat: 31.7683, lng: 35.2137 }}
              defaultZoom={13}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="TAT_PRO_WAR_ROOM_MAP"
            >
              {filteredAgents.map(agent => (
                <AdvancedMarker key={agent.id} position={agent.location} onClick={() => handleMarkerClick(agent.location, agent.name, 'agent', agent.id)}>
                   <Pin background={selectedAgentId === agent.id ? '#1e40af' : '#2563eb'} glyphColor={'#fff'} scale={selectedAgentId === agent.id ? 1.4 : 1.1}>
                      <span className="text-[11px] font-black text-white">{agent.name.charAt(0)}</span>
                   </Pin>
                </AdvancedMarker>
              ))}

              {donorsWithLocation.map(donor => (
                <AdvancedMarker key={donor.id} position={donor.location} onClick={() => handleMarkerClick(donor.location, `${donor.firstName} ${donor.lastName}`, 'donor', donor.id)}>
                  <Pin background={'#10b981'} glyphColor={'#fff'} scale={1.0}><span className="text-[10px] font-black text-white">D</span></Pin>
                </AdvancedMarker>
              ))}

              {infoWindowData && (
                <InfoWindow position={infoWindowData.position} onCloseClick={() => setInfoWindowData(null)}>
                  <div className="p-3 text-right bg-white min-w-[160px]" dir="rtl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{infoWindowData.type === 'agent' ? 'כוח שטח' : 'תורם'}</p>
                    <h4 className="text-sm font-black text-slate-900">{infoWindowData.title}</h4>
                  </div>
                </InfoWindow>
              )}
            </Map>
        </div>
      </div>
    </div>
  );
};

export default WarRoom;
