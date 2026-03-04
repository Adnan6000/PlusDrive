import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // ✅ Added for speed
import { encryptMessage, decryptMessage } from '../utils/crypto';
import {
  FaPaperPlane, FaSearch, FaCommentDots,
  FaCheck, FaCheckDouble, FaArrowLeft,
  FaPlus, FaImage, FaMapMarkerAlt, FaFileAlt, FaChalkboardTeacher, FaUserGraduate,
  FaEllipsisV, FaTrash, FaTimes, FaCheckSquare
} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Inbox() {
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState<any>(null);
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';
  const [searchParams] = useSearchParams();

  // ✅ 1. Optimized Contacts Fetching
  const { data: contacts = [] } = useQuery({
    queryKey: ['inbox-contacts', user.id],
    queryFn: async () => {
      const res = await api.get(`/messages/inbox/${user.id}`);
      return res.data;
    },
    refetchInterval: 10000, // Refresh sidebar every 10s
  });

  // ✅ 2. Optimized Message Fetching
  const { data: messages = [] } = useQuery({
    queryKey: ['conversation', user.id, activeChat?.id],
    queryFn: async () => {
      const res = await api.get(`/messages/conversation/${user.id}/${activeChat.id}`);
      return res.data.filter((m: any) => {
        if (m.senderId === user.id && m.deletedBySender) return false;
        if (m.receiverId === user.id && m.deletedByReceiver) return false;
        return true;
      });
    },
    enabled: !!activeChat?.id,
    refetchInterval: 3000, // Poll for new messages every 3s
  });

  // ✅ 3. Message Sending Mutation (Instant UI feedback)
  const sendMessageMutation = useMutation({
    mutationFn: (payload: any) => api.post('/messages/send', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', user.id, activeChat?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-contacts'] });
    }
  });

  useLayoutEffect(() => {
    if (!isSelectionMode) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isSelectionMode]);

  useEffect(() => {
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId) startChatWithUser(chatWithId);
  }, [searchParams]);

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
  }, [searchQuery, isInstructor]);

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

  const startChatWithUser = async (userId: string) => {
    try {
      const res = await api.get(`/auth/user/${userId}`);
      const targetUser = res.data;
      const exists = contacts.find((c: any) => c.id === targetUser.id);
      setActiveChat(exists || { id: targetUser.id, name: targetUser.fullName, role: targetUser.role, email: targetUser.email });
      setSearchQuery(''); setSearchResults([]);
    } catch (e) { }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure? This will clear the chat history for YOU only.")) return;
    try {
      await api.post('/messages/clear', { userId: user.id, otherId: activeChat.id });
      queryClient.setQueryData(['conversation', user.id, activeChat.id], []);
      setShowChatMenu(false);
    } catch (e) { alert("Failed to clear chat"); }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedMsgIds.length} messages for yourself?`)) return;
    setIsSelectionMode(false);
    const idsToDelete = [...selectedMsgIds];
    setSelectedMsgIds([]);
    
    try {
      for (const msgId of idsToDelete) {
        await api.post('/messages/delete', { messageId: msgId, userId: user.id, type: 'ME' });
      }
      queryClient.invalidateQueries({ queryKey: ['conversation', user.id, activeChat.id] });
    } catch (e) { alert("Error deleting messages"); }
  };

  const toggleSelection = (msgId: string) => {
    setSelectedMsgIds(prev => prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]);
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const content = newMessage;
    setNewMessage('');
    setShowAttachments(false);

    const encryptedContent = encryptMessage(content);
    sendMessageMutation.mutate({ senderId: user.id, receiverId: activeChat.id, content: encryptedContent, isChat: true });
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

    try {
      await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      queryClient.invalidateQueries({ queryKey: ['conversation', user.id, activeChat.id] });
    } catch (err) { alert("File upload failed"); }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`; // Standard URL
      sendMessageMutation.mutate({ senderId: user.id, receiverId: activeChat.id, content: encryptMessage(mapUrl), isChat: true });
    });
    setShowAttachments(false);
  };

  const triggerFileUpload = () => { fileInputRef.current?.click(); }

  const getAssetUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="flex h-[80vh] md:h-[calc(100vh-140px)] bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-sans relative">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" title="Upload attachment" />

      {/* SIDEBAR */}
      <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-white absolute inset-0 md:static z-20 transition-transform duration-300 ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-5 border-b border-slate-100 z-10">
          <h2 className="text-xl font-extrabold text-blue-600 mb-4">Messages</h2>
          {isInstructor && (
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Search students..." title="Search students" className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-100 focus:bg-white focus:outline-none transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-xl mt-2 z-50 overflow-hidden">
                  {searchResults.map(s => (
                    <div key={s.id} onClick={() => startChatWithUser(s.id)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                      <p className="font-bold text-sm text-slate-700">{s.fullName}</p>
                      <div className="mt-1">{getRoleBadge(s.role)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contacts.map((contact: any) => (
            <div key={contact.id} onClick={() => setActiveChat(contact)} className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all border ${activeChat?.id === contact.id ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold bg-slate-500 shrink-0">{contact.name?.charAt(0) || contact.fullName?.charAt(0) || '?'}</div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">{contact.name || contact.fullName}</p>
                <div className="mt-1">{getRoleBadge(contact.role)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`w-full md:w-2/3 flex flex-col absolute inset-0 md:static z-30 transition-transform duration-300 bg-white ${activeChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={() => setActiveChat(null)} title="Back to Contacts" className="md:hidden p-2 -ml-2 text-slate-600"><FaArrowLeft /></button>
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0">{activeChat.name?.charAt(0) || activeChat.fullName?.charAt(0) || '?'}</div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 truncate">{activeChat.name || activeChat.fullName}</p>
                  <div className="mt-0.5">{getRoleBadge(activeChat.role)}</div>
                </div>
              </div>
              <div className="relative shrink-0">
                {isSelectionMode ? (
                  <div className="flex items-center gap-2">
                    <button onClick={handleDeleteSelected} title="Delete selected" className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><FaTrash /></button>
                    <button onClick={() => { setIsSelectionMode(false); setSelectedMsgIds([]); }} title="Cancel selection" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><FaTimes /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowChatMenu(!showChatMenu)} title="Chat Menu" className="p-2 text-slate-500 rounded-full hover:bg-slate-100"><FaEllipsisV /></button>
                )}
                {showChatMenu && (
                  <div className="absolute right-0 top-12 bg-white shadow-2xl rounded-xl border border-slate-100 w-48 z-50">
                    <button onClick={() => { setIsSelectionMode(true); setShowChatMenu(false); }} className="w-full text-left p-3 hover:bg-slate-50 text-sm font-semibold flex items-center gap-2"><FaCheckSquare /> Select Messages</button>
                    <button onClick={handleClearChat} className="w-full text-left p-3 hover:bg-red-50 text-sm font-semibold text-red-600 flex items-center gap-2 border-t"><FaTrash /> Clear Chat</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg: any, index: number) => {
                const isMe = msg.senderId === user.id;
                const showDateSeparator = index === 0 || getDayLabel(msg.createdAt) !== getDayLabel(messages[index - 1].createdAt);
                const isSelected = selectedMsgIds.includes(msg.id);
                const decryptedContent = decryptMessage(msg.content);

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4"><span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{getDayLabel(msg.createdAt)}</span></div>
                    )}
                    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {isSelectionMode && (
                        <div onClick={() => toggleSelection(msg.id)} title="Toggle Selection" className={`h-5 w-5 rounded border cursor-pointer flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <FaCheck size={10} />}
                        </div>
                      )}
                      <div className={`max-w-[85%] md:max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border rounded-bl-none'}`}>
                        {msg.attachmentType === 'IMAGE' && <img src={getAssetUrl(msg.attachmentUrl)} alt="attachment" className="mb-2 rounded-lg max-h-60 w-full object-cover" />}
                        {msg.attachmentType === 'DOCUMENT' && <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg mb-1"><FaFileAlt /><a href={getAssetUrl(msg.attachmentUrl)} target="_blank" rel="noreferrer" className="underline font-bold text-xs truncate">Download</a></div>}
                        <p className="break-words whitespace-pre-wrap leading-relaxed">
                          {decryptedContent?.includes('google.com/maps') ? (
                            <a href={decryptedContent} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold flex items-center gap-1"><FaMapMarkerAlt /> View Location</a>
                          ) : decryptedContent}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                           <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           {isMe && <span className="opacity-90">{msg.isRead ? <FaCheckDouble /> : <FaCheck />}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <button type="button" onClick={() => setShowAttachments(!showAttachments)} title="Show Attachments" className={`p-3 rounded-full transition-all ${showAttachments ? 'bg-slate-800 text-white rotate-45' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><FaPlus /></button>
                {showAttachments && (
                  <div className="absolute bottom-20 left-4 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 flex flex-col gap-1 z-50 w-40">
                    <button type="button" onClick={triggerFileUpload} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded text-sm font-bold text-slate-600"><FaImage className="text-blue-500" /> Photo</button>
                    <button type="button" onClick={handleLocation} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded text-sm font-bold text-slate-600"><FaMapMarkerAlt className="text-green-500" /> Location</button>
                    <button type="button" onClick={triggerFileUpload} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded text-sm font-bold text-slate-600"><FaFileAlt className="text-red-500" /> Document</button>
                  </div>
                )}
                <input type="text" placeholder="Message..." title="Message Content" className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                <button type="submit" title="Send Message" className="bg-blue-600 text-white p-3 rounded-xl shadow-md hover:bg-blue-700 active:translate-y-0.5 transition-all"><FaPaperPlane /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <FaCommentDots size={60} className="mb-4 opacity-20" />
            <p className="font-bold">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}