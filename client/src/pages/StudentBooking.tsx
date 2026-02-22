import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import BookingCard from '../components/BookingCard'; 
import api from '../api/axios';
import { 
  FaChalkboardTeacher, FaCalendarCheck, FaTimes, FaSync, FaInfoCircle,
  FaMapMarkerAlt 
} from 'react-icons/fa';
import LocationPicker from '../components/LocationPicker';

export default function StudentBooking() {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [loading, setLoading] = useState(false);
  
  // MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [pickupData, setPickupData] = useState({
    address: '',
    lat: 30.1575,
    lng: 71.5249
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ✅ CSS: Force Calendar to be Mobile Responsive
  const calendarStyle = `
    .react-calendar { width: 100% !important; max-width: 100%; background: white; border: none; font-family: inherit; line-height: 1.125em; }
    .react-calendar__tile { padding: 10px 0; }
    .react-calendar__navigation button { font-size: 1.2rem; font-weight: bold; }
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
  }, [selectedInstructor]);

  // 2. Fetch Slots
  useEffect(() => {
    fetchSlots();
  }, [selectedInstructor]);

  const fetchSlots = async () => {
    if (!selectedInstructor) return;
    setLoading(true);
    try {
        const res = await api.get(`/availability/${selectedInstructor}`);
        setSlots(res.data);
    } catch (e) { console.error("Slots fetch error", e); }
    finally { setLoading(false); }
  };

  // 3. Match Slots to Day
  const isSameDay = (calendarDate: Date, apiDateString: string) => {
    if (!apiDateString) return false;
    const d1 = new Date(calendarDate);
    const d2 = new Date(apiDateString);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // 4. FILTER SLOTS
  const daySlots = slots.filter(s => {
    if (!isSameDay(date, s.date)) return false;
    const now = new Date();
    const slotDate = new Date(s.date);
    const [hours, minutes] = s.startTime.split(':');
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (slotDate < now) return false;
    return true;
  });

  // 5. Calendar Dots
  const tileContent = ({ date, view }: any) => {
    if (view === 'month' && slots.some(s => isSameDay(date, s.date) && !s.isBooked)) {
       return <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mt-1 shadow-sm"></div>;
    }
    return null;
  };

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
        reqLocation: pickupData.address,
        reqLat: pickupData.lat,
        reqLng: pickupData.lng,
        studentNote: bookingNote, 
        PickupStatus: 'PENDING'
      });
      alert("Request Sent! Instructor will review your pickup location.");
      setShowModal(false);
      fetchSlots(); 
    } catch (error) { alert("Booking failed. Slot might be taken."); }
  };

  return (
    <div className="space-y-6 relative h-full">
      <style>{calendarStyle}</style>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
        
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
                disabled={loading}
                title="Refresh Availability"
                className="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold px-4 py-2 bg-blue-50 rounded-full transition disabled:opacity-50"
            >
                <FaSync className={loading ? "animate-spin" : ""} /> Refresh
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
                    minDate={new Date()} 
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
              {daySlots.length > 0 ? daySlots.map(slot => {
                  const myBooking = slot.booking; 
                  const isMyBooking = (myBooking?.studentId === user.id || slot.studentId === user.id) && myBooking?.status !== 'REJECTED';
                  
                  // ✅ Using the BookingCard for slots owned by the student
                  if (isMyBooking) {
                    return (
                      <BookingCard 
                        key={slot.id} 
                        booking={{...slot, ...myBooking}} 
                      />
                    );
                  }

                  const isTaken = slot.isBooked;
                  return (
                    <div 
                      key={slot.id} 
                      onClick={() => !isTaken && handleSlotClick(slot)}
                      className={`p-4 rounded-xl border text-center h-40 flex flex-col items-center justify-center transition shadow-sm ${
                        isTaken 
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-white border-blue-200 text-blue-900 hover:shadow-md cursor-pointer hover:-translate-y-1'
                      }`}
                    >
                      <p className="font-bold text-xl">{slot.startTime} - {slot.endTime}</p>
                      <span className={`text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-full ${
                        isTaken ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isTaken ? 'TAKEN' : 'BOOK NOW'}
                      </span>
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg scale-100 transform transition-all my-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Confirm Booking & Pickup</h3>
              <button 
                onClick={() => setShowModal(false)} 
                title="Close Modal"
                className="p-2 hover:bg-slate-100 rounded-full transition"
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

              <div className="border p-4 rounded-xl bg-slate-50 space-y-3">
                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" /> Requested Pickup Location
                </h4>
                <LocationPicker 
                    onLocationChange={(lat, lng, addr) => setPickupData({ address: addr, lat, lng })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pickup Note (Optional)</label>
                <textarea 
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none bg-slate-50 transition text-sm"
                  placeholder="e.g. I'll be waiting at the main entrance..."
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