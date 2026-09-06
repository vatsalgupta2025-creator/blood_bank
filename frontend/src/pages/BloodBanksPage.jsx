import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, AlertTriangle } from 'lucide-react';
import { getBloodBanks, createBloodBank, updateBloodBank, deleteBloodBank } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const EMPTY = { name:'', address:'', city:'', state:'', phone:'', email:'', capacity:'', established:'' };

export default function BloodBanksPage() {
  const toast = useToast();
  const [banks,   setBanks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState({ open: false, mode: 'add', data: EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getBloodBanks()
      .then(r => setBanks(r.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() =>
    banks.filter(b =>
      [b.name, b.city, b.state, b.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    ), [banks, search]);

  const openAdd  = ()    => setModal({ open:true, mode:'add',  data: EMPTY });
  const openEdit = (row) => setModal({ open:true, mode:'edit', data: { ...row, established: row.established?.split('T')[0] || '' } });
  const closeModal = ()  => setModal(m => ({ ...m, open: false }));

  const handleSave = async () => {
    const { data, mode } = modal;
    if (!data.name || !data.city || !data.email) { toast.error('Name, city and email are required.'); return; }
    setSaving(true);
    try {
      if (mode === 'add') {
        await createBloodBank(data);
        toast.success('Blood bank added!');
      } else {
        await updateBloodBank(data.bank_id, data);
        toast.success('Blood bank updated!');
      }
      closeModal();
      load();
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBloodBank(id);
      toast.success('Blood bank deleted.');
      setConfirm(null);
      load();
    } catch(e) { toast.error(e.message); }
  };

  const columns = [
    { key:'name',      label:'Name',     sortable:true, render:(v)=><strong>{v}</strong> },
    { key:'city',      label:'City',     sortable:true },
    { key:'state',     label:'State',    sortable:true },
    { key:'phone',     label:'Phone' },
    { key:'email',     label:'Email',    render:(v)=><span className="font-mono text-sm">{v}</span> },
    { key:'capacity',  label:'Capacity', sortable:true, render:(v)=>`${v} units` },
    { key:'bank_id',   label:'Actions',  render:(_,row)=>(
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(row)} aria-label="Edit"><Pencil size={14}/></button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm(row)} aria-label="Delete"><Trash2 size={14}/></button>
      </div>
    )},
  ];

  const f = modal.data;
  const set = (k,v) => setModal(m => ({ ...m, data: { ...m.data, [k]:v } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Building2 size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--info)'}}/>Blood Banks</h1>
          <p className="page-subtitle">{banks.length} registered blood banks across India</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Blood Bank</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" />
          <input className="search-input" placeholder="Search by name, city, state…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner"/><span>Loading banks…</span></div>
        : <DataTable columns={columns} data={filtered} emptyMessage="No blood banks found." />
      }

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Add Blood Bank':'Edit Blood Bank'}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" style={{width:14,height:14}}/> Saving…</> : 'Save'}
          </button>
        </>}
      >
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Name <span className="required">*</span></label>
            <input className="form-input" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="City Central Blood Bank" />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Address</label>
            <input className="form-input" value={f.address} onChange={e=>set('address',e.target.value)} placeholder="Street address" />
          </div>
          <div className="form-group">
            <label className="form-label">City <span className="required">*</span></label>
            <input className="form-input" value={f.city} onChange={e=>set('city',e.target.value)} placeholder="Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={f.state} onChange={e=>set('state',e.target.value)} placeholder="Maharashtra" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91-22-12345678" />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input className="form-input" type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="info@bloodbank.org" />
          </div>
          <div className="form-group">
            <label className="form-label">Capacity (units)</label>
            <input className="form-input" type="number" value={f.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="500" />
          </div>
          <div className="form-group">
            <label className="form-label">Established</label>
            <input className="form-input" type="date" value={f.established} onChange={e=>set('established',e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Confirm Delete"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={()=>handleDelete(confirm?.bank_id)}>Delete</button>
        </>}
      >
        <div className="flex gap-3" style={{alignItems:'flex-start'}}>
          <AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}} />
          <div>
            <div className="font-semibold text-primary">Delete "{confirm?.name}"?</div>
            <div className="text-secondary text-sm mt-4">This will also delete all staff, blood units, donation events, and requests linked to this blood bank. This action cannot be undone.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
