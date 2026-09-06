import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, UserRound, Droplets,
  ClipboardList, FlaskConical, CalendarHeart, UserCog, Heart
} from 'lucide-react';

const nav = [
  { label: 'Overview', items: [
    { to: '/',                icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'Core Entities', items: [
    { to: '/blood-banks',     icon: Building2,       label: 'Blood Banks' },
    { to: '/donors',          icon: Users,           label: 'Donors' },
    { to: '/receivers',       icon: UserRound,       label: 'Receivers' },
    { to: '/staff',           icon: UserCog,         label: 'Staff' },
  ]},
  { label: 'Operations', items: [
    { to: '/blood-units',     icon: Droplets,        label: 'Blood Units' },
    { to: '/blood-requests',  icon: ClipboardList,   label: 'Blood Requests' },
    { to: '/donation-events', icon: CalendarHeart,   label: 'Donation Events' },
    { to: '/blood-tests',     icon: FlaskConical,    label: 'Blood Tests' },
  ]},
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true">
          <Heart size={20} color="white" fill="white" />
        </div>
        <div className="sidebar-logo-text">
          Blood<span>Bank</span><br />
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {nav.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="nav-icon" size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0 · DBMS Project 2026</div>
      </div>
    </aside>
  );
}
