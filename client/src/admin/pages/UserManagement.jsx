import React, { useState, useEffect } from 'react';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import { Users, UserPlus, Shield, Store, Search, Edit, Key, UserCheck, ToggleLeft, ToggleRight } from 'lucide-react';

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-blue-50 text-blue-900 border-blue-200' },
  BRANCH_MANAGER: { label: 'Branch Manager', color: 'bg-teal-50 text-teal-900 border-teal-200' },
  STAFF: { label: 'Staff / Cashier', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');
  const [branchId, setBranchId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [roleFilter, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (branchFilter) params.set('branchId', branchFilter);
      const [usersRes, branchesRes] = await Promise.all([
        adminApi.get(`/users?${params}`),
        adminApi.get('/branches'),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
    } catch (err) { console.error('Failed to load users', err); }
    finally { setLoading(false); }
  };

  const openModal = (user = null) => {
    setFormError('');
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setPassword('');
      setPhone(user.phone || '');
      setRole(user.role);
      setBranchId(user.branchId || '');
    } else {
      setEditingUser(null);
      setName(''); setEmail(''); setPassword(''); setPhone('');
      setRole('STAFF'); setBranchId('');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError('');
    try {
      if (editingUser) {
        const payload = { name, phone, role, branchId: role === 'SUPER_ADMIN' ? null : branchId };
        if (password) payload.password = password;
        await adminApi.patch(`/users/${editingUser.id}`, payload);
      } else {
        await adminApi.post('/users', { name, email, password, phone, role, branchId: role === 'SUPER_ADMIN' ? null : branchId });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save user');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminApi.patch(`/users/${user.id}`, { isActive: !user.isActive });
      fetchData();
    } catch (err) { alert('Failed to update user status'); }
  };

  const roleStats = {
    SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
    BRANCH_MANAGER: users.filter((u) => u.role === 'BRANCH_MANAGER').length,
    STAFF: users.filter((u) => u.role === 'STAFF').length,
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Staff & Roles Registry
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Enterprise Staff & Access Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage operator accounts, store manager assignments, and access privileges</p>
          </div>
          <button onClick={() => openModal()} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-2xs">
            <UserPlus size={13} /> <span>Create Staff Account</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <div key={key} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">{config.label}s</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">{roleStats[key]}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-tight">Active accounts</div>
            </div>
          ))}
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none w-full sm:w-auto">
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="STAFF">Staff / Cashier</option>
          </select>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none w-full sm:w-auto">
            <option value="">All Branches</option>
            {branches.filter(b => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name or email..." className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900" />
            </div>
          </div>
        </div>

        {/* User Cards Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-mono">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No accounts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((u) => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.STAFF;
              const initial = (u.name || '?').charAt(0).toUpperCase();

              return (
                <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs font-mono">
                          {initial}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-display">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                      <button onClick={() => handleToggleActive(u)} className="text-slate-500 hover:text-slate-800 transition" title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <ToggleRight size={20} className="text-teal-700" /> : <ToggleLeft size={20} className="text-slate-400" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${rc.color}`}>
                        {rc.label}
                      </span>
                      {u.branch && (
                        <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {u.branch.code}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1 text-[11px] text-slate-600 mb-3 font-mono">
                      {u.phone && <div className="flex justify-between"><span>Phone:</span><span className="text-slate-800">{u.phone}</span></div>}
                      {u.branch && <div className="flex justify-between"><span>Branch:</span><span className="text-slate-800 truncate max-w-[140px]">{u.branch.name}</span></div>}
                      <div className="flex justify-between">
                        <span>Last Login:</span>
                        <span className="text-slate-700">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                    <button onClick={() => openModal(u)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 rounded-lg transition">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => openModal({ ...u, _resetPw: true })} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition" title="Reset Password">
                      <Key size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-3 font-display">
              {editingUser ? `Edit Account — ${editingUser.name}` : 'Create Staff Account'}
            </h3>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Full Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Email Address *</label>
                  <input type="email" required disabled={!!editingUser} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">{editingUser ? 'Password (optional)' : 'Password *'}</label>
                  <input type="password" required={!editingUser} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98230 44444" className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Role Assignment *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <button key={key} type="button" onClick={() => setRole(key)} className={`p-2 rounded-lg border text-center transition ${role === key ? 'border-slate-900 bg-slate-100 font-bold text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                      <div className="text-[11px] font-semibold">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {role !== 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">Branch Assignment *</label>
                  <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none">
                    <option value="">Select Branch</option>
                    {branches.filter(b => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
              )}

              <div className="pt-2.5 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50">
                  {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
