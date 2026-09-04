import React, { useState, useEffect } from 'react';
import storeApi from '../../storeApi';
import StoreNavbar from '../../components/StoreNavbar';
import {
  Users,
  Plus,
  Search,
  FileText,
  Edit,
  X,
  Phone,
  UserCheck,
} from 'lucide-react';

export const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/customers?page=${page}&limit=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await storeApi.get(url);
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setTotalCount(res.data.data.total);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenAddModal = (customerToEdit = null) => {
    setFormError('');
    if (customerToEdit) {
      setSelectedCustomer(customerToEdit);
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setDoctorName(customerToEdit.doctorName || '');
      setDoctorRegNo(customerToEdit.doctorRegNo || '');
    } else {
      setSelectedCustomer(null);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDoctorName('');
      setDoctorRegNo('');
    }
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setFormError('Name and Phone number are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name,
        phone,
        email,
        address,
        doctorName,
        doctorRegNo,
      };
      const res = await storeApi.post('/customers', payload);
      if (res.data.success) {
        setShowAddModal(false);
        fetchCustomers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (customerId) => {
    setCustomerDetailsLoading(true);
    try {
      const res = await storeApi.get(`/customers/${customerId}`);
      if (res.data.success) {
        setActiveHistory(res.data.data);
      }
    } catch (err) {
      alert('Failed to load customer profile');
    } finally {
      setCustomerDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <StoreNavbar />

      <main className="flex-1 w-full w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Patient Profiles
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Patient & Customer Directory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage registered patients, prescription histories, and contact information
            </p>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-3 px-4.5 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-lg shadow-xs transition self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Add Patient</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6 flex gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Patient Name, Phone, or Doctor Name..."
                className="w-full pl-8.5 pr-3 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4.5 py-1.5.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-mono">
              Loading patients...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No patients registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs font-display">
                  <tr>
                    <th className="py-3.5 px-4">Patient Name</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Doctor / Prescriber</th>
                    <th className="py-3.5 px-4">Address</th>
                    <th className="py-3.5 px-4 text-center">Total Invoices</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-4 px-4 font-mono text-slate-700">{c.phone}</td>
                      <td className="py-4 px-4 text-slate-600">
                        {c.doctorName ? `Dr. ${c.doctorName}` : '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-500 truncate max-w-xs">
                        {c.address || '—'}
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded text-sm font-semibold border border-slate-200">
                          {c._count?.sales || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            onClick={() => handleViewHistory(c.id)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-sm font-semibold text-slate-700 transition shadow-2xs"
                          >
                            <FileText size={16} />
                            <span>History</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddModal(c)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-sm font-medium text-slate-600 transition"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-5">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3.5 font-display">
              {selectedCustomer ? 'Edit Patient Details' : 'Register New Patient'}
            </h3>

            {formError && (
              <div className="mb-3.5 p-2.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-sm">
              <div>
                <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Sharma"
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                    Doc Reg #
                  </label>
                  <input
                    type="text"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="MCI-12345"
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-1.5.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-bold shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {activeHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-5">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-5 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">{activeHistory.name} — Order History</h3>
                <p className="text-sm text-slate-500 font-mono">{activeHistory.phone}</p>
              </div>
              <button
                onClick={() => setActiveHistory(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-slate-100 space-y-2.5">
              {activeHistory.sales.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No previous orders for this patient.</p>
              ) : (
                activeHistory.sales.map((sale) => (
                  <div key={sale.id} className="pt-2.5 first:pt-0">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-bold font-mono text-slate-900">{sale.billNumber}</span>
                      <span className="font-bold text-slate-900 font-mono">₹{Number(sale.grandTotal).toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-slate-500 mb-1.5 font-mono">
                      {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="bg-slate-50 p-2 rounded text-sm space-y-0.5 border border-slate-100">
                      {sale.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-slate-700">
                          <span>{item.medicine.name} ({item.batchNumber})</span>
                          <span className="font-mono">Qty: {item.quantity} · ₹{Number(item.netAmount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
