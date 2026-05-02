import { useEffect, useState } from 'react';
import { Warehouse, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getParts, adjustInventory } from '../../services/api';
import { fmtNum } from '../../utils/helpers';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { LoadingPage } from '../../components/ui/Spinner';

export default function Inventory() {
  const [parts,   setParts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ part_id: '', qty_change: 0, reason: '', dir: 'add' });
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getParts();
      setParts(Array.isArray(data) ? data : []);
    } catch (e) { setParts([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = parts.filter(p =>
    p.part_number.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdj = (p, dir) => {
    setForm({ part_id: p.id, qty_change: 0, reason: '', dir });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.part_id || form.qty_change <= 0) return toast.error('Enter a valid quantity');
    const qty = form.dir === 'add' ? form.qty_change : -form.qty_change;
    setSaving(true);
    try {
      const res = await adjustInventory({ part_id: form.part_id, qty_change: qty, reason: form.reason });
      const part = parts.find(p => p.id === form.part_id);
      toast.success(`${part?.part_number} updated to ${fmtNum(res?.new_qty ?? '?')} on hand`);
      setModal(false);
      load();
    } catch (e) {
      // toast already shown
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Inventory Adjustment" subtitle="Sync physical stock with system" />
      <div className="p-6">
        <div className="mb-4">
          <input className="input max-w-sm" placeholder="Search parts..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="card overflow-hidden">
          {loading ? <LoadingPage /> : (
            <table className="w-full">
              <thead><tr>
                <th className="th">Part No.</th><th className="th">Name</th>
                <th className="th">Type</th><th className="th">On Hand</th>
                <th className="th">UoM</th><th className="th w-36">Adjust</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="tr-hover">
                    <td className="td font-mono text-xs font-medium">{p.part_number}</td>
                    <td className="td">{p.name}</td>
                    <td className="td text-xs text-gray-500">{p.type}</td>
                    <td className="td">
                      <span className={`font-mono font-semibold text-sm ${(p.on_hand_qty ?? 0) <= 5 ? 'text-red-500' : 'text-gray-800'}`}>
                        {fmtNum(p.on_hand_qty)}
                      </span>
                    </td>
                    <td className="td text-gray-500">{p.uom}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="btn-secondary text-xs py-1 px-2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => openAdj(p, 'add')}>
                          <Plus size={12} /> Add
                        </button>
                        <button className="btn-secondary text-xs py-1 px-2 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => openAdj(p, 'remove')}>
                          <Minus size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} className="td text-center text-gray-400 py-8">No parts found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} size="sm"
        title={form.dir === 'add' ? 'Add Stock' : 'Remove Stock'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className={form.dir === 'add' ? 'btn-primary' : 'btn-danger'} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (form.dir === 'add' ? 'Add Stock' : 'Remove Stock')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Part</label>
            <select className="input" value={form.part_id} onChange={e => setForm(f => ({ ...f, part_id: e.target.value }))}>
              <option value="">— Select part —</option>
              {parts.map(p => <option key={p.id} value={p.id}>{p.part_number} — {p.name} (On hand: {p.on_hand_qty})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input className="input" type="number" min="1" value={form.qty_change}
              onChange={e => setForm(f => ({ ...f, qty_change: +e.target.value }))} />
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input" placeholder="e.g. Physical count, goods receipt..." value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
