import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ClipboardList, AlertTriangle } from 'lucide-react';
import { getBloodRequests, createBloodRequest, updateBloodRequest, deleteBloodRequest, getBloodBanks, getReceivers } from '../api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BloodGroupBadge, StatusBadge, UrgencyBadge, formatDate } from '../components/Badges';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const STATUSES = ['Pending','Approved','Fulfilled','Rejected','Cancelled'];
const URGENCIES = ['Normal','Urgent','Critical'];
const EMPTY = { receiver_id:'', bank_id:'', blood_group:'O+', quantity_ml:450, urgency:'Normal', request_date:'', required_by:'', notes:'' };

export default function BloodRequestsPage() {
  const toast = useToast();
  const [requests,  setRequests]  = useState([]);
  const [banks,     setBanks]     = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [stFilter,  setStFilter]  = useState('');
  const [ugFilter,  setUgFilter]  = useState('');
  const [modal,     setModal]     = useState({ open:false, mode:'add', data:EMPTY });
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getBloodRequests(), getBloodBanks(), getReceivers()])
      .then(([r,b,rv]) => { setRequests(r.data); setBanks(b.data); setReceivers(rv.data); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() =>
    requests.filter(r => {
      const q = search.toLowerCase();
      const m = !q || [r.receiver_name, r.bank_name, r.blood_group].some(v=>v?.toLowerCase().includes(q));
      return m && (!stFilter||r.status===stFilter) && (!ugFilter||r.urgency===ugFilter);
    }), [requests, search, stFilter, ugFilter]);

  const openAdd  = () => {
    const bank = banks[0];
    const receiver = receivers[0];
    setModal({ 
      open:true, 
      mode:'add', 
      data:{ 
        ...EMPTY, 
        bank_id: bank?.bank_id||'', 
        bank_input: bank ? `${bank.name} — ${bank.city}` : '',
        receiver_id: receiver?.receiver_id||'', 
        receiver_input: receiver ? `${receiver.first_name} ${receiver.last_name} (${receiver.blood_group})` : '',
        request_date: new Date().toISOString().split('T')[0] 
      }
    });
  };

  const openEdit = (row) => {
    const bank = banks.find(b => b.bank_id === row.bank_id);
    const receiver = receivers.find(r => r.receiver_id === row.receiver_id);
    setModal({ 
      open:true, 
      mode:'edit', 
      data:{
        ...row,
        bank_input: bank ? `${bank.name} — ${bank.city}` : (row.bank_name || ''),
        receiver_input: receiver ? `${receiver.first_name} ${receiver.last_name} (${receiver.blood_group})` : (row.receiver_name || ''),
        request_date: row.request_date?.split('T')[0]||'',
        required_by:  row.required_by?.split('T')[0]||'',
      }
    });
  };
  const closeModal = () => setModal(m=>({...m,open:false}));

  const handleSave = async () => {
    const { data, mode } = modal;
    if (!(data.receiver_id || data.receiver_name)||!data.bank_id||!data.request_date) {
      toast.error('Receiver, bank, and request date are required.'); return;
    }
    setSaving(true);
    try {
      if (mode==='add') { await createBloodRequest(data); toast.success('Request created!'); }
      else { await updateBloodRequest(data.request_id, data); toast.success('Request updated!'); }
      closeModal(); load();
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteBloodRequest(id); toast.success('Request deleted.'); setConfirm(null); load(); }
    catch(e) { toast.error(e.message); }
  };

  const f   = modal.data;
  const set = (k,v) => setModal(m=>({...m,data:{...m.data,[k]:v}}));

  const columns = [
    { key:'request_id',   label:'#',           render:v=><span className="font-mono text-xs text-muted">#{v}</span> },
    { key:'receiver_name',label:'Receiver',     sortable:true, render:v=><strong>{v}</strong> },
    { key:'bank_name',    label:'Blood Bank',   sortable:true },
    { key:'blood_group',  label:'Blood Group',  render:v=><BloodGroupBadge group={v}/> },
    { key:'urgency',      label:'Urgency',      sortable:true, render:v=><UrgencyBadge urgency={v}/> },
    { key:'request_date', label:'Requested',    render:v=>formatDate(v) },
    { key:'required_by',  label:'Required By',  render:v=>formatDate(v) },
    { key:'status',       label:'Status',       sortable:true, render:v=><StatusBadge status={v}/> },
    { key:'request_id',   label:'Actions',      render:(_,row)=>(
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
          <h1 className="page-title"><ClipboardList size={26} style={{verticalAlign:'middle',marginRight:8,color:'var(--warning)'}}/>Blood Requests</h1>
          <p className="page-subtitle">
            {requests.filter(r=>r.status==='Pending').length} pending ·{' '}
            {requests.filter(r=>r.urgency==='Critical'&&['Pending','Approved'].includes(r.status)).length} critical open
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> New Request</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap" style={{flex:2}}>
          <Search className="search-icon"/>
          <input className="search-input" placeholder="Search receiver, bank, blood group…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:140}} value={ugFilter} onChange={e=>setUgFilter(e.target.value)}>
          <option value="">All Urgencies</option>
          {URGENCIES.map(u=><option key={u}>{u}</option>)}
        </select>
        <select className="form-select" style={{width:140}} value={stFilter} onChange={e=>setStFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner"/><span>Loading requests…</span></div>
        : <DataTable columns={columns} data={filtered} emptyMessage="No blood requests found." />
      }

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode==='add'?'New Blood Request':'Edit Request'}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:'Save'}
          </button>
        </>}
      >
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Receiver Name <span className="required">*</span></label>
            <input className="form-input" placeholder="Type receiver name..." value={f.receiver_name || ''} 
              onChange={e => set('receiver_name', e.target.value)}
            />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Blood Bank <span className="required">*</span></label>
            <input className="form-input" list="banks-list" placeholder="Type blood bank name..." value={f.bank_input || ''} 
              onChange={e => {
                const val = e.target.value;
                const match = banks.find(b => `${b.name} — ${b.city}` === val);
                setModal(m => ({...m, data:{...m.data, bank_input: val, bank_id: match ? match.bank_id : ''}}));
              }}
            />
            <datalist id="banks-list">
              {banks.map(b => <option key={b.bank_id} value={`${b.name} — ${b.city}`} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select className="form-select" value={f.blood_group} onChange={e=>set('blood_group',e.target.value)}>
              {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Urgency</label>
            <select className="form-select" value={f.urgency} onChange={e=>set('urgency',e.target.value)}>
              {URGENCIES.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Volume (mL)</label>
            <input className="form-input" type="number" value={f.quantity_ml} onChange={e=>set('quantity_ml',parseInt(e.target.value))} />
          </div>
          {modal.mode==='edit' && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={f.status} onChange={e=>set('status',e.target.value)}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Request Date <span className="required">*</span></label>
            <input className="form-input" type="date" value={f.request_date} onChange={e=>set('request_date',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Required By</label>
            <input className="form-input" type="date" value={f.required_by} onChange={e=>set('required_by',e.target.value)} />
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional details…" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Request"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={()=>handleDelete(confirm?.request_id)}>Delete</button>
        </>}
      >
        <div className="flex gap-3" style={{alignItems:'flex-start'}}>
          <AlertTriangle size={20} color="var(--danger)" style={{flexShrink:0,marginTop:2}}/>
          <div>
            <div className="font-semibold text-primary">Delete request #{confirm?.request_id}?</div>
            <div className="text-secondary text-sm mt-4">This action cannot be undone.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
