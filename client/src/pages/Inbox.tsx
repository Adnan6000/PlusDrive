import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom'; // To handle redirects
import { FaPaperPlane, FaUserCircle, FaSearch, FaCommentDots } from 'react-icons/fa';

export default function Inbox() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // SEARCH STATE (For Instructors)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams(); // To catch ?chatWith=ID

  // 1. Initial Load & Redirect Handling
  useEffect(() => {
    fetchContacts();
    
    // Check if we were redirected here to chat with someone specific
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId) {
       startChatWithUser(chatWithId);
    }
  }, []);

  // 2. Poll Messages
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const interval = setInterval(() => fetchMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  // 3. Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Instructor Search Logic
  useEffect(() => {
    const search = async () => {
       if (searchQuery.length > 2 && isInstructor) {
          try {
             const res = await axios.get(`http://localhost:5000/auth/search-students?query=${searchQuery}`);
             setSearchResults(res.data);
          } catch (e) { console.error(e); }
       } else {
          setSearchResults([]);
       }
    };
    const delay = setTimeout(search, 500); // Debounce
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/message/contacts/${user.id}`);
      setContacts(res.data);
    } catch (e) { console.error("Error fetching contacts"); }
  };

  const startChatWithUser = async (userId: string) => {
     try {
        const res = await axios.get(`http://localhost:5000/auth/user/${userId}`);
        const targetUser = res.data;
        
        // Check if already in contacts, if not add temporarily
        const exists = contacts.find(c => c.id === targetUser.id);
        if (!exists) {
           setContacts(prev => [targetUser, ...prev]);
        }
        
        setActiveChat(targetUser);
        setSearchQuery(''); // Clear search if instructor used it
        setSearchResults([]);
     } catch (e) { console.error("User not found"); }
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/message/history/${user.id}/${otherId}`);
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const tempMsg = { 
        id: Date.now(), 
        senderId: user.id, 
        content: newMessage, 
        createdAt: new Date().toISOString() 
      };
      setMessages([...messages, tempMsg]);
      setNewMessage('');

      await axios.post('http://localhost:5000/message/send', {
        senderId: user.id,
        receiverId: activeChat.id,
        content: tempMsg.content
      });
      
      fetchContacts(); // Refresh contact list to show latest
    } catch (e) { alert("Failed to send"); }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      
      {/* LEFT: SIDEBAR */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        
        {/* Header / Search Area */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-700 mb-2">Inbox</h2>
          
          {/* INSTRUCTOR ONLY SEARCH */}
          {isInstructor && (
            <div className="relative">
               <FaSearch className="absolute left-3 top-3 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Find a student..." 
                 className="w-full pl-10 pr-4 py-2 rounded-full border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
               
               {/* Search Results Dropdown */}
               {searchResults.length > 0 && (
                 <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-lg mt-2 z-50">
                   {searchResults.map(s => (
                     <div 
                       key={s.id} 
                       onClick={() => startChatWithUser(s.id)}
                       className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                     >
                       <p className="font-bold text-sm text-slate-700">{s.fullName}</p>
                       <p className="text-xs text-slate-400">{s.email}</p>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
        
        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveChat(contact)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white transition border-b border-slate-100
                ${activeChat?.id === contact.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''}
              `}
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {contact.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">{contact.fullName}</p>
                <p className="text-xs text-slate-500 truncate w-32">{contact.email}</p>
              </div>
            </div>
          ))}
          {contacts.length === 0 && !searchQuery && (
            <div className="p-8 text-center text-slate-400 text-sm">
              <FaCommentDots className="text-4xl mx-auto mb-2 opacity-30" />
              {isInstructor ? "Search for a student to chat." : "Your conversations will appear here."}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CHAT WINDOW */}
      <div className="w-2/3 flex flex-col bg-slate-50">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                {activeChat.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-700">{activeChat.fullName}</p>
                <p className="text-xs text-slate-500 uppercase">{activeChat.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg: any) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm
                      ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}
                    `}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 p-3 rounded-full border border-slate-300 focus:outline-none focus:border-blue-500 bg-slate-50"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button 
                title='submit'
                type="submit" 
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FaUserCircle className="text-6xl mb-4 text-slate-200" />
            <p className="font-medium">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}