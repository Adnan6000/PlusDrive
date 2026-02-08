import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaHistory, FaPaperPlane, FaMoneyBillWave, FaTimes } from 'react-icons/fa';

export default function StudentList() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Modals State
  const [showHistory, setShowHistory] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Data for Modals
  const [history, setHistory] = useState<any[]>([]);
  const [msgContent, setMsgContent] = useState('');
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/auth/students/${user.schoolId}`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error(error); }
  };

  // --- ACTIONS ---

  // 1. VIEW HISTORY
  const handleViewHistory = async () => {
    if (!selectedStudent) return;
    try {
      const res = await api.get(`/booking/student/${selectedStudent.id}`);
      setHistory(res.data);
      setShowHistory(true);
    } catch (error) { alert("Could not fetch history"); }
  };

  // 2. SEND MESSAGE
  const handleSendMessage = async () => {
    if (!selectedStudent) return;
    try {
      await api.post('/messages/send', {
        senderId: user.id,
        receiverId: selectedStudent.id,
        subject: 'Instructor Message',
        content: msgContent,
      });
      alert("Message Sent!");
      setShowMsgModal(false);
      setMsgContent('');
    } catch (error) { 
      console.error(error);
      const errorMessage = api.isAxiosError(error) ? (error.response?.data?.message || 'Internal Error') : 'Internal Error';
      alert("Failed to send: " + errorMessage);
     }
  };

  // 3. ADD FUNDS (Manual Payment)
  const handleAddFunds = async () => {
    if (!selectedStudent || !payAmount) return;
    try {
      await api.post('/finance/add-funds', {
        studentId: selectedStudent.id,
        amount: payAmount,
        description: 'Cash Payment / Deposit'
      });
      alert("Funds Added Successfully!");

      // Refresh list to show new balance
      fetchStudents();
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === selectedStudent.id
            ? { ...s, balance: s.balance + parseFloat(payAmount) }
            : s
        )
      );

      // 2. Updated the currently selected student (Safe Update)
      setSelectedStudent((prev: any) => {
        if (!prev) return null; // Safety check
        return { ...prev, balance: prev.balance + parseFloat(payAmount) };
      });

      setShowPayModal(false);
      setPayAmount('');
    } catch (error) { alert("Failed to add funds"); }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm min-h-[600px] flex">

      {/* LIST COLUMN */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <input
            type="text" placeholder="Search student..."
            className="w-full p-2 border rounded text-sm outline-none"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto flex-1 h-[550px]">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition ${selectedStudent?.id === student.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}`}
            >
              <h4 className="font-bold text-slate-700">{student.fullName}</h4>
              <p className="text-xs text-slate-500">{student.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS COLUMN */}
      <div className="w-2/3 p-8 bg-slate-50/50 relative">
        {selectedStudent ? (
          <div>
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6 border-b pb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-700">{selectedStudent.fullName}</h2>
                <p className="text-slate-500">{selectedStudent.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase">
                  Active Student
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{selectedStudent.balance} DKK</div>
                <p className="text-xs text-slate-400 uppercase font-bold mt-1">Current Balance</p>
                <button
                  onClick={() => setShowPayModal(true)}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 ml-auto"
                >
                  <FaMoneyBillWave /> Add Funds
                </button>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Contact</p>
                <p className="text-slate-700 font-medium">{selectedStudent.phone || 'No Phone'}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Address</p>
                <p className="text-slate-700 font-medium">
                  {selectedStudent.address ? `${selectedStudent.address}, ${selectedStudent.city}` : '-'}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS (NOW WORKING) */}
            <div className="flex gap-4">
              <button
                onClick={handleViewHistory}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaHistory /> View Booking History
              </button>
              <button
                onClick={() => setShowMsgModal(true)}
                className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <FaPaperPlane /> Send Message
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            Select a student to view details
          </div>
        )}

        {/* --- MODALS --- */}

        {/* 1. HISTORY MODAL */}
        {showHistory && (
          <div className="absolute inset-0 bg-white z-10 p-6 overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-slate-700">Booking History</h3>
              <button title="Close" onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-red-500"><FaTimes className="text-xl" /></button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500 uppercase text-xs">
                <tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3 text-right">Price</th></tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map(h => (
                  <tr key={h.id} className="border-b">
                    <td className="p-3">{new Date(h.date).toLocaleDateString()} <span className="text-slate-400 text-xs">{h.startTime}</span></td>
                    <td className="p-3">{h.type}</td>
                    <td className="p-3 font-bold text-xs">{h.status}</td>
                    <td className="p-3 text-right">{h.price}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="p-6 text-center italic text-slate-400">No history found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. MESSAGE MODAL */}
        {showMsgModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
              <h3 className="font-bold mb-4">Message to {selectedStudent.fullName}</h3>
              <textarea
                className="w-full border p-3 rounded h-32 outline-none focus:border-blue-500"
                placeholder="Type your message here..."
                value={msgContent}
                onChange={e => setMsgContent(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowMsgModal(false)} className="flex-1 bg-slate-200 py-2 rounded font-bold">Cancel</button>
                <button onClick={handleSendMessage} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Send</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADD FUNDS MODAL */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-80 shadow-xl">
              <h3 className="font-bold mb-4 text-green-700 flex items-center gap-2">
                <FaMoneyBillWave /> Add Funds
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Enter amount received from student (Cash/Transfer).
              </p>
              <input
                type="number"
                className="w-full border p-3 rounded text-xl font-bold mb-4 outline-none focus:border-green-500"
                placeholder="0.00 DKK"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowPayModal(false)} className="flex-1 bg-slate-200 py-2 rounded font-bold">Cancel</button>
                <button onClick={handleAddFunds} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">Confirm Deposit</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}