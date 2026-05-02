import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Settings, GitBranch, Wrench, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPart, getBOM, addBOMLine, deleteBOMLine,
  getBOO, addBOOStep, deleteBOOStep, getParts,
} from '../../services/api';
import { partTypeBadge, fmtNum } from '../../utils/helpers';
import { LoadingPage } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function PartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [part,     setPart]     = useState(null);
  const [bom,      setBom]      = useState([]);
  const [boo,      setBoo]      = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [tab,      setTab]      = useState('info');
  const [loading,  setLoading]  = useState(true);

  const [bomModal,  setBomModal]  = useState(false);
  const [bomForm,   setBomForm]   = useState({ child_part_id: '', qty_per: 1 });
  const [bomSaving, setBomSaving] = useState(false);

  const [booModal,  setBooModal]  = useState(false);
  const [booForm,   setBooForm]   = useState({ step_no: 10, operation: '', work_center: '', time_minutes: 0 });
  const [booSaving, setBooSaving] = useState(false);

  const [confirmBom, setConfirmBom] = useState(null);
  const [confirmBoo, setConfirmBoo] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, b, o, ap] = await Promise.allSettled([
        getPart(id), getBOM(id), getBOO(id), getParts()
      ]);
      setPart(p.value ?? null);
      setBom(Array.isArray(b.value) ? b.value : []);
      setBoo(Array.isArray(o.value) ? o.value : []);
      setAllParts((Array.isArray(ap.value) ? ap.value : []).filter(x => x.id !== id));
    } catch (e) {
      toast.error('Failed to load part data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleAddBom = async () => {
    if (!bomForm.child_part_id) return toast.error('Select a child part');
    setBomSaving(true);
    try {
      await addBOMLine(id, bomForm);
      toast.success('BOM line added!');
      setBomModal(false);
      setBomForm({ child_part_id: '', qty_per: 1 });
      const b = await getBOM(id);
      setBom(Array.isArray(b) ? b : []);
    } finally { setBomSaving(false); }
  };

  const handleDeleteBom = async (line) => {
    await deleteBOMLine(id, line.id);
    toast.success('BOM line removed');
    const b = await getBOM(id);
    setBom(Array.isArray(b) ? b : []);
  };

  const handleAddBoo = async () => {
    if (!booForm.operation || !booForm.work_center) return toast.error('Operation and work center required');
    setBooSaving(true);
    try {
      await addBOOStep(id, booForm);
      toast.success('Operation step added!');
      setBooModal(false);
      const o = await getBOO(id);
      setBoo(Array.isArray(o) ? o : []);
      setBooForm({ step_no: (boo.length + 2) * 10, operation: '', work_center: '', time_minutes: 0 });
    } finally { setBooSaving(false); }
  };

  const handleDeleteBoo = async (step) => {
    await deleteBOOStep(id, step.id);
    toast.success('Step removed');
    const o = await getBOO(id);
    setBoo(Array.isArray(o) ? o : []);
  };

  if (loading) return <LoadingPage />;
  if (!part)   return (
    <div className="p-6">
      <button onClick={() => navigate('/master/parts')} className="btn-secondary mb-4"><ArrowLeft size={14}/> Back</button>
      <p className="text-gray-500">Part not found.</p>
    </div>
  );

  const tabs = [
    { key: 'info', label: 'Info',             icon: Package },
    { key: 'bom',  label: `BOM (${bom.length})`, icon: GitBranch },
    { key: 'boo',  label: `BOO (${boo.length})`, icon: Wrench },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate('/master/parts')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Settings size={20} className="text-blue-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900">{part.name}</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {part.part_number} · {part.type} · Lead Time: {part.lead_time_days}d · Lot Size: {part.lot_size}
          </p>
        </div>
        <span className={partTypeBadge(part.type)}>{part.type}</span>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex px-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* INFO TAB */}
        {tab === 'info' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'On Hand Qty', value: `${fmtNum(part.on_hand_qty)} ${part.uom}`, color: (part.on_hand_qty ?? 0) <= 5 ? 'text-red-500' : 'text-gray-900' },
              { label: 'Lot Size',    value: fmtNum(part.lot_size),     color: 'text-gray-900' },
              { label: 'Lead Time',   value: `${part.lead_time_days} days`, color: 'text-gray-900' },
              { label: 'Status',      value: part.status,               color: part.status === 'Active' ? 'text-green-600' : 'text-gray-500' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* BOM TAB */}
        {tab === 'bom' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Bill of Materials</h2>
              <button className="btn-primary text-xs" onClick={() => setBomModal(true)}>
                <Plus size={13} /> Add Material
              </button>
            </div>
            <table className="w-full">
              <thead><tr>
                <th className="th">Child Part No.</th><th className="th">Name</th>
                <th className="th">Type</th><th className="th">Qty Per</th>
                <th className="th">UoM</th><th className="th w-12"></th>
              </tr></thead>
              <tbody>
                {bom.map(line => (
                  <tr key={line.id} className="tr-hover">
                    <td className="td font-mono text-xs font-medium">{line.child?.part_number ?? '—'}</td>
                    <td className="td">{line.child?.name ?? '—'}</td>
                    <td className="td"><span className={partTypeBadge(line.child?.type ?? '')}>{line.child?.type ?? '—'}</span></td>
                    <td className="td font-mono text-xs font-semibold">{line.qty_per}</td>
                    <td className="td text-gray-500">{line.child?.uom ?? '—'}</td>
                    <td className="td">
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        onClick={() => setConfirmBom(line)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {bom.length === 0 && (
                  <tr><td colSpan={6} className="td text-center text-gray-400 py-8">
                    No BOM lines yet. Add materials to define the recipe.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BOO TAB */}
        {tab === 'boo' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Bill of Operations</h2>
              <button className="btn-primary text-xs" onClick={() => {
                setBooForm({ step_no: (boo.length + 1) * 10, operation: '', work_center: '', time_minutes: 0 });
                setBooModal(true);
              }}><Plus size={13} /> Add Step</button>
            </div>
            <table className="w-full">
              <thead><tr>
                <th className="th">Step</th><th className="th">Operation</th>
                <th className="th">Work Center</th><th className="th">Time (min)</th>
                <th className="th w-12"></th>
              </tr></thead>
              <tbody>
                {boo.map(step => (
                  <tr key={step.id} className="tr-hover">
                    <td className="td font-mono text-xs font-semibold">{step.step_no}</td>
                    <td className="td font-medium">{step.operation}</td>
                    <td className="td font-mono text-xs">{step.work_center}</td>
                    <td className="td font-mono text-xs">{step.time_minutes}</td>
                    <td className="td">
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        onClick={() => setConfirmBoo(step)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {boo.length === 0 && (
                  <tr><td colSpan={5} className="td text-center text-gray-400 py-8">No operation steps yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOM Modal */}
      <Modal open={bomModal} onClose={() => setBomModal(false)} title="Add BOM Line" size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setBomModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAddBom} disabled={bomSaving}>{bomSaving ? 'Saving...' : 'Add Material'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Child Part *</label>
            <select className="input" value={bomForm.child_part_id}
              onChange={e => setBomForm(f => ({ ...f, child_part_id: e.target.value }))}>
              <option value="">— Select part —</option>
              {allParts.map(p => <option key={p.id} value={p.id}>{p.part_number} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Qty Per (per unit of parent)</label>
            <input className="input" type="number" min="0.001" step="0.001" value={bomForm.qty_per}
              onChange={e => setBomForm(f => ({ ...f, qty_per: +e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* BOO Modal */}
      <Modal open={booModal} onClose={() => setBooModal(false)} title="Add Operation Step" size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setBooModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAddBoo} disabled={booSaving}>{booSaving ? 'Saving...' : 'Add Step'}</button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Step No.</label>
              <input className="input" type="number" min="1" step="10" value={booForm.step_no}
                onChange={e => setBooForm(f => ({ ...f, step_no: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Time (minutes)</label>
              <input className="input" type="number" min="0" value={booForm.time_minutes}
                onChange={e => setBooForm(f => ({ ...f, time_minutes: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Operation *</label>
            <input className="input" placeholder="e.g. Assembly, Welding, QC" value={booForm.operation}
              onChange={e => setBooForm(f => ({ ...f, operation: e.target.value }))} />
          </div>
          <div>
            <label className="label">Work Center *</label>
            <input className="input" placeholder="e.g. WC-ASSY-01" value={booForm.work_center}
              onChange={e => setBooForm(f => ({ ...f, work_center: e.target.value.toUpperCase() }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmBom} onClose={() => setConfirmBom(null)}
        onConfirm={() => handleDeleteBom(confirmBom)}
        title="Remove BOM Line" message={`Remove "${confirmBom?.child?.part_number}" from this BOM?`} />
      <ConfirmDialog open={!!confirmBoo} onClose={() => setConfirmBoo(null)}
        onConfirm={() => handleDeleteBoo(confirmBoo)}
        title="Remove Operation Step" message={`Remove step ${confirmBoo?.step_no} — "${confirmBoo?.operation}"?`} />
    </div>
  );
}
