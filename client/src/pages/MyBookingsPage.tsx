import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    FaCalendarAlt, FaCheck, FaBan,
    FaInfoCircle, FaSpinner, FaMapMarkerAlt, FaClock
} from 'react-icons/fa';
import PickupDecisionModal from '../components/PickupDecisionModal';
import LocationPicker from '../components/LocationPicker'; 

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [decisionBooking, setDecisionBooking] = useState<any>(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/booking/${user.id}`);
            setBookings(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user.id]);

    const fixDateDisplay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    };

    const handleAcceptPickup = async (booking: any) => {
        if (!window.confirm("Confirm acceptance of this pickup location?")) return;
        try {
            await api.put(`/booking/${booking.id}/pickup/decide`, {
                instructorId: user.id,
                action: 'ACCEPT'
            });
            alert("Location Accepted Successfully");
            fetchBookings();
        } catch (e) {
            alert("Action failed. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600" />
                    {isInstructor ? 'Instructor: Booking Management' : 'My Lesson History'}
                </h2>
                <button
                    onClick={fetchBookings}
                    className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition"
                    title="Refresh List"
                >
                    Refresh List
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                    <FaInfoCircle className="text-4xl text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No bookings found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{fixDateDisplay(booking.date)}</h3>
                                    <p className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                                        <FaClock size={12} /> {booking.startTime} - {booking.endTime}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {isInstructor ? `Student: ${booking.student?.fullName}` : `Instructor: ${booking.admin?.fullName}`}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <FaMapMarkerAlt /> Pickup Management
                                </h4>

                                {/* PICKUP STATUS: PENDING (Decision Phase) */}
                                {booking.PickupStatus === 'PENDING' && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-blue-900">Student Request:</p>
                                                <p className="text-sm text-blue-800 break-words">{booking.reqLocation || 'No address specified'}</p>
                                                {booking.studentNote && (
                                                    <p className="text-xs text-slate-500 italic mt-1">Note: "{booking.studentNote}"</p>
                                                )}
                                            </div>
                                            {isInstructor && (
                                                <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleAcceptPickup(booking)}
                                                        className="flex-1 bg-green-600 text-white text-[11px] px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-green-700 transition"
                                                        title="Confirm Location"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => setDecisionBooking(booking)}
                                                        className="flex-1 bg-orange-500 text-white text-[11px] px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-orange-600 transition"
                                                        title="Propose Different Location"
                                                    >
                                                        Change
                                                    </button>
                                                    {/* Large Map Button integration */}
                                                    <button 
                                                        onClick={() => window.open(`https://www.google.com/maps?q=${booking.reqLat},${booking.reqLng}`, '_blank')}
                                                        className="mt-2 text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                                                        title="Open location in Google Maps"
                                                        >
                                                        <FaMapMarkerAlt /> Open in Large Map
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instructor Map View */}
                                        {isInstructor && booking.reqLat && booking.reqLng && (
                                            <div className="h-48 w-full rounded-lg overflow-hidden border border-blue-200 shadow-inner z-0">
                                                <LocationPicker
                                                    initialLat={booking.reqLat}
                                                    initialLng={booking.reqLng}
                                                    initialAddress={booking.reqLocation}
                                                    readOnly={true}
                                                />
                                            </div>
                                        )}

                                        {!isInstructor && (
                                            <p className="text-[10px] text-amber-600 mt-3 font-bold uppercase tracking-widest animate-pulse">
                                                Waiting for instructor to verify location...
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* PICKUP STATUS: ACCEPTED */}
                                {booking.PickupStatus === 'ACCEPTED' && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-4">
                                        <div className="bg-green-100 p-2 rounded-full text-green-600"><FaCheck /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-green-700 uppercase">Pickup Finalized</p>
                                            <p className="text-sm font-bold text-green-900 break-words">{booking.finalLocation}</p>
                                        </div>
                                    </div>
                                )}

                                {/* PICKUP STATUS: REJECTED / PROPOSED NEW */}
                                {booking.PickupStatus === 'REJECTED' && (
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-2">
                                            <FaBan /> Instructor Proposed New Location
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-slate-800">Final Meeting Point: <span className="font-bold underline">{booking.finalLocation}</span></p>
                                            {booking.instructorNote && (
                                                <p className="text-xs text-slate-600 mt-2 bg-white/50 p-2 rounded italic">
                                                    Instructor Note: "{booking.instructorNote}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* NO PICKUP REQUEST */}
                                {(!booking.PickupStatus || booking.PickupStatus === 'NONE') && (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed">
                                        No pickup location requested for this lesson.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Decision Modal: Instructor Proposing New Location */}
            {decisionBooking && (
                <PickupDecisionModal
                    booking={decisionBooking}
                    onClose={() => setDecisionBooking(null)}
                    onSuccess={() => {
                        setDecisionBooking(null);
                        fetchBookings();
                    }}
                />
            )}
        </div>
    );
}