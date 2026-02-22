import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaCommentDots, FaMapMarkerAlt, FaClock, 
    FaChevronDown, FaChevronUp, FaExternalLinkAlt,
    FaGoogle, FaApple, FaExclamationTriangle
} from 'react-icons/fa';
import LocationPicker from './LocationPicker'; 

interface BookingCardProps {
    booking: any;
}

export default function BookingCard({ booking }: BookingCardProps) {
    const navigate = useNavigate();
    const [showPickupDetails, setShowPickupDetails] = useState(false);

    // ✅ LOGIC: Button is visible if a request exists, regardless of instructor action
    const hasPickupRequest = booking.PickupStatus && booking.PickupStatus !== 'NONE';

    // ✅ UI LOGIC: Determine which data to show based on status
    const isAccepted = booking.PickupStatus === 'ACCEPTED';
    const isProposed = booking.PickupStatus === 'REJECTED'; // REJECTED status acts as "Instructor Proposed New"
    const isPending = booking.PickupStatus === 'PENDING';

    // Coordinates priority: Show req coordinates if Pending/Accepted, show final if Instructor proposed new
    const displayLat = isAccepted || isPending ? booking.reqLat : (booking.finalLat || booking.reqLat);
    const displayLng = isAccepted || isPending ? booking.reqLng : (booking.finalLng || booking.reqLng);
    const displayAddress = isAccepted || isPending ? booking.reqLocation : (booking.finalLocation || booking.reqLocation);

    // HELPER: Generate Google Calendar Link
    const getGoogleCalendarUrl = () => {
        const dateObj = new Date(booking.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const startSimple = booking.startTime.replace(':', '') + '00';
        const endSimple = booking.endTime.replace(':', '') + '00';
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Driving+Lesson&dates=${yyyy}${mm}${dd}T${startSimple}/${yyyy}${mm}${dd}T${endSimple}&details=Driving+Lesson+with+DriveBook`;
    };

    // HELPER: Generate .ics for Apple/Outlook
    const downloadIcs = () => {
        const dateObj = new Date(booking.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const startSimple = booking.startTime.replace(':', '') + '00';
        const endSimple = booking.endTime.replace(':', '') + '00';
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Driving Lesson\nDTSTART;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${startSimple}\nDTEND;TZID=Asia/Karachi:${yyyy}${mm}${dd}T${endSimple}\nDESCRIPTION:Driving+Lesson+with+DriveBook\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lesson.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Open External Maps
    const openInMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=$${displayLat},${displayLng}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 transition-all hover:shadow-md w-full max-w-sm mx-auto">
            {/* Header: Time and Badge */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                        <FaClock />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {booking.startTime} - {booking.endTime}
                        </h3>
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter">
                            YOURS
                        </span>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS: MESSAGE, CALENDAR, & PICKUP TOGGLE */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-50">
                <button 
                    onClick={() => navigate(`/inbox?chatWith=${booking.adminId || booking.instructorId}`)}
                    title="Message Instructor"
                    className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shrink-0"
                >
                    <FaCommentDots />
                </button>

                <a 
                    href={getGoogleCalendarUrl()}
                    target="_blank" 
                    rel="noreferrer"
                    title="Add to Google Calendar"
                    className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shrink-0"
                >
                    <FaGoogle />
                </a>

                <button 
                    onClick={downloadIcs}
                    title="Apple Calendar Sync"
                    className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0"
                >
                    <FaApple />
                </button>
                
                {hasPickupRequest && (
                    <button 
                        onClick={() => setShowPickupDetails(!showPickupDetails)}
                        title={showPickupDetails ? "Hide Pickup Details" : "See Pickup Location"} 
                        className={`p-3 rounded-full flex items-center gap-2 transition-all relative shrink-0 ${
                            showPickupDetails ? 'bg-orange-600 text-white shadow-md' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        }`}
                    >
                        <FaMapMarkerAlt />
                        {/* Alert Ping for Proposed New Location */}
                        {isProposed && !showPickupDetails && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                        {showPickupDetails ? <FaChevronUp size={10}/> : <FaChevronDown size={10}/>}
                    </button>
                )}
            </div>

            {/* EXPANDED PICKUP SECTION */}
            {showPickupDetails && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Status</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isAccepted ? 'bg-green-100 text-green-700' : isProposed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {isAccepted ? 'Accepted' : isProposed ? 'Proposed New' : 'Pending Review'}
                            </span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2 min-w-0 flex-1">
                                <FaMapMarkerAlt className={`mt-1 shrink-0 ${isProposed ? 'text-red-500' : 'text-blue-500'}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 leading-tight break-words">
                                        {displayAddress || "Location selected on map"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={openInMaps}
                                title="Open in External Maps"
                                className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 shrink-0 ml-2"
                            >
                                <FaExternalLinkAlt size={12} />
                            </button>
                        </div>

                        {/* Maps Preview Container */}
                        {displayLat && displayLng && (
                            <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 z-0 shadow-inner">
                                <LocationPicker 
                                    initialLat={displayLat}
                                    initialLng={displayLng}
                                    initialAddress={displayAddress}
                                    readOnly={true} 
                                />
                            </div>
                        )}
                        
                        {/* Notes Section */}
                        {(booking.studentNote || booking.instructorNote) && (
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-xs space-y-2">
                                {booking.studentNote && (
                                    <p className="text-slate-500 italic">Your Request Note: "{booking.studentNote}"</p>
                                )}
                                {isProposed && booking.instructorNote && (
                                    <p className="text-red-600 font-medium flex items-center gap-1">
                                        <FaExclamationTriangle size={10} className="shrink-0" /> 
                                        Instructor: "{booking.instructorNote}"
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}