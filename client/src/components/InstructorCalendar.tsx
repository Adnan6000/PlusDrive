import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaGoogle, FaApple } from 'react-icons/fa';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';

export default function InstructorCalendar() {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryClient = useQueryClient();

  const { data: slots = [] } = useQuery({
    queryKey: ['instructor-slots', user.id],
    queryFn: async () => {
      const res = await api.get(`/availability/${user.id}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['instructor-bookings', user.id],
    queryFn: async () => {
      const res = await api.get(`/booking/${user.id}`);
      // ✅ FIX TS7006: Added explicit 'any' type to parameter 'b'
      return res.data.filter((b: any) => b.status === 'CONFIRMED');
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: autoConfirm = false } = useQuery({
    queryKey: ['instructor-settings', user.id],
    queryFn: async () => {
      const res = await api.get(`/auth/user/${user.id}`);
      return res.data.autoConfirm || false;
    },
  });

  const addSlotMutation = useMutation({
    mutationFn: (newSlot: any) => api.post('/availability/add', newSlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-slots'] });
      alert("Slot Added Successfully");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Slot already exists or overlaps.');
    }
  });

  const toggleAutoConfirm = async () => {
    const newValue = !autoConfirm;
    try {
      await api.put('/auth/update-profile', {
        userId: user.id,
        updates: { autoConfirm: newValue }
      });
      queryClient.setQueryData(['instructor-settings', user.id], newValue);
    } catch (error) {
      alert("Failed to update setting");
    }
  };

  const addSlot = async () => {
    const cleanStart = startTime.replace('.', ':');
    const cleanEnd = endTime.replace('.', ':');
    const [startH, startM] = cleanStart.split(':').map(Number);
    const [endH, endM] = cleanEnd.split(':').map(Number);
    
    const startTimeInMinutes = startH * 60 + startM;
    const adjustedEndH = endH === 0 ? 24 : endH;
    const endTimeInMinutes = adjustedEndH * 60 + endM;

    if (endTimeInMinutes <= startTimeInMinutes) { 
        alert("End Time must be after Start Time"); 
        return; 
    }

    addSlotMutation.mutate({
      adminId: user.id, 
      date: date.toLocaleDateString('en-CA'), 
      startTime: cleanStart, 
      endTime: cleanEnd 
    });
  };

  const deleteSlot = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      await api.delete(`/availability/${id}`);
      queryClient.invalidateQueries({ queryKey: ['instructor-slots'] });
    } catch (err: any) {
      alert(err.response?.data?.message || "Cannot delete a booked slot!");
    }
  };

  const getBooking = (slotDate: string, sTime: string) => {
    return bookings.find((b: any) => b.date.split('T')[0] === slotDate.split('T')[0] && b.startTime === sTime);
  };

  const daySlots = slots.filter((s: any) => s.date.split('T')[0] === date.toLocaleDateString('en-CA'));

  // ✅ Green Dot Logic remains exactly the same for students and display
  const tileContent = ({ date, view }: any) => {
    if (view === 'month' && slots.some((s: any) => {
      const apiDate = s.date.split('T')[0];
      const calendarDate = date.toLocaleDateString('en-CA');
      return apiDate === calendarDate && !s.isBooked;
    })) {
       return <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mt-1 shadow-sm"></div>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4">
        <div>
           <h3 className="font-bold text-lg text-slate-700">Manage Availability</h3>
           <p className="text-xs text-slate-400">Set slots for students to book.</p>
        </div>
        
        <button 
          onClick={toggleAutoConfirm}
          title={autoConfirm ? "Disable Auto-Confirm" : "Enable Auto-Confirm"}
          className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all shadow-sm
            ${autoConfirm ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}
          `}
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

      <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="w-full lg:w-1/3 lg:border-r lg:pr-6 flex justify-center">
          <Calendar 
            onChange={(d: any) => setDate(d)} 
            value={date} 
            tileContent={tileContent} // ✅ Ensured green dots are visible
            minDate={new Date()} 
            className="w-full border-none shadow-sm rounded-lg p-2" 
          />
        </div>

        <div className="w-full lg:w-2/3 lg:pl-2">
          <h3 className="font-bold text-slate-700 mb-6 text-xl border-b pb-2">Slots for {date.toLocaleDateString()}</h3>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                   <label htmlFor="start-time" className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                   {/* ✅ FIX Axe/forms: Added title and placeholder */}
                   <input 
                      id="start-time" 
                      type="time" 
                      step="60" 
                      title="Select Start Time"
                      placeholder="HH:MM"
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                      className="w-full border p-2 rounded bg-white outline-none"
                    />
                </div>
                <div>
                   <label htmlFor="end-time" className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
                   {/* ✅ FIX Axe/forms: Added title and placeholder */}
                   <input 
                      id="end-time" 
                      type="time" 
                      step="60" 
                      title="Select End Time"
                      placeholder="HH:MM"
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                      className="w-full border p-2 rounded bg-white outline-none"
                    />
                </div>
                <button onClick={addSlot} className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition">
                  <FaPlus /> Add Slot
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {daySlots.length > 0 ? daySlots.map((slot: any) => {
              const booking = getBooking(slot.date, slot.startTime);
              return (
                <div key={slot.id} className={`p-4 rounded-lg border text-left relative shadow-sm transition ${slot.isBooked ? 'bg-blue-50 border-blue-200' : 'bg-white border-green-200 hover:shadow-md'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xl text-slate-700">{slot.startTime} - {slot.endTime}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{slot.isBooked ? 'Booked/Pending' : 'Available'}</p>
                    </div>
                    {!slot.isBooked && (
                      <button 
                        onClick={() => deleteSlot(slot.id)} 
                        title="Delete Slot" // ✅ FIX Axe/name-role-value: Added title
                        className="text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/50">
                    {slot.isBooked && booking ? (
                      <div>
                        <p className="text-xs font-bold text-blue-600 mb-2 truncate">Student: {booking.student.fullName}</p>
                        <div className="flex gap-2">
                           <a href={generateGoogleCalendarUrl({ title: `Lesson: ${booking.student.fullName}`, date: slot.date, startTime: slot.startTime, endTime: slot.endTime })} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-white border px-2 py-1.5 rounded text-[10px] font-bold text-slate-600 hover:text-blue-600 transition">
                            <FaGoogle /> Google
                          </a>
                          <button onClick={() => downloadIcsFile({ title: `Lesson: ${booking.student.fullName}`, date: slot.date, startTime: slot.startTime, endTime: slot.endTime })} className="flex-1 flex items-center justify-center gap-1 bg-white border px-2 py-1.5 rounded text-[10px] font-bold text-slate-600 hover:text-blue-600 transition">
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