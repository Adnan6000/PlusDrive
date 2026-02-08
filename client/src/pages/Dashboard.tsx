import { useEffect, useState } from 'react';
import api from '../api/axios';
import BookingRequests from '../components/BookingRequests'; 
import { FaUserGraduate, FaCalendarCheck, FaClock, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    title1: 'Loading...', val1: 0, 
    title2: 'Loading...', val2: 0, 
    title3: 'Loading...', val3: 0 
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/booking/stats/${user.id}`);
        setStats(res.data);
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, [user.id]);

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
      <div>
        <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{title}</h3>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="text-slate-200 text-4xl">{icon}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      
      {/* 1. WELCOME SECTION */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.fullName}!</h1>
          <p className="text-blue-200">
            {isInstructor 
              ? "You have upcoming lessons to teach. Check your schedule below." 
              : "Ready to drive? Check your upcoming lessons or book a new one."}
          </p>
          
          {!isInstructor && (
            <button 
              onClick={() => navigate('/my-bookings')}
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-blue-900/50"
            >
              Book a Lesson
            </button>
          )}
        </div>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
      </div>

      {/* 2. STATS GRID (Dynamic based on Role) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pending / Action Required */}
        <StatCard 
          title={stats.title1} 
          value={stats.val1} 
          icon={<FaClock />} 
          color="text-orange-500" 
        />
        
        {/* Card 2: Today / Upcoming */}
        <StatCard 
          title={stats.title2} 
          value={stats.val2} 
          icon={<FaCalendarCheck />} 
          color="text-blue-600" 
        />

        {/* Card 3: Total Students / Completed */}
        <StatCard 
          title={stats.title3} 
          value={stats.val3} 
          icon={isInstructor ? <FaUserGraduate /> : <FaClipboardList />} 
          color="text-slate-700" 
        />
      </div>

      {/* 3. INSTRUCTOR ONLY: Booking Requests Panel */}
      {isInstructor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
            Action Required
          </h2>
          <BookingRequests />
        </div>
      )}

      {/* 4. STUDENT ONLY: Quick Tips or Call to Action */}
      {!isInstructor && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg text-center">
          <h3 className="text-blue-800 font-bold text-lg">Need more practice?</h3>
          <p className="text-blue-600 text-sm mt-1">Check the calendar for new available slots from your instructor.</p>
        </div>
      )}

    </div>
  );
}