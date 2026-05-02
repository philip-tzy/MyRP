import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, RefreshCw, ShoppingBag, Factory, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMrpSuggestions, approveSuggestion, cancelSuggestion } from '../../services/api';
import { formatDate, suggStatusBadge, fmtNum } from '../../utils/helpers';
import { LoadingPage, EmptyState } from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';

const FILTERS = ['All', 'Pending', 'Firm', 'Cancelled'];

export default function SuggestionBoard() {
  const navigate = useNavigate();
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('Purchase');
  const [filter,    setFilter]    = useState('All');
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMrpSuggestions();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const byTab   = rows.filter(r => r.type === tab);
  const filtered = filter === 'All' ? byTab : byTab.filter(r => r.status === filter);

  const pendingCount  = rows.filter(r => r.status === 'Pending').length;
  const purchaseCount = rows.filter(r => r.type === 'Purchase').length;
  const jobCount      = rows.filter(r => r.type === 'Job').length;

  const handleApprove = async (row) => {
    setActioning(row.id);
    try {
      await approveSuggestion(row.id);
      toast.success(`${row.part?.part_number} approved!`);
      load();
    } finally { setActioning(null); }
  };

  const handleCancel = async (row) => {
    setActioning(row.id);
    try {
      await cancelSuggestion(row.id);
      toast.success('Suggestion cancelled');
      load();
    } finally { setActioning(null); }
  };

  return (
    <div>
      <PageHeader
        title="Suggestion Board"
        subtitle={`${rows.length} total suggestions · ${pendingCount} pending review`}
        actions={
          <button className="btn-secondary text-xs" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      <div className="p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><ListChecks size={18} className="text-amber-500" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-semibold text-gray-900">{pendingCount}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><ShoppingBag size={18} className="text-blue-500" /></div>
            <div><p className="text-xs text-gray-500">Purchase</p><p className="text-xl font-semibold text-gray-900">{purchaseCount}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><Factory size={18} className="text-purple-500" /></div>
            <div><p className="text-xs text-gray-500">Job Orders</p><p className="text-xl font-semibold text-gray-900">{jobCount}</p></div>
          </div>
        </div>

        {rows.length === 0 && !loading ? (
          <div className="card">
            <EmptyState icon={ListChecks}
              title="No suggestions yet"
              description="Run the MRP engine to generate purchase and job order suggestions."
              action={<button className="btn-primary" onClick={() => navigate('/mrp/engine')}>Go to MRP Engine</button>}
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center border-b border-gray-100 flex-wrap gap-0">
              {[
                { key: 'Purchase', icon: ShoppingBag, label: `Purchase (${purchaseCount})` },
                { key: 'Job',      icon: Factory,     label: `Job Orders (${jobCount})` },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
              <div className="ml-auto pr-4 flex gap-1">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <LoadingPage /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="th">Part No.</th>
                    <th className="th">Name</th>
                    <th className="th">Qty</th>
                    {tab === 'Purchase' && <th className="th">Supplier</th>}
                    {tab === 'Job'      && <th className="th">Type</th>}
                    <th className="th">Start Date</th>
                    <th className="th">Due Date</th>
                    <th className="th">Source SO</th>
                    <th className="th">Status</th>
                    <th className="th w-28">Action</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(row => (
                      <tr key={row.id} className={`tr-hover ${row.status === 'Cancelled' ? 'opacity-50' : ''}`}>
                        <td className="td font-mono text-xs font-semibold">{row.part?.part_number ?? '—'}</td>
                        <td className="td">{row.part?.name ?? '—'}</td>
                        <td className="td font-mono text-sm font-semibold">{fmtNum(row.order_qty)}</td>
                        {tab === 'Purchase' && <td className="td text-xs text-gray-500">{row.supplier?.name || '—'}</td>}
                        {tab === 'Job'      && <td className="td"><span className="badge-purple">{row.part?.type ?? '—'}</span></td>}
                        <td className="td text-xs">{formatDate(row.start_date)}</td>
                        <td className="td text-xs">{formatDate(row.due_date)}</td>
                        <td className="td font-mono text-xs text-gray-500">{row.source_so || '—'}</td>
                        <td className="td"><span className={suggStatusBadge(row.status)}>{row.status}</span></td>
                        <td className="td">
                          {row.status === 'Pending' && (
                            <div className="flex gap-1">
                              <button
                                className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-500 disabled:opacity-50"
                                onClick={() => handleApprove(row)} disabled={actioning === row.id} title="Approve">
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 disabled:opacity-50"
                                onClick={() => handleCancel(row)} disabled={actioning === row.id} title="Cancel">
                                <XCircle size={15} />
                              </button>
                            </div>
                          )}
                          {row.status === 'Firm' && (
                            <span className="text-xs text-brand-500 font-medium flex items-center gap-1">
                              <CheckCircle2 size={13} /> Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} className="td text-center text-gray-400 py-8">
                        No {tab} suggestions {filter !== 'All' ? `with status "${filter}"` : ''}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
