import { useState } from 'react';
import axios from 'axios';

export default function ContactInstructor() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [msg, setMsg] = useState({ subject: '', content: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/messages/send', {
        senderId: user.id,
        receiverId: user.schoolId, // In this logic, the message goes to the school owner
        ...msg
      });
      alert("Inquiry sent! The instructor will be notified.");
      setMsg({ subject: '', content: '' });
    } catch (error) {
      alert("Failed to send message.");
    }
  };

  return (
    <form onSubmit={handleSend} className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm">
      <h3 className="text-xl font-light text-slate-700 mb-4">Contact Instructor / Send Inquiry</h3>
      <input 
        type="text" placeholder="Subject" required
        className="w-full mb-4 p-3 border border-slate-300 rounded outline-none focus:border-blue-400"
        value={msg.subject} onChange={e => setMsg({...msg, subject: e.target.value})}
      />
      <textarea 
        placeholder="How can we help you?" required rows={5}
        className="w-full mb-4 p-3 border border-slate-300 rounded outline-none focus:border-blue-400"
        value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})}
      />
      <button type="submit" className="bg-[#0B1B32] text-white px-8 py-3 rounded font-bold hover:bg-blue-900 transition">
        Send Message
      </button>
    </form>
  );
}