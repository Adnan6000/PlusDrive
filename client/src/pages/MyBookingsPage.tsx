import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Added Navigation
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { 
  FaChalkboardTeacher, FaCalendarCheck, FaTimes, FaSync, FaInfoCircle,
  FaCommentDots, FaGoogle, FaApple // 👈 Changed SMS icon to Chat icon
} from 'react-icons/fa';

export default function StudentBooking() {
  const navigate = useNavigate(); // 👈 Hook for navigation
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  
  // MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingNote, setBookingNote] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // CSS: Force Calendar to be Mobile Responsive
  const calendarStyle = `
    .react-calendar { 
      width: 100% !important; 
      max-width: 100%; 
      background: white;
      border: none;
      font-family: inherit;
    }
    .react-calendar__tile {
      padding: 10px 0;
    }
  `;

  // HELPER: Fix Date Display
  const fixDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const bufferedDate = new Date(date.getTime() + (12 * 60 * 60 * 1000));
    return bufferedDate.toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    }); 
  };

  // HELPER: Generate Google Calendar Link
  const getGoogleCalendarUrl = (dateStr: string, startTime: string, endTime: string) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    
    const startSimple = startTime.replace(':', '') + '00';
    const endSimple = endTime.replace(':', '') + '00';

    const isoStart = `${yyyy}${mm}${dd}T${startSimple}`;
    const isoEnd = `${yyyy}${mm}${dd}T${endSimple}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Driving+Lesson&dates=${isoStart}/${isoEnd}&details=Driving+Lesson+with+DriveBook`;
  };

  // HELPER: Generate .ics (Apple/Outlook) File
  const downloadIcs = (dateStr: string, startTime: string, endTime: string) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    
    const startSimple = startTime.replace(':', '') + '00';
    const endSimple = endTime.replace(':', '') + '00';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Driving Lesson
DTSTART;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${startSimple}
DTEND;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${endSimple}
DESCRIPTION:Driving Lesson with DriveBook
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lesson.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Fetch Instructors
  useEffect(() => {
    const fetchInstructors = async () => {
        try {
            const res = await api.get(`/auth/school-instructors/any`);
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

  // 3. Match Slots to Day
  const isSameDay = (calendarDate: Date, apiDateString: string) => {
    if (!apiDateString) return false;
    const apiDate = new Date(apiDateString);
    const bufferedApiDate = new Date(apiDate.getTime() + (12 * 60 * 60 * 1000));
    
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarDate.getDate()).padStart(2, '0');
    
    const localDateString = `${year}-${month}-${day}`;
    const apiDateLocal = bufferedApiDate.toISOString().split('T')[0]; 
    
    return localDateString === apiDateLocal;
  };

  const daySlots = slots.filter(s => isSameDay(date, s.date));
  
  // 4. Calendar Dots
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

  // ✅ New Logic: Go to Inbox
  const handleMessageClick = (instructorId: string) => {
     // Navigate to inbox and pass the instructor ID so we can eventually open that chat
     navigate('/inbox', { state: { chatWith: instructorId } });
  };

  return (
    <div className="space-y-6 relative">
      <style>{calendarStyle}</style>

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
          {/* LEFT: CALENDAR */}
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

          {/* RIGHT: SLOTS GRID */}
          <div className="w-full lg:w-2/3">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
              <FaCalendarCheck className="text-blue-600" /> 
              Available Slots: <span className="text-slate-500 font-normal ml-1">{date.toDateString()}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {daySlots.length > 0 ? daySlots.map(slot => {
                  const myBooking = slot.booking; 
                  const isMyBooking = myBooking?.studentId === user.id || slot.studentId === user.id;
                  const isPending = isMyBooking && (myBooking?.status === 'PENDING');
                  const isTakenByOthers = slot.isBooked && !isMyBooking;
                  
                  // Dynamic Styles
                  let cardClass = "bg-white border-blue-200 text-blue-900 hover:shadow-md hover:border-blue-400 hover:-translate-y-1 cursor-pointer";
                  let statusClass = "bg-blue-100 text-blue-700";
                  let statusText = "BOOK NOW";

                  if (isTakenByOthers) {
                    cardClass = "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed";
                    statusClass = "bg-slate-200 text-slate-500";
                    statusText = "TAKEN";
                  } else if (isPending) {
                    cardClass = "bg-amber-50 border-amber-200 text-amber-900 cursor-default";
                    statusClass = "bg-amber-100 text-amber-700";
                    statusText = "WAITING...";
                  } else if (isMyBooking) {
                    cardClass = "bg-green-50 border-green-200 text-green-900 cursor-default";
                    statusClass = "bg-green-200 text-green-700";
                    statusText = "YOURS";
                  }

                  return (
                    <div 
                      key={slot.id} 
                      onClick={() => !slot.isBooked && handleSlotClick(slot)}
                      className={`relative p-4 rounded-xl border text-center transition shadow-sm group flex flex-col items-center justify-between h-40 ${cardClass}`}
                    >
                      <div className="w-full">
                        <p className="font-bold text-xl">{slot.startTime} - {slot.endTime}</p>
                        
                        <span className={`inline-block text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>

                      {/* ✅ ACTIONS: MESSAGE & CALENDAR */}
                      {isMyBooking && (
                        <div className="flex gap-2 mt-3 w-full justify-center border-t pt-2 border-black/5">
                           
                           {/* MESSAGE BUTTON (Visible for Waiting & Confirmed) */}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleMessageClick(slot.adminId); // Go to Inbox
                             }}
                             className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                             title="Message Instructor"
                           >
                             <FaCommentDots />
                           </button>

                           {/* CALENDAR BUTTONS (Only if Confirmed/YOURS) */}
                           {!isPending && (
                             <>
                               <a 
                                 href={getGoogleCalendarUrl(slot.date, slot.startTime, slot.endTime)}
                                 target="_blank" rel="noreferrer"
                                 className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                                 title="Add to Google Calendar"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <FaGoogle />
                               </a>
                               
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   downloadIcs(slot.date, slot.startTime, slot.endTime);
                                 }}
                                 className="p-2 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 transition"
                                 title="Download for Apple Calendar"
                               >
                                 <FaApple />
                               </button>
                             </>
                           )}
                        </div>
                      )}
                    </div>
                  );
              }) : (
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md scale-100 transform transition-all my-auto">
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