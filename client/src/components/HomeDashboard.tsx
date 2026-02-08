import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaCalendarCheck } from 'react-icons/fa';

export default function HomeDashboard() {
  const [data, setData] = useState<any>({ lessonsToday: [], latestMessages: [] });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/dashboard/summary/${user.id}`);
        setData(res.data);
      } catch (error) { console.error("Dashboard error", error); }
    };
    if (user.id) fetchData();
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-light text-slate-600">{t('home')}</h2>
        <div className="bg-blue-100 text-blue-600 text-sm font-bold py-2 px-4 rounded">
          {t('welcome')}, {user.fullName}
        </div>
      </div>

      {/* Requirement 1: Simple Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LESSONS TODAY */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-light text-slate-700">{t('lessonsToday')}</h3>
            <FaCalendarCheck className="text-slate-300"/>
          </div>
          <div className="p-0">
            {data.lessonsToday.length > 0 ? (
              data.lessonsToday.map((lesson: any) => (
                <div key={lesson.id} className="p-4 border-b border-slate-50 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-700">
                      {user.role === 'ADMIN' ? lesson.student.fullName : lesson.admin.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lesson.startTime} - {lesson.endTime} • {lesson.type}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                    ${lesson.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {lesson.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-300 italic">No lessons scheduled for today</div>
            )}
          </div>
        </div>

        {/* LATEST MESSAGES */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-lg font-light text-slate-700">Latest messages</h3>
          </div>
          <div className="p-0">
            {data.latestMessages.length > 0 ? (
              data.latestMessages.map((msg: any) => (
                <div key={msg.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <div className="flex justify-between">
                    <p className="font-bold text-slate-700">{msg.sender?.fullName}</p>
                    <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">{msg.content}</p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-300 italic">No recent messages</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}