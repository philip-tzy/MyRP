import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSalesOrders, deleteSalesOrder, updateSalesOrder } from '../../services/api';
import { formatDate, soStatusBadge } from '../../utils/helpers';
import PageHeader from '../../components/ui/PageHeader';
import { LoadingPage, EmptyState } from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const STATUS_OPTIONS = ['Draft','Confirmed','Shipped','Cancelled'];

export default function SalesOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSalesOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { setOrders([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o =>
    o.so_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (o) => {
    await deleteSalesOrder(o.id);
    toast.success('Sales order deleted');
    load();
  };

  const handleStatusChange = async (o, status) => {
    await updateSalesOrder(o.id, { status });
    toast.success(`Status updated to ${status}`);
    load();
  };

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle={`${orders.length} orders`}
        actions={<button className="btn-primary" onClick={() => navigate('/transactions/so/new')}><Plus size={15} /> Create SO</button>} />
      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search size={15} className="text-gray-400" />
            <input className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              placeholder="Search by SO number or customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <LoadingPage /> : (
            <table className="w-full">
              <thead><tr>
                <th className="th">SO Number</th><th className="th">Customer</th>
                <th className="th">Order Date</th><th className="th">Due Date</th>
                <th className="th">Status</th><th className="th w-20"></th>
              </tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="tr-hover" onClick={() => navigate(`/transactions/so/${o.id}`)}>
                    <td className="td font-mono text-xs font-semibold">{o.so_number}</td>
                    <td className="td font-medium">{o.customer?.name || '—'}</td>
                    <td className="td text-xs">{formatDate(o.order_date)}</td>
                    <td className="td text-xs">{formatDate(o.due_date)}</td>
                    <td className="td" onClick={e => e.stopPropagation()}>
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                        value={o.status}
                        onChange={e => handleStatusChange(o, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="td" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 items-center">
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          onClick={() => setConfirm(o)}><Trash2 size={13} /></button>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6}><EmptyState icon={ShoppingCart} title="No orders found"
                    description="Create your first sales order to get started."
                    action={<button className="btn-primary" onClick={() => navigate('/transactions/so/new')}><Plus size={14}/> Create SO</button>} /></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title="Delete Sales Order" message={`Delete "${confirm?.so_number}"? This cannot be undone.`} />
    </div>
  );
}
