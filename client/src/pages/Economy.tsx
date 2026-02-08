export default function Economy() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Financial Overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-green-50 border border-green-200 rounded">
           <p className="text-xs font-bold text-green-600 uppercase">Total Revenue</p>
           <p className="text-2xl font-bold text-green-700">$0.00</p>
        </div>
      </div>
    </div>
  );
}