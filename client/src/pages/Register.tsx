import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">Create Account</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            {/* FIX: Added htmlFor */}
            <label htmlFor="fullName" className="block text-sm font-bold text-slate-600 mb-1">Full Name</label>
            {/* FIX: Added id */}
            <input 
              id="fullName"
              name="fullName"
              type="text" 
              required
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            {/* FIX: Added htmlFor */}
            <label htmlFor="reg-email" className="block text-sm font-bold text-slate-600 mb-1">Email</label>
            {/* FIX: Added id */}
            <input 
              id="reg-email"
              name="email"
              type="email" 
              required
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            {/* FIX: Added htmlFor */}
            <label htmlFor="phone" className="block text-sm font-bold text-slate-600 mb-1">Phone</label>
            {/* FIX: Added id */}
            <input 
              id="phone"
              name="phone"
              type="text" 
              required
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            {/* FIX: Added htmlFor */}
            <label htmlFor="reg-password" className="block text-sm font-bold text-slate-600 mb-1">Password</label>
            {/* FIX: Added id */}
            <input 
              id="reg-password"
              name="password"
              type="password" 
              required
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
}