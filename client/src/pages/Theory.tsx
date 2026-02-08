import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaVideo, FaTrash, FaPlus, FaBookOpen } from 'react-icons/fa';

export default function Theory({ type }: { type: string }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';

  useEffect(() => {
    fetchLessons();
  }, [type]);

  const fetchLessons = async () => {
    try {
      const res = await api.get(`/lesson/${type}`);
      setLessons(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/lesson', { ...formData, category: type });
      setShowForm(false);
      setFormData({ title: '', content: '', videoUrl: '' });
      fetchLessons();
    } catch (e) { alert("Failed to add lesson"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this lesson?")) return;
    try {
      await api.delete(`/lesson/${id}`);
      fetchLessons();
    } catch (e) { alert("Failed to delete"); }
  };

  // Helper to convert YouTube URL to Embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.split('v=')[1] || url.split('/').pop();
    const cleanId = videoId?.split('&')[0]; // Remove playlist params
    return `https://www.youtube.com/embed/${cleanId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div>
           <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
             <FaBookOpen className="text-blue-600"/> Theory: {type} License
           </h2>
           <p className="text-slate-500">Study materials and videos.</p>
        </div>
        
        {isInstructor && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <FaPlus /> {showForm ? 'Close' : 'Add Lesson'}
          </button>
        )}
      </div>

      {/* INSTRUCTOR: ADD LESSON FORM */}
      {showForm && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" placeholder="Lesson Title" required
              className="w-full p-3 rounded border"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <textarea 
              placeholder="Lesson Content / Description" required
              className="w-full p-3 rounded border h-24"
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
            />
            <input 
              type="text" placeholder="YouTube Video URL (Optional)"
              className="w-full p-3 rounded border"
              value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})}
            />
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
              Publish Lesson
            </button>
          </form>
        </div>
      )}

      {/* LESSON LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.length > 0 ? lessons.map(lesson => (
          <div key={lesson.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Video Embed */}
            {lesson.videoUrl && (
              <div className="aspect-video bg-black">
                <iframe 
                  width="100%" height="100%" 
                  src={getEmbedUrl(lesson.videoUrl) || ''} 
                  title={lesson.title} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <FaVideo className="text-red-500"/> {lesson.title}
                </h3>
                {isInstructor && (
                  <button title="Delete Lesson" onClick={() => handleDelete(lesson.id)} className="text-slate-400 hover:text-red-500">
                    <FaTrash />
                  </button>
                )}
              </div>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </p>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12 text-slate-400 italic">
            No lessons added yet for {type}.
          </div>
        )}
      </div>
    </div>
  );
}