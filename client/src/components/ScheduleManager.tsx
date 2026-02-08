import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
// FIX: Removed unused FaCheckCircle
import { FaClock, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function ScheduleManager() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [autoConfirm, setAutoConfirm] = useState(false); 
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchBookings();
    fetchSettings();
  }, [date]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/booking/${user.id}`);
      setBookings(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/auth/user/${user.id}`);
      setAutoConfirm(res.data.autoConfirm || false);
    } catch (error) { console.error(error); }
  };

  const toggleAutoConfirm = async () => {
    const newValue = !autoConfirm;
    setAutoConfirm(newValue);
    try {
      await axios.put('http://localhost:5000/auth/update-profile', {
        userId: user.id,
        updates: { autoConfirm: newValue }
      });
      alert(`Auto-Confirmation is now ${newValue ? 'ON' : 'OFF'}`);
    } catch (error) {
      alert("Failed to save setting");
      setAutoConfirm(!newValue); 
    }
  };

  const getTileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const dayBookings = bookings.filter(b => new Date(b.date).toDateString() === date.toDateString());
      if (dayBookings.length > 0) {
        return <div className="text-[10px] text-blue-600 font-bold">{dayBookings.length} Lessons</div>;
      }
    }
    return null;
  };

  const selectedDayBookings = bookings.filter(b => new Date(b.date).toDateString() === date.toDateString());

  return (
    <div className="flex gap-6">
      {/* CALENDAR SIDE */}
      <div className="w-1/2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-700">My Calendar</h3>
          
          {/* AUTO CONFIRM TOGGLE */}
          <button 
            onClick={toggleAutoConfirm}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition
              ${autoConfirm ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}
            `}
          >
            {autoConfirm ? <FaToggleOn className="text-xl"/> : <FaToggleOff className="text-xl"/>}
            Auto-Confirm: {autoConfirm ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <Calendar 
          onChange={(d: any) => setDate(d)} 
          value={date} 
          tileContent={getTileContent}
          className="w-full border-none shadow-none"
        />
      </div>

      {/* DAY DETAILS SIDE */}
      <div className="w-1/2 bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">
          Schedule for {date.toDateString()}
        </h3>
        <div className="space-y-3">
          {selectedDayBookings.length > 0 ? selectedDayBookings.map(b => (
            <div key={b.id} className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-700">{b.student?.fullName || 'Student'}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FaClock /> {b.startTime} - {b.endTime}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${b.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {b.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center text-slate-400 italic mt-10">No lessons this day.</div>
          )}
        </div>
      </div>
    </div>
  );
}