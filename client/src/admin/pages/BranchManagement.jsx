import React, { useState, useEffect } from 'react';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import { Building2, Plus, MapPin, Phone, Mail, FileText, Users, Package, Receipt, Edit, Globe, CheckCircle2 } from 'lucide-react';

export const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [drugLicenseNo, setDrugLicenseNo] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/branches');
      if (res.data.success) setBranches(res.data.data);
    } catch (err) { console.error('Failed to load branches', err); }
    finally { setLoading(false); }
  };

  const openModal = (branch = null) => {
    setFormError('');
    if (branch) {
      setEditingBranch(branch);
      setName(branch.name); setCode(branch.code); setAddress(branch.address);
      setCity(branch.city); setState(branch.state); setPincode(branch.pincode);
      setPhone(branch.phone); setEmail(branch.email || '');
      setGstNumber(branch.gstNumber); setDrugLicenseNo(branch.drugLicenseNo);
    } else {
      setEditingBranch(null);
      setName(''); setCode(''); setAddress(''); setCity('Pune');
      setState('Maharashtra'); setPincode(''); setPhone('');
      setEmail(''); setGstNumber(''); setDrugLicenseNo('');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError('');
    try {
      const payload = { name, code, address, city, state, pincode, phone, email, gstNumber, drugLicenseNo };
      if (editingBranch) await adminApi.patch(`/branches/${editingBranch.id}`, payload);
      else await adminApi.post('/branches', payload);
      setShowModal(false);
      fetchBranches();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save branch');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (branch) => {
    try {
      await adminApi.patch(`/branches/${branch.id}`, { isActive: !branch.isActive });
      fetchBranches();
    } catch { alert('Failed to update branch status'); }
  };

  const totalStaff = branches.reduce((s, b) => s + (b._count?.users || 0), 0);
  const activeBranches = branches.filter((b) => b.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Branch Network
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Store Branches Registry & Licensing
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Onboard retail stores, configure branch GSTIN and Drug Licenses, and manage store operational status</p>
          </div>
          <button onClick={() => openModal()} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-2xs">
            <Plus size={13} /> <span>Onboard Store Branch</span>
          </button>
        </div>

        {/* Dense Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">Total Locations</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">{branches.length}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Configured stores</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">Active Stores</div>
            <div className="text-2xl font-bold font-mono mt-1.5 leading-none text-teal-800">{activeBranches}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Operational terminals</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">Total Staff</div>
            <div className="text-2xl font-bold font-mono mt-1.5 leading-none text-slate-900">{totalStaff}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Cashiers & managers</div>
          </div>
        </div>

        {/* Branch Cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-mono">Loading stores...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branches.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                        {b.code}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 mt-1 font-display leading-snug">{b.name}</h2>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" /> {b.address}, {b.city} - {b.pincode}
                      </p>
                    </div>
                    <button onClick={() => handleToggleActive(b)} className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition flex-shrink-0 ${b.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                      {b.isActive ? 'Active' : 'Suspended'}
                    </button>
                  </div>

                  {/* Branch Details */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1 text-[11px] text-slate-600 font-mono mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">GSTIN:</span>
                      <span className="text-slate-900 font-semibold">{b.gstNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Drug License:</span>
                      <span className="text-slate-800 truncate max-w-[150px]">{b.drugLicenseNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Phone:</span>
                      <span className="text-slate-800">{b.phone}</span>
                    </div>
                    {b.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Email:</span>
                        <span className="text-slate-800 truncate max-w-[150px]">{b.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase font-display">Staff</div>
                      <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{b._count?.users || 0}</div>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase font-display">Batches</div>
                      <div className="font-bold text-teal-800 font-mono text-sm mt-0.5">{b._count?.batches || 0}</div>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase font-display">Bills</div>
                      <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{b._count?.sales || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <button onClick={() => openModal(b)} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition">
                    <Edit size={12} /> Edit Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-3 font-display">
              {editingBranch ? `Edit Branch [${editingBranch.code}]` : 'Onboard Store Branch'}
            </h3>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Store Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kiara Medicals — Shop D" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Code *</label>
                  <input type="text" required disabled={!!editingBranch} value={code} onChange={(e) => setCode(e.target.value)} placeholder="BR-D" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase text-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Address *</label>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop No. 5, Crystal Tower, Baner Road" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">City *</label><input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" /></div>
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">State *</label><input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" /></div>
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Pincode *</label><input type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="411045" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none" /></div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Phone *</label><input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98230 44444" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none" /></div>
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shopD@kiaramedicals.com" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" /></div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">GSTIN *</label><input type="text" required value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="27AABCU9603R1ZM" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase focus:outline-none" /></div>
                <div><label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Drug License *</label><input type="text" required value={drugLicenseNo} onChange={(e) => setDrugLicenseNo(e.target.value)} placeholder="MH/20B/2024/12345" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none" /></div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50">
                  {submitting ? 'Saving...' : editingBranch ? 'Update Store' : 'Onboard Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
