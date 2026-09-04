import React, { useState, useEffect } from 'react';
import StoreNavbar from '../../components/StoreNavbar';
import storeApi from '../../storeApi';
import {
  Building2,
  Plus,
  Search,
  FileText,
  MapPin,
  Phone,
  Mail,
  X,
} from 'lucide-react';

export const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // New Supplier Form State
  const [formData, setFormData] = useState({
    name: '',
    agencyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    drugLicenseNo: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await storeApi.get(`/suppliers?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await storeApi.post('/suppliers', formData);
      if (res.data?.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          agencyName: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          gstNumber: '',
          drugLicenseNo: '',
        });
        fetchSuppliers();
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Failed to create supplier. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <StoreNavbar />

      <main className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Distributors & Vendors
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Supplier & Distributor Directory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage pharmaceutical distributors, GSTIN compliance, and procurement contacts
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-3 px-4.5 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-xs transition self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search distributor by name, agency, GSTIN..."
              className="w-full pl-8.5 pr-3 py-1.5.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
          </div>
        </div>

        {/* Supplier Cards Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm font-mono">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No suppliers found. Click "Add Supplier" to create your first distributor profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-base text-slate-900 font-display">{sup.name}</span>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200 font-mono">
                      {sup._count?.purchases || 0} Invoices
                    </span>
                  </div>
                  {sup.agencyName && (
                    <div className="text-sm text-slate-500 mb-3">{sup.agencyName}</div>
                  )}

                  <div className="space-y-1.5 text-sm text-slate-600 border-t border-slate-100 pt-3 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Phone:</span>
                      <span className="font-semibold text-slate-800">{sup.phone}</span>
                    </div>
                    {sup.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Email:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">{sup.email}</span>
                      </div>
                    )}
                    {sup.gstNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">GSTIN:</span>
                        <span className="font-semibold text-slate-800 bg-slate-100 px-1 py-0.2 rounded">
                          {sup.gstNumber}
                        </span>
                      </div>
                    )}
                    {sup.drugLicenseNo && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">DL No:</span>
                        <span className="text-slate-700">{sup.drugLicenseNo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {sup.address && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-sm text-slate-500 truncate flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-5">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base font-display">Add Distributor / Supplier</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-3 text-sm">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahaveer Medi-Sales"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahaveer Pharma Pvt Ltd"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98220 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@distributor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAECM5544R1Z8"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Drug License No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH-PZ1-20B-1029"
                    value={formData.drugLicenseNo}
                    onChange={(e) =>
                      setFormData({ ...formData, drugLicenseNo: e.target.value })
                    }
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                  Physical Address
                </label>
                <textarea
                  rows="2"
                  placeholder="Street, City, Pincode"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-1.5.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Distributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
