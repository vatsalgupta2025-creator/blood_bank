import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Users, AlertTriangle } from 'lucide-react';
import { getDonors, createDonor, updateDonor, deleteDonor } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BloodGroupBadge, GenderBadge, EligibilityBadge, formatDate } from '../components/Badges';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const EMPTY = { first_name:'', last_name:'', dob:'', gender:'Male', blood_group:'O+', phone:'', email:'', street:'', city:'', state:'', is_eligible:1 };

export default function DonorsPage() {
  const toast = useToast();
  const [donors,  setDonors]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [bgFilter,setBgFilter]= useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getDonors()
      .then(r => setDonors(r.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() =>
    donors.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || [d.first_name, d.last_name, d.phone, d.city, d.blood_group]
        .some(v => v?.toLowerCase().includes(q));
      const matchBg = !bgFilter || d.blood_group === bgFilter;
      return matchSearch && matchBg;
    }), [donors, search, bgFilter]);

  const openAdd  = ()    => setModal({ open:true, mode:'add', data:EMPTY });
  const openEdit = (row) => setModal({ open:true, mode:'edit', data:{ ...row, dob:row.dob?.split('T')[0]||'' }});
  const closeModal = ()  => setModal(m=>({...m, open:false}));

  const handleSave = async () => {
    const { data, mode } = modal;
    if (!data.first_name || !data.blood_group || !data.phone) { toast.error('First name, blood group, and phone are required.'); return; }
    setSaving(true);
    try {
      if (mode === 'add') { await createDonor(data); toast.success('Donor added!'); }
      else { await updateDonor(data.donor_id, data); toast.success('Donor updated!'); }
      closeModal(); load();
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteDonor(id); toast.success('Donor deleted.'); setConfirm(null); load(); }
    catch(e) { toast.error(e.message); }
  };

  const f   = modal.data;
  const set = (k,v) => setModal(m=>({...m, data:{...m.data,[k]:v}}));

  const columns = [
    { key:'donor_id',        label:'ID',         sortable:true, render:v=><span className="font-mono text-xs text-muted">#{v}</span> },
    { key:'first_name',      label:'Name',        sortable:true, render:(_,row)=><strong>{row.first_name} {row.last_name}</strong> },
    { key:'blood_group',     label:'Blood Group', sortable:true, render:v=><BloodGroupBadge group={v}/> },
    { key:'age',             label:'Age',         sortable:true, render:v=>`${v} yrs` },
    { key:'gender',          label:'Gender',      render:v=><GenderBadge gender={v}/> },
    { key:'phone',           label:'Phone' },
    { key:'city',            label:'City',        sortable:true },
    { key:'total_donations', label:'Donations',   sortable:true, render:v=><span className="badge badge-info">{v}</span> },
    { key:'last_donation',   label:'Last Donated',render:v=>formatDate(v) },
    { key:'is_eligible',     label:'Status',      render:v=><EligibilityBadge eligible={v}/> },
    { key:'donor_id',        label:'Actions',     render:(_,row)=>(
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
          <h1 className="page-title"><Users size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--success)'}}/>Donors</h1>
          <p className="page-subtitle">{donors.length} registered donors · {donors.filter(d=>d.is_eligible).length} currently eligible</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Donor</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}>
          <Search className="search-icon"/>
          <input className="search-input" placeholder="Search by name, phone, city…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:150}} value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
        </select>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner"/><span>Loading donors…</span></div>
        : <DataTable columns={columns} data={filtered} emptyMessage="No donors found." />
      }

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Add Donor':'Edit Donor'}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:'Save'}
          </button>
        </>}
      >
        <div className="form-grid form-grid-2">
          <div className="form-group">
            <label className="form-label">First Name <span className="required">*</span></label>
            <input className="form-input" value={f.first_name} onChange={e=>set('first_name',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={f.last_name} onChange={e=>set('last_name',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-input" type="date" value={f.dob} onChange={e=>set('dob',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-select" value={f.gender} onChange={e=>set('gender',e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group <span className="required">*</span></label>
            <select className="form-select" value={f.blood_group} onChange={e=>set('blood_group',e.target.value)}>
              {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className="form-input" value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91-9000000000" />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={f.email} onChange={e=>set('email',e.target.value)} />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Street Address</label>
            <input className="form-input" value={f.street} onChange={e=>set('street',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={f.city} onChange={e=>set('city',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={f.state} onChange={e=>set('state',e.target.value)} />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Eligibility</label>
            <select className="form-select" value={f.is_eligible} onChange={e=>set('is_eligible',parseInt(e.target.value))}>
              <option value={1}>Eligible to Donate</option>
              <option value={0}>Not Eligible</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Donor"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={()=>handleDelete(confirm?.donor_id)}>Delete</button>
        </>}
      >
        <div className="flex gap-3" style={{alignItems:'flex-start'}}>
          <AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div>
            <div className="font-semibold text-primary">Delete "{confirm?.first_name} {confirm?.last_name}"?</div>
            <div className="text-secondary text-sm mt-4">This will delete the donor and all their donation history and test records.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
