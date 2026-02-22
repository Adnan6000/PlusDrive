import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import { 
  FaChalkboardTeacher, FaCalendarCheck, FaTimes, FaSync, 
  FaCommentDots, FaGoogle, FaApple, FaMapMarkerAlt
} from 'react-icons/fa'; // Removed FaInfoCircle
import LocationPicker from '../components/LocationPicker';

export default function StudentBooking() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  
  // MODAL & PICKUP STATE
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingNote, setBookingNote] = useState('');
  
  const [pickupData, setPickupData] = useState({
    address: '',
    lat: 30.1575,
    lng: 71.5249
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const calendarStyle = `
    .react-calendar { width: 100% !important; max-width: 100%; background: white; border: none; font-family: inherit; }
    .react-calendar__tile { padding: 10px 0; }
  `;

  const fixDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const bufferedDate = new Date(date.getTime() + (12 * 60 * 60 * 1000));
    return bufferedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); 
  };

  const getGoogleCalendarUrl = (dateStr: string, startTime: string, endTime: string) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const startSimple = startTime.replace(':', '') + '00';
    const endSimple = endTime.replace(':', '') + '00';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Driving+Lesson&dates=${yyyy}${mm}${dd}T${startSimple}/${yyyy}${mm}${dd}T${endSimple}&details=Driving+Lesson+with+DriveBook`;
  };

  const downloadIcs = (dateStr: string, startTime: string, endTime: string) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const startSimple = startTime.replace(':', '') + '00';
    const endSimple = endTime.replace(':', '') + '00';
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Driving Lesson\nDTSTART;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${startSimple}\nDTEND;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${endSimple}\nDESCRIPTION:Driving Lesson with DriveBook\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lesson.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchInstructors = async () => {
    try {
          // Changed from /any to /school-instructors/all or your specific school ID
          const res = await api.get(`/auth/school-instructors/${user.schoolId || 'all'}`);
          setInstructors(res.data);
          if(res.data.length > 0 && !selectedInstructor) setSelectedInstructor(res.data[0].id);
      } catch (e) { console.error(e); }
    };

  const fetchSlots = async () => {
    if (!selectedInstructor) return;
    try {
        const res = await api.get(`/availability/${selectedInstructor}`);
        setSlots(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchInstructors(); }, []);
  useEffect(() => { fetchSlots(); }, [selectedInstructor]);

  const isSameDay = (calendarDate: Date, apiDateString: string) => {
    if (!apiDateString) return false;
    const apiDate = new Date(apiDateString);
    const bufferedApiDate = new Date(apiDate.getTime() + (12 * 60 * 60 * 1000));
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === bufferedApiDate.toISOString().split('T')[0]; 
  };

  const daySlots = slots.filter(s => isSameDay(date, s.date));
  const tileContent = ({ date, view }: any) => (view === 'month' && slots.some(s => isSameDay(date, s.date) && !s.isBooked)) ? <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mt-1 shadow-sm"></div> : null;

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setBookingNote('');
    setPickupData({ address: '', lat: 30.1575, lng: 71.5249 });
    setShowModal(true);
  };

  const submitBooking = async () => {
    if (!selectedSlot) return;
    if (!pickupData.address) return alert("Please specify a requested pickup location on the map.");

    try {
      await api.post('/booking/request', {
        studentId: user.id,
        availabilityId: selectedSlot.id,
        type: 'Driving',
        note: bookingNote,
        reqLocation: pickupData.address,
        reqLat: pickupData.lat,
        reqLng: pickupData.lng,
        studentNote: bookingNote
      });
      alert("Booking Request Sent with Pickup Request!");
      setShowModal(false);
      fetchSlots(); 
    } catch (error) { alert("Booking failed. Slot might be taken."); }
  };

  const handleMessageClick = (instructorId: string) => navigate(`/inbox?chatWith=${instructorId}`);

  return (
    <div className="space-y-6 relative">
      <style>{calendarStyle}</style>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-b pb-6">
            <div className="w-full sm:max-w-md">
               <label htmlFor="instructor-select" className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                 <FaChalkboardTeacher className="text-blue-600"/> Select Instructor
               </label>
               {/* ✅ ADDED title for select accessibility */}
               <select 
                 id="instructor-select"
                 title="Select Instructor" 
                 className="w-full border p-2.5 rounded bg-slate-50 outline-none" 
                 value={selectedInstructor} 
                 onChange={e => setSelectedInstructor(e.target.value)}
               >
                 {instructors.map(i => <option key={i.id} value={i.id}>{i.fullName}</option>)}
               </select>
            </div>
            <button onClick={fetchSlots} className="text-sm flex items-center gap-2 text-blue-600 font-bold px-4 py-2 bg-blue-50 rounded-full transition">
              <FaSync /> Refresh
            </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Calendar onChange={(d: any) => setDate(d)} value={date} tileContent={tileContent} className="w-full border-none shadow-sm rounded-lg p-2" />
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
              <FaCalendarCheck className="text-blue-600" /> Available Slots: <span className="text-slate-500 font-normal ml-1">{date.toDateString()}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {daySlots.map(slot => {
                  const isMyBooking = slot.booking?.studentId === user.id || slot.studentId === user.id;
                  const isPending = isMyBooking && slot.booking?.status === 'PENDING';
                  const isTaken = slot.isBooked && !isMyBooking;
                  return (
                    <div key={slot.id} onClick={() => !slot.isBooked && handleSlotClick(slot)} className={`relative p-4 rounded-xl border text-center transition shadow-sm flex flex-col items-center justify-between h-44 ${slot.isBooked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-200 hover:border-blue-400 cursor-pointer'}`}>
                      <p className="font-bold text-xl">{slot.startTime} - {slot.endTime}</p>
                      <span className={`text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-full ${isTaken ? 'bg-slate-200' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isTaken ? 'TAKEN' : isPending ? 'WAITING...' : 'BOOK NOW'}
                      </span>
                      {isMyBooking && (
                        <div className="flex gap-2 mt-3 w-full justify-center border-t pt-2 border-black/5">
                           {/* ✅ ADDED title for accessibility */}
                           <button title="Message Instructor" onClick={(e) => { e.stopPropagation(); handleMessageClick(slot.adminId); }} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"><FaCommentDots /></button>
                           {!isPending && <>
                             {/* ✅ ADDED title for accessibility */}
                             <a title="Add to Google Calendar" href={getGoogleCalendarUrl(slot.date, slot.startTime, slot.endTime)} target="_blank" rel="noreferrer" className="p-2 bg-red-100 text-red-600 rounded-full" onClick={(e) => e.stopPropagation()}><FaGoogle /></a>
                             <button title="Download Apple Calendar File" onClick={(e) => { e.stopPropagation(); downloadIcs(slot.date, slot.startTime, slot.endTime); }} className="p-2 bg-slate-200 text-slate-700 rounded-full"><FaApple /></button>
                           </>}
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Confirm Booking & Pickup</h3>
              {/* ✅ ADDED title for accessibility */}
              <button title="Close" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><FaTimes className="text-slate-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div><p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Date</p><p className="text-slate-700 font-semibold">{fixDateDisplay(selectedSlot.date)}</p></div>
                 <div className="text-right"><p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Time</p><p className="text-slate-700 font-semibold">{selectedSlot.startTime} - {selectedSlot.endTime}</p></div>
              </div>

              <div className="border p-4 rounded-xl bg-slate-50 space-y-3">
                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" /> Pickup Location Request
                </h4>
                <LocationPicker 
                    onLocationChange={(lat, lng, addr) => setPickupData({ address: addr, lat, lng })}
                />
              </div>

              <div>
                <label htmlFor="pickup-note" className="block text-sm font-bold text-slate-700 mb-2">Pickup Note from Student</label>
                <textarea 
                  id="pickup-note"
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none bg-slate-50 transition text-sm"
                  placeholder="e.g. I will be wearing a red jacket at the bus stop..."
                  value={bookingNote}
                  onChange={e => setBookingNote(e.target.value)}
                />
              </div>

              <button 
                onClick={submitBooking} 
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
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