import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaCalendarAlt, FaEnvelope, FaUsers, 
  FaCar, FaMotorcycle, FaWallet, FaUserCircle, FaSignOutAlt 
} from 'react-icons/fa';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const NavItem = ({ to, icon, label, role }: any) => {
    // FIX: Strict check for INSTRUCTOR or STUDENT logic
    if (role && user.role !== role) return null;
    
    const active = location.pathname === to 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'text-slate-300 hover:bg-slate-800 hover:text-white';

    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${active}`}>
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider text-blue-400">PlusDrive</h1>
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">
               STATUS: {user.role}
             </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* COMMON */}
          <NavItem to="/dashboard" icon={<FaHome />} label="Home / Overview" />
          
          {/* INSTRUCTOR FEATURES (Role is now INSTRUCTOR) */}
          <NavItem to="/reservations" icon={<FaCalendarAlt />} label="Reservations" role="INSTRUCTOR" />
          <NavItem to="/users" icon={<FaUsers />} label="Users / Students" role="INSTRUCTOR" />
          <NavItem to="/economy" icon={<FaWallet />} label="Economy" role="INSTRUCTOR" />

          {/* STUDENT FEATURES */}
          <NavItem to="/my-bookings" icon={<FaCalendarAlt />} label="Book Lessons" role="STUDENT" />

          {/* COMMON COMMUNICATION */}
          <NavItem to="/inbox" icon={<FaEnvelope />} label="Inbox / Messages" />
          
          {/* THEORY (Open to all for now) */}
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase">Education</p>
          </div>
          <NavItem to="/theory-car" icon={<FaCar />} label="Theory Car" />
          <NavItem to="/theory-mc" icon={<FaMotorcycle />} label="Theory MC" />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase">Account</p>
          </div>
          <NavItem to="/profile" icon={<FaUserCircle />} label="My Profile" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full rounded transition">
            <FaSignOutAlt /> <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
             <span className="font-bold text-slate-700 capitalize">Dashboard</span> 
             <span>/</span> 
             <span className="text-blue-600 font-bold capitalize">{location.pathname.replace('/', '')}</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
             </div>
             <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
               {user.fullName?.charAt(0)}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 bg-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}