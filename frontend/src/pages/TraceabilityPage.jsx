import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, GitBranch, Droplets, Users, Building2, FlaskConical,
  AlertTriangle, Maximize2, Minimize2, X, Info, ChevronRight,
  Database, Zap, ZoomIn, ZoomOut, RotateCcw, Filter, Layers,
  ShieldCheck, ShieldAlert, CheckCircle2, Clock, Calendar,
  Sparkles, Compass, MapPin, Phone, Mail, ArrowRight, ExternalLink
} from 'lucide-react';
import {
  traceBloodUnit,
  traceDonor,
  getGraphStatus,
  expandGraphNode,
  getGraphNodeDetails
} from '../api';
import ForceGraph2D from 'react-force-graph-2d';

/* ── Node & Link Styling ──────────────────────────────────────────────────── */
const NODE_STYLES = {
  Donor: {
    color: '#3B82F6',
    border: '#2563EB',
    bg: 'rgba(59,130,246,0.14)',
    label: 'Donor',
    radius: 17,
    letter: 'D',
    icon: Users
  },
  DonationEvent: {
    color: '#10B981',
    border: '#059669',
    bg: 'rgba(16,185,129,0.14)',
    label: 'Donation Event',
    radius: 15,
    letter: 'E',
    icon: Calendar
  },
  BloodUnit: {
    color: '#DC2626',
    border: '#B91C1C',
    bg: 'rgba(220,38,38,0.14)',
    label: 'Blood Unit',
    radius: 17,
    letter: 'U',
    icon: Droplets
  },
  BloodTest: {
    color: '#F59E0B',
    border: '#D97706',
    bg: 'rgba(245,158,11,0.14)',
    label: 'Blood Test',
    radius: 14,
    letter: 'T',
    icon: FlaskConical
  },
  BloodBank: {
    color: '#8B5CF6',
    border: '#7C3AED',
    bg: 'rgba(139,92,246,0.14)',
    label: 'Blood Bank',
    radius: 16,
    letter: 'B',
    icon: Building2
  },
};

const LINK_STYLES = {
  DONATES:     { color: '#3B82F6', label: 'DONATES' },
  RECEIVED_AT: { color: '#8B5CF6', label: 'RECEIVED AT' },
  GENERATES:   { color: '#DC2626', label: 'GENERATES' },
  HAS_TEST:    { color: '#F59E0B', label: 'HAS TEST' },
  TRANSFUSED_TO: { color: '#EC4899', label: 'TRANSFUSED TO' },
};

/* ── Graph Builders ───────────────────────────────────────────────────────── */
function buildUnitTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, rawId, type, label, subLabel, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, rawId, type, label, subLabel, props: props || {} });
  }

  if (data.unit) {
    const u = data.unit;
    addNode(
      `unit-${u.unit_id}`,
      u.unit_id,
      'BloodUnit',
      u.unit_code || `Unit #${u.unit_id}`,
      u.blood_group ? `${u.blood_group} · ${u.volume_ml || 450}ml` : 'Blood Unit',
      { ...u }
    );
  }

  if (data.donationEvent) {
    const ev = data.donationEvent;
    const evId = ev.event_id;
    addNode(
      `event-${evId}`,
      evId,
      'DonationEvent',
      `Event #${evId}`,
      ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Collection',
      { ...ev }
    );
    if (data.unit) {
      links.push({
        id: `event-${evId}-unit-${data.unit.unit_id}`,
        source: `event-${evId}`,
        target: `unit-${data.unit.unit_id}`,
        label: 'GENERATES'
      });
    }
  }

  if (data.donor) {
    const d = data.donor;
    addNode(
      `donor-${d.donor_id}`,
      d.donor_id,
      'Donor',
      d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Donor #${d.donor_id}`,
      d.blood_group ? `Group ${d.blood_group}` : 'Authorized Donor',
      { ...d }
    );
    if (data.donationEvent) {
      links.push({
        id: `donor-${d.donor_id}-event-${data.donationEvent.event_id}`,
        source: `donor-${d.donor_id}`,
        target: `event-${data.donationEvent.event_id}`,
        label: 'DONATES'
      });
    }
  }

  if (data.bloodBank) {
    const b = data.bloodBank;
    const bankId = b.bank_id;
    addNode(
      `bank-${bankId}`,
      bankId,
      'BloodBank',
      b.name || `Bank #${bankId}`,
      b.city ? `${b.city}, ${b.state || ''}` : 'Blood Center',
      { ...b }
    );
    if (data.donationEvent) {
      links.push({
        id: `event-${data.donationEvent.event_id}-bank-${bankId}`,
        source: `event-${data.donationEvent.event_id}`,
        target: `bank-${bankId}`,
        label: 'RECEIVED_AT'
      });
    }
  }

  if (data.bloodTests && data.bloodTests.length > 0) {
    data.bloodTests.forEach(t => {
      const testId = t.test_id;
      addNode(
        `test-${testId}`,
        testId,
        'BloodTest',
        t.test_type || `Test #${testId}`,
        t.status || 'Passed',
        { ...t }
      );
      if (data.donationEvent) {
        links.push({
          id: `event-${data.donationEvent.event_id}-test-${testId}`,
          source: `event-${data.donationEvent.event_id}`,
          target: `test-${testId}`,
          label: 'HAS_TEST'
        });
      }
    });
  }

  return { nodes, links };
}

function buildDonorTraceGraph(data) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  function addNode(id, rawId, type, label, subLabel, props) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, rawId, type, label, subLabel, props: props || {} });
  }

  if (data.donor) {
    const d = data.donor;
    addNode(
      `donor-${d.donor_id}`,
      d.donor_id,
      'Donor',
      d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Donor #${d.donor_id}`,
      d.blood_group ? `Group ${d.blood_group}` : 'Registered Donor',
      { ...d }
    );
  }

  if (data.donations && Array.isArray(data.donations)) {
    data.donations.forEach(don => {
      if (don.donationEvent) {
        const ev = don.donationEvent;
        const evId = ev.event_id;
        addNode(
          `event-${evId}`,
          evId,
          'DonationEvent',
          `Event #${evId}`,
          ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Donation',
          { ...ev }
        );
        if (data.donor) {
          links.push({
            id: `donor-${data.donor.donor_id}-event-${evId}`,
            source: `donor-${data.donor.donor_id}`,
            target: `event-${evId}`,
            label: 'DONATES'
          });
        }

        if (don.bloodBank) {
          const b = don.bloodBank;
          const bankId = b.bank_id;
          addNode(
            `bank-${bankId}`,
            bankId,
            'BloodBank',
            b.name || `Bank #${bankId}`,
            b.city ? `${b.city}, ${b.state || ''}` : 'Facility',
            { ...b }
          );
          links.push({
            id: `event-${evId}-bank-${bankId}`,
            source: `event-${evId}`,
            target: `bank-${bankId}`,
            label: 'RECEIVED_AT'
          });
        }

        if (don.bloodUnit) {
          const u = don.bloodUnit;
          addNode(
            `unit-${u.unit_id}`,
            u.unit_id,
            'BloodUnit',
            u.unit_code || `Unit #${u.unit_id}`,
            u.blood_group ? `${u.blood_group} · ${u.volume_ml || 450}ml` : 'Unit',
            { ...u }
          );
          links.push({
            id: `event-${evId}-unit-${u.unit_id}`,
            source: `event-${evId}`,
            target: `unit-${u.unit_id}`,
            label: 'GENERATES'
          });
        }

        if (don.bloodTests && don.bloodTests.length > 0) {
          don.bloodTests.forEach(t => {
            const testId = t.test_id;
            addNode(
              `test-${testId}`,
              testId,
              'BloodTest',
              t.test_type || `Test #${testId}`,
              t.status || 'Passed',
              { ...t }
            );
            links.push({
              id: `event-${evId}-test-${testId}`,
              source: `event-${evId}`,
              target: `test-${testId}`,
              label: 'HAS_TEST'
            });
          });
        }
      }
    });
  }

  return { nodes, links };
}

/* ── Bloom Entity Inspector Panel ─────────────────────────────────────────── */
function DetailsPanel({
  node,
  graphData,
  onClose,
  onSelectConnectedNode,
  onExpandNeighbors,
  onFocusNode,
  isExpanding,
  userRole
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailedData, setDetailedData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!node) {
      setDetailedData(null);
      return;
    }
    let isCurrent = true;
    setLoadingDetails(true);
    getGraphNodeDetails(node.type.toLowerCase(), node.rawId)
      .then(res => {
        if (isCurrent && res?.data) {
          setDetailedData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isCurrent) setLoadingDetails(false);
      });
    return () => { isCurrent = false; };
  }, [node]);

  if (!node) return null;

  const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
  const mergedProps = { ...(node.props || {}), ...(detailedData || {}) };
  const isDonor = node.type === 'Donor';
  const isUnit = node.type === 'BloodUnit';
  const isEvent = node.type === 'DonationEvent';
  const isTest = node.type === 'BloodTest';
  const isBank = node.type === 'BloodBank';

  // Connected nodes in current graph
  const connectedNodes = useMemo(() => {
    if (!graphData || !node) return [];
    const conns = [];
    const seen = new Set();
    const nodeId = node.id;

    graphData.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      let targetNodeId = null;
      let relLabel = l.label;

      if (srcId === nodeId) {
        targetNodeId = tgtId;
      } else if (tgtId === nodeId) {
        targetNodeId = srcId;
      }

      if (targetNodeId && !seen.has(targetNodeId)) {
        seen.add(targetNodeId);
        const match = graphData.nodes.find(n => n.id === targetNodeId);
        if (match) {
          conns.push({ node: match, relation: relLabel });
        }
      }
    });
    return conns;
  }, [graphData, node]);

  // Clean key-value entries
  const skipKeys = new Set([
    'identity', 'labels', 'elementId', 'id', 'rawId', 'type', 'label', 'subLabel',
    'piiRestricted', 'donations', 'units', 'bloodTests'
  ]);
  const propEntries = Object.entries(mergedProps).filter(
    ([k, v]) => !skipKeys.has(k) && v != null && v !== '' && typeof v !== 'object'
  );

  function formatKey(k) {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatValue(v) {
    if (v === true || v === 1) return 'Yes';
    if (v === false || v === 0) return 'No';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return String(v);
  }

  return (
    <aside className="bloom-inspector-panel">
      {/* Header */}
      <div className="bloom-panel-header" style={{ borderLeftColor: style.color }}>
        <div className="bloom-panel-header-info">
          <div className="bloom-entity-badge" style={{ backgroundColor: style.bg, color: style.color }}>
            <span className="bloom-entity-dot" style={{ backgroundColor: style.color }} />
            {style.label}
          </div>
          <h2 className="bloom-entity-title">{node.label}</h2>
          <span className="bloom-entity-sub">{node.subLabel || `ID: #${node.rawId}`}</span>
        </div>

        <div className="bloom-panel-header-actions">
          <button
            onClick={() => onFocusNode(node)}
            className="bloom-panel-action-btn"
            title="Center node on canvas"
          >
            <Compass size={14} />
          </button>
          <button
            onClick={() => onExpandNeighbors(node)}
            disabled={isExpanding}
            className="bloom-panel-action-btn primary"
            title="Expand connected relationships"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={onClose}
            className="bloom-panel-action-btn"
            title="Close details"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Role-based Privacy Banner for Donors */}
      {isDonor && (
        <div className={`bloom-pii-banner ${mergedProps.piiRestricted ? 'restricted' : 'authorized'}`}>
          {mergedProps.piiRestricted ? (
            <>
              <ShieldAlert size={14} className="bloom-pii-icon" />
              <div>
                <strong>Clinical Privacy Protection</strong>
                <p>Phone and email are masked for {userRole || 'Clinical Staff'}. Clinical history & eligibility are fully accessible.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="bloom-pii-icon" />
              <div>
                <strong>Full Administrator Access</strong>
                <p>Authorized access to complete donor records and unmasked contact identifiers.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bloom-tabs">
        <button
          className={`bloom-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`bloom-tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          Attributes
        </button>
        <button
          className={`bloom-tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          Lineage ({connectedNodes.length})
        </button>
      </div>

      {/* Tab Body */}
      <div className="bloom-panel-body">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="bloom-overview-section">
            {/* Quick Metrics Grid */}
            <div className="bloom-metrics-grid">
              {isDonor && (
                <>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Blood Group</span>
                    <span className="bloom-metric-val highlight" style={{ color: '#DC2626' }}>
                      {mergedProps.blood_group || 'Unknown'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Eligibility</span>
                    <span className={`bloom-metric-val ${mergedProps.is_eligible ? 'success' : 'warn'}`}>
                      {mergedProps.is_eligible ? 'Eligible' : 'Deferred'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Total Donations</span>
                    <span className="bloom-metric-val">{mergedProps.total_donations || 0}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Age / Gender</span>
                    <span className="bloom-metric-val">
                      {mergedProps.age ? `${mergedProps.age}y` : '—'} · {mergedProps.gender || '—'}
                    </span>
                  </div>
                </>
              )}

              {isUnit && (
                <>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Blood Group</span>
                    <span className="bloom-metric-val highlight" style={{ color: '#DC2626' }}>
                      {mergedProps.blood_group || 'Unknown'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Volume</span>
                    <span className="bloom-metric-val">{mergedProps.volume_ml || 450} mL</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Storage Temp</span>
                    <span className="bloom-metric-val">{mergedProps.storage_temp || '4°C'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Status</span>
                    <span className="bloom-metric-val success">{mergedProps.status || 'Available'}</span>
                  </div>
                </>
              )}

              {isEvent && (
                <>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Event Date</span>
                    <span className="bloom-metric-val">
                      {mergedProps.event_date ? new Date(mergedProps.event_date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Hemoglobin</span>
                    <span className="bloom-metric-val">
                      {mergedProps.hemoglobin_g_dl ? `${mergedProps.hemoglobin_g_dl} g/dL` : '14.5 g/dL'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Blood Pressure</span>
                    <span className="bloom-metric-val">
                      {mergedProps.systolic_bp ? `${mergedProps.systolic_bp}/${mergedProps.diastolic_bp}` : '120/80'}
                    </span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Units Collected</span>
                    <span className="bloom-metric-val success">1 Unit</span>
                  </div>
                </>
              )}

              {isTest && (
                <>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Screening Test</span>
                    <span className="bloom-metric-val">{mergedProps.test_type || 'Serology'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Outcome</span>
                    <span className="bloom-metric-val success">{mergedProps.status || 'Passed'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Tested By</span>
                    <span className="bloom-metric-val">{mergedProps.tested_by || 'Lab Specialist'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Test Date</span>
                    <span className="bloom-metric-val">
                      {mergedProps.test_date ? new Date(mergedProps.test_date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </>
              )}

              {isBank && (
                <>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Storage Capacity</span>
                    <span className="bloom-metric-val">{mergedProps.capacity || 1000} Units</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Established</span>
                    <span className="bloom-metric-val">{mergedProps.established || '2018'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">Location</span>
                    <span className="bloom-metric-val">{mergedProps.city || 'Central Hub'}</span>
                  </div>
                  <div className="bloom-metric-card">
                    <span className="bloom-metric-label">State</span>
                    <span className="bloom-metric-val">{mergedProps.state || 'National'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Contact & Facility section */}
            <div className="bloom-section-card">
              <h3 className="bloom-section-title">Authoritative Source</h3>
              <p className="bloom-section-desc">
                Enriched in real time from MySQL enterprise records with Neo4j Aura graph lineage topology.
              </p>
              {mergedProps.email && (
                <div className="bloom-contact-row">
                  <Mail size={13} />
                  <span>{mergedProps.email}</span>
                </div>
              )}
              {mergedProps.phone && (
                <div className="bloom-contact-row">
                  <Phone size={13} />
                  <span>{mergedProps.phone}</span>
                </div>
              )}
              {(mergedProps.address || mergedProps.street || mergedProps.city) && (
                <div className="bloom-contact-row">
                  <MapPin size={13} />
                  <span>
                    {[mergedProps.address || mergedProps.street, mergedProps.city, mergedProps.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ATTRIBUTES TAB */}
        {activeTab === 'attributes' && (
          <div className="bloom-attributes-table">
            {loadingDetails && (
              <div className="bloom-loading-banner">
                <div className="trace-spinner" />
                <span>Enriching authoritative fields...</span>
              </div>
            )}
            {propEntries.length === 0 ? (
              <div className="bloom-empty-msg">No additional properties stored for this node.</div>
            ) : (
              propEntries.map(([k, v]) => (
                <div key={k} className="bloom-prop-row">
                  <span className="bloom-prop-key">{formatKey(k)}</span>
                  <span className="bloom-prop-val">{formatValue(v)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* LINEAGE & CROSS-NAVIGATION TAB */}
        {activeTab === 'lineage' && (
          <div className="bloom-lineage-section">
            <p className="bloom-lineage-hint">
              Click any connected entity to instantly select and highlight it in the graph canvas.
            </p>

            <div className="bloom-connected-list">
              {connectedNodes.length === 0 ? (
                <div className="bloom-empty-msg">No active connections loaded in current viewport.</div>
              ) : (
                connectedNodes.map(({ node: connNode, relation }) => {
                  const cStyle = NODE_STYLES[connNode.type] || NODE_STYLES.BloodUnit;
                  const Icon = cStyle.icon || GitBranch;
                  return (
                    <button
                      key={connNode.id}
                      onClick={() => onSelectConnectedNode(connNode)}
                      className="bloom-conn-card"
                    >
                      <div className="bloom-conn-card-left">
                        <div
                          className="bloom-conn-icon-badge"
                          style={{ backgroundColor: cStyle.bg, color: cStyle.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="bloom-conn-info">
                          <span className="bloom-conn-relation">{relation.replace(/_/g, ' ')}</span>
                          <span className="bloom-conn-title">{connNode.label}</span>
                          <span className="bloom-conn-type">{cStyle.label}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="bloom-conn-arrow" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Expand neighbors button */}
            <div className="bloom-expand-footer">
              <button
                onClick={() => onExpandNeighbors(node)}
                disabled={isExpanding}
                className="bloom-expand-btn"
              >
                {isExpanding ? (
                  <><div className="trace-spinner" /> Querying Neo4j AuraDB…</>
                ) : (
                  <><Sparkles size={14} /> Expand Node Relationships in AuraDB</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Main Traceability Component ─────────────────────────────────────────── */
export default function TraceabilityPage() {
  const [searchMode, setSearchMode] = useState('unit');
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [graphStatus, setGraphStatus] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [layoutMode, setLayoutMode] = useState('force'); // 'force' | 'hierarchical' | 'radial'
  const [inGraphFilter, setInGraphFilter] = useState('');
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const userRole = useMemo(() => {
    try {
      const stored = localStorage.getItem('bb_user');
      if (stored) return JSON.parse(stored).role || '';
    } catch {}
    return '';
  }, []);

  const canAccess = ['Admin', 'Doctor', 'Nurse'].includes(userRole);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setDimensions({
          width: e.contentRect.width,
          height: Math.max(e.contentRect.height, 460)
        });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [isFullscreen]);

  // Graph status polling
  useEffect(() => {
    if (!canAccess) return;
    getGraphStatus()
      .then(res => setGraphStatus(res))
      .catch(() => {});
  }, [canAccess]);

  // Filtered graph data based on type toggles
  const displayGraphData = useMemo(() => {
    if (!graphData) return null;
    if (hiddenTypes.size === 0) return graphData;

    const visibleNodes = graphData.nodes.filter(n => !hiddenTypes.has(n.type));
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return visibleIds.has(srcId) && visibleIds.has(tgtId);
    });

    return { nodes: visibleNodes, links: visibleLinks };
  }, [graphData, hiddenTypes]);

  // Active focal set (Bloom illumination of neighbor nodes & links)
  const focalNeighborhood = useMemo(() => {
    const focalNode = hoveredNode || selectedNode;
    if (!focalNode || !displayGraphData) return null;

    const set = new Set([focalNode.id]);
    displayGraphData.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (srcId === focalNode.id) set.add(tgtId);
      if (tgtId === focalNode.id) set.add(srcId);
    });
    return set;
  }, [hoveredNode, selectedNode, displayGraphData]);

  // Layout Engine Application
  const applyLayout = useCallback((mode, dataToLayout) => {
    const gd = dataToLayout || graphData;
    if (!gd || !gd.nodes || gd.nodes.length === 0) return;

    if (mode === 'force') {
      gd.nodes.forEach(n => {
        n.fx = undefined;
        n.fy = undefined;
      });
      if (graphRef.current) {
        try {
          const charge = graphRef.current.d3Force('charge');
          if (charge) charge.strength(-450);
          const link = graphRef.current.d3Force('link');
          if (link) link.distance(95);
          graphRef.current.d3ReheatSimulation();
        } catch {}
      }
    } else if (mode === 'hierarchical') {
      // Order: Donor (col 0) -> DonationEvent (col 1) -> BloodUnit / BloodTest (col 2) -> BloodBank (col 3)
      const tiers = {
        Donor: { col: -320, nodes: [] },
        DonationEvent: { col: -110, nodes: [] },
        BloodTest: { col: 120, nodes: [] },
        BloodUnit: { col: 120, nodes: [] },
        BloodBank: { col: 340, nodes: [] },
      };

      gd.nodes.forEach(n => {
        if (tiers[n.type]) tiers[n.type].nodes.push(n);
        else tiers.BloodUnit.nodes.push(n);
      });

      Object.values(tiers).forEach(t => {
        const count = t.nodes.length;
        t.nodes.forEach((n, idx) => {
          n.fx = t.col;
          n.fy = count > 1 ? (idx - (count - 1) / 2) * 85 : 0;
        });
      });

      if (graphRef.current) graphRef.current.d3ReheatSimulation();
    } else if (mode === 'radial') {
      // Center node is primary entity or selected node
      const center = selectedNode
        ? gd.nodes.find(n => n.id === selectedNode.id) || gd.nodes[0]
        : gd.nodes[0];

      if (!center) return;
      center.fx = 0;
      center.fy = 0;

      const others = gd.nodes.filter(n => n.id !== center.id);
      const ring1 = [];
      const ring2 = [];

      others.forEach(n => {
        if (n.type === 'DonationEvent' || n.type === 'BloodUnit') ring1.push(n);
        else ring2.push(n);
      });

      const r1 = 150;
      ring1.forEach((n, i) => {
        const theta = (2 * Math.PI * i) / Math.max(ring1.length, 1);
        n.fx = r1 * Math.cos(theta);
        n.fy = r1 * Math.sin(theta);
      });

      const r2 = 270;
      ring2.forEach((n, i) => {
        const theta = (2 * Math.PI * i) / Math.max(ring2.length, 1);
        n.fx = r2 * Math.cos(theta);
        n.fy = r2 * Math.sin(theta);
      });

      if (graphRef.current) graphRef.current.d3ReheatSimulation();
    }
  }, [graphData, selectedNode]);

  // Trace execution handler
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
    setHoveredNode(null);

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
      applyLayout(layoutMode, gd);

      // Auto-select root traced node
      const rootNode = gd.nodes.find(n => n.type === (activeMode === 'unit' ? 'BloodUnit' : 'Donor'));
      if (rootNode) setSelectedNode(rootNode);

      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 75);
          setTimeout(() => {
            if (graphRef.current && graphRef.current.zoom() > 2.0) {
              graphRef.current.zoom(1.8, 300);
            }
          }, 420);
        }
      }, 550);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch trace data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchId, searchMode, layoutMode, applyLayout]);

  // Fit to view
  const handleFitView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 75);
      setTimeout(() => {
        if (graphRef.current && graphRef.current.zoom() > 2.0) {
          graphRef.current.zoom(1.8, 300);
        }
      }, 420);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.3, 300);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 0.75, 300);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 400);
      graphRef.current.zoom(1.2, 400);
    }
  }, []);

  // Center on specific node
  const handleFocusNode = useCallback((node) => {
    if (graphRef.current && node && typeof node.x === 'number') {
      graphRef.current.centerAt(node.x, node.y, 450);
      graphRef.current.zoom(1.85, 450);
    }
    setSelectedNode(node);
  }, []);

  // Dynamic Neighbor Expansion
  const handleExpandNeighbors = useCallback(async (nodeToExpand) => {
    const target = nodeToExpand || selectedNode;
    if (!target) return;

    setIsExpanding(true);
    try {
      const res = await expandGraphNode(target.type.toLowerCase(), target.rawId);
      if (!res.success || !res.data) {
        showToast('No additional neighboring relationships found.');
        return;
      }

      const { nodes: newNodes, links: newLinks } = res.data;
      setGraphData(prev => {
        if (!prev) return prev;
        const existingNodeIds = new Set(prev.nodes.map(n => n.id));
        const existingLinkIds = new Set(prev.links.map(l => l.id || `${typeof l.source === 'object' ? l.source.id : l.source}-${typeof l.target === 'object' ? l.target.id : l.target}`));

        let addedNodesCount = 0;
        const mergedNodes = [...prev.nodes];

        newNodes.forEach(nn => {
          if (!existingNodeIds.has(nn.id)) {
            existingNodeIds.add(nn.id);
            // Place near the parent node with small jitter
            const jitterX = (Math.random() - 0.5) * 40;
            const jitterY = (Math.random() - 0.5) * 40;
            mergedNodes.push({
              ...nn,
              x: (target.x || 0) + jitterX,
              y: (target.y || 0) + jitterY,
            });
            addedNodesCount++;
          }
        });

        const mergedLinks = [...prev.links];
        newLinks.forEach(nl => {
          const key = nl.id || `${nl.source}-${nl.target}`;
          if (!existingLinkIds.has(key)) {
            existingLinkIds.add(key);
            mergedLinks.push(nl);
          }
        });

        if (addedNodesCount > 0) {
          showToast(`Expanded ${addedNodesCount} new connected entities in AuraDB.`);
        } else {
          showToast('All connected entities are already loaded on canvas.');
        }

        const nextData = { nodes: mergedNodes, links: mergedLinks };
        return nextData;
      });

      if (graphRef.current) graphRef.current.d3ReheatSimulation();
    } catch (err) {
      showToast('Expansion failed: ' + (err.message || 'Service error'));
    } finally {
      setIsExpanding(false);
    }
  }, [selectedNode, showToast]);

  // Layout mode switcher
  const handleLayoutChange = useCallback((mode) => {
    setLayoutMode(mode);
    applyLayout(mode, graphData);
  }, [applyLayout, graphData]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!workspaceRef.current) return;
    if (!document.fullscreenElement) {
      workspaceRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Filter type toggle
  const toggleTypeFilter = useCallback((type) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // In-graph search handler
  const handleInGraphSearch = useCallback((query) => {
    setInGraphFilter(query);
    if (!query || !displayGraphData) return;

    const q = query.trim().toLowerCase();
    const match = displayGraphData.nodes.find(n =>
      n.label.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q) ||
      String(n.rawId) === q ||
      (n.subLabel && n.subLabel.toLowerCase().includes(q))
    );

    if (match) {
      handleFocusNode(match);
    }
  }, [displayGraphData, handleFocusNode]);

  // Canvas Node Painting (Bloom-Style Aesthetics)
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const style = NODE_STYLES[node.type] || NODE_STYLES.BloodUnit;
    const r = style.radius;
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#F1F5F9' : '#0F172A';

    // Bloom Illumination Logic: Dim non-focal elements to 0.16 opacity
    const isFocal = !focalNeighborhood || focalNeighborhood.has(node.id);
    ctx.globalAlpha = isFocal ? 1.0 : 0.16;

    // Glowing aura ring when active/selected
    if (isSelected || isHovered) {
      ctx.shadowColor = style.color;
      ctx.shadowBlur = isSelected ? 22 : 14;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
      ctx.fill();
    }

    // Main Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? style.color : style.border;
    ctx.fill();

    // Solid Inner Ring
    ctx.strokeStyle = isSelected ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)');
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Letter Initial inside Node
    ctx.font = `700 ${Math.round(r * 0.95)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(style.letter, node.x, node.y + 0.5);

    // Primary Label below Node
    const effectiveScale = Math.max(globalScale || 1, 0.4);
    const labelSize = Math.min(13, Math.max(8, 9.5 / effectiveScale));
    ctx.font = `${isSelected ? '700' : '600'} ${labelSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = isSelected ? style.color : textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let label = node.label || '';
    if (label.length > 20) label = label.slice(0, 18) + '…';
    ctx.fillText(label, node.x, node.y + r + 4);

    // Sub-label (e.g. Group A+, 450ml)
    if (globalScale > 0.8 && node.subLabel) {
      const subSize = Math.max(7, 7.5 / effectiveScale);
      ctx.font = `500 ${subSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
      let sub = node.subLabel;
      if (sub.length > 24) sub = sub.slice(0, 22) + '…';
      ctx.fillText(sub, node.x, node.y + r + labelSize + 6);
    }

    ctx.globalAlpha = 1.0;
  }, [selectedNode, hoveredNode, focalNeighborhood]);

  // Canvas Link Painting (Bloom-Style Directional Flow)
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const style = LINK_STYLES[link.label] || { color: '#64748B' };
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number' || typeof end.x !== 'number') return;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    // Bloom Illumination Logic: Dim non-focal links
    const srcId = typeof start === 'object' ? start.id : start;
    const tgtId = typeof end === 'object' ? end.id : end;
    const isFocal = !focalNeighborhood || (focalNeighborhood.has(srcId) && focalNeighborhood.has(tgtId));
    ctx.globalAlpha = isFocal ? 0.95 : 0.12;

    const strokeColor = style.color + (isDark ? 'CC' : 'E6');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isFocal ? 1.8 : 1.0;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Directional Arrow Head
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const endR = (NODE_STYLES[end.type]?.radius || 15) + 3;
    const ratio = (len - endR) / len;
    const arrowX = start.x + dx * ratio;
    const arrowY = start.y + dy * ratio;
    const arrowLen = 7;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle - Math.PI / 7), arrowY - arrowLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle + Math.PI / 7), arrowY - arrowLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // Relationship Label on midpoint
    if (globalScale > 0.6) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const effectiveScale = Math.max(globalScale || 1, 0.4);
      const fontSize = Math.min(11, Math.max(7, 8 / effectiveScale));
      ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = isDark ? style.color : (style.color === '#F59E0B' ? '#B45309' : style.color);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const relLabel = (link.label || '').replace(/_/g, ' ');
      ctx.fillText(relLabel, midX, midY - 5 / effectiveScale);
    }

    ctx.globalAlpha = 1.0;
  }, [focalNeighborhood]);

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
    <div className={`trace-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bloom-toast">
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Status Bar */}
      <div className="trace-header">
        <div className="trace-breadcrumb">
          <span>Clinical Operations</span>
          <ChevronRight size={14} />
          <span className="trace-breadcrumb-active">Blood Traceability Explorer</span>
        </div>
        <div className="trace-title-row">
          <div>
            <h1 className="trace-title">Lineage & Traceability Explorer</h1>
            <p className="trace-subtitle">
              Interactive Neo4j graph lineage tracking donors, donation events, laboratory screenings, blood units, and inventory banks.
            </p>
          </div>
          <div className="trace-status-badges">
            <div className="trace-status-badge" data-connected={isNeo4jConnected ? 'true' : 'false'}>
              <div className="trace-status-dot" />
              <span>{isNeo4jConnected ? 'Neo4j AuraDB Live' : 'Neo4j Offline'}</span>
            </div>
            {dataSource && (
              <div className={`trace-source-badge ${dataSource}`}>
                {dataSource === 'neo4j' ? <Zap size={12} /> : <Database size={12} />}
                <span>{dataSource === 'neo4j' ? 'Graph Sourced' : 'Relational Fallback'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trace Search Toolbar */}
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
            placeholder={searchMode === 'unit' ? 'Enter Blood Unit ID (e.g. 1, 2)…' : 'Enter Donor ID (e.g. 1, 2)…'}
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="trace-search-input"
          />
        </div>

        <button onClick={() => handleSearch()} disabled={loading} className="trace-search-btn">
          {loading ? (
            <><div className="trace-spinner" /> Tracing Lineage…</>
          ) : (
            <><Search size={14} /> Trace</>
          )}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="trace-message trace-error">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Source Banner */}
      {dataSource && !error && (
        <div className={`trace-message ${dataSource === 'neo4j' ? 'trace-info-neo4j' : 'trace-info-mysql'}`}>
          {dataSource === 'neo4j' ? <Zap size={15} /> : <Database size={15} />}
          <span>
            {dataSource === 'neo4j'
              ? 'Complete multi-hop lineage projected directly from Neo4j AuraDB graph database.'
              : (traceData?.message || 'Lineage reconstructed authoritatively from MySQL relational tables.')}
          </span>
        </div>
      )}

      {/* Empty State / Quick Launch */}
      {!loading && !error && !graphData && !traceData && (
        <div className="trace-empty">
          <div className="bloom-empty-icon-wrap">
            <GitBranch size={44} strokeWidth={1.3} className="bloom-empty-icon" />
          </div>
          <h3>Bloom Traceability Workspace</h3>
          <p>
            Trace real-time chain of custody from donation through serology screening to temperature-monitored storage banks.
          </p>
          <div className="trace-samples">
            <span className="trace-samples-label">Quick Demonstration Traces</span>
            <div className="trace-samples-row">
              <button onClick={() => handleSearch('unit', 1)} className="trace-sample-btn unit">
                <Droplets size={12} /> Blood Unit #1
              </button>
              <button onClick={() => handleSearch('unit', 2)} className="trace-sample-btn unit">
                <Droplets size={12} /> Blood Unit #2
              </button>
              <button onClick={() => handleSearch('donor', 1)} className="trace-sample-btn donor">
                <Users size={12} /> Donor #1 (Rahul Sharma)
              </button>
              <button onClick={() => handleSearch('donor', 2)} className="trace-sample-btn donor">
                <Users size={12} /> Donor #2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bloom Graph Exploration Canvas & Inspector */}
      {graphData && graphData.nodes.length > 0 && (
        <div ref={workspaceRef} className="trace-workspace">
          {/* Canvas HUD & Controls Toolbar */}
          <div className="bloom-canvas-toolbar">
            {/* Filter entity pills */}
            <div className="bloom-filter-pills">
              <span className="bloom-filter-title"><Filter size={12} /> Filter:</span>
              {Object.entries(NODE_STYLES).map(([type, s]) => {
                const isHidden = hiddenTypes.has(type);
                const count = graphData.nodes.filter(n => n.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`bloom-filter-chip ${isHidden ? 'hidden' : 'active'}`}
                    style={{
                      borderColor: isHidden ? 'transparent' : s.color,
                      backgroundColor: isHidden ? 'transparent' : s.bg,
                      color: isHidden ? 'var(--text-muted)' : s.color
                    }}
                  >
                    <span className="bloom-chip-dot" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                    <span className="bloom-chip-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* In-Graph Search Bar */}
            <div className="bloom-node-search-wrap">
              <Search size={13} className="bloom-node-search-icon" />
              <input
                type="text"
                placeholder="Find node by name or ID…"
                value={inGraphFilter}
                onChange={e => handleInGraphSearch(e.target.value)}
                className="bloom-node-search-input"
              />
              {inGraphFilter && (
                <button onClick={() => handleInGraphSearch('')} className="bloom-node-search-clear">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Layout switchers & Camera actions */}
            <div className="bloom-layout-controls">
              <div className="bloom-layout-btn-group">
                <button
                  className={`bloom-layout-btn ${layoutMode === 'force' ? 'active' : ''}`}
                  onClick={() => handleLayoutChange('force')}
                  title="Organic Force-Directed Layout"
                >
                  Force
                </button>
                <button
                  className={`bloom-layout-btn ${layoutMode === 'hierarchical' ? 'active' : ''}`}
                  onClick={() => handleLayoutChange('hierarchical')}
                  title="Hierarchical Lineage DAG"
                >
                  DAG
                </button>
                <button
                  className={`bloom-layout-btn ${layoutMode === 'radial' ? 'active' : ''}`}
                  onClick={() => handleLayoutChange('radial')}
                  title="Concentric Radial Layout"
                >
                  Radial
                </button>
              </div>

              <div className="bloom-camera-btn-group">
                <button onClick={handleZoomIn} className="bloom-camera-btn" title="Zoom in">
                  <ZoomIn size={14} />
                </button>
                <button onClick={handleZoomOut} className="bloom-camera-btn" title="Zoom out">
                  <ZoomOut size={14} />
                </button>
                <button onClick={handleFitView} className="bloom-camera-btn" title="Fit to view">
                  <Maximize2 size={14} />
                </button>
                <button onClick={handleResetCamera} className="bloom-camera-btn" title="Reset view">
                  <RotateCcw size={14} />
                </button>
                <button onClick={toggleFullscreen} className="bloom-camera-btn" title="Toggle Fullscreen">
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>

              <div className="bloom-stats-badge">
                <span>{displayGraphData.nodes.length} nodes · {displayGraphData.links.length} edges</span>
              </div>
            </div>
          </div>

          {/* Graph Viewport + Inspector */}
          <div className="trace-graph-wrap">
            <div ref={containerRef} className="trace-graph-container">
              <ForceGraph2D
                ref={graphRef}
                graphData={displayGraphData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"
                minZoom={0.25}
                maxZoom={3.0}
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={(node, color, ctx) => {
                  const r = (NODE_STYLES[node.type]?.radius || 15) + 6;
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                  ctx.fill();
                }}
                linkCanvasObject={linkCanvasObject}
                linkDirectionalParticles={0}
                onNodeClick={(node) => setSelectedNode(node)}
                onNodeHover={(node) => setHoveredNode(node || null)}
                onBackgroundClick={() => setSelectedNode(null)}
                cooldownTicks={120}
                d3AlphaDecay={0.03}
                d3VelocityDecay={0.25}
                enableZoomInteraction={true}
                enablePanInteraction={true}
              />
            </div>

            {/* Bloom Entity Details Panel */}
            <DetailsPanel
              node={selectedNode}
              graphData={graphData}
              onClose={() => setSelectedNode(null)}
              onSelectConnectedNode={handleFocusNode}
              onExpandNeighbors={handleExpandNeighbors}
              onFocusNode={handleFocusNode}
              isExpanding={isExpanding}
              userRole={userRole}
            />
          </div>
        </div>
      )}
    </div>
  );
}
