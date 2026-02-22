import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  FaCalendarAlt, FaMapMarkerAlt, FaCheck, 
  FaBan, FaHourglassHalf, FaInfoCircle 
} from 'react-icons/fa';
import PickupDecisionModal from '../components/PickupDecisionModal';

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [decisionBooking, setDecisionBooking] = useState<any>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';

    const fetchBookings = async () => {
        try {
            // Logic: Use the generic getter that handles role-based filtering on the backend
            const res = await api.get(`/booking/${user.id}`);
            setBookings(res.data);
        } catch (error) { 
            console.error("Fetch error:", error); 
        }
    };

    useEffect(() => { 
        fetchBookings(); 
    }, [user.id]);

    const handleAcceptPickup = async (booking: any) => {
        if (!window.confirm("Accept this pickup location?")) return;
        try {
            await api.put(`/booking/${booking.id}/pickup/decide`, {
                instructorId: user.id,
                action: 'ACCEPT'
            });
            alert("Location Accepted");
            fetchBookings();
        } catch (e) { 
            alert("Error accepting location"); 
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" /> 
                {isInstructor ? 'Instructor: Booking Requests' : 'Student: My Booking History'}
            </h3>
            
            <div className="space-y-4">
                {bookings.length > 0 ? bookings.map(booking => (
                    <div key={booking.id} className="flex flex-col p-5 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                            <div>
                                <p className="font-bold text-slate-800 text-lg">
                                    {new Date(booking.date).toLocaleDateString()} | <span className="text-blue-600">{booking.startTime}</span>
                                </p>
                                <p className="text-sm text-slate-500">
                                    {isInstructor ? `Student: ${booking.student?.fullName}` : `Instructor: ${booking.admin?.fullName}`}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {booking.status}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2 mb-2"><FaMapMarkerAlt /> Pickup Request</h4>
                            
                            {booking.pickupStatus === 'PENDING' && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-sm font-medium">Requested: {booking.reqLocation}</p>
                                    <p className="text-xs text-slate-500 italic">Note: "{booking.studentNote || 'No note'}"</p>
                                    {isInstructor && (
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => handleAcceptPickup(booking)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Accept</button>
                                            <button onClick={() => setDecisionBooking(booking)} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Reject & Propose New</button>
                                        </div>
                                    )}
                                    {!isInstructor && <p className="text-[10px] text-yellow-700 mt-2 font-bold uppercase tracking-widest"><FaHourglassHalf className="inline" /> Pending Instructor Approval</p>}
                                </div>
                            )}

                            {booking.pickupStatus === 'ACCEPTED' && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600"><FaCheck /></div>
                                    <div>
                                        <p className="text-xs font-bold text-green-700 uppercase">Pickup Confirmed</p>
                                        <p className="text-sm font-medium text-green-900">{booking.finalLocation}</p>
                                    </div>
                                </div>
                            )}

                            {booking.pickupStatus === 'REJECTED' && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2 text-red-700 font-bold mb-1"><FaBan /> Location Changed</div>
                                    <p className="text-sm text-slate-800">Final Pickup: <span className="font-bold">{booking.finalLocation}</span></p>
                                    {booking.instructorNote && <p className="text-xs text-slate-600 mt-1 italic">Instructor Note: "{booking.instructorNote}"</p>}
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12">
                        <FaInfoCircle className="mx-auto text-slate-300 text-3xl mb-3" />
                        <p className="text-slate-400">No bookings found.</p>
                    </div>
                )}
            </div>

            {decisionBooking && (
                <PickupDecisionModal 
                    booking={decisionBooking} 
                    onClose={() => setDecisionBooking(null)} 
                    onSuccess={() => { setDecisionBooking(null); fetchBookings(); }} 
                />
            )}
        </div>
    );
}