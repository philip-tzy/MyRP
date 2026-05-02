import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getParts, createPart, deletePart } from '../../services/api';
import { partTypeBadge, fmtNum } from '../../utils/helpers';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { LoadingPage, EmptyState } from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useStore from '../../store/useStore';

const EMPTY_FORM = {
  part_number: '', name: '', type: 'Raw Material',
  uom: 'EA', on_hand_qty: 0, lot_size: 1, lead_time_days: 1,
};

export default function PartsMaster() {
  const navigate = useNavigate();
  const setPartsCache = useStore(s => s.setPartsCache);

  const [parts,   setParts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getParts();
      const safe = Array.isArray(data) ? data : [];
      setParts(safe);
      setPartsCache(safe);
    } catch (e) {
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = parts.filter(p =>
    p.part_number.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.part_number || !form.name) return toast.error('Part number and name are required');
    setSaving(true);
    try {
      await createPart(form);
      toast.success('Part created!');
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    await deletePart(p.id);
    toast.success(`${p.part_number} deleted`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Parts Master"
        subtitle={`${parts.length} parts registered`}
        actions={
          <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
            <Plus size={15} /> Add New Part
          </button>
        }
      />

      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              placeholder="Search by part number, name or type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            )}
          </div>

          {loading ? <LoadingPage /> : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Part No.</th>
                  <th className="th">Name</th>
                  <th className="th">Type</th>
                  <th className="th">UoM</th>
                  <th className="th">Lead Time</th>
                  <th className="th">Lot Size</th>
                  <th className="th">On Hand</th>
                  <th className="th">Status</th>
                  <th className="th w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="tr-hover" onClick={() => navigate(`/master/parts/${p.id}`)}>
                    <td className="td font-mono text-xs font-medium">{p.part_number}</td>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td"><span className={partTypeBadge(p.type)}>{p.type}</span></td>
                    <td className="td text-gray-500">{p.uom}</td>
                    <td className="td">{p.lead_time_days} days</td>
                    <td className="td font-mono text-xs">{fmtNum(p.lot_size)}</td>
                    <td className="td">
                      <span className={`font-mono text-xs font-semibold ${(p.on_hand_qty ?? 0) <= 5 ? 'text-red-500' : 'text-gray-800'}`}>
                        {fmtNum(p.on_hand_qty)}
                      </span>
                    </td>
                    <td className="td">
                      <span className={p.status === 'Active' ? 'badge-green' : 'badge-gray'}>{p.status}</span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={e => { e.stopPropagation(); setConfirm(p); }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState icon={Package} title="No parts found" description="Try adjusting your search or add a new part." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add New Part"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Part'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Part Number *</label>
              <input className="input" placeholder="e.g. RM-150" value={form.part_number}
                onChange={e => setForm(f => ({ ...f, part_number: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="label">UoM *</label>
              <select className="input" value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}>
                {['EA','kg','m','ltr','box','roll','set'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Part Name *</label>
            <input className="input" placeholder="Description of the part" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['Raw Material','Sub-Assembly','Finished Good'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Lead Time (days)</label>
              <input className="input" type="number" min="0" value={form.lead_time_days}
                onChange={e => setForm(f => ({ ...f, lead_time_days: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Lot Size</label>
              <input className="input" type="number" min="1" value={form.lot_size}
                onChange={e => setForm(f => ({ ...f, lot_size: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Initial Stock</label>
              <input className="input" type="number" min="0" value={form.on_hand_qty}
                onChange={e => setForm(f => ({ ...f, on_hand_qty: +e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title="Delete Part"
        message={`Are you sure you want to delete "${confirm?.part_number} - ${confirm?.name}"? This will also remove all associated BOM and BOO data.`}
      />
    </div>
  );
}
