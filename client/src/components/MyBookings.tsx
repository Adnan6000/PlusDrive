import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaCalendarAlt, FaGoogle, FaApple, FaChevronDown, FaClock } from 'react-icons/fa';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get(`/booking/student/${user.id}`);
        setBookings(res.data);
      } catch (error) { console.error(error); }
    };
    fetchBookings();
  }, [user.id]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
        <FaCalendarAlt className="text-blue-500" /> My Booking History
      </h3>
      
      <div className="space-y-4">
        {bookings.length > 0 ? bookings.map(booking => {
           // Calendar Event Content
           const calendarData = {
             title: `Driving Lesson with ${booking.admin?.fullName}`,
             date: booking.date,
             startTime: booking.startTime,
             endTime: booking.endTime,
             description: 'Driving Lesson',
             location: 'Driving School'
           };

           return (
            <div key={booking.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-100 rounded gap-4">
              
              {/* Lesson Details */}
              <div>
                <p className="font-bold text-slate-700 text-lg">{new Date(booking.date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                   <FaClock className="text-slate-400"/> {booking.startTime} - {booking.endTime}
                </p>
                <p className="text-xs text-slate-400 mt-1">Instructor: {booking.admin?.fullName}</p>
              </div>
              
              <div className="flex items-center gap-4 self-end sm:self-auto">
                {/* Status Badge */}
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider
                  ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {booking.status}
                </span>

                {/* Add to Calendar (ONLY IF CONFIRMED) */}
                {booking.status === 'CONFIRMED' && (
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === booking.id ? null : booking.id)}
                      className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded text-xs font-bold hover:bg-slate-100 transition shadow-sm"
                    >
                      <FaCalendarAlt className="text-blue-500"/> Add to Calendar <FaChevronDown className="text-slate-400"/>
                    </button>
                    
                    {/* Dropdown Options */}
                    {openDropdown === booking.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded shadow-xl z-10 animate-in fade-in zoom-in duration-200">
                        <a 
                          href={generateGoogleCalendarUrl(calendarData)} 
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 w-full text-left"
                        >
                          <FaGoogle className="text-red-500"/> Google Calendar
                        </a>
                        <button 
                          onClick={() => downloadIcsFile(calendarData)}
                          className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 w-full text-left border-t border-slate-100"
                        >
                          <FaApple className="text-black"/> Apple / Outlook
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
           );
        }) : (
          <div className="text-center py-8 text-slate-400 italic">
            You haven't booked any lessons yet.
          </div>
        )}
      </div>
    </div>
  );
}