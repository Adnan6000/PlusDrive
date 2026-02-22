import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FaUserEdit, FaSearch, FaSave } from 'react-icons/fa'; // ✅ Fixed: Unused imports removed

export default function PricingManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<'ALL' | string>('ALL');
  const [newPrice, setNewPrice] = useState('');

  // 1. Fetch all students for the dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/auth/school-students');
        setStudents(res.data);
      } catch (error) {
        console.error("Failed to fetch students", error);
      }
    };
    fetchStudents();
  }, []);

  // 2. Filter students by Name, Email, or Phone (Case Insensitive)
  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const handleUpdatePrice = async () => {
    if (!newPrice) return alert("Please enter a valid price.");
    try {
      await api.put('/booking/update-pricing', {
        target: selectedStudentId,
        price: parseFloat(newPrice)
      });
      alert(`Price updated for ${selectedStudentId === 'ALL' ? 'all students' : 'the selected student'}.`);
      setNewPrice('');
    } catch (e) { 
      alert("Failed to update pricing."); 
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <FaUserEdit className="text-blue-600" aria-hidden="true" /> Manage Student Pricing & Plans
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* SEARCHABLE DROPDOWN */}
          <div>
            <label htmlFor="student-search" className="text-xs font-bold text-slate-400 uppercase">
              Select Target
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-slate-300 text-xs" aria-hidden="true" />
              </div>
              <input 
                id="student-search"
                className="w-full border pl-8 p-2 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search Name, Email, or Phone..."
                title="Search for a student" // ✅ Added for axe accessibility
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              id="student-select"
              className="w-full border mt-2 p-2 rounded-lg text-sm bg-white"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              title="Select a student to apply pricing" // ✅ Fixed: axe/forms select-name error
            >
              <option value="ALL">📢 All Students (Default Price)</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  👤 {s.fullName} ({s.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="price-input" className="text-xs font-bold text-slate-400 uppercase">
              New Price (DKK / $)
            </label>
            <input 
              id="price-input"
              type="number"
              className="w-full border p-2 rounded-lg mt-1 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g. 500"
              title="Enter new price" // ✅ Fixed: axe/forms label/title error
            />
          </div>
          <button 
            onClick={handleUpdatePrice}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <FaSave aria-hidden="true" /> Apply Pricing Change
          </button>
        </div>
      </div>
    </div>
  );
}