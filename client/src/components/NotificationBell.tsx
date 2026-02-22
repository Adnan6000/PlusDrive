import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCircle } from 'react-icons/fa';
// ✅ Verified Path: Go up to 'src', then into 'api', then target 'axios.ts'
import api from '../api/axios'; 

export default function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const { data } = await api.get(`/notifications/${userId}`);
            setNotifications(data);
        } catch (error) {
            console.error("Notification Fetch Error:", error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); 
        return () => clearInterval(interval);
    }, [userId]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error("Mark Read Error:", err);
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all focus:outline-none"
            >
                <FaBell className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-red-600 text-white text-[9px] md:text-[10px] items-center justify-center font-bold">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Responsive Dropdown */}
            {isOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">No new alerts</div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    onClick={() => markAsRead(n.id)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 flex gap-3 ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                                >
                                    {!n.isRead && <FaCircle className="text-blue-500 mt-1.5 shrink-0" size={6} />}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs leading-snug break-words ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                                            {n.message}
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}