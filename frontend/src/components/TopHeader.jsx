import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Droplet, Moon, Sun } from 'lucide-react';
import Modal from './Modal';
import { getBloodBanks, createDonationEvent } from '../api';
import { useToast } from '../context/ToastContext';

export default function TopHeader() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ donor_name: '', bank_id: '', event_date: '' });

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  const openBookingModal = async () => {
    setModalOpen(true);
    setFormData({ donor_name: '', bank_id: '', event_date: new Date().toISOString().split('T')[0] });
    try {
      const res = await getBloodBanks();
      setBanks(res.data);
      if (res.data.length > 0) setFormData(f => ({ ...f, bank_id: res.data[0].bank_id }));
    } catch (e) {
      toast.error('Failed to load blood banks');
    }
  };

  const handleBook = async () => {
    if (!formData.donor_name || !formData.bank_id || !formData.event_date) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await createDonationEvent(formData);
      toast.success('Appointment booked successfully!');
      setModalOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(15, 15, 18, 0.95)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Main navbar */}
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 32px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>

          {/* Left: Logo */}
          <NavLink to="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DC143C, #8B0000)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(220,20,60,0.25)',
            }}>
              <Droplet color="white" size={18} />
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#F9F6F3',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display, inherit)',
            }}>
              LifeFlow
            </span>
          </NavLink>

          {/* Center: Navigation */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {[
              { to: '/dashboard',        label: 'Dashboard' },
              { to: '/donors',           label: 'Donors' },
              { to: '/receivers',        label: 'Receivers' },
              { to: '/blood-banks',      label: 'Centers' },
              { to: '/blood-units',      label: 'Inventory' },
              { to: '/blood-requests',   label: 'Requests' },
              { to: '/donation-events',  label: 'Events' },
              { to: '/blood-tests',      label: 'Tests' },
              { to: '/staff',            label: 'Staff' },
            ].map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 450,
                  color: isActive ? '#F9F6F3' : 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  borderRadius: 10,
                  background: isActive ? 'rgba(220,20,60,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(220,20,60,0.2)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            <button
              onClick={toggleTheme}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#F9F6F3';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={openBookingModal}
              style={{
                padding: '10px 22px',
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 12px rgba(220,20,60,0.25)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(220,20,60,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(220,20,60,0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Book Appointment
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('bb_user');
                window.location.href = '/login';
              }}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(220,20,60,0.2)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'rgba(220,20,60,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Book Blood Donation Appointment"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBook} disabled={saving}>{saving ? 'Booking...' : 'Confirm Appointment'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Your Name <span className="text-red-500">*</span></label>
            <input className="form-input" placeholder="Enter your full name" value={formData.donor_name} onChange={e => setFormData(f => ({...f, donor_name: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Select Blood Bank <span className="text-red-500">*</span></label>
            <select className="form-select" value={formData.bank_id} onChange={e => setFormData(f => ({...f, bank_id: e.target.value}))}>
              <option value="">Select a center...</option>
              {banks.map(b => (
                <option key={b.bank_id} value={b.bank_id}>{b.name} - {b.city}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Date <span className="text-red-500">*</span></label>
            <input className="form-input" type="date" value={formData.event_date} onChange={e => setFormData(f => ({...f, event_date: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </>
  );
}
