import React, { useState, useEffect } from 'react';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Plus, Search, AlertTriangle, CheckCircle2, Pill, BarChart3, Layers } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-1.5.5 shadow-sm text-sm">
      <p className="font-bold text-slate-900">{label}</p>
      <p className="font-mono text-teal-800 font-bold">{payload[0].value.toLocaleString('en-IN')} units</p>
    </div>
  );
};

export const ConsolidatedInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Medicine form states
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [composition, setComposition] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState('');
  const [hsnCode, setHsnCode] = useState('3004');
  const [unit, setUnit] = useState('STRIP');
  const [gstRate, setGstRate] = useState(12);
  const [minReorderLevel, setMinReorderLevel] = useState(10);
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = '/inventory/consolidated?';
      if (search) url += `search=${encodeURIComponent(search)}`;
      const res = await adminApi.get(url);
      if (res.data.success) {
        setMedicines(res.data.data.medicines);
        setBranches(res.data.data.branches);
      }
    } catch (err) { console.error('Failed to load consolidated inventory', err); }
    finally { setLoading(false); }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchInventory(); };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setFormError('Brand name is required'); return; }
    setSubmitting(true); setFormError('');
    try {
      await adminApi.post('/inventory/master', { name, genericName, composition, manufacturer, category, hsnCode, unit, gstRate, minReorderLevel, prescriptionRequired });
      setShowAddModal(false);
      setName(''); setGenericName(''); setComposition(''); setManufacturer(''); setCategory('');
      fetchInventory();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to add medicine'); }
    finally { setSubmitting(false); }
  };

  const totalMeds = medicines.length;
  const totalStock = medicines.reduce((s, m) => s + m.totalStock, 0);
  const lowStockCount = medicines.filter((m) => m.isLowStock).length;
  const healthyCount = medicines.filter((m) => !m.isLowStock).length;

  const branchStockData = branches.map((b) => ({
    name: b.code,
    stock: medicines.reduce((s, m) => s + (m.branchStock[b.code] || 0), 0),
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 w-full w-full mx-auto px-6 sm:px-8 lg:px-12 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                Inventory Catalog
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Consolidated Enterprise Stock Matrix
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Central master medicine registry with side-by-side branch stock levels</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="self-start sm:self-auto inline-flex items-center gap-2.5 px-4 py-1.5.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition shadow-2xs">
            <Plus size={18} /> <span>Add Master Medicine</span>
          </button>
        </div>

        {/* 4 Dense KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Catalog Items</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">{totalMeds}</div>
            <div className="text-sm text-slate-500 mt-1 leading-tight">Active formulations</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Enterprise Stock</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">{totalStock.toLocaleString('en-IN')}</div>
            <div className="text-sm text-slate-500 mt-1 leading-tight">Total units in network</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Low Stock Alerts</div>
            <div className="text-2xl font-bold font-mono mt-1.5 leading-none text-amber-700">{lowStockCount}</div>
            <div className="text-sm text-slate-500 mt-1 leading-tight">Below reorder point</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Healthy Stock</div>
            <div className="text-2xl font-bold font-mono mt-1.5 leading-none text-teal-800">{healthyCount}</div>
            <div className="text-sm text-slate-500 mt-1 leading-tight">Adequate buffer units</div>
          </div>
        </div>

        {/* Branch Stock Chart & Search Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {branchStockData.length > 0 && (
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                  Stock Units by Branch
                </h2>
                <span className="text-sm text-slate-500 font-mono">{branches.length} stores</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={branchStockData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="stock" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={`${branchStockData.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'} bg-white border border-slate-200 p-4.5 rounded-xl shadow-2xs`}>
            <h2 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider mb-2">
              Catalog Search
            </h2>
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Medicine, Salt, Formula, or HSN..."
                  className="w-full pl-8.5 pr-3 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <button type="submit" className="px-4.5 py-1.5.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition">
                Search
              </button>
            </form>
            <p className="text-sm text-slate-500 mt-2">Filter the multi-branch cross-tabulation table below</p>
          </div>
        </div>

        {/* Inventory Matrix Table: Confident font size and dense scanning */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700 font-display">
              Formulation Cross-Matrix ({medicines.length})
            </span>
            <span className="text-sm text-slate-500 font-medium">All retail branches</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm font-mono">Loading matrix data...</div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">No medicines found in master catalog.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-sm uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                  <tr>
                    <th className="px-4 py-3.5">Medicine & Salt</th>
                    <th className="px-4 py-3.5">HSN / GST</th>
                    <th className="px-4 py-3.5">Manufacturer</th>
                    {branches.map((b) => (
                      <th key={b.id} className="px-4 py-3.5 text-center">
                        <span className="font-mono bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200 text-sm font-bold">{b.code}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-right">Enterprise Total</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-base">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 text-sm leading-snug">{m.name}</div>
                        <div className="text-sm text-slate-500">{m.composition || m.genericName || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sm text-slate-600">
                        <div className="font-semibold">{m.hsnCode}</div>
                        <div className="text-xs text-slate-500">{m.gstRate}% GST</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{m.manufacturer || '—'}</td>
                      {branches.map((b) => {
                        const stock = m.branchStock[b.code] || 0;
                        return (
                          <td key={b.id} className="px-4 py-3.5 text-center font-mono">
                            <span className={`font-semibold px-3 py-1 rounded text-sm ${stock > 0 ? stock <= m.minReorderLevel ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>
                              {stock}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-base">
                        {m.totalStock} <span className="text-sm font-normal text-slate-500 font-sans">{m.unit}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {m.isLowStock ? (
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                            <AlertTriangle size={14} className="text-amber-700" />
                            <span>Low</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            <span>OK</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Master Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-3 font-display">
              Add Medicine to Central Master Catalog
            </h3>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleCreateMedicine} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Brand Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Augmentin 625 Duo" className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Generic Salt</label>
                  <input type="text" value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="Amoxicillin + Clavulanic" className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Composition</label>
                <input type="text" value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="Amoxicillin 500mg + Clavulanic Acid 125mg" className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Manufacturer</label>
                  <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="GSK / Sun Pharma" className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Antibiotic / Analgesic" className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">HSN Code</label>
                  <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">GST %</label>
                  <input type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-600 mb-1 font-display">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none">
                    <option value="STRIP">Strip</option>
                    <option value="TABLET">Tablet</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="INJECTION">Injection</option>
                    <option value="TUBE">Tube</option>
                  </select>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4.5 py-1.5.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedInventory;
