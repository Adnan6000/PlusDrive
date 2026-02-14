import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // 👈 Added this
import api from '../api/axios';
import { FaPaperPlane, FaSearch, FaUserCircle, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function Inbox() {
  const [inboxList, setInboxList] = useState<any[]>([]); 
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation(); // 👈 To catch the data sent from Booking Page

  useEffect(() => {
    fetchInbox();
  }, []);

  // Poll for new messages every 3 seconds if a chat is open
  useEffect(() => {
    if (selectedContact) {
        fetchConversation();
        const interval = setInterval(fetchConversation, 3000); 
        return () => clearInterval(interval);
    }
  }, [selectedContact]);

  const fetchInbox = async () => {
    try {
      const res = await api.get(`/messages/inbox/${user.id}`);
      let contacts = res.data;
      
      // ✅ LOGIC: Check if we came from "My Bookings" page with a specific person to chat with
      const chatWithId = location.state?.chatWith;
      
      if (chatWithId) {
          // 1. Check if this person is already in our inbox list
          const existing = contacts.find((c: any) => c.id === chatWithId);
          
          if (existing) {
             setInboxList(contacts);
             setSelectedContact(existing); // Open it immediately
          } else {
             // 2. If not in list, fetch their details to start a NEW chat
             try {
                // Assuming you have an endpoint to get user details by ID
                // If not, we can try to fetch generic instructor info
                const userRes = await api.get(`/auth/user/${chatWithId}`); 
                const newContact = {
                   id: userRes.data.id,
                   name: userRes.data.fullName,
                   role: userRes.data.role === 'INSTRUCTOR' ? 'ADMIN' : 'STUDENT',
                   lastMsg: 'Start a conversation...',
                   date: new Date().toISOString()
                };
                contacts = [newContact, ...contacts]; // Add to top
                setInboxList(contacts);
                setSelectedContact(newContact);
             } catch (err) {
                console.error("Could not fetch new contact details", err);
                setInboxList(contacts);
             }
          }
          // Clear the state so it doesn't reopen on refresh
          window.history.replaceState({}, document.title);
      } else {
          setInboxList(contacts);
      }

    } catch (error) { console.error(error); }
  };

  const fetchConversation = async () => {
    if (!selectedContact) return;
    try {
        const res = await api.get(`/messages/conversation/${user.id}/${selectedContact.id}`);
        setConversation(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedContact) return;

    try {
        await api.post('/messages/send', {
          senderId: user.id,
          receiverId: selectedContact.id,
          content: reply,
          subject: 'Chat Message',
          isChat: true // 👈 Flag to tell Backend: "Don't email this, it's just a chat"
        });
        
        setReply('');
        fetchConversation(); // Update chat view
        fetchInbox(); // Update sidebar list "last message"
    } catch (error) {
        alert("Failed to send message");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm h-[600px] flex">
      
      {/* LEFT SIDE: CONTACT LIST */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-slate-400" />
            <input className="w-full pl-10 p-2 border border-slate-300 rounded text-sm outline-none" placeholder="Search chats..." />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {inboxList.length > 0 ? inboxList.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-blue-50 transition 
                ${selectedContact?.id === contact.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {contact.role === 'ADMIN' ? <FaChalkboardTeacher className="text-blue-500"/> : <FaUserGraduate className="text-green-500"/>}
                    <h4 className="font-bold text-slate-700 text-sm">{contact.name}</h4>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(contact.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 ml-6">{contact.lastMsg}</p>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400 italic text-sm">No messages yet.</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: CHAT AREA */}
      <div className="w-2/3 flex flex-col bg-slate-50">
        {selectedContact ? (
          <>
            {/* CHAT HEADER */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
              <FaUserCircle className="text-3xl text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700">{selectedContact.name}</h3>
                <p className="text-xs font-bold uppercase text-blue-500">{selectedContact.role === 'ADMIN' ? 'Instructor' : 'Student'}</p>
              </div>
            </div>

            {/* MESSAGES FEED */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.map(msg => {
                    const isMe = msg.senderId === user.id;
                    return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm 
                        ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}
                        `}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        </div>
                    </div>
                    );
                })}
            </div>

            {/* REPLY BOX */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                className="flex-1 p-3 border border-slate-300 rounded outline-none focus:border-blue-500"
                placeholder="Type your message..."
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <button type="submit" className="bg-[#0B1B32] text-white px-6 rounded hover:bg-blue-900 transition flex items-center gap-2 font-bold">
                <FaPaperPlane /> Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FaPaperPlane className="text-6xl mb-4 opacity-20" />
            <p>Select a contact to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}