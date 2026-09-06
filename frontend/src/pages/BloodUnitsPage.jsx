import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Droplets, AlertTriangle } from 'lucide-react';
import { getBloodUnits, createBloodUnit, updateBloodUnit, deleteBloodUnit, getBloodBanks } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BloodGroupBadge, StatusBadge, ExpiryBadge, formatDate } from '../components/Badges';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const STATUSES = ['Available','Reserved','Used','Expired','Discarded'];
const EMPTY = { bank_id:'', unit_code:'', blood_group:'O+', volume_ml:450, collected_date:'', expiry_date:'', status:'Available', storage_temp:4.0 };

export default function BloodUnitsPage() {
  const toast = useToast();
  const [units,   setUnits]   = useState([]);
  const [banks,   setBanks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [bgFilter,setBgFilter]= useState('');
  const [stFilter,setStFilter]= useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getBloodUnits(), getBloodBanks()])
      .then(([u,b]) => { setUnits(u.data); setBanks(b.data); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() =>
    units.filter(u => {
      const q = search.toLowerCase();
      const m = !q || [u.unit_code, u.bank_name, u.blood_group].some(v=>v?.toLowerCase().includes(q));
      return m && (!bgFilter||u.blood_group===bgFilter) && (!stFilter||u.status===stFilter);
    }), [units, search, bgFilter, stFilter]);

  const openAdd  = ()    => setModal({ open:true, mode:'add', data:{ ...EMPTY, bank_id: banks[0]?.bank_id||'' } });
  const openEdit = (row) => setModal({ open:true, mode:'edit', data:{
    ...row,
    collected_date: row.collected_date?.split('T')[0]||'',
    expiry_date:    row.expiry_date?.split('T')[0]||''
  }});
  const closeModal = () => setModal(m=>({...m,open:false}));

  const handleSave = async () => {
    const { data, mode } = modal;
    if (!data.bank_id||!data.unit_code||!data.collected_date||!data.expiry_date) {
      toast.error('Bank, unit code, collected date and expiry date are required.'); return;
    }
    setSaving(true);
    try {
      if (mode==='add') { await createBloodUnit(data); toast.success('Blood unit added!'); }
      else { await updateBloodUnit(data.unit_id, data); toast.success('Blood unit updated!'); }
      closeModal(); load();
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteBloodUnit(id); toast.success('Unit deleted.'); setConfirm(null); load(); }
    catch(e) { toast.error(e.message); }
  };

  const f   = modal.data;
  const set = (k,v) => setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns = [
    { key:'unit_code',      label:'Unit Code',     sortable:true, render:v=><span className="font-mono text-sm">{v}</span> },
    { key:'bank_name',      label:'Blood Bank',    sortable:true },
    { key:'blood_group',    label:'Blood Group',   sortable:true, render:v=><BloodGroupBadge group={v}/> },
    { key:'volume_ml',      label:'Volume',        render:v=>`${v} mL` },
    { key:'collected_date', label:'Collected',     render:v=>formatDate(v) },
    { key:'expiry_date',    label:'Expiry',        render:v=>formatDate(v) },
    { key:'days_to_expiry', label:'Expiry Status', render:v=><ExpiryBadge days={v}/> },
    { key:'status',         label:'Status',        sortable:true, render:v=><StatusBadge status={v}/> },
    { key:'unit_id',        label:'Actions',       render:(_,row)=>(
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(row)}><Pencil size={14}/></button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={()=>setConfirm(row)}><Trash2 size={14}/></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Droplets size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--crimson)'}}/>Blood Units</h1>
          <p className="page-subtitle">{units.filter(u=>u.status==='Available').length} available · {units.filter(u=>u.status==='Expired').length} expired</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Unit</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}>
          <Search className="search-icon"/>
          <input className="search-input" placeholder="Search unit code, bank…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:150}} value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
        </select>
        <select className="form-select" style={{width:140}} value={stFilter} onChange={e=>setStFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner"/><span>Loading blood units…</span></div>
        : <DataTable columns={columns} data={filtered} emptyMessage="No blood units found." />
      }

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Add Blood Unit':'Edit Blood Unit'}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:'Save'}
          </button>
        </>}
      >
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Blood Bank <span className="required">*</span></label>
            <select className="form-select" value={f.bank_id} onChange={e=>set('bank_id',e.target.value)}>
              <option value="">Select bank…</option>
              {banks.map(b=><option key={b.bank_id} value={b.bank_id}>{b.name} — {b.city}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit Code <span className="required">*</span></label>
            <input className="form-input font-mono" value={f.unit_code} onChange={e=>set('unit_code',e.target.value)} placeholder="BU-MUM-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select className="form-select" value={f.blood_group} onChange={e=>set('blood_group',e.target.value)}>
              {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Volume (mL)</label>
            <input className="form-input" type="number" value={f.volume_ml} onChange={e=>set('volume_ml',parseInt(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={f.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Collected Date <span className="required">*</span></label>
            <input className="form-input" type="date" value={f.collected_date} onChange={e=>set('collected_date',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date <span className="required">*</span></label>
            <input className="form-input" type="date" value={f.expiry_date} onChange={e=>set('expiry_date',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Storage Temp (°C)</label>
            <input className="form-input" type="number" step="0.1" value={f.storage_temp} onChange={e=>set('storage_temp',parseFloat(e.target.value))} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Blood Unit"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={()=>handleDelete(confirm?.unit_id)}>Delete</button>
        </>}
      >
        <div className="flex gap-3" style={{alignItems:'flex-start'}}>
          <AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div>
            <div className="font-semibold text-primary">Delete unit "{confirm?.unit_code}"?</div>
            <div className="text-secondary text-sm mt-4">This action cannot be undone.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
