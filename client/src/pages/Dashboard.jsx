import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, ListChecks, AlertTriangle, ArrowRight } from 'lucide-react';
import { getParts, getSalesOrders, getMrpSuggestions } from '../services/api';
import { formatDate, soStatusBadge } from '../utils/helpers';
import { LoadingPage } from '../components/ui/Spinner';
import PageHeader from '../components/ui/PageHeader';

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="opacity-80" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [parts,       setParts]       = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, o, s] = await Promise.allSettled([
          getParts(),
          getSalesOrders(),
          getMrpSuggestions(),
        ]);
        setParts(      Array.isArray(p.value) ? p.value : []);
        setOrders(     Array.isArray(o.value) ? o.value : []);
        setSuggestions(Array.isArray(s.value) ? s.value : []);
      } catch (e) {
        // states stay as []
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingPage />;

  const safeParts       = Array.isArray(parts)       ? parts       : [];
  const safeOrders      = Array.isArray(orders)      ? orders      : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

  const lowStock   = safeParts.filter(p => (p.on_hand_qty ?? 0) <= 5);
  const openOrders = safeOrders.filter(o => o.status !== 'Shipped' && o.status !== 'Cancelled');
  const pending    = safeSuggestions.filter(s => s.status === 'Pending');

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Production planning overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package}       label="Total Parts"     value={safeParts.length}       sub={`${lowStock.length} low stock`} color="bg-blue-50 text-blue-500"   onClick={() => navigate('/master/parts')} />
          <StatCard icon={ShoppingCart}  label="Open Orders"     value={openOrders.length}      sub="unshipped"                      color="bg-amber-50 text-amber-500" onClick={() => navigate('/transactions/so')} />
          <StatCard icon={ListChecks}    label="MRP Suggestions" value={safeSuggestions.length} sub={`${pending.length} pending`}    color="bg-brand-50 text-brand-400" onClick={() => navigate('/mrp/suggestions')} />
          <StatCard icon={AlertTriangle} label="Stock Alerts"    value={lowStock.length}        sub="<=5 units on hand"              color="bg-red-50 text-red-400"     onClick={() => navigate('/master/parts')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Recent Sales Orders</h2>
              <button onClick={() => navigate('/transactions/so')} className="text-xs text-brand-400 hover:text-brand-600 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <table className="w-full">
              <thead><tr>
                <th className="th text-[11px]">SO Number</th>
                <th className="th text-[11px]">Customer</th>
                <th className="th text-[11px]">Due Date</th>
                <th className="th text-[11px]">Status</th>
              </tr></thead>
              <tbody>
                {safeOrders.slice(0, 5).map(o => (
                  <tr key={o.id} className="tr-hover" onClick={() => navigate(`/transactions/so/${o.id}`)}>
                    <td className="td font-mono text-xs">{o.so_number}</td>
                    <td className="td">{o.customer?.name || '—'}</td>
                    <td className="td text-xs">{formatDate(o.due_date)}</td>
                    <td className="td"><span className={soStatusBadge(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
                {safeOrders.length === 0 && (
                  <tr><td colSpan={4} className="td text-center text-gray-400 py-6">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Pending Suggestions</h2>
              <button onClick={() => navigate('/mrp/suggestions')} className="text-xs text-brand-400 hover:text-brand-600 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <table className="w-full">
              <thead><tr>
                <th className="th text-[11px]">Part</th>
                <th className="th text-[11px]">Type</th>
                <th className="th text-[11px]">Qty</th>
                <th className="th text-[11px]">Start Date</th>
              </tr></thead>
              <tbody>
                {pending.slice(0, 5).map(s => (
                  <tr key={s.id} className="tr-hover" onClick={() => navigate('/mrp/suggestions')}>
                    <td className="td font-mono text-xs">{s.part?.part_number ?? '—'}</td>
                    <td className="td"><span className={s.type === 'Purchase' ? 'badge-blue' : 'badge-purple'}>{s.type}</span></td>
                    <td className="td font-mono text-xs">{s.order_qty}</td>
                    <td className="td text-xs">{formatDate(s.start_date)}</td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr><td colSpan={4} className="td text-center text-gray-400 py-6">
                    No pending suggestions — run MRP to generate
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="card p-4 border-l-4 border-red-400">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Low stock alert</p>
                <div className="flex flex-wrap gap-2">
                  {lowStock.map(p => (
                    <span key={p.id}
                      className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-100"
                      onClick={() => navigate(`/master/parts/${p.id}`)}>
                      {p.part_number} ({p.on_hand_qty} {p.uom})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
