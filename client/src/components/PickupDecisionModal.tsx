import { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import LocationPicker from './LocationPicker';
import api from '../api/axios';

interface Props {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PickupDecisionModal({ booking, onClose, onSuccess }: Props) {
  // ✅ Retrieve user to get instructorId
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [newLocation, setNewLocation] = useState({ address: '', lat: 0, lng: 0 });
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Logic: Validate coordinates and address were selected
    if (!newLocation.address || !newLocation.lat) {
        return alert("Please pick a new location on the map.");
    }
    if (!note) return alert("Please provide a note to the student.");

    setLoading(true);
    try {
        // Calling the refined backend route we created
        await api.put(`/booking/${booking.id}/pickup/decide`, {
            instructorId: user.id,
            action: 'REJECTED', // Signals a "Proposed New" state in our logic
            location: newLocation.address,
            lat: newLocation.lat,
            lng: newLocation.lng,
            note: note // Becomes 'instructorNote' on backend
        });
        
        alert("New location proposed! Student has been notified in their Inbox.");
        onSuccess();
    } catch (e) {
        alert("Failed to update location.");
    } finally {
        setLoading(false);
    }
};


  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-orange-50">
          <h3 className="font-bold text-orange-800 flex items-center gap-2">
            <FaExclamationTriangle /> Propose New Pickup Location
          </h3>
          <button onClick={onClose} title="Close"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Student requested: <span className="font-bold text-slate-800">{booking.reqLocation}</span>
          </p>

          <div className="border rounded-xl overflow-hidden">
            <LocationPicker 
              onLocationChange={(lat, lng, addr) => setNewLocation({ address: addr, lat, lng })} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Note to Student (Required)</label>
            <textarea 
              className="w-full border p-2 rounded-lg h-24 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Explain why you changed the location..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating..." : "Confirm New Location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}