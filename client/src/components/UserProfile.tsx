import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FaMoon, FaSun, FaGlobe, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Generally' | 'Settings'>('Generally');

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    surname: '',
    email: '',
    phone: '',
    cvr: '',
    country: 'Denmark',
    address: '',
    zipCode: '',
    city: '',
    description: '',
    isVerified: false
  });

  // Password Form State
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  // Settings State
  const [settings, setSettings] = useState({ theme: 'light', lang: 'en' });

  // 1. FETCH DATA ON LOAD
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user.id) return;
      try {
        const res = await api.get(`/auth/user/${user.id}`);
        // Merge fetched data with existing state to avoid overwriting defaults
        setFormData(prev => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, [user.id]);

  // 2. UPDATE PROFILE HANDLER
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/update-profile', {
        userId: user.id,
        updates: formData
      });
      alert("Profile Saved!");
      
      // Update local storage to reflect name changes immediately in Sidebar/Header
      const updatedUser = { ...user, fullName: formData.fullName, isVerified: formData.isVerified };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // 3. CHANGE PASSWORD HANDLER
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("New passwords do not match!");
    
    try {
      await api.post('/auth/change-password', {
        userId: user.id,
        current: passData.current,
        new: passData.new
      });
      alert("Password Changed Successfully!");
      setPassData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || "Error changing password");
    }
  };

  // 4. SEND VERIFICATION EMAIL
  const sendConfirmation = async () => {
    try {
      await api.post('/auth/resend-verification', { email: formData.email });
      alert(`Verification link sent to ${formData.email}`);
    } catch (e) { 
      alert("Failed to send verification link. Please try again later."); 
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl mt-8 text-white">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
          {formData.fullName?.charAt(0) || user.fullName?.charAt(0)}
        </div>
        <div>
          <h2 className="text-3xl font-bold">{formData.fullName} {formData.surname}</h2>
          <p className="text-slate-400 flex items-center gap-2">
            Status: <span className="text-blue-400 font-bold">{user.role === 'ADMIN' ? 'Instructor' : 'Student'}</span>
            {formData.isVerified && <FaCheckCircle className="text-green-400 text-sm" title="Verified Account"/>}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 mb-8 border-b border-white/10 text-sm font-bold uppercase tracking-wider">
        <button 
          onClick={() => setActiveTab('Generally')}
          className={`pb-4 transition ${activeTab === 'Generally' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
        >
          Generally
        </button>
        <button 
          onClick={() => setActiveTab('Settings')}
          className={`pb-4 transition ${activeTab === 'Settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
        >
          Settings
        </button>
      </div>

      {/* --- TAB CONTENT: GENERALLY (Personal Info) --- */}
      {activeTab === 'Generally' && (
        <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          <div className="lg:col-span-3 bg-slate-800/50 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Personal Information</h3>
              <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="fullName" className="text-slate-400 text-xs uppercase font-bold mb-2 block">First Name</label>
                <input 
                  id="fullName"
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                />
              </div>
              <div>
                <label htmlFor="surname" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Surname</label>
                <input 
                  id="surname"
                  type="text" 
                  value={formData.surname || ''}
                  onChange={e => setFormData({...formData, surname: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="email" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Email</label>
                <input 
                  id="email"
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl p-3 text-slate-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Phone Number</label>
                <input 
                  id="phone"
                  type="text" 
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="address" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Address</label>
                <input 
                  id="address"
                  type="text" 
                  value={formData.address || ''}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="zipCode" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Postal Code</label>
                    <input 
                    id="zipCode"
                    type="text" 
                    value={formData.zipCode || ''}
                    onChange={e => setFormData({...formData, zipCode: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                    />
                </div>
                <div>
                    <label htmlFor="city" className="text-slate-400 text-xs uppercase font-bold mb-2 block">City</label>
                    <input 
                    id="city"
                    type="text" 
                    value={formData.city || ''}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                    />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Personal Description</label>
              <textarea 
                id="description"
                rows={4}
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Tell us about yourself..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
              />
            </div>
          </div>
        </form>
      )}

      {/* --- TAB CONTENT: SETTINGS (Security & Confirmations) --- */}
      {activeTab === 'Settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* LEFT: Confirmations & UI Settings */}
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
                <FaExclamationCircle /> Account Status
              </h3>
              <div className="bg-slate-900/50 p-4 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-bold uppercase">Email Address</span>
                    <span className="text-white text-sm font-medium truncate max-w-[150px]">{formData.email}</span>
                </div>
                {formData.isVerified ? (
                  <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                    <FaCheckCircle /> Verified
                  </span>
                ) : (
                  <button 
                    onClick={sendConfirmation}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-md"
                  >
                    Confirm Now
                  </button>
                )}
              </div>
            </div>

            {/* UI Settings */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Appearance</h3>
                
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3 text-slate-300">
                        {settings.theme === 'light' ? <FaSun /> : <FaMoon />}
                        <span className="text-sm font-medium">Theme Mode</span>
                    </div>
                    <select 
                        id="themeSelect"
                        title='Select Theme'
                        value={settings.theme} 
                        onChange={(e) => setSettings({...settings, theme: e.target.value})}
                        className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg p-2 outline-none focus:border-blue-500"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-300">
                        <FaGlobe />
                        <span className="text-sm font-medium">Language</span>
                    </div>
                    <select 
                        id="langSelect"
                        title="Select Language"
                        value={settings.lang} 
                        onChange={(e) => setSettings({...settings, lang: e.target.value})}
                        className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg p-2 outline-none focus:border-blue-500"
                    >
                        <option value="en">English</option>
                        <option value="da">Danish</option>
                    </select>
                </div>
            </div>
          </div>

          {/* RIGHT: Change Password */}
          <div className="lg:col-span-2">
            <form onSubmit={handleChangePassword} className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Change Password</h3>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition shadow-lg">
                  Update Password
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Current Password</label>
                  <input 
                    id="currentPassword"
                    type="password" 
                    value={passData.current}
                    onChange={e => setPassData({...passData, current: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="text-slate-400 text-xs uppercase font-bold mb-2 block">New Password</label>
                  <input 
                    id="newPassword"
                    type="password" 
                    value={passData.new}
                    onChange={e => setPassData({...passData, new: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="text-slate-400 text-xs uppercase font-bold mb-2 block">Confirm New Password</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    value={passData.confirm}
                    onChange={e => setPassData({...passData, confirm: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition" 
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}