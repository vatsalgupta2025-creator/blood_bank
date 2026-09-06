import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarHeart, AlertTriangle } from 'lucide-react';
import { getDonationEvents, createDonationEvent, updateDonationEvent, deleteDonationEvent, getDonors, getBloodBanks, getStaff } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BloodGroupBadge, formatDate } from '../components/Badges';

const EMPTY = { donor_id:'', bank_id:'', event_date:'', event_time:'', staff_id:'', notes:'' };

export default function DonationEventsPage() {
  const toast = useToast();
  const [events,  setEvents]  = useState([]);
  const [donors,  setDonors]  = useState([]);
  const [banks,   setBanks]   = useState([]);
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getDonationEvents(),getDonors(),getBloodBanks(),getStaff()])
      .then(([e,d,b,s])=>{setEvents(e.data);setDonors(d.data);setBanks(b.data);setStaff(s.data);})
      .catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const filtered = useMemo(()=>events.filter(ev=>{
    const q=search.toLowerCase();
    return !q||[ev.donor_name,ev.bank_name,ev.staff_name].some(v=>v?.toLowerCase().includes(q));
  }),[events,search]);

  const openAdd  = ()    => setModal({open:true,mode:'add',data:{...EMPTY,bank_id:banks[0]?.bank_id||'',donor_id:donors[0]?.donor_id||''}});
  const openEdit = (row) => setModal({open:true,mode:'edit',data:{...row,event_date:row.event_date?.split('T')[0]||''}});
  const closeModal = ()  => setModal(m=>({...m,open:false}));

  const handleSave = async ()=>{
    const {data:d,mode}=modal;
    if(!(d.donor_id || d.donor_name)||!d.bank_id||!d.event_date){toast.error('Donor, bank, and event date required.');return;}
    setSaving(true);
    try{
      if(mode==='add'){await createDonationEvent(d);toast.success('Event recorded!');}
      else{await updateDonationEvent(d.event_id,d);toast.success('Event updated!');}
      closeModal();load();
    }catch(e){toast.error(e.message);}finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await deleteDonationEvent(id);toast.success('Event deleted.');setConfirm(null);load();}
    catch(e){toast.error(e.message);}
  };

  const f=modal.data; const set=(k,v)=>setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns=[
    {key:'event_id',   label:'#',      render:v=><span className="font-mono text-xs text-muted">#{v}</span>},
    {key:'donor_name', label:'Donor',  sortable:true,render:v=><strong>{v}</strong>},
    {key:'blood_group',label:'Blood',  render:v=><BloodGroupBadge group={v}/>},
    {key:'bank_name',  label:'Bank',   sortable:true},
    {key:'event_date', label:'Date',   sortable:true,render:v=>formatDate(v)},
    {key:'unit_code',  label:'Unit Code',render:v=><span className="font-mono text-xs">{v||'—'}</span>},
    {key:'event_id',   label:'Actions', render:(_,row)=>(
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
          <h1 className="page-title"><CalendarHeart size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--info)'}}/>Donation Events</h1>
          <p className="page-subtitle">{events.length} total donation events recorded</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Record Event</button>
      </div>
      <div className="filter-bar">
        <div className="search-input-wrap"><Search className="search-icon"/>
          <input className="search-input" placeholder="Search donor, bank, staff…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      {loading?<div className="loading-center"><div className="spinner"/><span>Loading events…</span></div>
        :<DataTable columns={columns} data={filtered} emptyMessage="No donation events found."/>}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Record Donation Event':'Edit Event'}
        footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Donor Name <span className="required">*</span></label>
            <input className="form-input" placeholder="Type donor name..." value={f.donor_name || ''} 
              onChange={e => set('donor_name', e.target.value)}
            />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Blood Bank <span className="required">*</span></label>
            <select className="form-select" value={f.bank_id} onChange={e=>set('bank_id',e.target.value)}>
              <option value="">Select bank…</option>{banks.map(b=><option key={b.bank_id} value={b.bank_id}>{b.name} — {b.city}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Event Date <span className="required">*</span></label><input className="form-input" type="date" value={f.event_date} onChange={e=>set('event_date',e.target.value)}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Conducted By</label>
            <select className="form-select" value={f.staff_id} onChange={e=>set('staff_id',e.target.value)}>
              <option value="">Select staff…</option>{staff.map(s=><option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name} — {s.role}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Notes</label><textarea className="form-textarea" value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any notes about this donation…"/></div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Event"
        footer={<><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>handleDelete(confirm?.event_id)}>Delete</button></>}>
        <div className="flex gap-3" style={{alignItems:'flex-start'}}><AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div><div className="font-semibold text-primary">Delete donation event #{confirm?.event_id}?</div><div className="text-secondary text-sm mt-4">Blood tests linked to this event will also be deleted.</div></div>
        </div>
      </Modal>
    </div>
  );
}
