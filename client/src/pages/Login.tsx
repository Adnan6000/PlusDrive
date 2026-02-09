import { useState } from 'react';
import api from '../api/axios'; // ✅ FIX: Points back to src/api/axios.ts
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/auth/login', {
        email,
        password
      });

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.role === 'INSTRUCTOR' || res.data.user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/my-bookings');
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">Login</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-600 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              className="w-full border p-2 rounded"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-600 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              className="w-full border p-2 rounded"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-blue-600 font-bold">Register</Link>
        </p>
      </div>
    </div>
  );
}