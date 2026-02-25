import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  FaFileInvoiceDollar, FaEye, FaHistory, FaSearch, 
  FaSave, FaUniversity, FaUsers, FaCheckCircle, FaTimes, FaExternalLinkAlt 
} from 'react-icons/fa';

export default function Economy() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [bankInfo, setBankInfo] = useState({ 
    bankRegNum: '6695', 
    bankAccountNum: '2001753439', 
    schoolName: 'DriveBook ApS'
  });
  
  const [invStudentId, setInvStudentId] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [invDesc, setInvDesc] = useState('Lesson Package\nPart 1');
  const [invPrice, setInvPrice] = useState('6999');
  const [invDueDate, setInvDueDate] = useState('2026-02-21');
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    if (isInstructor) fetchStudents();
  }, [isInstructor]);

  const fetchData = async () => {
    try {
      const endpoint = isInstructor ? `/booking/invoices/all` : `/booking/invoices/student/${user.id}`;
      const res = await api.get(endpoint);
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (e) { 
      console.error("Error loading data:", e); 
      setInvoices([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/auth/students');
      setStudents(res.data);
    } catch (e) { console.error("Error loading students:", e); }
  };

  const handleUpdateBankInfo = async () => {
    if (!user.schoolId) return alert("School ID missing.");
    try {
      await api.put(`/booking/school-settings/${user.schoolId}`, bankInfo);
      alert("Bank details saved!");
    } catch (e) { alert("Error updating bank info."); }
  };

  const handleGenerateInvoice = async () => {
    if (!applyToAll && !invStudentId) return alert("Please select a student.");
    try {
      await api.post('/booking/generate-invoice', {
        studentId: applyToAll ? 'ALL' : invStudentId,
        amount: parseFloat(invPrice),
        dueDate: invDueDate,
        description: invDesc
      });
      alert("Invoice(s) generated!");
      fetchData();
    } catch (e) { alert("Generation failed. Check console."); }
  };

  const handleUploadProof = async (invId: string) => {
    if (!selectedFile) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append('file', selectedFile); 

    try {
      await api.post(`/booking/invoice/${invId}/pay`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Receipt submitted successfully!");
      setSelectedInvoice(null);
      setSelectedFile(null);
      fetchData();
    } catch (e) { 
      console.error(e);
      alert("Upload failed. Please check your connection."); 
    }
  };

  const handleInstructorDecision = async (invId: string, status: 'PAID' | 'REJECTED') => {
    try {
      await api.put(`/booking/invoice/${invId}/status`, { status });
      alert(`Invoice marked as ${status}`);
      setSelectedInvoice(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to ensure date matches input exactly (removes timezone shift)
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (selectedInvoice) {
    return (
      <div className="max-w-4xl mx-auto p-10 bg-white shadow-lg my-8 font-sans text-slate-800 border relative overflow-hidden">
        {/* PAID WATERMARK */}
        {selectedInvoice.status === 'PAID' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-10 pointer-events-none border-[12px] border-green-600 p-6 rounded-xl">
            <h1 className="text-9xl font-black text-green-600 uppercase">PAID</h1>
          </div>
        )}

        <button onClick={() => setSelectedInvoice(null)} className="mb-8 text-blue-600 font-bold no-print" title="Close Invoice View">← Close</button>
        
        <div className="text-center mb-10"><h1 className="text-2xl font-bold uppercase">{bankInfo.schoolName}</h1></div>
        
        <h2 className="text-5xl font-light mb-6 border-b pb-4 uppercase">Invoice</h2>
        
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="font-bold uppercase text-xs text-gray-400">Billed To:</p>
            <p className="font-bold text-lg">{selectedInvoice.student?.fullName || user.fullName}</p>
            <p className="text-sm text-gray-600">{selectedInvoice.studentAddress || selectedInvoice.student?.address || "No address provided"}</p>
            <p className="text-sm text-gray-600">{selectedInvoice.studentPhone || selectedInvoice.student?.phone || ""}</p>
          </div>
          <div className="text-right uppercase text-xs font-bold">
            <p>Invoice No: <span className="font-normal">{selectedInvoice.invoiceNo}</span></p>
            <p>Due Date: <span className="font-bold text-red-600">{formatDate(selectedInvoice.dueDate)}</span></p>
          </div>
        </div>

        <table className="w-full border-t-2 border-black py-4 mb-6">
          <thead><tr className="text-left text-xs uppercase font-bold text-gray-700 h-12 border-b"><th>Description</th><th className="text-right">Price (Excl. VAT)</th></tr></thead>
          <tbody>
            <tr className="text-sm h-16 border-b">
              <td className="whitespace-pre-line">{selectedInvoice.description}</td>
              <td className="text-right font-bold">{selectedInvoice.amount.toLocaleString()},00 kr.</td>
            </tr>
          </tbody>
        </table>

        {/* VAT BREAKDOWN */}
        <div className="flex justify-end mb-10">
           <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>{selectedInvoice.amount.toLocaleString()},00 kr.</span>
              </div>
              <div className="flex justify-between text-gray-500 border-b pb-2">
                <span>VAT (25%):</span>
                <span>{(selectedInvoice.vatAmount || (selectedInvoice.amount * 0.25)).toLocaleString()},00 kr.</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total:</span>
                <span>{(selectedInvoice.totalWithVat || (selectedInvoice.amount * 1.25)).toLocaleString()},00 kr.</span>
              </div>
           </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-10 border-l-4 border-black">
          <p className="font-bold mb-2 uppercase text-xs text-gray-400">Bank Transfer Details:</p>
          <p className="text-sm">Reg.nr.: <span className="font-bold">{bankInfo.bankRegNum}</span> Account No.: <span className="font-bold">{bankInfo.bankAccountNum}</span></p>
        </div>

        <div className="border-t pt-8 no-print">
          {isInstructor ? (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 uppercase text-xs">Payment Verification</h4>
              {selectedInvoice.proofUrl ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-white max-w-sm">
                    <img 
                      src={selectedInvoice.proofUrl} 
                      alt="Payment Proof" 
                      className="w-full h-auto cursor-pointer"
                      onClick={() => window.open(selectedInvoice.proofUrl, '_blank')}
                    />
                  </div>
                  <button 
                    onClick={() => window.open(selectedInvoice.proofUrl, '_blank')}
                    className="text-blue-600 text-xs font-bold flex items-center gap-1"
                    title="View receipt in full screen"
                  >
                    <FaExternalLinkAlt /> View Full Image
                  </button>
                  {selectedInvoice.status === 'REVIEWING' && (
                    <div className="flex gap-4 pt-4 border-t">
                      <button onClick={() => handleInstructorDecision(selectedInvoice.id, 'PAID')} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2" title="Approve this payment">
                        <FaCheckCircle /> Approve Payment
                      </button>
                      <button onClick={() => handleInstructorDecision(selectedInvoice.id, 'REJECTED')} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2" title="Reject this payment">
                        <FaTimes /> Reject Proof
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No receipt uploaded by student yet.</p>
              )}
            </div>
          ) : (
            selectedInvoice.status === 'PENDING' && (
              <div>
                <label htmlFor="file-upload" className="block text-xs font-bold uppercase mb-4 text-gray-500 underline">Upload Payment Receipt</label>
                <div className="flex items-center gap-6">
                  <input 
                    id="file-upload" 
                    type="file" 
                    title="Select payment proof image" 
                    className="text-xs"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  />
                  {selectedFile && (
                    <button onClick={() => handleUploadProof(selectedInvoice.id)} className="bg-blue-600 text-white px-8 py-2 rounded-full font-bold text-xs flex items-center gap-2" title="Submit receipt to instructor">
                      <FaCheckCircle /> Submit Receipt
                    </button>
                  )}
                </div>
              </div>
            )
          )}
          <div className="mt-4 flex justify-between items-center">
             <span className={`text-xs font-bold uppercase ${selectedInvoice.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                Status: {selectedInvoice.status}
             </span>
             <button onClick={() => window.print()} className="text-xs font-bold text-gray-400 uppercase hover:text-black no-print" title="Print this invoice">Print Invoice</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {isInstructor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <FaFileInvoiceDollar aria-hidden="true" /> Create Invoice
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-slate-300" aria-hidden="true" />
                <label htmlFor="search-box" className="sr-only">Search Students</label>
                <input id="search-box" title="Search for student by name or email" className="w-full border pl-10 p-2 rounded-lg text-sm" placeholder="Search by name/email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <label htmlFor="select-student" className="sr-only">Select Student</label>
              <select id="select-student" title="Choose a student for this invoice" disabled={applyToAll} className="w-full border p-2 rounded-lg text-sm bg-white" value={invStudentId} onChange={e => setInvStudentId(e.target.value)}>
                <option value="">-- {filteredStudents.length} students found --</option>
                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input id="all-check" type="checkbox" title="Check to send invoice to all students" checked={applyToAll} onChange={e => setApplyToAll(e.target.checked)} />
                <label htmlFor="all-check" className="text-sm font-bold text-blue-600 flex items-center gap-1 cursor-pointer"><FaUsers aria-hidden="true" /> Apply to all students</label>
              </div>
              <label htmlFor="desc-box" className="sr-only">Description</label>
              <textarea id="desc-box" title="Description of lesson or package" className="w-full border p-2 rounded-lg text-sm h-20" placeholder="Description..." value={invDesc} onChange={e => setInvDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="price-box" className="text-[10px] font-bold text-gray-400 uppercase">Price DKK (Excl. VAT)</label>
                  <input id="price-box" title="Base price before tax" type="number" className="w-full border p-2 rounded-lg text-sm" value={invPrice} onChange={e => setInvPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="date-box" className="text-[10px] font-bold text-gray-400 uppercase">Due Date</label>
                  <input id="date-box" title="Select the payment deadline" type="date" className="w-full border p-2 rounded-lg text-sm" value={invDueDate} onChange={e => setInvDueDate(e.target.value)} />
                </div>
              </div>
              <button onClick={handleGenerateInvoice} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg" title="Generate and send invoice">Generate Invoice</button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h4 className="font-bold mb-4 flex items-center gap-2"><FaUniversity aria-hidden="true" /> Bank Settings</h4>
            <div className="space-y-3">
              <label htmlFor="regNum" className="text-[10px] font-bold text-gray-400 block uppercase">Reg.nr.</label>
              <input id="regNum" title="Bank Registration number" className="w-full border p-2 text-sm rounded" value={bankInfo.bankRegNum} onChange={e => setBankInfo({...bankInfo, bankRegNum: e.target.value})} />
              <label htmlFor="accNum" className="text-[10px] font-bold text-gray-400 block uppercase">Kontonr.</label>
              <input id="accNum" title="Bank Account number" className="w-full border p-2 text-sm rounded" value={bankInfo.bankAccountNum} onChange={e => setBankInfo({...bankInfo, bankAccountNum: e.target.value})} />
              <button onClick={handleUpdateBankInfo} className="w-full bg-slate-800 text-white py-2 text-xs font-bold rounded flex items-center justify-center gap-2" title="Save these bank details"><FaSave aria-hidden="true" /> Save Bank info</button>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY SECTION --- */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FaHistory aria-hidden="true" /> Payment & Invoice History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold">
              <tr className="border-b">
                <th className="p-4">Invoice No</th>
                <th className="p-4">Amount (Incl. VAT)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? invoices.map(inv => (
                <tr key={inv.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">{inv.invoiceNo}</td>
                  <td className="p-4 font-medium">{(inv.totalWithVat || (inv.amount * 1.25)).toLocaleString()} kr.</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'REVIEWING' ? 'bg-blue-100 text-blue-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedInvoice(inv)} 
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                      title={`Open invoice ${inv.invoiceNo}`}
                    >
                      <FaEye className="text-gray-600" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 italic">No invoices found for your account.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}