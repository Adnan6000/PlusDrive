import { useState } from 'react';
import { 
  FaHome, FaCalendarAlt, FaEnvelope, FaUsers, 
  FaCar, FaMotorcycle, FaWallet, FaUserCircle, FaChevronDown, FaChevronRight 
} from 'react-icons/fa';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
}

export default function Sidebar({ activeTab, setActiveTab, userRole }: SidebarProps) {
  const [showTheoryCar, setShowTheoryCar] = useState(false);
  const [showTheoryMC, setShowTheoryMC] = useState(false);

  // Helper to open chat with instructor
  const handleContactInstructor = () => {
    // Save a flag so Inbox knows to open the Instructor chat immediately
    sessionStorage.setItem('openChat', 'INSTRUCTOR');
    setActiveTab('Inbox');
  };

  const MenuItem = ({ id, icon: Icon, title, subtitle, hasSub = false, isOpen = false, onToggle = () => {} }: any) => (
    <div 
      onClick={() => {
        if (hasSub) onToggle();
        else setActiveTab(id);
      }}
      className={`
        group flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4
        ${activeTab === id || (hasSub && isOpen) 
          ? 'border-blue-400 bg-blue-900/50' 
          : 'border-transparent hover:bg-white/5 hover:border-slate-500'}
      `}
    >
      <Icon className={`text-xl ${activeTab === id ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${activeTab === id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
          {title}
        </h4>
        <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
          {subtitle}
        </p>
      </div>
      {hasSub && (
        isOpen ? <FaChevronDown className="text-xs text-slate-500" /> : <FaChevronRight className="text-xs text-slate-500" />
      )}
    </div>
  );

  const SubMenuItem = ({ id, title }: any) => (
    <div 
      onClick={() => setActiveTab(id)}
      className={`pl-14 py-3 text-sm font-medium cursor-pointer transition hover:text-white
        ${activeTab === id ? 'text-blue-400' : 'text-slate-400'}
      `}
    >
      {title}
    </div>
  );

  return (
    <div className="w-64 bg-[#0B1B32] h-screen flex flex-col fixed left-0 top-0 overflow-y-auto border-r border-white/5 shadow-2xl z-50">
      {/* HEADER */}
      <div className="p-4 bg-[#14243C] border-b border-white/5 mb-2">
        <h3 className="text-white font-bold text-sm truncate">My Driving School</h3>
        <p className="text-xs text-blue-400 font-bold uppercase mt-1">Status: {userRole === 'ADMIN' ? 'Instructor' : 'Student'}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <MenuItem id="Home" icon={FaHome} title="Home" subtitle="Overview" />
        
        <MenuItem id="Reservations" icon={FaCalendarAlt} title="Reservations" subtitle={userRole === 'ADMIN' ? 'Manage Calendar' : 'Book Lessons'} />
        
        <MenuItem id="Inbox" icon={FaEnvelope} title="Inbox" subtitle="Messages" />
        
        {userRole === 'ADMIN' && (
          <MenuItem id="Users" icon={FaUsers} title="Users" subtitle="Students List" />
        )}

        {/* THEORY CAR */}
        <MenuItem 
          id="TheoryCar" icon={FaCar} title="Theory Car" subtitle="Exams & Lessons" 
          hasSub={true} isOpen={showTheoryCar} onToggle={() => setShowTheoryCar(!showTheoryCar)} 
        />
        {showTheoryCar && (
          <div className="bg-[#081221]">
            <SubMenuItem id="TheoryCar_Tests" title="Theory tests" />
            <SubMenuItem id="TheoryCar_Lessons" title="Theory lessons" />
          </div>
        )}

        {/* THEORY MC */}
        <MenuItem 
          id="TheoryMC" icon={FaMotorcycle} title="Theory MC" subtitle="Exams & Lessons" 
          hasSub={true} isOpen={showTheoryMC} onToggle={() => setShowTheoryMC(!showTheoryMC)} 
        />
        {showTheoryMC && (
          <div className="bg-[#081221]">
            <SubMenuItem id="TheoryMC_Tests" title="Theory tests" />
            <SubMenuItem id="TheoryMC_Lessons" title="Theory lessons" />
          </div>
        )}

        <MenuItem id="Economy" icon={FaWallet} title="Economy" subtitle="Payments" />
        
        <MenuItem id="Account" icon={FaUserCircle} title="Account" subtitle="Profile & Settings" />
      </nav>

      {/* STUDENT SUPPORT BUTTON */}
      {userRole === 'STUDENT' && (
        <div className="p-4">
          <button 
            onClick={handleContactInstructor}
            className="w-full bg-blue-600 text-white py-3 rounded shadow-lg font-bold hover:bg-blue-500 transition flex items-center justify-center gap-2"
          >
            <FaEnvelope /> Contact Instructor
          </button>
        </div>
      )}

      <div className="p-6 mt-auto opacity-50">
         <p className="text-[10px] text-slate-500 uppercase">Powered by</p>
         <h4 className="text-white font-bold tracking-widest">DriveBook</h4>
      </div>
    </div>
  );
}