import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, UserRound, AlertTriangle } from 'lucide-react';
import { getReceivers, createReceiver, updateReceiver, deleteReceiver } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BloodGroupBadge, GenderBadge, formatDate } from '../components/Badges';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const EMPTY = { first_name:'', last_name:'', dob:'', gender:'Male', blood_group:'O+', phone:'', email:'', hospital_name:'', hospital_city:'', medical_condition:'' };

export default function ReceiversPage() {
  const toast = useToast();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [bgFilter,setBgFilter]= useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getReceivers().then(r=>setData(r.data)).catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(()=>data.filter(r=>{
    const q=search.toLowerCase();
    const m=!q||[r.first_name,r.last_name,r.hospital_name,r.blood_group].some(v=>v?.toLowerCase().includes(q));
    return m&&(!bgFilter||r.blood_group===bgFilter);
  }),[data,search,bgFilter]);

  const openAdd  = ()    => setModal({open:true,mode:'add',data:EMPTY});
  const openEdit = (row) => setModal({open:true,mode:'edit',data:{...row,dob:row.dob?.split('T')[0]||''}});
  const closeModal = ()  => setModal(m=>({...m,open:false}));

  const handleSave = async ()=>{
    const {data:d,mode}=modal;
    if(!d.first_name||!d.blood_group){toast.error('First name and blood group required.');return;}
    setSaving(true);
    try{
      if(mode==='add'){await createReceiver(d);toast.success('Receiver added!');}
      else{await updateReceiver(d.receiver_id,d);toast.success('Receiver updated!');}
      closeModal();load();
    }catch(e){toast.error(e.message);}finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await deleteReceiver(id);toast.success('Receiver deleted.');setConfirm(null);load();}
    catch(e){toast.error(e.message);}
  };

  const f=modal.data; const set=(k,v)=>setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns=[
    {key:'receiver_id',label:'#',render:v=><span className="font-mono text-xs text-muted">#{v}</span>},
    {key:'first_name', label:'Name',    sortable:true,render:(_,row)=><strong>{row.first_name} {row.last_name}</strong>},
    {key:'blood_group',label:'Blood Group',sortable:true,render:v=><BloodGroupBadge group={v}/>},
    {key:'age',        label:'Age',     render:v=>v?`${v} yrs`:'—'},
    {key:'gender',     label:'Gender',  render:v=><GenderBadge gender={v}/>},
    {key:'hospital_name',label:'Hospital',sortable:true},
    {key:'hospital_city',label:'City',  sortable:true},
    {key:'medical_condition',label:'Condition'},
    {key:'receiver_id',label:'Actions', render:(_,row)=>(
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
          <h1 className="page-title"><UserRound size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--purple)'}}/>Receivers</h1>
          <p className="page-subtitle">{data.length} registered patients / receivers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Receiver</button>
      </div>
      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}><Search className="search-icon"/>
          <input className="search-input" placeholder="Search name, hospital…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:150}} value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
          <option value="">All Blood Groups</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
        </select>
      </div>
      {loading?<div className="loading-center"><div className="spinner"/><span>Loading receivers…</span></div>
        :<DataTable columns={columns} data={filtered} emptyMessage="No receivers found."/>}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Add Receiver':'Edit Receiver'}
        footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="form-group"><label className="form-label">First Name <span className="required">*</span></label><input className="form-input" value={f.first_name} onChange={e=>set('first_name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={f.last_name} onChange={e=>set('last_name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">DOB</label><input className="form-input" type="date" value={f.dob} onChange={e=>set('dob',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={f.gender} onChange={e=>set('gender',e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div className="form-group"><label className="form-label">Blood Group <span className="required">*</span></label><select className="form-select" value={f.blood_group} onChange={e=>set('blood_group',e.target.value)}>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={f.phone} onChange={e=>set('phone',e.target.value)}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Email</label><input className="form-input" type="email" value={f.email} onChange={e=>set('email',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Hospital Name</label><input className="form-input" value={f.hospital_name} onChange={e=>set('hospital_name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Hospital City</label><input className="form-input" value={f.hospital_city} onChange={e=>set('hospital_city',e.target.value)}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Medical Condition</label><input className="form-input" value={f.medical_condition} onChange={e=>set('medical_condition',e.target.value)} placeholder="Thalassemia, Anemia…"/></div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Receiver"
        footer={<><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>handleDelete(confirm?.receiver_id)}>Delete</button></>}>
        <div className="flex gap-3" style={{alignItems:'flex-start'}}><AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div><div className="font-semibold text-primary">Delete "{confirm?.first_name} {confirm?.last_name}"?</div><div className="text-secondary text-sm mt-4">All blood requests linked to this receiver will also be deleted.</div></div>
        </div>
      </Modal>
    </div>
  );
}
