import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Public Pages
import LandingPage from './pages/LandingPage'; // 👈 Make sure you create this file!
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

// Protected Pages (Dashboard & Inside App)
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations'; 
import MyBookingsPage from './pages/MyBookingsPage';
import Inbox from './pages/Inbox';
import Users from './pages/Users';
import Theory from './pages/Theory';
import Economy from './pages/Economy';
import Profile from './pages/Profile';

// Simple "Guard" to protect the dashboard
// (Fixed the JSX error by removing strict type annotation)
const ProtectedRoute = ({ children }: { children: any }) => {
  // Check if user is logged in (adjust key if you use 'token' or 'user')
  const isAuthenticated = localStorage.getItem('token') || localStorage.getItem('user'); 
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================================== */}
        {/* 1. PUBLIC ROUTES (Accessible by everyone)            */}
        {/* ==================================================== */}
        
        {/* ✅ The 3D Landing Page is now the Homepage */}
        <Route path="/" element={<LandingPage />} /> 
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} /> 
        
        {/* ==================================================== */}
        {/* 2. PROTECTED ROUTES (Only for logged-in users)       */}
        {/* ==================================================== */}
        {/* All these pages will have the Sidebar & Navbar */}
        
        <Route element={<Layout />}>
           {/* If someone goes to /dashboard, show Dashboard */}
           <Route 
             path="/dashboard" 
             element={
               <ProtectedRoute>
                 <Dashboard />
               </ProtectedRoute>
             } 
           />
           
           <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
           <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
           <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
           <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
           
           {/* Theory Pages */}
           <Route path="/theory-car" element={<ProtectedRoute><Theory type="Car" /></ProtectedRoute>} />
           <Route path="/theory-mc" element={<ProtectedRoute><Theory type="Motorcycle" /></ProtectedRoute>} />
           
           <Route path="/economy" element={<ProtectedRoute><Economy /></ProtectedRoute>} />
           <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>

        {/* Fallback: If route doesn't exist, go to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}