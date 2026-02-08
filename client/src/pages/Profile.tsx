import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaLock, FaSave, FaIdCard, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [loading, setLoading] = useState(false);
  
  // User Data State
  const [user, setUser] = useState<any>({});
  
  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    hourlyRate: 50 // Default
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = storedUser.role === 'INSTRUCTOR' || storedUser.role === 'ADMIN';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/auth/user/${storedUser.id}`);
      setUser(res.data);
      setFormData({
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        city: res.data.city || '',
        zipCode: res.data.zipCode || '',
        hourlyRate: res.data.hourlyRate || 50
      });
    } catch (e) { console.error("Failed to load profile"); }
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/update-profile', {
        userId: user.id,
        updates: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          hourlyRate: formData.hourlyRate
        }
      });
      alert("Profile updated successfully!");
      
      // Update LocalStorage name just in case
      const updatedLS = { ...storedUser, fullName: formData.fullName };
      localStorage.setItem('user', JSON.stringify(updatedLS));
      window.dispatchEvent(new Event('storage')); // Trigger UI update if needed
      
      fetchProfile(); // Refresh data
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    try {
      await api.post('/auth/change-password', {
        userId: user.id,
        current: securityData.currentPassword,
        new: securityData.newPassword
      });
      alert("Password changed successfully!");
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* LEFT: SIDEBAR / CARD */}
      <div className="w-full md:w-1/3 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-50 uppercase">
              {user.fullName?.charAt(0)}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-700">{user.fullName}</h2>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mt-1">{user.role}</p>
          
          <div className="mt-6 flex flex-col gap-2 text-left text-sm text-slate-600">
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded truncate">
               <FaEnvelope className="text-slate-400"/> {user.email}
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
               <FaPhone className="text-slate-400"/> {user.phone || "No phone added"}
             </div>
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
               <FaMapMarkerAlt className="text-slate-400"/> {user.city ? `${user.city}` : "No location"}
             </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
           <button 
             onClick={() => setActiveTab('general')}
             className={`w-full text-left px-6 py-4 flex items-center gap-3 font-bold transition
               ${activeTab === 'general' ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-600' : 'text-slate-500 hover:bg-slate-50'}
             `}
           >
             <FaIdCard /> General Information
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`w-full text-left px-6 py-4 flex items-center gap-3 font-bold transition
               ${activeTab === 'security' ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-600' : 'text-slate-500 hover:bg-slate-50'}
             `}
           >
             <FaLock /> Security & Password
           </button>
        </div>
      </div>

      {/* RIGHT: FORMS */}
      <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-700 mb-6 border-b pb-2">Edit Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-slate-500 mb-1">Full Name</label>
                <input 
                  id="fullName"
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-slate-500 mb-1">Phone Number</label>
                <input 
                  id="phone"
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-bold text-slate-500 mb-1">Address</label>
                <input 
                  id="address"
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-bold text-slate-500 mb-1">City</label>
                <input 
                  id="city"
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-bold text-slate-500 mb-1">Zip Code</label>
                <input 
                  id="zipCode"
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.zipCode}
                  onChange={e => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>

              {/* INSTRUCTOR ONLY FIELD */}
              {isInstructor && (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200 md:col-span-2">
                  <label htmlFor="hourlyRate" className="block text-sm font-bold text-yellow-800 mb-1">Lesson Hourly Rate ($)</label>
                  <input 
                    id="hourlyRate"
                    type="number" 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={formData.hourlyRate}
                    onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})}
                  />
                  <p className="text-xs text-yellow-700 mt-1">This rate will apply to all your future bookings.</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition"
              >
                <FaSave /> {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* TAB: SECURITY */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-6 animate-in fade-in duration-300">
             <h3 className="text-xl font-bold text-slate-700 mb-6 border-b pb-2">Change Password</h3>
             
             <div className="space-y-4 max-w-md">
               <div>
                  <label htmlFor="currentPassword" className="block text-sm font-bold text-slate-500 mb-1">Current Password</label>
                  <input 
                    id="currentPassword"
                    type="password" 
                    required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={securityData.currentPassword}
                    onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                  />
               </div>

               <div>
                  <label htmlFor="newPassword" className="block text-sm font-bold text-slate-500 mb-1">New Password</label>
                  <input 
                    id="newPassword"
                    type="password" 
                    required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={securityData.newPassword}
                    onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                  />
               </div>

               <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-500 mb-1">Confirm New Password</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={securityData.confirmPassword}
                    onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                  />
               </div>
             </div>

             <div className="pt-4">
              <button 
                type="submit" 
                className="bg-slate-800 text-white px-8 py-3 rounded font-bold hover:bg-slate-900 shadow-lg flex items-center gap-2 transition"
              >
                <FaLock /> Update Password
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}