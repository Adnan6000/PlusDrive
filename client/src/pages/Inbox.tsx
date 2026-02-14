import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { 
  FaPaperPlane, FaSearch, FaCommentDots, 
  FaCheck, FaCheckDouble, FaExclamationCircle, FaArrowLeft,
  FaPlus, FaImage, FaMapMarkerAlt, FaFileAlt, FaChalkboardTeacher, FaUserGraduate, 
  FaEllipsisV, FaTrash, FaTimes, FaCheckSquare
} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Inbox() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI STATES
  const [showAttachments, setShowAttachments] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // MENU & SELECTION STATES
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';
  const [searchParams] = useSearchParams(); 

  const prevMsgCount = useRef(0);

  useLayoutEffect(() => {
    if (messages.length > prevMsgCount.current && !isSelectionMode) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages, isSelectionMode]);

  useEffect(() => {
    fetchContacts();
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId) startChatWithUser(chatWithId);
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const interval = setInterval(() => fetchMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    const search = async () => {
       if (searchQuery.length > 2 && isInstructor) {
          try {
             const res = await api.get(`/auth/search-students?query=${searchQuery}`);
             setSearchResults(res.data);
          } catch (e) { console.error(e); }
       } else { setSearchResults([]); }
    };
    const delay = setTimeout(search, 500); 
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const getRoleBadge = (role: string) => {
    const isTeacher = role === 'ADMIN' || role === 'INSTRUCTOR';
    return isTeacher ? (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
        <FaChalkboardTeacher /> Instructor
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
        <FaUserGraduate /> Student
      </span>
    );
  };

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchContacts = async () => {
    try { const res = await api.get(`/messages/inbox/${user.id}`); setContacts(res.data); } catch (e) {}
  };

  const startChatWithUser = async (userId: string) => {
    try {
        const res = await api.get(`/auth/user/${userId}`);
        const targetUser = res.data;
        const exists = contacts.find(c => c.id === targetUser.id);
        if (!exists) {
            const newContact = { id: targetUser.id, name: targetUser.fullName, role: targetUser.role, email: targetUser.email };
            setContacts(prev => [newContact, ...prev]);
            setActiveChat(newContact);
        } else { setActiveChat(exists); }
        setSearchQuery(''); setSearchResults([]);
      } catch (e) {}
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await api.get(`/messages/conversation/${user.id}/${otherId}`);
      const visibleMessages = res.data.filter((m: any) => {
          if (m.senderId === user.id && m.deletedBySender) return false;
          if (m.receiverId === user.id && m.deletedByReceiver) return false;
          return true;
      });
      setMessages(visibleMessages);
    } catch (e) {}
  };

  const handleClearChat = async () => {
      if (!window.confirm("Are you sure? This will clear the chat history for YOU only.")) return;
      try {
          await api.post('/messages/clear', { userId: user.id, otherId: activeChat.id });
          setMessages([]);
          setShowChatMenu(false);
      } catch (e) { alert("Failed to clear chat"); }
  };

  const handleDeleteSelected = async () => {
      if (!window.confirm(`Delete ${selectedMsgIds.length} messages for yourself?`)) return;
      setMessages(prev => prev.filter(m => !selectedMsgIds.includes(m.id)));
      setIsSelectionMode(false);
      setSelectedMsgIds([]);
      for (const msgId of selectedMsgIds) {
          await api.post('/messages/delete', { messageId: msgId, userId: user.id, type: 'ME' });
      }
  };

  const toggleSelection = (msgId: string) => {
      if (selectedMsgIds.includes(msgId)) {
          setSelectedMsgIds(prev => prev.filter(id => id !== msgId));
      } else {
          setSelectedMsgIds(prev => [...prev, msgId]);
      }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    setShowAttachments(false);
    const tempId = Date.now();
    const tempMsg = { id: tempId, senderId: user.id, content: newMessage, createdAt: new Date().toISOString(), isRead: false, status: 'sending' };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    try {
      const res = await api.post('/messages/send', { senderId: user.id, receiverId: activeChat.id, content: tempMsg.content, isChat: true });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, status: 'sent' } : m));
      fetchContacts(); 
    } catch (e) { setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)); }
  };

  const handleFileSelect = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;
    setShowAttachments(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', user.id);
    formData.append('receiverId', activeChat.id);
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    formData.append('type', type);
    const tempId = Date.now();
    const tempMsg = { id: tempId, senderId: user.id, content: `Sending ${type.toLowerCase()}...`, attachmentType: type, attachmentUrl: URL.createObjectURL(file), createdAt: new Date().toISOString(), isRead: false, status: 'sending' };
    setMessages(prev => [...prev, tempMsg]);
    try {
        const res = await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, status: 'sent' } : m));
    } catch (err) { alert("File upload failed"); setMessages(prev => prev.filter(m => m.id !== tempId)); }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `http://googleusercontent.com/maps.google.com/?q=${latitude},${longitude}`;
        const tempId = Date.now();
        setMessages(prev => [...prev, { id: tempId, senderId: user.id, content: mapUrl, createdAt: new Date().toISOString(), status: 'sending' }]);
        await api.post('/messages/send', { senderId: user.id, receiverId: activeChat.id, content: mapUrl, isChat: true });
        fetchMessages(activeChat.id);
    });
    setShowAttachments(false);
  }

  const triggerFileUpload = () => { fileInputRef.current?.click(); }

  const getAssetUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="flex h-[80vh] md:h-[calc(100vh-140px)] bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-sans relative">
      {/* ADDED TITLE TO HIDDEN FILE INPUT */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        title="Upload attachment" 
        aria-label="Upload attachment"
      />

      {/* SIDEBAR */}
      <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-white/80 backdrop-blur-sm absolute inset-0 md:static z-20 transition-transform duration-300 ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
         <div className="p-5 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100 z-10">
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 drop-shadow-sm">Messages</h2>
          {isInstructor && (
            <div className="relative group">
               <FaSearch className="absolute left-3 top-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
               <input 
                type="text" 
                placeholder="Search students..." 
                title="Search students"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all shadow-inner" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
              />
               {searchResults.length > 0 && (
                 <div className="absolute top-full left-0 w-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl mt-2 z-50 overflow-hidden">
                   {searchResults.map(s => (
                     <div key={s.id} onClick={() => startChatWithUser(s.id)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors">
                       <p className="font-bold text-sm text-slate-700">{s.fullName}</p>
                       <div className="flex justify-between items-center mt-1">{getRoleBadge(s.role)}</div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} onClick={() => setActiveChat(contact)} className={`group relative p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all duration-300 ease-out border ${activeChat?.id === contact.id ? 'bg-white border-blue-200 shadow-lg md:scale-[1.02] md:translate-x-1' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:shadow-md hover:-translate-y-0.5'}`}>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0 ${activeChat?.id === contact.id ? 'bg-[radial-gradient(circle_at_30%_30%,_#60a5fa,_#2563eb)]' : 'bg-[radial-gradient(circle_at_30%_30%,_#94a3b8,_#475569)]'}`}>{contact.name?.charAt(0) || contact.fullName?.charAt(0) || '?'}</div>
              <div className="overflow-hidden flex-1">
                <div className="flex justify-between items-start"><p className={`font-bold text-sm truncate ${activeChat?.id === contact.id ? 'text-blue-800' : 'text-slate-700'}`}>{contact.name || contact.fullName}</p></div>
                <div className="flex items-center justify-between mt-1">{getRoleBadge(contact.role)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 absolute inset-0 md:static z-30 transition-transform duration-300 bg-white ${activeChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {activeChat ? (
          <>
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                  <button onClick={() => setActiveChat(null)} title="Back to inbox" className="md:hidden p-2 -ml-2 text-slate-600 hover:text-blue-600 transition"><FaArrowLeft /></button>
                  <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,_#4ade80,_#16a34a)] flex items-center justify-center text-white font-bold shadow-md shrink-0">{activeChat.name?.charAt(0) || activeChat.fullName?.charAt(0) || '?'}</div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg leading-tight truncate">{activeChat.name || activeChat.fullName}</p>
                    <div className="mt-1">{getRoleBadge(activeChat.role)}</div>
                  </div>
              </div>
              <div className="relative">
                 {isSelectionMode ? (
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{selectedMsgIds.length} selected</span>
                        <button onClick={handleDeleteSelected} title="Delete selected" className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><FaTrash /></button>
                        <button onClick={() => { setIsSelectionMode(false); setSelectedMsgIds([]); }} title="Cancel selection" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><FaTimes /></button>
                     </div>
                 ) : (
                     <button onClick={() => setShowChatMenu(!showChatMenu)} title="Chat menu" className="p-2 text-slate-500 hover:text-blue-600 transition rounded-full hover:bg-slate-100">
                        <FaEllipsisV />
                     </button>
                 )}
                 {showChatMenu && (
                    <div className="absolute right-0 top-12 bg-white shadow-2xl rounded-xl border border-slate-100 w-48 overflow-hidden z-50">
                        <button onClick={() => { setIsSelectionMode(true); setShowChatMenu(false); }} className="w-full text-left p-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FaCheckSquare className="text-slate-400" /> Select Messages
                        </button>
                        <button onClick={handleClearChat} className="w-full text-left p-3 hover:bg-red-50 text-sm font-semibold text-red-600 flex items-center gap-2 border-t border-slate-50">
                            <FaTrash /> Clear Chat
                        </button>
                    </div>
                 )}
              </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.id;
                const showDateSeparator = index === 0 || getDayLabel(msg.createdAt) !== getDayLabel(messages[index - 1].createdAt);
                const isDeleted = msg.isDeletedEveryone;
                const isSelected = selectedMsgIds.includes(msg.id);

                return (
                  <div key={msg.id} className="relative">
                    {showDateSeparator && (
                      <div className="flex justify-center my-6"><span className="bg-slate-200/80 backdrop-blur text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-white">{getDayLabel(msg.createdAt)}</span></div>
                    )}
                    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                      {isSelectionMode && (
                          <div 
                            onClick={() => toggleSelection(msg.id)} 
                            title="Select message"
                            className={`h-5 w-5 rounded border cursor-pointer flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white'}`}
                          >
                              {isSelected && <FaCheck size={10} />}
                          </div>
                      )}
                      <div className={`relative max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm shadow-md ${isDeleted ? 'bg-slate-100 border border-slate-200 text-slate-400 italic' : isMe ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-blue-200' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-slate-200'}`}>
                        {!isDeleted && msg.attachmentType === 'IMAGE' && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                <img src={getAssetUrl(msg.attachmentUrl)} alt="attachment" className="w-full h-auto max-h-60 object-cover" />
                            </div>
                        )}
                        {!isDeleted && msg.attachmentType === 'DOCUMENT' && (
                            <div className="flex items-center gap-3 bg-black/10 p-3 rounded-lg mb-2">
                                <FaFileAlt className="text-2xl" />
                                <a href={getAssetUrl(msg.attachmentUrl)} target="_blank" rel="noreferrer" className="underline font-bold text-xs truncate max-w-[150px]">Download File</a>
                            </div>
                        )}
                        <p className="relative z-10 leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content?.includes('google.com/maps') ? (
                                <a href={msg.content} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline font-bold"><FaMapMarkerAlt /> View Location</a>
                            ) : msg.content}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] relative z-10 ${isMe && !isDeleted ? 'text-blue-100' : 'text-slate-400'}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {isMe && !isDeleted && (
                            <span className="ml-1 opacity-90">
                              {msg.status === 'failed' ? <FaExclamationCircle className="text-red-300" /> : msg.status === 'sending' ? <span className="animate-pulse">...</span> : msg.isRead ? <FaCheckDouble /> : <FaCheck />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {!isSelectionMode && (
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 relative">
                  {showAttachments && (
                      <div className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 flex flex-col gap-2 z-50 w-48">
                          <button onClick={triggerFileUpload} title="Send image" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 transition text-sm font-bold text-left"><div className="bg-blue-100 p-2 rounded-full text-blue-600"><FaImage /></div> Photo</button>
                          <button onClick={handleLocation} title="Send location" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-green-600 transition text-sm font-bold text-left"><div className="bg-green-100 p-2 rounded-full text-green-600"><FaMapMarkerAlt /></div> Location</button>
                          <button onClick={triggerFileUpload} title="Send document" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-red-600 transition text-sm font-bold text-left"><div className="bg-red-100 p-2 rounded-full text-red-600"><FaFileAlt /></div> Document</button>
                      </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                    <button type="button" onClick={() => setShowAttachments(!showAttachments)} title="Attachments" className={`p-4 rounded-full transition-all duration-300 shadow-sm border border-slate-200 ${showAttachments ? 'bg-slate-800 text-white rotate-45' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><FaPlus /></button>
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      title="Type message"
                      className="flex-1 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none shadow-inner" 
                      value={newMessage} 
                      onChange={e => setNewMessage(e.target.value)} 
                    />
                    <button type="submit" title="Send message" className="bg-gradient-to-b from-blue-500 to-blue-700 text-white p-4 rounded-xl shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-[4px]"><FaPaperPlane className="text-lg" /></button>
                  </form>
                </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner flex items-center justify-center mb-6"><FaCommentDots className="text-6xl text-slate-300" /></div>
            <p className="font-bold text-xl text-slate-400">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}