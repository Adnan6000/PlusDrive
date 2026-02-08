// client/src/pages/Reservations.tsx

import InstructorCalendar from '../components/InstructorCalendar'; // Import the new component
import BookingRequests from '../components/BookingRequests';

export default function Reservations() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-700">Manage Calendar & Availability</h2>
      
      {/* 1. The NEW Calendar that allows Adding Slots */}
      <InstructorCalendar /> 

      {/* 2. The List of Incoming Requests (Keep this) */}
      <BookingRequests />
    </div>
  );
}