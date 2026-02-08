import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaArrowDown, FaArrowUp, FaSearch, FaFileInvoiceDollar } from 'react-icons/fa';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'DEPOSIT' | 'REFUND' | 'PAYMENT';
  description: string;
  student?: { fullName: string; email: string };
}

export default function FinanceManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Endpoint depends on role
      const endpoint = user.role === 'ADMIN' 
        ? `http://localhost:5000/finance/school/${user.schoolId}` // Instructor sees all
        : `http://localhost:5000/finance/student/${user.id}`;     // Student sees own

      const res = await axios.get(endpoint);
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching finance history", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter for Instructor Search
  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.student?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type: string) => {
    if (type === 'DEPOSIT' || type === 'REFUND') return <FaArrowUp className="text-green-500" />;
    return <FaArrowDown className="text-red-500" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-light text-slate-700 flex items-center gap-3">
            <FaFileInvoiceDollar className="text-blue-500" />
            Financial Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === 'ADMIN' ? 'Manage payments and view student history' : 'Your payment and lesson history'}
          </p>
        </div>
        
        {/* Total Balance Display */}
        <div className="bg-blue-600 text-white px-6 py-3 rounded shadow-lg text-center">
          <p className="text-xs opacity-80 uppercase font-bold">Current Balance</p>
          <p className="text-2xl font-bold">{user.balance} DKK</p>
        </div>
      </div>

      {/* SEARCH BAR (Instructor Only) */}
      {user.role === 'ADMIN' && (
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student name or description..." 
              className="w-full pl-10 p-2 border border-slate-300 rounded outline-none focus:border-blue-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              {user.role === 'ADMIN' && <th className="p-4">Student</th>}
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center">Loading records...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition">
                  <td className="p-4 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="p-4 font-medium">{t.description}</td>
                  {user.role === 'ADMIN' && (
                    <td className="p-4 text-blue-600 hover:underline cursor-pointer">
                      {t.student?.fullName || 'N/A'}
                    </td>
                  )}
                  <td className={`p-4 text-right font-bold ${t.type === 'PAYMENT' ? 'text-red-500' : 'text-green-600'}`}>
                    {t.type === 'PAYMENT' ? '-' : '+'}{t.amount} DKK
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold
                      ${t.type === 'PAYMENT' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {getIcon(t.type)} {t.type}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}