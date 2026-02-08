import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden relative font-sans">
      {/* Background Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 p-6 backdrop-blur-md border-b border-white/5 bg-slate-900/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/50 flex items-center justify-center font-bold text-lg">P</div>
            <span className="text-xl font-black tracking-tighter uppercase">Plus<span className="text-blue-500">Drive</span></span>
          </div>
          <div className="flex gap-4 items-center">
             {/* Small Login Button */}
            <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-blue-400 transition">
              {role === 'instructor' ? 'Instructor Login' : 'Student Login'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 inline-block">
            Authorized Driving Education
          </span>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
            The Smart Way to Your <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Danish License.</span>
          </h1>

          {/* ROLE DROPDOWN / TOGGLE */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-slate-400 text-sm">I am a:</span>
            <div className="relative">
              <select 
                aria-label="Select User Role" // This fixes the error instantly
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'instructor')}
                className="appearance-none bg-slate-800 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-white font-bold outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-750 transition"
             >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
              {/* Custom Arrow Icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-20">
            <button 
              onClick={() => navigate(role === 'instructor' ? '/login' : '/register')} 
              className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 ${
                role === 'instructor' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {role === 'instructor' ? 'Access Instructor Panel' : 'Book Your First Lesson'}
            </button>
          </div>
        </motion.div>

        {/* Dynamic Preview Card based on Role */}
        <motion.div 
          key={role} // Re-animates when role changes
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-16 w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {role === 'student' ? (
             // STUDENT PREVIEW
             <div className="bg-slate-900 p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">🚗</div>
                <div className="text-left">
                   <h3 className="text-xl font-bold text-white">Student Portal</h3>
                   <p className="text-slate-400 text-sm">Track your progress, book night driving, and pay securely.</p>
                </div>
             </div>
          ) : (
             // INSTRUCTOR PREVIEW
             <div className="bg-slate-900 p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl">📅</div>
                <div className="text-left">
                   <h3 className="text-xl font-bold text-white">Instructor Panel</h3>
                   <p className="text-slate-400 text-sm">Manage availability, view student logs, and approve requests.</p>
                </div>
             </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}