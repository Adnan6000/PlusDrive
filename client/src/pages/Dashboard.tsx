import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isInstructorsOpen, setIsInstructorsOpen] = useState(false); // Sidebar toggle
    const [activeTab, setActiveTab] = useState('overview'); // Controls main content
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentInstructor, setCurrentInstructor] = useState<any>(null);
    const [students, setStudents] = useState([]);
    const [showStudentModal, setShowStudentModal] = useState(false);

    const fetchInstructors = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.schoolId) {
                const response = await axios.get(`http://localhost:3000/auth/instructors/${userData.schoolId}`);
                setInstructors(response.data); // Save the list in state
            }
        } catch (err) {
            console.error("Failed to fetch instructors", err);
        }
    };

    const fetchStudents = async () => {
        try { 
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.schoolId) {
                const response = await axios.get(`http://localhost:3000/auth/students/${userData.schoolId}`);
                setStudents(response.data); // Save the list in state
            }
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }

        fetchInstructors();
        fetchStudents();
    }, [navigate]);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this instructor?')) {
            try {
                await axios.delete(`http://localhost:3000/auth/instructor/${id}`);
                alert('Instructor deleted successfully!');
                fetchInstructors(); // Refresh the list
            } catch (err) {
                console.error("Error deleting instructor", err);
                alert('Failed to delete instructor. Check console for details.');
            }
        }
    }

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleAddInstructor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            schoolId: user?.schoolId // Gets the ID of the school logged in
        };

        console.log("Sending data to server:", data);

        try {
            const res = await axios.post('http://localhost:3000/auth/add-instructor', data);
            console.log("Server Response:", res.data);
            setShowModal(false);
            alert('Instructor added successfully!');
            fetchInstructors(); // Refresh the list
        } catch (err: any) {
            console.error("Full Error Object:", err.response?.data); // <--- Add this to see the REAL error
            alert('Error adding instructor: ' + (err.response?.data?.message || 'Check console'));
        }
    };

    if (!user) return <div className="bg-gray-900 min-h-screen text-white p-10 text-center">Loading...</div>;

    return (
        <div className="relative flex h-screen bg-gray-900 text-gray-100 overflow-hidden">

            {/* Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
                <h1 className="text-2xl font-bold text-blue-500 mb-10">PlusDrive</h1>
                <nav className="flex-1 space-y-2">
                    {/* Dashboard Link */}
                    <div
                        onClick={() => setActiveTab('overview')}
                        className={`p-3 rounded-lg cursor-pointer transition font-medium ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                    >
                        Dashboard Overview
                    </div>

                    {/* Instructors Group */}
                    <div className="space-y-1">
                        <div
                            onClick={() => setIsInstructorsOpen(!isInstructorsOpen)}
                            className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition flex justify-between items-center group"
                        >
                            <span className="font-semibold">Instructors</span>
                            <span className={`transition-transform duration-200 ${isInstructorsOpen ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>

                        {/* Animated Sub-menu: Only shows if isInstructorsOpen is true */}
                        {isInstructorsOpen && (
                            <div className="pl-4 space-y-1 border-l-2 border-gray-700 ml-2 animate-in fade-in slide-in-from-top-1">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full text-left p-2 text-sm text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded-lg transition"
                                >
                                    • Add New
                                </button>
                                <button
                                    onClick={() => setActiveTab('instructor-list')}
                                    className={`w-full text-left p-2 text-sm rounded-lg transition ${activeTab === 'instructor-list' ? 'text-blue-400 bg-gray-700/50' : 'text-gray-400 hover:text-blue-400'}`}
                                >
                                    • View All Instructors({instructors.length})
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition">Students</div>
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-auto p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition text-left font-medium"
                >
                    Logout
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-bold">Welcome back, {user.fullName}!</h2>
                        <p className="text-gray-400">Manage your driving school instructors and students.</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center font-bold shadow-lg">
                        {user.fullName?.[0]}
                    </div>
                </header>

                {/* Instructors Table */}
                <div className="flex-1 p-10 overflow-y-auto">
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-bold">PlusDrive {activeTab === 'overview' ? 'Overview' : 'Management'}</h2>
                            <p className="text-gray-400">Logged in as {user.fullName}</p>
                        </div>
                    </header>

                    {/* SECTION 1: OVERVIEW (Stats Cards) */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <p className="text-gray-400 text-sm mb-1 uppercase">Total Instructors</p>
                                <p className="text-3xl font-bold text-blue-500">{instructors.length}</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition">
                                <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Active Lessons</p>
                                <p className="text-3xl font-bold">0</p>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition">
                                <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Total Students</p>
                                <p className="text-3xl font-bold">0</p>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: INSTRUCTOR LIST (The Table) */}
                    {activeTab === 'instructor-list' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-blue-400 text-center">Instructor Directory</h3>
                                <button onClick={() => setShowModal(true)} className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
                                    + Add New
                                </button>
                            </div>

                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-widest">
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {instructors.map((inst: any) => (
                                            <tr key={inst.id} className="hover:bg-gray-700/30 transition">
                                                <td className="p-4 font-medium">{inst.fullName}</td>
                                                <td className="p-4 text-gray-400">{inst.email}</td>
                                                <td className="p-4 flex justify-center gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentInstructor(inst);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-blue-400 hover:underline text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(inst.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD INSTRUCTOR MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
                        <h3 className="text-2xl font-bold mb-2">New Instructor</h3>
                        <p className="text-gray-400 mb-6 text-sm">Fill in the details to register a new instructor for your school.</p>

                        <form onSubmit={handleAddInstructor} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    name="fullName"
                                    required
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="example@plusdrive.com"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition shadow-lg shadow-blue-900/20"
                                >
                                    Save Instructor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* EDIT INSTRUCTOR MODAL */}
            {showEditModal && currentInstructor && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-blue-400">Edit Instructor</h3>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            try {
                                await axios.patch(`http://localhost:3000/auth/instructor/${currentInstructor.id}`, {
                                    fullName: formData.get('fullName'),
                                    email: formData.get('email'),
                                });
                                setShowEditModal(false);
                                alert('Updated successfully!');
                                fetchInstructors(); // Refresh the list
                            } catch (err) {
                                alert('Update failed.');
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    name="fullName"
                                    defaultValue={currentInstructor.fullName}
                                    placeholder='Enter full name'
                                    title="Instructor Full Name"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={currentInstructor.email}
                                    placeholder='Enter email address'
                                    title='Instructor Email'
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 bg-gray-700 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 rounded-lg font-bold">Update Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}