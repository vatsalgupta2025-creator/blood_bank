import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, UserCog, AlertTriangle } from 'lucide-react';
import { getStaff, createStaffMember, updateStaffMember, deleteStaffMember, getBloodBanks } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { RoleBadge, formatDate } from '../components/Badges';

const ROLES = ['Doctor','Nurse','Technician','Admin','Receptionist'];
const SHIFTS = ['Morning','Afternoon','Night'];
const EMPTY = { bank_id:'', first_name:'', last_name:'', role:'Doctor', phone:'', email:'', shift:'Morning', hired_date:'' };

export default function StaffPage() {
  const toast = useToast();
  const [staff,   setStaff]   = useState([]);
  const [banks,   setBanks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getStaff(),getBloodBanks()])
      .then(([s,b])=>{setStaff(s.data);setBanks(b.data);})
      .catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const filtered = useMemo(()=>staff.filter(s=>{
    const q=search.toLowerCase();
    const m=!q||[s.first_name,s.last_name,s.bank_name,s.email].some(v=>v?.toLowerCase().includes(q));
    return m&&(!roleFilter||s.role===roleFilter);
  }),[staff,search,roleFilter]);

  const openAdd  = ()    => setModal({open:true,mode:'add',data:{...EMPTY,bank_id:banks[0]?.bank_id||''}});
  const openEdit = (row) => setModal({open:true,mode:'edit',data:{...row,hired_date:row.hired_date?.split('T')[0]||''}});
  const closeModal = ()  => setModal(m=>({...m,open:false}));

  const handleSave = async ()=>{
    const {data:d,mode}=modal;
    if(!d.first_name||!d.bank_id){toast.error('First name and bank are required.');return;}
    setSaving(true);
    try{
      if(mode==='add'){await createStaffMember(d);toast.success('Staff member added!');}
      else{await updateStaffMember(d.staff_id,d);toast.success('Staff updated!');}
      closeModal();load();
    }catch(e){toast.error(e.message);}finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await deleteStaffMember(id);toast.success('Staff deleted.');setConfirm(null);load();}
    catch(e){toast.error(e.message);}
  };

  const f=modal.data; const set=(k,v)=>setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns=[
    {key:'staff_id',  label:'#',       render:v=><span className="font-mono text-xs text-muted">#{v}</span>},
    {key:'first_name',label:'Name',    sortable:true,render:(_,row)=><strong>{row.first_name} {row.last_name}</strong>},
    {key:'role',      label:'Role',    sortable:true,render:v=><RoleBadge role={v}/>},
    {key:'bank_name', label:'Bank',    sortable:true},
    {key:'shift',     label:'Shift'},
    {key:'phone',     label:'Phone'},
    {key:'email',     label:'Email',   render:v=><span className="font-mono text-xs">{v||'—'}</span>},
    {key:'hired_date',label:'Hired',   render:v=>formatDate(v)},
    {key:'staff_id',  label:'Actions', render:(_,row)=>(
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
          <h1 className="page-title"><UserCog size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--warning)'}}/>Staff</h1>
          <p className="page-subtitle">{staff.length} staff members across {banks.length} banks</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Staff</button>
      </div>
      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}><Search className="search-icon"/>
          <input className="search-input" placeholder="Search name, bank, email…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:150}} value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
      </div>
      {loading?<div className="loading-center"><div className="spinner"/><span>Loading staff…</span></div>
        :<DataTable columns={columns} data={filtered} emptyMessage="No staff found."/>}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Add Staff Member':'Edit Staff'}
        footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Blood Bank <span className="required">*</span></label>
            <select className="form-select" value={f.bank_id} onChange={e=>set('bank_id',e.target.value)}>
              <option value="">Select bank…</option>{banks.map(b=><option key={b.bank_id} value={b.bank_id}>{b.name} — {b.city}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">First Name <span className="required">*</span></label><input className="form-input" value={f.first_name} onChange={e=>set('first_name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={f.last_name} onChange={e=>set('last_name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={f.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Shift</label><select className="form-select" value={f.shift} onChange={e=>set('shift',e.target.value)}>{SHIFTS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={f.phone} onChange={e=>set('phone',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={f.email} onChange={e=>set('email',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Hired Date</label><input className="form-input" type="date" value={f.hired_date} onChange={e=>set('hired_date',e.target.value)}/></div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Staff"
        footer={<><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>handleDelete(confirm?.staff_id)}>Delete</button></>}>
        <div className="flex gap-3" style={{alignItems:'flex-start'}}><AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div><div className="font-semibold text-primary">Delete "{confirm?.first_name} {confirm?.last_name}"?</div><div className="text-secondary text-sm mt-4">This action cannot be undone.</div></div>
        </div>
      </Modal>
    </div>
  );
}
