import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query'; // ✅ For speed and status
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false); // ✅ Toggle for Forgot Password
  const navigate = useNavigate();

  // ✅ Mutation for Login
  const loginMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/login', data),
    onSuccess: (res) => {
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const target = (res.data.user.role === 'INSTRUCTOR' || res.data.user.role === 'ADMIN') 
        ? '/dashboard' : '/my-bookings';
      navigate(target);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Login failed')
  });

  // ✅ Mutation for Forgot Password
  const resetMutation = useMutation({
    mutationFn: (data: { email: string }) => api.post('/auth/forgot-password', data),
    onSuccess: () => {
      alert('Reset link sent to your email!');
      setResetMode(false);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to send reset email')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetMode) {
      resetMutation.mutate({ email });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e0e0] p-4 font-sans">
      <div className="bg-[#e0e0e0] p-10 rounded-[40px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] w-full max-w-md transition-all duration-500">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {resetMode ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {resetMode ? 'Enter email to receive a link' : 'Please enter your details'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl mb-6 text-xs font-bold text-center border border-red-100 animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="group">
            <label htmlFor="email" className="block text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">Email Address</label>
            <div className="relative flex items-center">
              <FaEnvelope className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                className="w-full bg-[#e0e0e0] pl-12 pr-4 py-4 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {!resetMode && (
            <div className="group">
              <div className="flex justify-between items-center mb-2 px-1">
                <label htmlFor="password" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={() => setResetMode(true)}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative flex items-center">
                <FaLock className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#e0e0e0] pl-12 pr-4 py-4 rounded-2xl border-none shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-700 transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loginMutation.isPending || resetMutation.isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {resetMode ? (resetMutation.isPending ? 'Sending...' : 'Send Reset Link') : (loginMutation.isPending ? 'Verifying...' : 'Sign In')}
            <FaArrowRight />
          </button>

          {resetMode && (
            <button 
              type="button" 
              onClick={() => setResetMode(false)}
              className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Back to Login
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline ml-1">Register</Link>
        </p>
      </div>
    </div>
  );
}