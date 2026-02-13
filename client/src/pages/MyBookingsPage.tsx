import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { FaChalkboardTeacher, FaCalendarCheck, FaTimes, FaSync, FaInfoCircle } from 'react-icons/fa';

export default function StudentBooking() {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  
  // MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingNote, setBookingNote] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ✅ FIX 1: Robust Display Helper
  // We add 12 hours to the incoming date. This fixes the issue where the backend 
  // sends "Previous Day 19:00 UTC" for a "Current Day" slot.
  const fixDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Add 12 hours (in milliseconds) buffer
    const bufferedDate = new Date(date.getTime() + (12 * 60 * 60 * 1000));

    return bufferedDate.toLocaleDateString('en-GB', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    }); 
  };

  // 1. Fetch Instructors
  useEffect(() => {
    const fetchInstructors = async () => {
        try {
            const res = await api.get(`/auth/school-instructors/any`);
            console.log("Instructors Loaded:", res.data); 
            setInstructors(res.data);
            
            if(res.data.length > 0 && !selectedInstructor) {
              setSelectedInstructor(res.data[0].id);
            }
        } catch (e) { console.error("Instructors fetch error", e); }
    };
    fetchInstructors();
  }, []);

  // 2. Fetch Slots
  useEffect(() => {
    fetchSlots();
  }, [selectedInstructor]);

  const fetchSlots = async () => {
    if (!selectedInstructor) return;
    try {
        const res = await api.get(`/availability/${selectedInstructor}`);
        setSlots(res.data);
    } catch (e) { console.error("Slots fetch error", e); }
  };

  // ✅ FIX 2: Updated Logic to match slots to the correct day
  const isSameDay = (calendarDate: Date, apiDateString: string) => {
    if (!apiDateString) return false;
    
    // Create Date object from API string
    const apiDate = new Date(apiDateString);
    
    // Add the same 12-hour buffer so the grid placement matches the display
    const bufferedApiDate = new Date(apiDate.getTime() + (12 * 60 * 60 * 1000));
    
    // Compare Local Calendar Date vs Buffered API Date
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    // Extract YYYY-MM-DD from the buffered date
    const apiDateLocal = bufferedApiDate.toISOString().split('T')[0]; 
    
    return localDateString === apiDateLocal;
  };

  const daySlots = slots.filter(s => isSameDay(date, s.date));

  // 4. GREEN DOTS
  const tileContent = ({ date, view }: any) => {
    if (view === 'month' && slots.some(s => isSameDay(date, s.date) && !s.isBooked)) {
       return <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mt-1 shadow-sm"></div>;
    }
    return null;
  };

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setBookingNote('');
    setShowModal(true);
  };

  const submitBooking = async () => {
    if (!selectedSlot) return;
    try {
      await api.post('/booking/request', {
        studentId: user.id,
        availabilityId: selectedSlot.id,
        type: 'Driving',
        note: bookingNote
      });
      alert("Request Sent! Please check 'My Bookings'.");
      setShowModal(false);
      fetchSlots(); 
    } catch (error) { alert("Booking failed. Slot might be taken."); }
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        
        {/* HEADER */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-b pb-6">
            <div className="w-full sm:max-w-md">
               <label htmlFor="instructor-select" className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                 <FaChalkboardTeacher className="text-blue-600"/> Select Instructor
               </label>
               <select 
                 id="instructor-select"
                 className="w-full border p-2.5 rounded bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                 value={selectedInstructor} 
                 onChange={e => setSelectedInstructor(e.target.value)}
               >
                 {instructors.length === 0 && <option value="">No instructors found</option>}
                 {instructors.map(i => <option key={i.id} value={i.id}>{i.fullName}</option>)}
               </select>
            </div>
            
            <button 
                onClick={fetchSlots}
                className="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold px-4 py-2 bg-blue-50 rounded-full transition"
            >
                <FaSync /> Refresh
            </button>
        </div>

        {/* CALENDAR & GRID */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Calendar 
                    onChange={(d: any) => setDate(d)} 
                    value={date} 
                    tileContent={tileContent} 
                    className="w-full border-none shadow-sm rounded-lg p-2" 
                />
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Dates with available slots</span>
                </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
              <FaCalendarCheck className="text-blue-600" /> 
              Available Slots: <span className="text-slate-500 font-normal ml-1">{date.toDateString()}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {daySlots.length > 0 ? daySlots.map(slot => (
                 <button 
                   key={slot.id} 
                   disabled={slot.isBooked} 
                   onClick={() => handleSlotClick(slot)} 
                   className={`relative p-4 rounded-xl border text-center transition shadow-sm group flex flex-col items-center justify-center h-32
                     ${slot.isBooked 
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-white border-blue-200 text-blue-900 hover:shadow-md hover:border-blue-400 hover:-translate-y-1'
                     }
                   `}
                 >
                   <p className="font-bold text-xl">{slot.startTime} - {slot.endTime}</p>
                   <span className={`text-[10px] font-bold uppercase mt-3 px-3 py-1 rounded-full 
                     ${slot.isBooked 
                        ? 'bg-slate-200 text-slate-500' 
                        : 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors'}
                   `}>
                     {slot.isBooked ? 'TAKEN' : 'BOOK NOW'}
                   </span>
                 </button>
              )) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <FaInfoCircle className="mx-auto text-slate-300 text-3xl mb-3" />
                    <p className="text-slate-500 font-medium">No slots available for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md scale-100 transform transition-all">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Confirm Booking</h3>
              
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition"
                aria-label="Close Modal"
              >
                <FaTimes className="text-slate-400 hover:text-red-500" />
              </button>

            </div>
            
            <div className="space-y-5">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Date</p>
                    {/* ✅ FIX: Using the improved helper function here */}
                    <p className="text-slate-700 font-semibold">{fixDateDisplay(selectedSlot.date)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Time</p>
                    <p className="text-slate-700 font-semibold">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Note for Instructor (Optional)</label>
                <textarea 
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none bg-slate-50 transition"
                  placeholder="What would you like to practice?"
                  value={bookingNote}
                  onChange={e => setBookingNote(e.target.value)}
                />
              </div>

              <button 
                onClick={submitBooking} 
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}