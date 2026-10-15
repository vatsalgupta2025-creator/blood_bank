import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, GitBranch, Droplets, Users, Building2, FlaskConical, CalendarHeart, AlertTriangle, Maximize2, X, Info } from 'lucide-react';
import { traceBloodUnit, traceDonor, getGraphStatus } from '../api';
import ForceGraph2D from 'react-force-graph-2d';

// ── Node styling ────────────────────────────────────────────────────────────
const NODE_STYLES = {
  Donor:          { color: '#3B82F6', borderColor: '#2563EB', icon: '👤', radius: 14 },
  DonationEvent:  { color: '#10B981', borderColor: '#059669', icon: '🩸', radius: 12 },
  BloodUnit:      { color: '#DC143C', borderColor: '#9B1C1C', icon: '💉', radius: 13 },
  BloodTest:      { color: '#F59E0B', borderColor: '#D97706', icon: '🔬', radius: 11 },
  BloodBank:      { color: '#8B5CF6', borderColor: '#7C3AED', icon: '🏥', radius: 13 },
};

const LINK_COLORS = {
  DONATES:     '#3B82F6',
  RECEIVED_AT: '#8B5CF6',
  GENERATES:   '#DC143C',
  HAS_TEST:    '#F59E0B',
};

// ── Transform API response into graph data ──────────────────────────────────

function buildUnitTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, type, label, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, label, props: props || {} });
  }

  // Blood Unit (always present — comes from MySQL even when Neo4j is down)
  if (data.unit) {
    const u = data.unit;
    addNode(`unit-${u.unit_id}`, 'BloodUnit',
      u.unit_code || `Unit #${u.unit_id}`,
      { ...u });
  }

  // Donation Event
  if (data.donationEvent) {
    const ev = data.donationEvent;
    const evId = ev.event_id;
    addNode(`event-${evId}`, 'DonationEvent',
      `Event #${evId}`,
      { ...ev });
    if (data.unit) {
      links.push({ source: `event-${evId}`, target: `unit-${data.unit.unit_id}`, label: 'GENERATES' });
    }
  }

  // Donor
  if (data.donor) {
    const d = data.donor;
    addNode(`donor-${d.donor_id}`, 'Donor',
      d.name || `Donor #${d.donor_id}`,
      { ...d });
    if (data.donationEvent) {
      links.push({ source: `donor-${d.donor_id}`, target: `event-${data.donationEvent.event_id}`, label: 'DONATES' });
    }
  }

  // Blood Bank
  if (data.bloodBank) {
    const b = data.bloodBank;
    const bankId = b.bank_id;
    addNode(`bank-${bankId}`, 'BloodBank',
      b.name || `Bank #${bankId}`,
      { ...b });
    if (data.donationEvent) {
      links.push({ source: `event-${data.donationEvent.event_id}`, target: `bank-${bankId}`, label: 'RECEIVED_AT' });
    }
  }

  // Blood Tests
  if (data.bloodTests && data.bloodTests.length > 0) {
    data.bloodTests.forEach(t => {
      const testId = t.test_id;
      addNode(`test-${testId}`, 'BloodTest',
        t.test_type || `Test #${testId}`,
        { ...t });
      if (data.donationEvent) {
        links.push({ source: `event-${data.donationEvent.event_id}`, target: `test-${testId}`, label: 'HAS_TEST' });
      }
    });
  }

  return { nodes, links };
}

function buildDonorTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, type, label, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, label, props: props || {} });
  }

  // Donor
  if (data.donor) {
    const d = data.donor;
    addNode(`donor-${d.donor_id}`, 'Donor',
      d.name || `Donor #${d.donor_id}`,
      { ...d });
  }

  // Donations array
  if (data.donations && Array.isArray(data.donations)) {
    data.donations.forEach((don, idx) => {
      // Donation Event
      if (don.donationEvent) {
        const ev = don.donationEvent;
        const evId = ev.event_id;
        addNode(`event-${evId}`, 'DonationEvent',
          `Event #${evId}`,
          { ...ev });
        if (data.donor) {
          links.push({ source: `donor-${data.donor.donor_id}`, target: `event-${evId}`, label: 'DONATES' });
        }

        // Blood Bank
        if (don.bloodBank) {
          const b = don.bloodBank;
          const bankId = b.bank_id;
          addNode(`bank-${bankId}`, 'BloodBank',
            b.name || `Bank #${bankId}`,
            { ...b });
          links.push({ source: `event-${evId}`, target: `bank-${bankId}`, label: 'RECEIVED_AT' });
        }

        // Blood Unit
        if (don.bloodUnit) {
          const u = don.bloodUnit;
          addNode(`unit-${u.unit_id}`, 'BloodUnit',
            u.unit_code || `Unit #${u.unit_id}`,
            { ...u });
          links.push({ source: `event-${evId}`, target: `unit-${u.unit_id}`, label: 'GENERATES' });
        }

        // Blood Tests
        if (don.bloodTests && don.bloodTests.length > 0) {
          don.bloodTests.forEach(t => {
            const testId = t.test_id;
            addNode(`test-${testId}`, 'BloodTest',
              t.test_type || `Test #${testId}`,
              { ...t });
            links.push({ source: `event-${evId}`, target: `test-${testId}`, label: 'HAS_TEST' });
          });
        }
      }
    });
  }

  return { nodes, links };
}


// ── Details Panel ───────────────────────────────────────────────────────────

function DetailsPanel({ node, onClose }) {
  if (!node) return null;
  const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
  const props = node.props || {};

  // Filter out internal/redundant keys
  const skipKeys = new Set(['identity', 'labels', 'elementId']);
  const entries = Object.entries(props).filter(([k]) => !skipKeys.has(k) && props[k] != null);

  function formatKey(k) {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatValue(v) {
    if (v === true) return 'Yes';
    if (v === false) return 'No';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 320,
      background: 'rgba(15, 15, 20, 0.96)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
      padding: 0, zIndex: 20, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: `linear-gradient(135deg, ${style.color}18, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{style.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F9F6F3' }}>{node.label}</div>
            <div style={{ fontSize: 11, color: style.color, fontWeight: 500 }}>{node.type}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F9F6F3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <X size={14} />
        </button>
      </div>
      {/* Properties */}
      <div style={{ padding: '12px 20px', maxHeight: 360, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: '8px 0' }}>No properties available.</div>
        ) : entries.map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between', padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>{formatKey(k)}</span>
            <span style={{ fontSize: 12, color: '#E2E8F0', textAlign: 'right', wordBreak: 'break-word' }}>{formatValue(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Main Page Component ─────────────────────────────────────────────────────

export default function TraceabilityPage() {
  const [searchMode, setSearchMode] = useState('unit'); // 'unit' | 'donor'
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [traceData, setTraceData] = useState(null); // raw API response
  const [graphData, setGraphData] = useState(null);  // { nodes, links }
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphStatus, setGraphStatus] = useState(null);
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Role check — Technicians cannot access trace endpoints
  const userRole = useMemo(() => {
    try {
      const stored = localStorage.getItem('bb_user');
      if (stored) return JSON.parse(stored).role || '';
    } catch {}
    return '';
  }, []);

  const canAccess = ['Admin', 'Doctor', 'Nurse'].includes(userRole);

  // Resize observer for responsive graph canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width, height: Math.max(e.contentRect.height, 420) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Fetch graph status on mount
  useEffect(() => {
    if (!canAccess) return;
    getGraphStatus()
      .then(res => setGraphStatus(res))
      .catch(() => {});
  }, [canAccess]);

  // Search handler
  const handleSearch = useCallback(async (modeOverride, idOverride) => {
    const activeMode = modeOverride || searchMode;
    const rawId = idOverride !== undefined ? String(idOverride) : searchId;
    const id = rawId.trim();

    if (!id || isNaN(Number(id))) {
      setError('Please enter a valid numeric ID.');
      return;
    }

    if (modeOverride) setSearchMode(modeOverride);
    if (idOverride !== undefined) setSearchId(String(idOverride));

    setLoading(true);
    setError('');
    setTraceData(null);
    setGraphData(null);
    setSelectedNode(null);

    try {
      let res;
      if (activeMode === 'unit') {
        res = await traceBloodUnit(id);
      } else {
        res = await traceDonor(id);
      }

      if (!res.success) {
        setError(res.message || 'Trace query failed.');
        return;
      }

      const apiData = res.data;
      setTraceData(apiData);

      // Build graph data from the real API response
      let gd;
      if (activeMode === 'unit') {
        gd = buildUnitTraceGraph(apiData);
      } else {
        gd = buildDonorTraceGraph(apiData);
      }

      if (gd.nodes.length === 0) {
        setError('No graph data returned. The record may not exist in the Neo4j projection.');
        return;
      }

      setGraphData(gd);

      // Fit to view after data loads
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 60);
        }
      }, 600);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch trace data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchId, searchMode]);

  // Fit to view
  const handleFitView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 60);
    }
  }, []);

  // Node paint callback
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
    const r = style.radius;
    const isSelected = selectedNode && selectedNode.id === node.id;

    // Glow for selected
    if (isSelected) {
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 20;
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? style.color : style.borderColor + '60';
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? style.color : style.color + 'CC';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Icon emoji
    ctx.font = `${r}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(style.icon, node.x, node.y);

    // Label below
    const labelSize = Math.max(10, 11 / globalScale);
    ctx.font = `${isSelected ? 'bold ' : ''}${labelSize}px Inter, sans-serif`;
    ctx.fillStyle = isSelected ? '#F9F6F3' : 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Truncate label
    let label = node.label || '';
    if (label.length > 20) label = label.slice(0, 18) + '…';
    ctx.fillText(label, node.x, node.y + r + 5);
  }, [selectedNode]);

  // Link canvas
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const color = LINK_COLORS[link.label] || '#555';
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;

    ctx.strokeStyle = color + 'AA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrow
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const endR = (NODE_STYLES[end.type]?.radius || 12) + 4;
    const ratio = (len - endR) / len;
    const arrowX = start.x + dx * ratio;
    const arrowY = start.y + dy * ratio;
    const arrowLen = 7;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle - Math.PI / 7), arrowY - arrowLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle + Math.PI / 7), arrowY - arrowLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Relationship label on link
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const fontSize = Math.max(8, 9 / globalScale);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = color + 'CC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(link.label || '', midX, midY - 6);
  }, []);

  // ── Access denied for Technician ──────────────────────────────────────────
  if (!canAccess) {
    return (
      <div style={{
        padding: '40px 24px', textAlign: 'center', maxWidth: 600,
        margin: '40px auto', background: 'rgba(20, 20, 26, 0.7)',
        borderRadius: 16, border: '1px solid rgba(220, 20, 60, 0.2)',
      }}>
        <AlertTriangle size={48} color="#DC143C" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, color: '#F9F6F3', marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          Blood Traceability is available to Admin, Doctor, and Nurse roles only.
        </p>
      </div>
    );
  }

  // ── Status banner ─────────────────────────────────────────────────────────
  const syncInfo = graphStatus && graphStatus.success ? graphStatus : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%' }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '28px 32px 0', maxWidth: 1400, margin: '0 auto', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={18} color="#3B82F6" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9F6F3', margin: 0, letterSpacing: '-0.01em' }}>
              Blood Traceability
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Neo4j Aura graph-powered donor and blood unit lineage explorer
            </p>
          </div>
        </div>

        {/* Graph engine status badge */}
        {syncInfo && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 12, padding: '6px 14px', borderRadius: 20,
            background: syncInfo.connected ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${syncInfo.connected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: syncInfo.connected ? '#10B981' : '#F59E0B',
            }} />
            <span style={{ fontSize: 11, color: syncInfo.connected ? '#10B981' : '#F59E0B', fontWeight: 500 }}>
              Neo4j {syncInfo.connected ? 'Connected' : 'Unavailable'}
            </span>
            {syncInfo.lastSyncTime && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                · Last sync: {new Date(syncInfo.lastSyncTime).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Search Bar ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 32px', maxWidth: 1400, margin: '0 auto', width: '100%',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '14px 20px',
        }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', borderRadius: 10, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
          }}>
            <button
              onClick={() => { setSearchMode('unit'); setError(''); setTraceData(null); setGraphData(null); setSelectedNode(null); }}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: searchMode === 'unit' ? 600 : 400,
                color: searchMode === 'unit' ? '#F9F6F3' : 'rgba(255,255,255,0.4)',
                background: searchMode === 'unit' ? 'rgba(220,20,60,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Droplets size={14} /> Blood Unit
            </button>
            <button
              onClick={() => { setSearchMode('donor'); setError(''); setTraceData(null); setGraphData(null); setSelectedNode(null); }}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: searchMode === 'donor' ? 600 : 400,
                color: searchMode === 'donor' ? '#F9F6F3' : 'rgba(255,255,255,0.4)',
                background: searchMode === 'donor' ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Users size={14} /> Donor
            </button>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={searchMode === 'unit' ? 'Enter Blood Unit ID…' : 'Enter Donor ID…'}
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%', padding: '10px 12px 10px 38px', fontSize: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#F9F6F3', outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 600,
              color: 'white', background: 'linear-gradient(135deg, #DC143C, #8B0000)',
              border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 12px rgba(220,20,60,0.2)',
            }}
          >
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Tracing…</>
            ) : (
              <><Search size={14} /> Trace</>
            )}
          </button>
        </div>
      </div>

      {/* ── Error message ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '0 32px', maxWidth: 1400, margin: '0 auto', width: '100%',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'rgba(220,20,60,0.08)', border: '1px solid rgba(220,20,60,0.2)',
            borderRadius: 10, color: '#F87171', fontSize: 13,
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* ── Projection warning ────────────────────────────────────────────── */}
      {traceData && traceData.projectionSynced === false && traceData.message && (
        <div style={{
          padding: '0 32px', maxWidth: 1400, margin: '0 auto', width: '100%',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, color: '#F59E0B', fontSize: 13,
          }}>
            <Info size={16} />
            {traceData.message}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && !error && !graphData && !traceData && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 32px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <GitBranch size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: 8 }}>
              Search for a Blood Unit or Donor
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 20 }}>
              Enter an ID above to trace the complete blood donation lineage from
              donor through donation event, screening tests, and blood bank.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)' }}>Quick Samples</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => handleSearch('unit', 1)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.25)',
                    color: '#F87171', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,20,60,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,20,60,0.1)'; }}
                >
                  🩸 Blood Unit #1
                </button>
                <button
                  onClick={() => handleSearch('unit', 2)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.25)',
                    color: '#F87171', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,20,60,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,20,60,0.1)'; }}
                >
                  🩸 Blood Unit #2
                </button>
                <button
                  onClick={() => handleSearch('donor', 1)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                    color: '#60A5FA', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                >
                  👤 Donor #1
                </button>
                <button
                  onClick={() => handleSearch('donor', 2)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                    color: '#60A5FA', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                >
                  👤 Donor #2
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Graph Canvas ──────────────────────────────────────────────────── */}
      {graphData && graphData.nodes.length > 0 && (
        <div style={{
          flex: 1, padding: '0 32px 24px', maxWidth: 1400, margin: '0 auto', width: '100%',
          position: 'relative', minHeight: 420,
        }}>
          {/* Legend & controls */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, flexWrap: 'wrap', gap: 12,
          }}>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {Object.entries(NODE_STYLES).map(([type, s]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{type}</span>
                </div>
              ))}
            </div>
            {/* Fit button */}
            <button
              onClick={handleFitView}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F9F6F3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <Maximize2 size={13} /> Fit View
            </button>
          </div>

          {/* Graph container */}
          <div
            ref={containerRef}
            style={{
              position: 'relative', width: '100%', height: 'calc(100vh - 340px)', minHeight: 420,
              background: 'rgba(10, 10, 14, 0.6)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, overflow: 'hidden',
            }}
          >
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node, color, ctx) => {
                const r = (NODE_STYLES[node.type]?.radius || 12) + 4;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fill();
              }}
              linkCanvasObject={linkCanvasObject}
              linkDirectionalParticles={0}
              onNodeClick={(node) => setSelectedNode(node)}
              onBackgroundClick={() => setSelectedNode(null)}
              cooldownTicks={80}
              d3AlphaDecay={0.04}
              d3VelocityDecay={0.3}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />

            {/* Details panel */}
            <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />

            {/* Node count badge */}
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              padding: '5px 12px', borderRadius: 8,
              background: 'rgba(15,15,20,0.85)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
            }}>
              {graphData.nodes.length} nodes · {graphData.links.length} relationships
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
