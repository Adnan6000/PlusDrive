import { useState } from 'react';
import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import LocationPicker from './LocationPicker';
import { requestPickup } from '../api/axios'; 

interface ModalProps {
    booking: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PickupRequestModal({ booking, onClose, onSuccess }: ModalProps) {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState(booking.studentNote || '');
    // Ensure lat/lng are numbers. If null, default to Multan.
    const [location, setLocation] = useState({
        lat: Number(booking.reqLat) || 30.1575,
        lng: Number(booking.reqLng) || 71.5249,
        address: booking.reqLocation || ''
    });

    const handleLocationChange = (lat: number, lng: number, addr: string) => {
        setLocation({ lat, lng, address: addr });
    };

    const handleSubmit = async () => {
        if (!location.address) return alert("Please enter an address or pick a location on the map.");
        
        setLoading(true);
        try {
            await requestPickup(booking.id, {
                userId: booking.studentId, 
                reqLocation: location.address,
                reqLat: location.lat,
                reqLng: location.lng,
                studentNote: note
            });
            alert("Pickup request sent!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to send request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FaMapMarkerAlt /> Request Pickup
                    </h3>
                    {/* ✅ ADDED title="Close" HERE */}
                    <button onClick={onClose} title="Close" className="hover:bg-blue-700 p-2 rounded-full transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    <LocationPicker 
                        initialLat={location.lat}
                        initialLng={location.lng}
                        initialAddress={location.address}
                        onLocationChange={handleLocationChange}
                    />

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Note for Instructor</label>
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="I'll be wearing a red jacket..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-200"
                    >
                        {loading ? 'Sending...' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}