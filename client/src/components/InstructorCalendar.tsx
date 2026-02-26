import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaGoogle, FaApple } from 'react-icons/fa';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';

export default function InstructorCalendar() {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [autoConfirm, setAutoConfirm] = useState(false);
  
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      const slotRes = await api.get(`/availability/${user.id}`);
      setSlots(slotRes.data);
      const bookingRes = await api.get(`/booking/${user.id}`);
      setBookings(bookingRes.data.filter((b: any) => b.status === 'CONFIRMED'));
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/auth/user/${user.id}`); 
      setAutoConfirm(res.data.autoConfirm || false);
    } catch (error) { console.error(error); }
  };

  const toggleAutoConfirm = async () => {
    const newValue = !autoConfirm;
    setAutoConfirm(newValue);
    try {
      await api.put('/auth/update-profile', {
        userId: user.id,
        updates: { autoConfirm: newValue }
      });
    } catch (error) {
      setAutoConfirm(!newValue);
      alert("Failed to update setting");
    }
  };

  const addSlot = async () => {
    // 1. Normalize time format (replace dots with colons)
    const cleanStart = startTime.replace('.', ':');
    const cleanEnd = endTime.replace('.', ':');

    // 2. Convert to numeric hours for accurate comparison
    const [startH, startM] = cleanStart.split(':').map(Number);
    const [endH, endM] = cleanEnd.split(':').map(Number);
    
    const startTimeInMinutes = startH * 60 + startM;
    // If end hour is 00 (midnight), treat it as 24:00 for the comparison logic
    const adjustedEndH = endH === 0 ? 24 : endH;
    const endTimeInMinutes = adjustedEndH * 60 + endM;

    if (endTimeInMinutes <= startTimeInMinutes) { 
        alert("End Time must be after Start Time"); 
        return; 
    }

    // 3. Validate Past Time with Timezone Safety
    const now = new Date();
    const selectedSlotStart = new Date(date);
    selectedSlotStart.setHours(startH, startM, 0, 0);

    if (selectedSlotStart < now) {
        alert("You cannot add a slot in the past!");
        return;
    }

    try {
      await api.post('/availability/add', {
        adminId: user.id, 
        // Force YYYY-MM-DD to stop the "Slot already exists" timezone bug
        date: date.toLocaleDateString('en-CA'), 
        startTime: cleanStart, 
        endTime: cleanEnd 
      });
      fetchData();
      alert("Slot Added Successfully");
    } catch (err: any) { // Fixed TS18046 'unknown' error
      const errorMsg = err.response?.data?.message || 'Slot already exists or overlaps.';
      alert(errorMsg); 
    }
  };

  const deleteSlot = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      // Ensuring the delete request is clean
      await api.delete(`/availability/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Cannot delete a booked slot!");
    }
  };

  // ✅ FIX: Use string-based comparison to match your addSlot logic
  const getBooking = (slotDate: string, sTime: string) => {
    return bookings.find(b => b.date.split('T')[0] === slotDate.split('T')[0] && b.startTime === sTime);
  };

  // ✅ FIX: Filter slots based on the flat YYYY-MM-DD string
  const daySlots = slots.filter(s => s.date.split('T')[0] === date.toLocaleDateString('en-CA'));

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BAR WITH TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4">
        <div>
           <h3 className="font-bold text-lg text-slate-700">Manage Availability</h3>
           <p className="text-xs text-slate-400">Set slots for students to book.</p>
        </div>
        
        <button 
          onClick={toggleAutoConfirm}
          className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all shadow-sm
            ${autoConfirm ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}
          `}
          aria-label={autoConfirm ? "Disable Auto-Confirm" : "Enable Auto-Confirm"}
        >
          <div className="text-2xl">
            {autoConfirm ? <FaToggleOn /> : <FaToggleOff />}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider">Auto-Confirm</p>
            <p className="text-[10px]">{autoConfirm ? 'Bookings are instant' : 'You must approve requests'}</p>
          </div>
        </button>
      </div>

      {/* 2. CALENDAR GRID */}
      <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        
        {/* LEFT: CALENDAR */}
        <div className="w-full lg:w-1/3 lg:border-r lg:pr-6 flex justify-center">
          <Calendar 
            onChange={(d: any) => setDate(d)} 
            value={date} 
            minDate={new Date()} // FIX: Disable past dates
            className="w-full border-none shadow-sm rounded-lg p-2" 
          />
        </div>

        {/* RIGHT: SLOT MANAGER */}
        <div className="w-full lg:w-2/3 lg:pl-2">
          <h3 className="font-bold text-slate-700 mb-6 text-xl border-b pb-2">Slots for {date.toLocaleDateString()}</h3>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                   <label htmlFor="start-time" className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                   <input 
                      id="start-time" 
                      type="time" 
                      step="60" // Forces minutes only, sometimes cleans up the mask
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                      className="w-full border p-2 rounded bg-white outline-none"
                    />
                </div>
                <div>
                   <label htmlFor="end-time" className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
                   <input 
                      id="end-time" 
                      type="time" 
                      step="60" // Forces minutes only, sometimes cleans up the mask
                      value={endTime} onChange={e => setEndTime(e.target.value)} 
                      className="w-full border p-2 rounded bg-white outline-none"
                   />
                </div>
                <button onClick={addSlot} className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition">
                  <FaPlus /> Add Slot
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {daySlots.length > 0 ? daySlots.map(slot => {
              const booking = getBooking(slot.date, slot.startTime);
              return (
                <div key={slot.id} className={`p-4 rounded-lg border text-left relative shadow-sm transition ${slot.isBooked ? 'bg-blue-50 border-blue-200' : 'bg-white border-green-200 hover:shadow-md'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xl text-slate-700">{slot.startTime} - {slot.endTime}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{slot.isBooked ? 'Booked/Pending' : 'Available'}</p>
                    </div>
                    {!slot.isBooked && (
                      <button onClick={() => deleteSlot(slot.id)} className="text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded" aria-label="Delete Slot"><FaTrash /></button>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/50">
                    {slot.isBooked && booking ? (
                      <div>
                        <p className="text-xs font-bold text-blue-600 mb-2 truncate">Student: {booking.student.fullName}</p>
                        <div className="flex gap-2">
                           {/* Calendar Buttons */}
                           <a href={generateGoogleCalendarUrl({
                              title: `Lesson: ${booking.student.fullName}`,
                              date: slot.date,
                              startTime: slot.startTime,
                              endTime: slot.endTime
                            })} 
                            target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 bg-white border px-2 py-1.5 rounded text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition"
                          >
                            <FaGoogle /> Google
                          </a>
                          <button onClick={() => downloadIcsFile({
                              title: `Lesson: ${booking.student.fullName}`,
                              date: slot.date,
                              startTime: slot.startTime,
                              endTime: slot.endTime
                            })}
                            className="flex-1 flex items-center justify-center gap-1 bg-white border px-2 py-1.5 rounded text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition"
                          >
                            <FaApple /> Apple
                          </button>
                        </div>
                      </div>
                    ) : slot.isBooked ? (
                      <span className="block text-center text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">PENDING APPROVAL</span>
                    ) : (
                      <span className="block text-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">OPEN</span>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-slate-400">No slots added.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}