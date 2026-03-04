import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Public Pages
import LandingPage from './pages/LandingPage'; 
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
import StudentBooking from './pages/StudentBooking';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh in cache for 5 minutes
      refetchOnWindowFocus: true, // Auto-refresh when user clicks back into the tab
    },
  },
});


// Simple "Guard" to protect the dashboard
const ProtectedRoute = ({ children }: { children: any }) => {
  const isAuthenticated = localStorage.getItem('token') || localStorage.getItem('user'); 
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ==================================================== */}
          {/* 1. PUBLIC ROUTES                                     */}
          {/* ==================================================== */}
          
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} /> 
          
          {/* ==================================================== */}
          {/* 2. PROTECTED ROUTES                                  */}
          {/* ==================================================== */}
          
          <Route element={<Layout />}>
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
            <Route path="/book" element={<ProtectedRoute><StudentBooking /></ProtectedRoute>} />
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
    </QueryClientProvider>
  );
}