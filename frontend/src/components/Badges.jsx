// Badge helpers for consistent status/urgency/blood group display

export function BloodGroupBadge({ group }) {
  if (!group) return <span className="text-muted">—</span>;
  return <span className="badge badge-blood">{group}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    Available:  'badge-success',
    Pending:    'badge-warning',
    Approved:   'badge-info',
    Fulfilled:  'badge-success',
    Used:       'badge-default',
    Expired:    'badge-danger',
    Discarded:  'badge-danger',
    Reserved:   'badge-purple',
    Rejected:   'badge-danger',
    Cancelled:  'badge-danger',
    Negative:   'badge-success',
    Positive:   'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-default'}`}>{status ?? '—'}</span>;
}

export function UrgencyBadge({ urgency }) {
  const map = {
    Normal:   'badge-info',
    Urgent:   'badge-warning',
    Critical: 'badge-danger',
  };
  return (
    <span className={`badge ${map[urgency] || 'badge-default'}`}>
      {urgency === 'Critical' && '🔴 '}{urgency ?? '—'}
    </span>
  );
}

export function RoleBadge({ role }) {
  const map = {
    Doctor:      'badge-info',
    Nurse:       'badge-success',
    Technician:  'badge-purple',
    Admin:       'badge-warning',
    Receptionist:'badge-default',
  };
  return <span className={`badge ${map[role] || 'badge-default'}`}>{role ?? '—'}</span>;
}

export function GenderBadge({ gender }) {
  const map = { Male: 'badge-info', Female: 'badge-purple', Other: 'badge-default' };
  return <span className={`badge ${map[gender] || 'badge-default'}`}>{gender ?? '—'}</span>;
}

export function EligibilityBadge({ eligible }) {
  return eligible
    ? <span className="badge badge-success">Eligible</span>
    : <span className="badge badge-danger">Ineligible</span>;
}

// Format date nicely
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Days to expiry display
export function ExpiryBadge({ days }) {
  if (days == null) return <span className="text-muted">—</span>;
  if (days < 0)  return <span className="badge badge-danger">Expired {Math.abs(days)}d ago</span>;
  if (days < 14) return <span className="badge badge-warning">Expires in {days}d</span>;
  return <span className="badge badge-success">Expires in {days}d</span>;
}
