import React, { useState, useEffect } from 'react';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import { ShieldCheck, Filter, RotateCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, User as UserIcon, Building2 } from 'lucide-react';

const ACTION_STYLES = {
  SALE_BILL_CREATED: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' },
  SALE_BILL_CANCELLED: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-600' },
  PURCHASE_STOCK_INWARD: { color: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600' },
  STOCK_ADJUSTMENT: { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600' },
  STOCK_OVERRIDE: { color: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-600' },
  PRICE_UPDATE: { color: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-600' },
};

const getActionStyle = (action) => {
  for (const [key, style] of Object.entries(ACTION_STYLES)) {
    if (action?.includes(key)) return style;
  }
  return { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' };
};

const parseJson = (str) => {
  if (!str) return null;
  try { return typeof str === 'object' ? str : JSON.parse(str); } catch { return str; }
};

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchData(); }, [page, branchFilter, actionFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '30');
      if (branchFilter) params.set('branchId', branchFilter);
      if (actionFilter) params.set('action', actionFilter);

      const [logsRes, branchesRes] = await Promise.all([
        adminApi.get(`/audit-logs?${params}`),
        adminApi.get('/branches'),
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.data.logs);
        setTotalPages(logsRes.data.data.totalPages || 1);
        setTotal(logsRes.data.data.total || 0);
      }
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
    } catch (err) { console.error('Failed to load audit logs', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Regulatory Compliance
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Immutable System Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Permanent compliance log of all dispensing events, price edits, voided invoices, and stock adjustments</p>
          </div>
          <button onClick={fetchData} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs">
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> <span>Refresh Logs</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400 hidden sm:block" />
            <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none">
              <option value="">All Branches</option>
              {branches.filter(b => b.isActive !== false).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none">
              <option value="">All Action Types</option>
              <option value="SALE_BILL_CREATED">Sales Created</option>
              <option value="SALE_BILL_CANCELLED">Bills Voided / Cancelled</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
              <option value="PURCHASE_STOCK_INWARD">Purchase Inward</option>
              <option value="STOCK_OVERRIDE">Stock Overrides</option>
              <option value="PRICE_UPDATE">Price Edits</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-mono self-start sm:self-auto">{total} total audit records</span>
        </div>

        {/* Timeline Log Feed */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">Loading compliance trail...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs bg-white rounded-xl border border-slate-200">No audit records found matching filters.</div>
          ) : (
            logs.map((log) => {
              const style = getActionStyle(log.action);
              const newVals = parseJson(log.newValues);
              const oldVals = parseJson(log.oldValues);
              const isExpanded = expandedId === log.id;
              const hasPayload = newVals || oldVals;

              return (
                <div key={log.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition">
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => hasPayload && setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Timeline Dot */}
                    <div className="pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.2 rounded border font-mono ${style.color}`}>
                          {log.action}
                        </span>
                        {log.branch && (
                          <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-1">
                            <Building2 size={10} className="text-slate-400" />
                            {log.branch.code}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">{log.entityType}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono text-slate-600">
                          <Clock size={11} className="text-slate-400" />
                          {new Date(log.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon size={11} className="text-slate-400" />
                          <span className="text-slate-800 font-medium">{log.user?.name || 'System Operator'}</span>
                          {log.user?.role && <span className="text-slate-400 font-mono text-[11px]">({log.user.role})</span>}
                        </span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    {hasPayload && (
                      <button className="p-1 rounded text-slate-400 hover:text-slate-700 flex-shrink-0" aria-label="Toggle diff payload">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Diff Payload */}
                  {isExpanded && hasPayload && (
                    <div className="px-3 pb-3 ml-5 border-t border-slate-100 pt-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {oldVals && (
                          <div>
                            <div className="text-[10px] font-bold text-red-700 uppercase font-display mb-1">Previous Values</div>
                            <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 overflow-x-auto max-h-32">
                              {typeof oldVals === 'string' ? oldVals : JSON.stringify(oldVals, null, 2)}
                            </pre>
                          </div>
                        )}
                        {newVals && (
                          <div>
                            <div className="text-[10px] font-bold text-teal-800 uppercase font-display mb-1">New State</div>
                            <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 overflow-x-auto max-h-32">
                              {typeof newVals === 'string' ? newVals : JSON.stringify(newVals, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 disabled:opacity-40 font-semibold shadow-2xs">
                <ChevronLeft size={13} /> Previous
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 disabled:opacity-40 font-semibold shadow-2xs">
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLogsView;
