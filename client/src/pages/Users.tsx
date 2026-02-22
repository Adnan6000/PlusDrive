import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  FaSearch, FaPhone, FaEnvelope, FaCheckCircle, 
  FaTimesCircle, FaEdit, FaSave, FaTimes, FaMapMarkerAlt 
} from 'react-icons/fa';

export default function Users() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // EDIT STATE
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    isVerified: false 
  });
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/auth/students');
      setStudents(res.data);
    } catch (error) { 
      console.error("Failed to fetch students"); 
    } finally {
      setLoading(false);
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
      await api.put('/auth/admin/update-user', {
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

  // ✅ IMPROVED SEARCH LOGIC: Handles Case Sensitivity & Multiple Fields
  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase().trim();
    return (
      student.fullName.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.phone && student.phone.includes(term)) ||
      (student.address && student.address.toLowerCase().includes(term))
    );
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading directory...</div>;

  return (
    <div className="space-y-6 relative">
      {/* RESPONSIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 md:p-6 rounded-lg shadow-sm border border-slate-200 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-700">Student Directory</h2>
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, or address..." 
            className="w-full pl-10 pr-4 py-2 border rounded-full bg-slate-50 focus:outline-none focus:border-blue-500 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DIRECTORY CONTAINER */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        {/* DESKTOP TABLE: Hidden on mobile */}
        <table className="w-full text-left hidden md:table">
          <thead className="bg-slate-50 text-slate-600 font-bold text-sm uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Contact & Address</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{student.fullName}</td>
                <td className="p-4 text-sm space-y-1">
                  <div className="flex items-center gap-2"><FaEnvelope className="text-slate-400 w-4"/> {student.email}</div>
                  <div className="flex items-center gap-2"><FaPhone className="text-slate-400 w-4"/> {student.phone || "N/A"}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 italic mt-1">
                    <FaMapMarkerAlt className="text-blue-400 w-3"/> {student.address || "No address"}
                  </div>
                </td>
                <td className="p-4 text-center">
                  {student.isVerified 
                    ? <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold"><FaCheckCircle/> Verified</span> 
                    : <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold"><FaTimesCircle/> Pending</span>
                  }
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleEditClick(student)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full transition" title={`Edit details for ${student.fullName}`} aria-label={`Edit details for ${student.fullName}`}><FaEdit /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MOBILE CARD VIEW: Visible only on small screens */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredStudents.length > 0 ? filteredStudents.map(student => (
            <div key={student.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{student.fullName}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {student.isVerified 
                      ? <FaCheckCircle className="text-green-500" size={12}/> 
                      : <FaTimesCircle className="text-orange-500" size={12}/>
                    }
                    <span className={`text-[10px] font-bold uppercase ${student.isVerified ? 'text-green-600' : 'text-orange-500'}`}>
                       {student.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleEditClick(student)} className="p-2 bg-blue-50 text-blue-600 rounded-lg" title={`Edit details for ${student.fullName}`} aria-label={`Edit details for ${student.fullName}`}><FaEdit size={18} /></button>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-3"><FaEnvelope className="text-slate-400 shrink-0"/> {student.email}</div>
                <div className="flex items-center gap-3"><FaPhone className="text-slate-400 shrink-0"/> {student.phone || "N/A"}</div>
                <div className="flex items-start gap-3 bg-slate-50 p-2 rounded border border-slate-100">
                  <FaMapMarkerAlt className="text-blue-400 mt-1 shrink-0"/> 
                  <span className="text-xs italic">{student.address || "Address not provided"}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-slate-400 italic">No matching students found.</div>
          )}
        </div>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit Student</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-red-500 transition" title="Close Edit Modal" aria-label="Close Edit Modal"><FaTimes size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Full Name</label>
                <input id='edit-name' title='Enter full name' type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Email</label>
                <input id='edit-email' title='Enter email address' type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Phone</label>
                <input id='edit-phone' title='Enter phone number' type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
                <label className="text-sm font-bold text-slate-600">Verified Account</label>
                <input id='edit-verified' title='Toggle verified status' type="checkbox" checked={formData.isVerified} onChange={e => setFormData({...formData, isVerified: e.target.checked})} className="h-5 w-5 text-blue-600 rounded" />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}