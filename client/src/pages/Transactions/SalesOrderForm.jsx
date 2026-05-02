import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSalesOrder, createSalesOrder, getCustomers, getParts } from '../../services/api';
import { genSoNumber } from '../../utils/helpers';
import { LoadingPage } from '../../components/ui/Spinner';

const emptyLine = () => ({ part_id: '', order_qty: 1, _key: Math.random() });

export default function SalesOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';

  const [customers, setCustomers] = useState([]);
  const [parts,     setParts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    customer_id: '',
    so_number:   genSoNumber(),
    order_date:  new Date().toISOString().split('T')[0],
    due_date:    '',
    notes:       '',
  });
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [c, p] = await Promise.allSettled([getCustomers(), getParts()]);
        setCustomers(Array.isArray(c.value) ? c.value : []);
        setParts(Array.isArray(p.value) ? p.value : []);

        if (isEdit) {
          const so = await getSalesOrder(id);
          if (so) {
            setForm({
              customer_id: so.customer_id || '',
              so_number:   so.so_number   || '',
              order_date:  so.order_date  || '',
              due_date:    so.due_date    || '',
              notes:       so.notes       || '',
            });
            const soLines = Array.isArray(so.lines) ? so.lines : [];
            setLines(soLines.length > 0
              ? soLines.map(l => ({ part_id: l.part_id, order_qty: l.order_qty, _key: Math.random() }))
              : [emptyLine()]
            );
          }
        }
      } catch (e) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addLine    = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (key) => setLines(l => l.filter(x => x._key !== key));
  const setLine    = (key, field, val) =>
    setLines(l => l.map(x => x._key === key ? { ...x, [field]: val } : x));

  const partName = (pid) => parts.find(p => p.id === pid)?.name || '';
  const partUom  = (pid) => parts.find(p => p.id === pid)?.uom  || '';

  const handleSave = async () => {
    if (!form.customer_id) return toast.error('Select a customer');
    if (!form.due_date)    return toast.error('Due date is required');
    const validLines = lines.filter(l => l.part_id && l.order_qty > 0);
    if (validLines.length === 0) return toast.error('Add at least one order line');

    setSaving(true);
    try {
      await createSalesOrder({ ...form, lines: validLines });
      toast.success('Sales order saved!');
      navigate('/transactions/so');
    } catch (e) {
      // toast already shown by interceptor
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate('/transactions/so')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {isEdit ? `Edit ${form.so_number}` : 'Create Sales Order'}
        </h1>
      </div>

      <div className="p-6 space-y-5 max-w-5xl">
        {/* Header fields */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Header</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">SO Number</label>
              <input className="input font-mono text-xs" value={form.so_number}
                onChange={e => setForm(f => ({ ...f, so_number: e.target.value }))} />
            </div>
            <div>
              <label className="label">Customer *</label>
              <select className="input" value={form.customer_id}
                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Order Date</label>
              <input className="input" type="date" value={form.order_date}
                onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {/* Order lines */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Order Lines</h2>
            <span className="text-xs text-gray-400">{lines.filter(l => l.part_id).length} item(s)</span>
          </div>
          <table className="w-full">
            <thead><tr>
              <th className="th">Part</th>
              <th className="th">Description</th>
              <th className="th w-28">Qty</th>
              <th className="th w-16">UoM</th>
              <th className="th w-10"></th>
            </tr></thead>
            <tbody>
              {lines.map(line => (
                <tr key={line._key}>
                  <td className="td">
                    <select className="input text-xs font-mono" value={line.part_id}
                      onChange={e => setLine(line._key, 'part_id', e.target.value)}>
                      <option value="">— Select part —</option>
                      {parts.map(p => <option key={p.id} value={p.id}>{p.part_number}</option>)}
                    </select>
                  </td>
                  <td className="td text-sm text-gray-500 italic">{partName(line.part_id) || '—'}</td>
                  <td className="td">
                    <input className="input text-xs font-mono" type="number" min="1" value={line.order_qty}
                      onChange={e => setLine(line._key, 'order_qty', +e.target.value)} />
                  </td>
                  <td className="td text-xs text-gray-500">{partUom(line.part_id) || '—'}</td>
                  <td className="td">
                    <button className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                      onClick={() => removeLine(line._key)} disabled={lines.length === 1}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-50">
            <button className="btn-secondary text-xs" onClick={addLine}>
              <Plus size={13} /> Add Item
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => navigate('/transactions/so')}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
