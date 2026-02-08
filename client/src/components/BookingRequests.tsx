import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaCheck, FaTimes, FaUserClock, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function BookingRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/booking/pending/${user.id}`);
      setRequests(res.data);
      setLoading(false);
    } catch (error) { console.error("Error fetching requests", error); }
  };

  const handleResponse = async (id: string, action: 'CONFIRMED' | 'REJECTED') => {
    const confirmMsg = action === 'CONFIRMED' 
      ? "Accept this student? They will receive a confirmation email." 
      : "Reject this request? The slot will be opened again.";
      
    if (!confirm(confirmMsg)) return;

    try {
      await api.put('/booking/status', { bookingId: id, action });
      alert(action === 'CONFIRMED' ? "Booking Confirmed!" : "Booking Rejected.");
      fetchRequests(); // Refresh list immediately
    } catch (error) { alert("Action failed"); }
  };

  if (loading) return <div className="text-slate-400 text-sm animate-pulse">Loading requests...</div>;

  if (requests.length === 0) return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
        <FaUserClock className="text-slate-300 text-2xl" />
      </div>
      <p className="text-slate-500 font-medium">No pending requests.</p>
      <p className="text-xs text-slate-400">Relax! You are all caught up.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700">Pending Approvals</h3>
        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
          {requests.length} Waiting
        </span>
      </div>
      
      <div className="divide-y divide-slate-100">
        {requests.map(req => (
          <div key={req.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition">
            
            {/* Student Info */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {req.student.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-700">{req.student.fullName}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(req.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><FaClock /> {req.startTime} - {req.endTime}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleResponse(req.id, 'CONFIRMED')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition shadow-sm shadow-green-200"
              >
                <FaCheck /> Accept
              </button>
              <button 
                onClick={() => handleResponse(req.id, 'REJECTED')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                <FaTimes /> Reject
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}