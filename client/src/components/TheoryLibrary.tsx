import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlayCircle, FaFilePdf, FaCheckCircle, FaLock, FaTrash, FaPlus, FaCloudUploadAlt, FaCar, FaMotorcycle } from 'react-icons/fa';

interface TheoryProps {
  category: 'CAR' | 'MC';
  type: 'TESTS' | 'LESSONS';
}

export default function TheoryLibrary({ category, type }: TheoryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newItem, setNewItem] = useState<{title: string, url: string, isFree: boolean, file: File | null}>({ 
    title: '', url: '', isFree: false, file: null 
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hasAccess = user.role === 'ADMIN' || user.hasTheoryAccess;

  useEffect(() => {
    fetchContent();
  }, [category, type]); 

  const fetchContent = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/theory/${category}`);
      const filtered = res.data.filter((i: any) => 
        type === 'TESTS' ? i.type === 'TEST' : (i.type === 'VIDEO' || i.type === 'PDF')
      );
      setItems(filtered);
    } catch (error) { console.error("Error fetching theory:", error); }
  };

  const handleAdd = async () => {
    const finalUrl = newItem.file ? URL.createObjectURL(newItem.file) : newItem.url;

    await axios.post('http://localhost:5000/theory/add', {
      title: newItem.title,
      url: finalUrl,
      isFree: newItem.isFree,
      category, 
      type: type === 'TESTS' ? 'TEST' : (newItem.file?.type.includes('pdf') ? 'PDF' : 'VIDEO') 
    });
    
    setShowAddModal(false);
    setNewItem({ title: '', url: '', isFree: false, file: null });
    fetchContent();
  };

  const handleDelete = async (id: string) => {
    if(confirm("Delete this item?")) {
      await axios.delete(`http://localhost:5000/theory/${id}`);
      fetchContent();
    }
  };

  const getIcon = (itemType: string, locked: boolean) => {
    if (locked) return <FaLock />;
    if (itemType === 'VIDEO') return <FaPlayCircle />;
    if (itemType === 'PDF') return <FaFilePdf />;
    return <FaCheckCircle />;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light text-slate-700 flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-xs font-bold text-white flex items-center gap-2 ${category === 'CAR' ? 'bg-blue-600' : 'bg-orange-500'}`}>
              {category === 'CAR' ? <FaCar /> : <FaMotorcycle />} {category}
            </span>
            {type === 'TESTS' ? 'Theory Tests' : 'Lessons'}
          </h2>
          {!hasAccess && (
            <p className="text-red-500 text-xs font-bold mt-1 uppercase flex items-center gap-1">
              <FaLock /> Full Access Locked (Payment Required)
            </p>
          )}
        </div>
        
        {user.role === 'ADMIN' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-green-700 flex items-center gap-2 transition"
          >
            <FaPlus /> Add {type === 'TESTS' ? 'Test' : 'Lesson'}
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {items.length > 0 ? items.map((item: any) => {
          const isLocked = !hasAccess && !item.isFree;
          return (
            <div key={item.id} className={`p-6 flex justify-between items-center hover:bg-slate-50 transition ${isLocked ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                  {getIcon(item.type, isLocked)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-lg">{item.title}</h4>
                  <p className="text-xs text-slate-500 uppercase flex items-center gap-2">
                    {item.isFree ? <span className="text-green-600 font-bold">Free Preview</span> : 'Premium Content'}
                    {item.type !== 'TEST' && <span className="bg-slate-100 px-1 rounded text-[10px] border border-slate-200">{item.type}</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isLocked ? (
                  <button disabled className="px-4 py-2 bg-slate-300 text-white text-xs font-bold rounded uppercase cursor-not-allowed">Locked</button>
                ) : (
                  <button onClick={() => window.open(item.url, '_blank')} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded uppercase hover:bg-blue-700 transition shadow-sm">
                    {type === 'TESTS' ? 'Start Test' : 'View'}
                  </button>
                )}
                {user.role === 'ADMIN' && (
                  <button onClick={() => handleDelete(item.id)} aria-label="Delete Content" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center text-slate-400 italic">No content added yet.</div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 animate-fadeIn">
            <h3 className="font-bold text-xl text-slate-700 mb-6 border-b pb-2">Add New Content</h3>
            
            <div className="mb-4">
              <label htmlFor="contentTitle" className="block text-xs font-bold text-slate-500 mb-1 uppercase">Title</label>
              <input id="contentTitle" className="w-full border border-slate-300 p-2 rounded focus:border-blue-500 outline-none" placeholder="Ex: Highway Rules 101" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
            </div>

            <div className="mb-4">
               <label htmlFor="fileUpload" className="block text-xs font-bold text-slate-500 mb-1 uppercase">Upload File</label>
               <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                  <input id="fileUpload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.mp4,.mov,.png,.jpg"
                    onChange={(e) => { if (e.target.files && e.target.files[0]) setNewItem({...newItem, file: e.target.files[0], url: ''}); }}
                  />
                  <div className="flex flex-col items-center gap-1">
                      <FaCloudUploadAlt className="text-2xl text-slate-400"/>
                      <span className="text-sm font-medium text-slate-600">{newItem.file ? newItem.file.name : "Click to browse files"}</span>
                  </div>
               </div>
            </div>

            <div className="mb-4">
              <label htmlFor="contentUrl" className="block text-xs font-bold text-slate-500 mb-1 uppercase">OR External URL</label>
              <input id="contentUrl" className="w-full border border-slate-300 p-2 rounded focus:border-blue-500 outline-none" placeholder="https://youtube.com/..." value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} disabled={!!newItem.file} />
            </div>

            <div className="mb-6">
              <label htmlFor="isFreeCheck" className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
                <input id="isFreeCheck" type="checkbox" checked={newItem.isFree} onChange={e => setNewItem({...newItem, isFree: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"/>
                <span className="text-sm font-medium text-slate-700">Set as Free Preview?</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg font-bold text-slate-600 transition">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition shadow-md">Upload Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}