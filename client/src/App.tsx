import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations'; 
import MyBookingsPage from './pages/MyBookingsPage';

// IMPORT THE NEW PAGES
import Inbox from './pages/Inbox';
import Users from './pages/Users';
import Theory from './pages/Theory';
import Economy from './pages/Economy';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} /> 
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          
          {/* NEW ROUTES ADDED HERE */}
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/users" element={<Users />} />
          <Route path="/theory-car" element={<Theory type="Car" />} />
          <Route path="/theory-mc" element={<Theory type="Motorcycle" />} />
          <Route path="/economy" element={<Economy />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}