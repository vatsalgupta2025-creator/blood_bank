import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, FlaskConical, AlertTriangle } from 'lucide-react';
import { getBloodTests, createBloodTest, updateBloodTest, deleteBloodTest, getDonors, getDonationEvents, getStaff } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { StatusBadge, BloodGroupBadge, formatDate } from '../components/Badges';

const TEST_TYPES = ['HIV','Hepatitis B','Hepatitis C','Syphilis','Malaria','Blood Group Confirm'];
const RESULTS    = ['Pending','Negative','Positive'];
const EMPTY = { event_id:'', donor_id:'', test_type:'HIV', tested_date:'', result:'Pending', tested_by:'', remarks:'' };

export default function BloodTestsPage() {
  const toast = useToast();
  const [tests,   setTests]   = useState([]);
  const [donors,  setDonors]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [resFilter,setResFilter]=useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getBloodTests(),getDonors(),getDonationEvents(),getStaff()])
      .then(([t,d,e,s])=>{setTests(t.data);setDonors(d.data);setEvents(e.data);setStaff(s.data);})
      .catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const filtered = useMemo(()=>tests.filter(t=>{
    const q=search.toLowerCase();
    const m=!q||[t.donor_name,t.test_type,t.tester_name].some(v=>v?.toLowerCase().includes(q));
    return m&&(!resFilter||t.result===resFilter);
  }),[tests,search,resFilter]);

  const openAdd  = ()    => setModal({open:true,mode:'add',data:{...EMPTY,donor_id:donors[0]?.donor_id||'',event_id:events[0]?.event_id||''}});
  const openEdit = (row) => setModal({open:true,mode:'edit',data:{...row,tested_date:row.tested_date?.split('T')[0]||''}});
  const closeModal = ()  => setModal(m=>({...m,open:false}));

  const handleSave=async()=>{
    const {data:d,mode}=modal;
    if(!d.donor_id||!d.event_id||!d.tested_date){toast.error('Donor, event, and test date required.');return;}
    setSaving(true);
    try{
      if(mode==='add'){await createBloodTest(d);toast.success('Test recorded!');}
      else{await updateBloodTest(d.test_id,d);toast.success('Test updated!');}
      closeModal();load();
    }catch(e){toast.error(e.message);}finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await deleteBloodTest(id);toast.success('Test deleted.');setConfirm(null);load();}
    catch(e){toast.error(e.message);}
  };

  const f=modal.data; const set=(k,v)=>setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns=[
    {key:'test_id',    label:'#',        render:v=><span className="font-mono text-xs text-muted">#{v}</span>},
    {key:'donor_name', label:'Donor',    sortable:true,render:v=><strong>{v}</strong>},
    {key:'blood_group',label:'Blood',    render:v=><BloodGroupBadge group={v}/>},
    {key:'test_type',  label:'Test Type',sortable:true},
    {key:'tested_date',label:'Date',     sortable:true,render:v=>formatDate(v)},
    {key:'result',     label:'Result',   sortable:true,render:v=><StatusBadge status={v}/>},
    {key:'tester_name',label:'Tested By'},
    {key:'remarks',    label:'Remarks',  render:v=><span className="text-sm text-muted truncate" style={{maxWidth:160}}>{v||'—'}</span>},
    {key:'test_id',    label:'Actions',  render:(_,row)=>(
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
          <h1 className="page-title"><FlaskConical size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--purple)'}}/>Blood Tests</h1>
          <p className="page-subtitle">{tests.length} tests · {tests.filter(t=>t.result==='Positive').length} positive</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Test</button>
      </div>
      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}><Search className="search-icon"/>
          <input className="search-input" placeholder="Search donor, test type…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:140}} value={resFilter} onChange={e=>setResFilter(e.target.value)}>
          <option value="">All Results</option>{RESULTS.map(r=><option key={r}>{r}</option>)}
        </select>
      </div>
      {loading?<div className="loading-center"><div className="spinner"/><span>Loading tests…</span></div>
        :<DataTable columns={columns} data={filtered} emptyMessage="No blood tests found."/>}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'Record Blood Test':'Edit Test'}
        footer={<><button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Donation Event <span className="required">*</span></label>
            <select className="form-select" value={f.event_id} onChange={e=>set('event_id',e.target.value)}>
              <option value="">Select event…</option>{events.map(e=><option key={e.event_id} value={e.event_id}>#{e.event_id} — {e.donor_name} on {e.event_date?.split('T')[0]}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Donor <span className="required">*</span></label>
            <select className="form-select" value={f.donor_id} onChange={e=>set('donor_id',e.target.value)}>
              <option value="">Select donor…</option>{donors.map(d=><option key={d.donor_id} value={d.donor_id}>{d.first_name} {d.last_name} ({d.blood_group})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Test Type</label>
            <select className="form-select" value={f.test_type} onChange={e=>set('test_type',e.target.value)}>
              {TEST_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Result</label>
            <select className="form-select" value={f.result} onChange={e=>set('result',e.target.value)}>
              {RESULTS.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Tested Date <span className="required">*</span></label><input className="form-input" type="date" value={f.tested_date} onChange={e=>set('tested_date',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Tested By</label>
            <select className="form-select" value={f.tested_by} onChange={e=>set('tested_by',e.target.value)}>
              <option value="">Select staff…</option>{staff.map(s=><option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Remarks</label><textarea className="form-textarea" value={f.remarks} onChange={e=>set('remarks',e.target.value)}/></div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Test"
        footer={<><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>handleDelete(confirm?.test_id)}>Delete</button></>}>
        <div className="flex gap-3" style={{alignItems:'flex-start'}}><AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div><div className="font-semibold text-primary">Delete test #{confirm?.test_id}?</div></div>
        </div>
      </Modal>
    </div>
  );
}
