import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { 
  FaPaperPlane, FaSearch, FaCommentDots, 
  FaCheck, FaCheckDouble, FaExclamationCircle, FaArrowLeft,
  FaPlus, FaImage, FaMapMarkerAlt, FaFileAlt, FaMicrophone, FaChalkboardTeacher, FaUserGraduate
} from 'react-icons/fa';

export default function Inbox() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI STATES
  const [showAttachments, setShowAttachments] = useState(false); // Toggle for + menu
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams(); 

  // --- LOGIC ---
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // HELPER: Get clear role label
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
    try {
      const res = await api.get(`/messages/inbox/${user.id}`);
      setContacts(res.data);
    } catch (e) { console.error("Error fetching contacts"); }
  };

  const startChatWithUser = async (userId: string) => {
     try {
       const res = await api.get(`/auth/user/${userId}`);
       const targetUser = res.data;
       const exists = contacts.find(c => c.id === targetUser.id);
       if (!exists) {
           const newContact = {
               id: targetUser.id,
               name: targetUser.fullName,
               role: targetUser.role,
               email: targetUser.email
           };
           setContacts(prev => [newContact, ...prev]);
           setActiveChat(newContact);
       } else {
           setActiveChat(exists);
       }
       setSearchQuery(''); 
       setSearchResults([]);
     } catch (e) { console.error("User not found"); }
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await api.get(`/messages/conversation/${user.id}/${otherId}`);
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    
    // Close attachment menu if open
    setShowAttachments(false);

    const tempId = Date.now();
    const tempMsg = { 
      id: tempId, senderId: user.id, content: newMessage, 
      createdAt: new Date().toISOString(), isRead: false, status: 'sending' 
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {
      const res = await api.post('/messages/send', {
        senderId: user.id, receiverId: activeChat.id, content: tempMsg.content, isChat: true
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, status: 'sent' } : m));
      fetchContacts(); 
    } catch (e) { 
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  // Mock handler for attachments
  const handleAttachment = (type: string) => {
      alert(`Upload ${type} feature requires Backend Storage (AWS S3). UI is ready!`);
      setShowAttachments(false);
  };

  return (
    // MAIN CONTAINER
    <div className="flex h-[80vh] md:h-[calc(100vh-140px)] bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-sans relative">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <div className={`
        w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-white/80 backdrop-blur-sm absolute inset-0 md:static z-20 transition-transform duration-300
        ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100 z-10">
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 drop-shadow-sm">
            Messages
          </h2>
          
          {isInstructor && (
            <div className="relative group">
               <FaSearch className="absolute left-3 top-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search students..." 
                 className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all shadow-inner" 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
               {searchResults.length > 0 && (
                 <div className="absolute top-full left-0 w-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl mt-2 z-50 overflow-hidden">
                   {searchResults.map(s => (
                     <div key={s.id} onClick={() => startChatWithUser(s.id)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors">
                       <p className="font-bold text-sm text-slate-700">{s.fullName}</p>
                       <div className="flex justify-between items-center mt-1">
                         {getRoleBadge(s.role)}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
        
        {/* CONTACT LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveChat(contact)}
              className={`
                group relative p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all duration-300 ease-out border
                ${activeChat?.id === contact.id 
                  ? 'bg-white border-blue-200 shadow-lg md:scale-[1.02] md:translate-x-1' 
                  : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:shadow-md hover:-translate-y-0.5'
                }
              `}
            >
              <div className={`
                h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0
                ${activeChat?.id === contact.id 
                   ? 'bg-[radial-gradient(circle_at_30%_30%,_#60a5fa,_#2563eb)] ring-2 ring-blue-100'
                   : 'bg-[radial-gradient(circle_at_30%_30%,_#94a3b8,_#475569)]'
                }
              `}>
                {contact.name?.charAt(0) || '?'}
              </div>

              <div className="overflow-hidden flex-1">
                <div className="flex justify-between items-start">
                    <p className={`font-bold text-sm truncate ${activeChat?.id === contact.id ? 'text-blue-800' : 'text-slate-700'}`}>
                    {contact.name || contact.fullName}
                    </p>
                    <span className="text-[10px] text-slate-400">
                        {new Date(contact.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                     {/* ✅ ROLE BADGE IN LIST */}
                    {getRoleBadge(contact.role)}
                </div>
              </div>

              {activeChat?.id === contact.id && (
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] hidden md:block"></div>
              )}
            </div>
          ))}
          
          {contacts.length === 0 && !searchQuery && (
            <div className="p-10 text-center opacity-40">
              <FaCommentDots className="text-5xl mx-auto mb-3 text-slate-300 drop-shadow-md" />
              <p className="text-sm text-slate-500 font-medium">No chats yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT CHAT WINDOW ================= */}
      <div className={`
        w-full md:w-2/3 flex flex-col bg-slate-50 absolute inset-0 md:static z-30 transition-transform duration-300 bg-white
        ${activeChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        
        {activeChat ? (
          <>
            {/* 3D HEADER */}
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center gap-4 shadow-sm z-10">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:text-blue-600 transition"
                aria-label="Back to inbox"
                title="Back to inbox"
              >
                <FaArrowLeft />
              </button>

              <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,_#4ade80,_#16a34a)] flex items-center justify-center text-white font-bold shadow-md shrink-0">
                {activeChat.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg leading-tight truncate">{activeChat.name || activeChat.fullName}</p>
                {/* ✅ ROLE BADGE IN HEADER */}
                <div className="mt-1">
                    {getRoleBadge(activeChat.role)}
                </div>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.id;
                const showDateSeparator = index === 0 || getDayLabel(msg.createdAt) !== getDayLabel(messages[index - 1].createdAt);

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-6">
                        <span className="bg-slate-200/80 backdrop-blur text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-white">
                          {getDayLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`
                        max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm relative shadow-md transition-transform
                        ${isMe 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-blue-200' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-slate-200'
                        }
                      `}>
                        <div className={`absolute top-0 left-0 w-full h-1/2 rounded-t-2xl opacity-10 bg-gradient-to-b from-white to-transparent pointer-events-none`}></div>

                        <p className="relative z-10 leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                        
                        <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] relative z-10 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {isMe && (
                            <span className="ml-1 opacity-90">
                              {msg.status === 'failed' ? <FaExclamationCircle className="text-red-300" /> 
                              : msg.status === 'sending' ? <span className="animate-pulse">...</span> 
                              : msg.isRead ? <FaCheckDouble /> : <FaCheck />}
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

            {/* 3D INPUT AREA WITH ATTACHMENTS */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 relative">
              
              {/* ATTACHMENT MENU POPUP */}
              {showAttachments && (
                  <div className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 flex flex-col gap-2 animate-in slide-in-from-bottom-5 duration-200 z-50 w-48">
                      <button onClick={() => handleAttachment('Image')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 transition text-sm font-bold text-left">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600"><FaImage /></div> Photo
                      </button>
                      <button onClick={() => handleAttachment('Location')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-green-600 transition text-sm font-bold text-left">
                          <div className="bg-green-100 p-2 rounded-full text-green-600"><FaMapMarkerAlt /></div> Location
                      </button>
                      <button onClick={() => handleAttachment('Document')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-red-600 transition text-sm font-bold text-left">
                          <div className="bg-red-100 p-2 rounded-full text-red-600"><FaFileAlt /></div> Document
                      </button>
                      <button onClick={() => handleAttachment('Audio')} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-purple-600 transition text-sm font-bold text-left">
                          <div className="bg-purple-100 p-2 rounded-full text-purple-600"><FaMicrophone /></div> Audio
                      </button>
                  </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                
                {/* ATTACHMENT TOGGLE BUTTON */}
                <button 
                  type="button"
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`
                    p-4 rounded-full transition-all duration-300 shadow-sm border border-slate-200
                    ${showAttachments ? 'bg-slate-800 text-white rotate-45' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                  `}
                  aria-label="Add attachment"
                  title="Add attachment"
                >
                  <FaPlus />
                </button>

                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="flex-1 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all shadow-inner"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                
                <button 
                  title='submit'
                  type="submit" 
                  className="
                    bg-gradient-to-b from-blue-500 to-blue-700 text-white p-4 rounded-xl 
                    hover:from-blue-400 hover:to-blue-600 transition-all 
                    shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-[4px]
                  "
                >
                  <FaPaperPlane className="text-lg drop-shadow-md" />
                </button>
              </form>
            </div>
          </>
        ) : (
          // EMPTY STATE
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 select-none bg-slate-50">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner flex items-center justify-center mb-6">
                <FaCommentDots className="text-6xl text-slate-300 drop-shadow-sm" />
            </div>
            <p className="font-bold text-xl text-slate-400">Select a conversation</p>
            <p className="text-sm text-slate-400 opacity-70">to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}