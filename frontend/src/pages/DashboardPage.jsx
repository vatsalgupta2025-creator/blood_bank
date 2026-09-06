import { useState, useEffect } from 'react';
import {
  ClipboardList, Droplets, UserRound, Building2, AlertTriangle,
  Users, CalendarHeart, FlaskConical, UserCog, ArrowRight
} from 'lucide-react';
import { getDashboardSummary, getBloodRequests, getDonationEvents, getBloodBanks } from '../api';
import { useNavigate } from 'react-router-dom';
import { BloodGroupBadge, UrgencyBadge, formatDate } from '../components/Badges';

function BloodDropIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
    </svg>
  );
}

function HeartbeatLine({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="0,20 30,20 45,5 55,35 65,12 80,28 95,20 200,20" />
    </svg>
  );
}

const modules = [
  { to: '/donors',          icon: Users,          label: 'Donors',           desc: 'Manage registered blood donors',       color: '#DC143C' },
  { to: '/blood-units',     icon: Droplets,       label: 'Blood Inventory',  desc: 'Track blood units & stock levels',     color: '#8B0000' },
  { to: '/blood-banks',     icon: Building2,      label: 'Blood Banks',      desc: 'Find & manage donation centers',       color: '#B22222' },
  { to: '/blood-requests',  icon: ClipboardList,  label: 'Blood Requests',   desc: 'Handle transfusion requests',          color: '#DC143C' },
  { to: '/receivers',       icon: UserRound,      label: 'Receivers',        desc: 'Patients & blood receivers',           color: '#8B0000' },
  { to: '/donation-events', icon: CalendarHeart,  label: 'Donation Events',  desc: 'Camps & event records',                color: '#B22222' },
  { to: '/blood-tests',     icon: FlaskConical,   label: 'Blood Tests',      desc: 'Screening & test results',             color: '#DC143C' },
  { to: '/staff',           icon: UserCog,        label: 'Staff',            desc: 'Blood bank staff & personnel',         color: '#8B0000' },
];

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [requests, setRequests] = useState([]);
  const [events, setEvents]     = useState([]);
  const [banks, setBanks]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getBloodRequests(),
      getDonationEvents(),
      getBloodBanks()
    ])
      .then(([resData, resReq, resEvt, resBank]) => {
        setData(resData.data);
        // Filter urgent/critical pending requests
        setRequests(resReq.data.filter(r => 
          ['Pending', 'Approved'].includes(r.status) && 
          ['Urgent', 'Critical'].includes(r.urgency)
        ).slice(0, 5)); // top 5
        
        // Take latest 5 events
        setEvents(resEvt.data.slice(0, 5));
        
        // Take some banks for overview
        setBanks(resBank.data.slice(0, 4));
      })
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#A1A1AA' }}>Loading dashboard...</div>
  );
  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#DC143C' }}>
      <AlertTriangle size={48} style={{ margin: '0 auto 16px' }} />
      <h2>Error Loading Dashboard</h2>
      <p>{error}</p>
    </div>
  );
  if (!data) return null;

  return (
    <div style={{ margin: 0, padding: 0, width: '100%', background: '#0F0F12' }}>

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(139,0,0,0.22) 0%, transparent 70%), radial-gradient(ellipse 50% 80% at 20% 80%, rgba(90,0,0,0.15) 0%, transparent 60%), #0F0F12',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{
          position: 'relative', maxWidth: 1280, margin: '0 auto',
          padding: '64px 40px', width: '100%',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 48, alignItems: 'center',
          }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Trust badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC143C', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
                  Trusted Blood Management Platform
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(40px, 5vw, 72px)',
                lineHeight: 1.05,
                fontFamily: 'var(--font-display)',
                color: '#F9F6F3',
                margin: 0,
              }}>
                Every Drop<br />
                <em style={{ fontStyle: 'normal', color: '#DC143C' }}>Can Save</em><br />
                a Life.
              </h1>

              <p style={{
                fontSize: 17, color: 'rgba(255,255,255,0.55)',
                maxWidth: 480, lineHeight: 1.7, margin: 0,
              }}>
                Connect donors, blood banks, healthcare teams, and patients through
                one intelligent blood management platform.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a
                  href="#modules"
                  style={{
                    padding: '14px 28px', background: '#8B0000', color: 'white',
                    fontWeight: 500, borderRadius: 12, fontSize: 14,
                    textDecoration: 'none', transition: 'all 0.2s',
                    boxShadow: '0 0 20px rgba(139,0,0,0.3)',
                  }}
                >
                  Find Blood
                </a>
                <button
                  onClick={() => navigate('/donors')}
                  style={{
                    padding: '14px 28px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500, borderRadius: 12, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Donate Blood
                </button>
              </div>
            </div>

            {/* Right — Hero visual */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 auto' }}>
                <div style={{
                  position: 'relative', borderRadius: 24, overflow: 'hidden',
                  aspectRatio: '4/5',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1770221797869-81e508282ac4?w=800&h=1000&fit=crop&auto=format"
                    alt="Medical professionals"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) saturate(0.85)' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(90,0,0,0.7) 0%, transparent 50%), linear-gradient(to right, rgba(15,15,18,0.5) 0%, transparent 40%)',
                  }} />
                  <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                    <HeartbeatLine className="text-[#DC143C] w-full animate-heartbeat opacity-80" />
                  </div>
                </div>

                {/* Floating badges */}
                <div style={{
                  position: 'absolute', top: -16, left: -16,
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
                  borderRadius: 16, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BloodDropIcon className="w-4 h-4 text-[#DC143C]" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>A+ Available</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>342 units ready</div>
                  </div>
                </div>

                <div style={{
                  position: 'absolute', bottom: -16, right: -16,
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
                  borderRadius: 16, padding: '12px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F87171' }}>O− Critical</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Urgent need · 63 units</div>
                </div>

                <div style={{
                  position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
                  borderRadius: 16, padding: '12px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>24/7 Support</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginTop: 2 }}>Blood Emergency Line</div>
                </div>
              </div>

              {/* Background glow */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: -1, borderRadius: '50%',
                filter: 'blur(60px)',
                background: 'radial-gradient(circle, rgba(139,0,0,0.25) 0%, transparent 70%)',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATISTICS STRIP ──────────────────────────────────────── */}
      <section style={{
        background: '#16161A',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 0',
        width: '100%',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 40px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        }}>
          {[
            { value: `${data.availableUnits}+`, label: 'Blood Units' },
            { value: `${data.eligibleDonors}+`, label: 'Donors' },
            { value: data.totalBanks, label: 'Blood Banks' },
            { value: data.pendingRequests, label: 'Pending Requests' },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px 12px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{
                fontSize: 32, fontWeight: 700, color: '#F9F6F3',
                fontFamily: 'var(--font-display)',
              }}>{stat.value}</div>
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4,
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DETAILED OVERVIEW SECTIONS ─────────────────────────────── */}
      <section style={{ padding: '64px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          
          {/* Blood Inventory Overview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F9F6F3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Droplets size={20} color="#DC143C" /> Inventory Status
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/blood-units')}>View All</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => {
                const count = data.bloodGroupInventory.find(g => g.blood_group === group)?.count || 0;
                const isLow = count < 20;
                return (
                  <div key={group} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLow ? 'rgba(220,20,60,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {isLow && (
                      <div style={{
                        position: 'absolute', top: -10, right: -10, width: 40, height: 40,
                        background: 'radial-gradient(circle, rgba(220,20,60,0.4) 0%, transparent 70%)',
                      }} />
                    )}
                    <div style={{ fontSize: 24, fontWeight: 700, color: isLow ? '#F87171' : '#F9F6F3' }}>
                      {group}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      {count} Units
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Blood Requests */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F9F6F3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#F59E0B" /> Urgent Requests
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/blood-requests')}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
                  No urgent requests pending.
                </div>
              ) : requests.map(req => (
                <div key={req.request_id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#F9F6F3', fontSize: 15 }}>{req.receiver_name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      Required by {formatDate(req.required_by)} at {req.bank_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BloodGroupBadge group={req.blood_group} />
                    <UrgencyBadge urgency={req.urgency} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
          
          {/* Recent Activity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F9F6F3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarHeart size={20} color="#10B981" /> Recent Activity
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/donation-events')}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
                  No recent activities recorded.
                </div>
              ) : events.map(evt => (
                <div key={evt.event_id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Droplets size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: '#F9F6F3' }}>
                      <strong style={{ fontWeight: 600 }}>{evt.donor_name}</strong> donated blood.
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      {formatDate(evt.event_date)} at {evt.bank_name}
                    </div>
                  </div>
                  <BloodGroupBadge group={evt.blood_group} />
                </div>
              ))}
            </div>
          </div>

          {/* Connected Blood Banks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F9F6F3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="#3B82F6" /> Connected Banks
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/blood-banks')}>View All</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {banks.map(bank => (
                <div key={bank.bank_id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#F9F6F3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bank.name}
                  </h3>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    {bank.city}, {bank.state}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    Capacity: {bank.capacity} units
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* ── MODULES GRID ──────────────────────────────────────────── */}
      <section id="modules" style={{
        background: '#0F0F12',
        padding: '80px 40px',
        width: '100%',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontSize: 11, color: '#DC143C', letterSpacing: '0.2em',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 12,
            }}>Quick Access</div>
            <h2 style={{
              fontSize: 'clamp(28px, 3vw, 44px)',
              fontFamily: 'var(--font-display)',
              color: '#F9F6F3', margin: '0 0 12px 0',
            }}>
              System Modules
            </h2>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Access all blood bank management functions from one place
            </p>
          </div>

          {/* Module cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}>
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.to}
                  onClick={() => navigate(mod.to)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: 28,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = `${mod.color}33`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px ${mod.color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Subtle corner glow */}
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 80, height: 80, borderRadius: '50%',
                    background: `radial-gradient(circle, ${mod.color}15 0%, transparent 70%)`,
                  }} />

                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${mod.color}15`,
                    border: `1px solid ${mod.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Icon size={24} color={mod.color} />
                  </div>

                  <h3 style={{
                    margin: '0 0 8px 0', fontSize: 17, fontWeight: 600,
                    color: '#F9F6F3',
                  }}>{mod.label}</h3>

                  <p style={{
                    margin: '0 0 16px 0', fontSize: 13,
                    color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
                  }}>{mod.desc}</p>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 500, color: mod.color,
                  }}>
                    Open module <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
