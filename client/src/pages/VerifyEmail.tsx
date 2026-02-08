import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    verifyAccount();
  }, [token]);

  const verifyAccount = async () => {
    try {
      // Make sure this endpoint matches your backend AuthController
      await axios.post('http://localhost:5000/auth/verify-email', { token });
      setStatus('success');
      setMessage('Account verified successfully! Redirecting to login...');
      
      // Redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Verifying Account...</h2>
            <p className="text-slate-500 mt-2">Please wait while we verify your email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-4xl text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Verified!</h2>
            <p className="text-slate-500 mt-2">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <FaTimesCircle className="text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Verification Failed</h2>
            <p className="text-slate-500 mt-2">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 bg-slate-200 text-slate-700 px-6 py-2 rounded-full font-bold hover:bg-slate-300"
            >
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}