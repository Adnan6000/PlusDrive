import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus } from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ FIX: Using standard React.ChangeEvent to resolve Namespace error
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const registerMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/auth/register', data),
    onSuccess: () => {
      alert('Registration successful! A verification link has been sent to your Gmail.');
      navigate('/login');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e0e0] p-4 font-sans">
      <div className="bg-[#e0e0e0] p-10 rounded-[40px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] w-full max-w-md transition-all duration-500 hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Join DriveBook Today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl mb-6 text-xs font-bold text-center border border-red-100 animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5 text-left">
          <div className="group">
            <label htmlFor="fullName" className="block text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">Full Name</label>
            <div className="relative flex items-center">
              <FaUser className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Full Name"
                className="w-full bg-[#e0e0e0] pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="reg-email" className="block text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">Email Address</label>
            <div className="relative flex items-center">
              <FaEnvelope className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="w-full bg-[#e0e0e0] pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="phone" className="block text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">Phone</label>
            <div className="relative flex items-center">
              <FaPhone className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="phone"
                name="phone"
                type="text"
                required
                placeholder="Phone Number"
                className="w-full bg-[#e0e0e0] pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="reg-password" className="block text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">Password</label>
            <div className="relative flex items-center">
              <FaLock className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-[#e0e0e0] pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Joining...' : <><FaUserPlus /> Register</>}
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline ml-1">Login</Link>
        </p>
      </div>
    </div>
  );
}