import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, GitBranch, Droplets, Users, Building2, FlaskConical, AlertTriangle, Maximize2, X, Info, ChevronRight, Database, Zap } from 'lucide-react';
import { traceBloodUnit, traceDonor, getGraphStatus } from '../api';
import ForceGraph2D from 'react-force-graph-2d';

/* ── Node & Link Styling ──────────────────────────────────────────────────── */
const NODE_STYLES = {
  Donor:          { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Donor',           radius: 16 },
  DonationEvent:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Donation Event',   radius: 14 },
  BloodUnit:      { color: '#DC2626', bg: 'rgba(220,38,38,0.12)',  label: 'Blood Unit',       radius: 16 },
  BloodTest:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Blood Test',       radius: 13 },
  BloodBank:      { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Blood Bank',       radius: 15 },
};

const LINK_COLORS = {
  DONATES:     '#3B82F6',
  RECEIVED_AT: '#8B5CF6',
  GENERATES:   '#DC2626',
  HAS_TEST:    '#F59E0B',
};

/* ── Graph Transform: Unit Trace ──────────────────────────────────────────── */
function buildUnitTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, type, label, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, label, props: props || {} });
  }

  if (data.unit) {
    const u = data.unit;
    addNode(`unit-${u.unit_id}`, 'BloodUnit',
      u.unit_code || `Unit #${u.unit_id}`,
      { ...u });
  }

  if (data.donationEvent) {
    const ev = data.donationEvent;
    const evId = ev.event_id;
    addNode(`event-${evId}`, 'DonationEvent', `Event #${evId}`, { ...ev });
    if (data.unit) {
      links.push({ source: `event-${evId}`, target: `unit-${data.unit.unit_id}`, label: 'GENERATES' });
    }
  }

  if (data.donor) {
    const d = data.donor;
    addNode(`donor-${d.donor_id}`, 'Donor', d.name || `Donor #${d.donor_id}`, { ...d });
    if (data.donationEvent) {
      links.push({ source: `donor-${d.donor_id}`, target: `event-${data.donationEvent.event_id}`, label: 'DONATES' });
    }
  }

  if (data.bloodBank) {
    const b = data.bloodBank;
    const bankId = b.bank_id;
    addNode(`bank-${bankId}`, 'BloodBank', b.name || `Bank #${bankId}`, { ...b });
    if (data.donationEvent) {
      links.push({ source: `event-${data.donationEvent.event_id}`, target: `bank-${bankId}`, label: 'RECEIVED_AT' });
    }
  }

  if (data.bloodTests && data.bloodTests.length > 0) {
    data.bloodTests.forEach(t => {
      const testId = t.test_id;
      addNode(`test-${testId}`, 'BloodTest', t.test_type || `Test #${testId}`, { ...t });
      if (data.donationEvent) {
        links.push({ source: `event-${data.donationEvent.event_id}`, target: `test-${testId}`, label: 'HAS_TEST' });
      }
    });
  }

  return { nodes, links };
}

/* ── Graph Transform: Donor Trace ─────────────────────────────────────────── */
function buildDonorTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, type, label, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, label, props: props || {} });
  }

  if (data.donor) {
    const d = data.donor;
    addNode(`donor-${d.donor_id}`, 'Donor', d.name || `Donor #${d.donor_id}`, { ...d });
  }

  if (data.donations && Array.isArray(data.donations)) {
    data.donations.forEach(don => {
      if (don.donationEvent) {
        const ev = don.donationEvent;
        const evId = ev.event_id;
        addNode(`event-${evId}`, 'DonationEvent', `Event #${evId}`, { ...ev });
        if (data.donor) {
          links.push({ source: `donor-${data.donor.donor_id}`, target: `event-${evId}`, label: 'DONATES' });
        }

        if (don.bloodBank) {
          const b = don.bloodBank;
          const bankId = b.bank_id;
          addNode(`bank-${bankId}`, 'BloodBank', b.name || `Bank #${bankId}`, { ...b });
          links.push({ source: `event-${evId}`, target: `bank-${bankId}`, label: 'RECEIVED_AT' });
        }

        if (don.bloodUnit) {
          const u = don.bloodUnit;
          addNode(`unit-${u.unit_id}`, 'BloodUnit', u.unit_code || `Unit #${u.unit_id}`, { ...u });
          links.push({ source: `event-${evId}`, target: `unit-${u.unit_id}`, label: 'GENERATES' });
        }

        if (don.bloodTests && don.bloodTests.length > 0) {
          don.bloodTests.forEach(t => {
            const testId = t.test_id;
            addNode(`test-${testId}`, 'BloodTest', t.test_type || `Test #${testId}`, { ...t });
            links.push({ source: `event-${evId}`, target: `test-${testId}`, label: 'HAS_TEST' });
          });
        }
      }
    });
  }

  return { nodes, links };
}

/* ── Details Panel ────────────────────────────────────────────────────────── */
function DetailsPanel({ node, onClose }) {
  if (!node) return null;
  const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
  const props = node.props || {};

  const skipKeys = new Set(['identity', 'labels', 'elementId']);
  const entries = Object.entries(props).filter(([k, v]) => !skipKeys.has(k) && v != null && v !== '');

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
    <div className="trace-details-panel">
      <div className="trace-details-header" style={{ borderLeft: `3px solid ${style.color}` }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: style.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {style.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{node.label}</div>
        </div>
        <button onClick={onClose} className="trace-details-close" aria-label="Close details">
          <X size={14} />
        </button>
      </div>
      <div className="trace-details-body">
        {entries.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>No details available.</div>
        ) : entries.map(([k, v]) => (
          <div key={k} className="trace-detail-row">
            <span className="trace-detail-key">{formatKey(k)}</span>
            <span className="trace-detail-value">{formatValue(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Main Component ───────────────────────────────────────────────────────── */
export default function TraceabilityPage() {
  const [searchMode, setSearchMode] = useState('unit');
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphStatus, setGraphStatus] = useState(null);
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const userRole = useMemo(() => {
    try {
      const stored = localStorage.getItem('bb_user');
      if (stored) return JSON.parse(stored).role || '';
    } catch {}
    return '';
  }, []);

  const canAccess = ['Admin', 'Doctor', 'Nurse'].includes(userRole);

  // Resize observer
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

  // Fetch graph status
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

      let gd;
      if (activeMode === 'unit') {
        gd = buildUnitTraceGraph(apiData);
      } else {
        gd = buildDonorTraceGraph(apiData);
      }

      if (gd.nodes.length === 0) {
        setError('No lineage data found for this ID.');
        return;
      }

      setGraphData(gd);

      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 70);
          setTimeout(() => {
            if (graphRef.current && graphRef.current.zoom() > 2.0) {
              graphRef.current.zoom(1.8, 300);
            }
          }, 420);
        }
      }, 600);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch trace data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchId, searchMode]);

  const handleFitView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 70);
      setTimeout(() => {
        if (graphRef.current && graphRef.current.zoom() > 2.0) {
          graphRef.current.zoom(1.8, 300);
        }
      }, 420);
    }
  }, []);

  // Adjust force repulsion and link distance for clear visual separation
  useEffect(() => {
    if (graphRef.current && graphData) {
      try {
        const charge = graphRef.current.d3Force('charge');
        if (charge && typeof charge.strength === 'function') {
          charge.strength(-400);
        }
        const link = graphRef.current.d3Force('link');
        if (link && typeof link.distance === 'function') {
          link.distance(100);
        }
        graphRef.current.d3ReheatSimulation();
      } catch {}
    }
  }, [graphData]);

  // Node paint
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
    const r = style.radius;
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#E2E8F0' : '#1F2937';

    // Selected glow
    if (isSelected) {
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 16;
    }

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? style.color : style.color + 'EE';
    ctx.fill();

    // Ring
    ctx.strokeStyle = isSelected ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)');
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Letter icon inside
    const initial = node.type === 'DonationEvent' ? 'E' :
                    node.type === 'BloodUnit' ? 'U' :
                    node.type === 'BloodTest' ? 'T' :
                    node.type === 'BloodBank' ? 'B' :
                    node.type === 'Donor' ? 'D' : '?';
    ctx.font = `bold ${Math.round(r * 0.9)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(initial, node.x, node.y + 0.5);

    // Label below
    const effectiveScale = Math.max(globalScale || 1, 0.4);
    const labelSize = Math.min(14, Math.max(8, 10 / effectiveScale));
    ctx.font = `${isSelected ? '700' : '500'} ${labelSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = isSelected ? (isDark ? '#FFFFFF' : '#111827') : textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let label = node.label || '';
    if (label.length > 22) label = label.slice(0, 20) + '…';
    ctx.fillText(label, node.x, node.y + r + 4);
  }, [selectedNode]);

  // Link paint
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const color = LINK_COLORS[link.label] || '#6B7280';
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    ctx.strokeStyle = color + (isDark ? '80' : '99');
    ctx.lineWidth = 1.4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrow
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const endR = (NODE_STYLES[end.type]?.radius || 14) + 3;
    const ratio = (len - endR) / len;
    const arrowX = start.x + dx * ratio;
    const arrowY = start.y + dy * ratio;
    const arrowLen = 6;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle - Math.PI / 7), arrowY - arrowLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle + Math.PI / 7), arrowY - arrowLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Relationship label
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const effectiveScale = Math.max(globalScale || 1, 0.4);
    const fontSize = Math.min(12, Math.max(7, 8.5 / effectiveScale));
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = isDark ? color : (color === '#F59E0B' ? '#B45309' : color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const relLabel = (link.label || '').replace(/_/g, ' ');
    ctx.fillText(relLabel, midX, midY - 4 / effectiveScale);
  }, []);

  // Access denied
  if (!canAccess) {
    return (
      <div className="trace-access-denied">
        <AlertTriangle size={40} color="var(--crimson)" />
        <h2>Access Restricted</h2>
        <p>Blood Traceability is available to Admin, Doctor, and Nurse roles only.</p>
      </div>
    );
  }

  const isNeo4jConnected = graphStatus && graphStatus.connected;
  const dataSource = traceData?.projectionSynced ? 'neo4j' : (traceData ? 'mysql' : null);

  return (
    <div className="trace-page">
      {/* Breadcrumb + Title */}
      <div className="trace-header">
        <div className="trace-breadcrumb">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span className="trace-breadcrumb-active">Traceability</span>
        </div>
        <div className="trace-title-row">
          <div>
            <h1 className="trace-title">Blood Traceability</h1>
            <p className="trace-subtitle">Trace end-to-end blood unit lineage from donor through donation, screening, and storage.</p>
          </div>
          <div className="trace-status-badge" data-connected={isNeo4jConnected ? 'true' : 'false'}>
            <div className="trace-status-dot" />
            <span>{isNeo4jConnected ? 'Neo4j Connected' : 'Neo4j Unavailable'}</span>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="trace-toolbar">
        <div className="trace-mode-toggle">
          <button
            className={`trace-mode-btn ${searchMode === 'unit' ? 'active' : ''}`}
            onClick={() => { setSearchMode('unit'); setError(''); setTraceData(null); setGraphData(null); setSelectedNode(null); }}
          >
            <Droplets size={14} /> Blood Unit
          </button>
          <button
            className={`trace-mode-btn ${searchMode === 'donor' ? 'active' : ''}`}
            onClick={() => { setSearchMode('donor'); setError(''); setTraceData(null); setGraphData(null); setSelectedNode(null); }}
          >
            <Users size={14} /> Donor
          </button>
        </div>

        <div className="trace-search-input-wrap">
          <Search size={15} className="trace-search-icon" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={searchMode === 'unit' ? 'Enter Blood Unit ID…' : 'Enter Donor ID…'}
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="trace-search-input"
          />
        </div>

        <button onClick={() => handleSearch()} disabled={loading} className="trace-search-btn">
          {loading ? (
            <><div className="trace-spinner" /> Tracing…</>
          ) : (
            <><Search size={14} /> Trace</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="trace-message trace-error">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* Data source indicator */}
      {dataSource && !error && (
        <div className={`trace-message ${dataSource === 'neo4j' ? 'trace-info-neo4j' : 'trace-info-mysql'}`}>
          {dataSource === 'neo4j' ? <Zap size={15} /> : <Database size={15} />}
          {dataSource === 'neo4j'
            ? 'Lineage sourced from Neo4j graph database.'
            : (traceData?.message || 'Lineage reconstructed from MySQL relational data.')}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !graphData && !traceData && (
        <div className="trace-empty">
          <GitBranch size={40} strokeWidth={1.2} />
          <h3>Trace a Blood Unit or Donor</h3>
          <p>Enter an ID above to visualize the complete donation lineage — from donor through event, screening, and storage.</p>
          <div className="trace-samples">
            <span className="trace-samples-label">Quick Samples</span>
            <div className="trace-samples-row">
              <button onClick={() => handleSearch('unit', 1)} className="trace-sample-btn unit">Unit #1</button>
              <button onClick={() => handleSearch('unit', 2)} className="trace-sample-btn unit">Unit #2</button>
              <button onClick={() => handleSearch('donor', 1)} className="trace-sample-btn donor">Donor #1</button>
              <button onClick={() => handleSearch('donor', 2)} className="trace-sample-btn donor">Donor #2</button>
            </div>
          </div>
        </div>
      )}

      {/* Graph + Details */}
      {graphData && graphData.nodes.length > 0 && (
        <div className="trace-workspace">
          {/* Controls bar */}
          <div className="trace-controls">
            <div className="trace-legend">
              {Object.entries(NODE_STYLES).map(([type, s]) => (
                <div key={type} className="trace-legend-item">
                  <div className="trace-legend-dot" style={{ background: s.color }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="trace-graph-actions">
              <span className="trace-count">{graphData.nodes.length} nodes · {graphData.links.length} edges</span>
              <button onClick={handleFitView} className="trace-fit-btn" title="Fit to view">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Graph canvas */}
          <div className="trace-graph-wrap">
            <div ref={containerRef} className="trace-graph-container">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"
                minZoom={0.3}
                maxZoom={2.5}
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={(node, color, ctx) => {
                  const r = (NODE_STYLES[node.type]?.radius || 14) + 4;
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
            </div>

            {/* Details panel */}
            <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
