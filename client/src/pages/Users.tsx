import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

export default function Users() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // EDIT STATE
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', isVerified: false });
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/auth/students');
      setStudents(res.data);
    } catch (error) { 
      console.error("Failed to fetch students"); 
    } finally {
      setLoading(false); // FIX: Ensure loading state is used
    }
  };

  const handleEditClick = (student: any) => {
    setEditingUser(student);
    setFormData({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || '',
      isVerified: student.isVerified
    });
  };

  const handleSave = async () => {
    try {
      await axios.put('http://localhost:5000/auth/admin/update-user', {
        adminId: currentUser.id,
        targetUserId: editingUser.id,
        updates: formData
      });
      
      alert("User updated successfully!");
      setEditingUser(null);
      fetchStudents(); 
    } catch (error) {
      alert("Failed to update user.");
    }
  };

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FIX: Used the loading state
  if (loading) return <div className="p-10 text-center text-slate-500">Loading directory...</div>;

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-700">Student Directory</h2>
        <div className="relative w-72">
          <FaSearch className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="w-full pl-10 pr-4 py-2 border rounded-full bg-slate-50 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold text-sm uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{student.fullName}</td>
                <td className="p-4 text-sm space-y-1">
                  <div className="flex items-center gap-2"><FaEnvelope className="text-slate-400"/> {student.email}</div>
                  <div className="flex items-center gap-2"><FaPhone className="text-slate-400"/> {student.phone || "N/A"}</div>
                </td>
                <td className="p-4 text-center">
                  {/* FIX: Used FaCheckCircle and FaTimesCircle here */}
                  {student.isVerified 
                    ? <span className="flex items-center justify-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold"><FaCheckCircle/> Verified</span> 
                    : <span className="flex items-center justify-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold"><FaTimesCircle/> Pending</span>
                  }
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleEditClick(student)}
                    className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full transition"
                    title="Edit User"
                    aria-label="Edit User" 
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-96 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit Student</h3>
              {/* FIX: Added aria-label for accessibility */}
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-red-500 transition"
                aria-label="Close modal"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                {/* FIX: Added htmlFor and id */}
                <label htmlFor="edit-fullname" className="block text-sm font-bold text-slate-600 mb-1">Full Name</label>
                <input 
                  id="edit-fullname"
                  type="text" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                {/* FIX: Added htmlFor and id */}
                <label htmlFor="edit-email" className="block text-sm font-bold text-slate-600 mb-1">Email</label>
                <input 
                  id="edit-email"
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                {/* FIX: Added htmlFor and id */}
                <label htmlFor="edit-phone" className="block text-sm font-bold text-slate-600 mb-1">Phone</label>
                <input 
                  id="edit-phone"
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                {/* FIX: Added htmlFor and id */}
                <label htmlFor="edit-verified" className="text-sm font-bold text-slate-600">Verified Account</label>
                <input 
                  id="edit-verified"
                  type="checkbox" 
                  checked={formData.isVerified}
                  onChange={e => setFormData({...formData, isVerified: e.target.checked})}
                  className="h-5 w-5 text-blue-600"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2"
              >
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}