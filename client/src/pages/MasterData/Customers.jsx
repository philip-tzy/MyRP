import { useEffect, useState } from 'react';
import { Plus, Search, Users, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { LoadingPage, EmptyState } from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const EMPTY = { code: '', name: '', city: '', contact: '', email: '' };

export default function Customers() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ code: r.code, name: r.name, city: r.city||'', contact: r.contact||'', email: r.email||'' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) return toast.error('Code and name are required');
    setSaving(true);
    try {
      if (editing) { await updateCustomer(editing.id, form); toast.success('Customer updated!'); }
      else         { await createCustomer(form);              toast.success('Customer created!'); }
      setModal(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    await deleteCustomer(r.id);
    toast.success('Customer deleted');
    load();
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${rows.length} customers`}
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Customer</button>} />

      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search size={15} className="text-gray-400" />
            <input className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <LoadingPage /> : (
            <table className="w-full">
              <thead><tr>
                <th className="th">Code</th><th className="th">Company Name</th>
                <th className="th">City</th><th className="th">Contact</th>
                <th className="th">Email</th><th className="th w-20"></th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="tr-hover">
                    <td className="td font-mono text-xs font-medium">{r.code}</td>
                    <td className="td font-medium">{r.name}</td>
                    <td className="td text-gray-500">{r.city || '—'}</td>
                    <td className="td">{r.contact || '—'}</td>
                    <td className="td text-blue-500 text-xs">{r.email || '—'}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" onClick={() => openEdit(r)}><Pencil size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" onClick={() => setConfirm(r)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6}><EmptyState icon={Users} title="No customers found" /></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Code *</label><input className="input" placeholder="CUST-004" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))}/></div>
            <div><label className="label">City</label><input className="input" placeholder="Jakarta" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))}/></div>
          </div>
          <div><label className="label">Company Name *</label><input className="input" placeholder="PT Example Jaya" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Contact Person</label><input className="input" placeholder="John Doe" value={form.contact} onChange={e => setForm(f=>({...f,contact:e.target.value}))}/></div>
          <div><label className="label">Email</label><input className="input" type="email" placeholder="hello@company.co.id" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title="Delete Customer" message={`Delete "${confirm?.name}"?`} />
    </div>
  );
}
