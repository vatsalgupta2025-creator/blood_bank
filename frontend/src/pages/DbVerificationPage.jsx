import React, { useState } from 'react';
import { verifyDbRecord } from '../api';
import { ShieldCheck, Search, AlertTriangle, CheckCircle, RotateCcw, Database, Info } from 'lucide-react';

const ENTITY_OPTIONS = [
  { value: 'donor',          label: 'Donor',           pk: 'donor_id' },
  { value: 'receiver',       label: 'Receiver',        pk: 'receiver_id' },
  { value: 'blood_bank',     label: 'Blood Bank',      pk: 'bank_id' },
  { value: 'blood_unit',     label: 'Blood Unit',      pk: 'unit_id' },
  { value: 'blood_request',  label: 'Blood Request',   pk: 'request_id' },
  { value: 'staff',          label: 'Staff',           pk: 'staff_id' },
  { value: 'donation_event', label: 'Donation Event',  pk: 'event_id' },
  { value: 'blood_test',     label: 'Blood Test',      pk: 'test_id' }
];

export default function DbVerificationPage() {
  const [selectedEntity, setSelectedEntity] = useState(ENTITY_OPTIONS[0].value);
  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  // Check role from localStorage
  let isAdmin = false;
  try {
    const userStr = localStorage.getItem('bb_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.role === 'Admin') isAdmin = true;
    }
  } catch {
    isAdmin = false;
  }

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!recordId.trim()) {
      setError('Please enter a record ID.');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const res = await verifyDbRecord(selectedEntity, recordId.trim());
      if (res.success) {
        setVerificationResult(res);
      } else {
        setError(res.message || 'Failed to verify record.');
      }
    } catch (err) {
      setError(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRecordId('');
    setError('');
    setVerificationResult(null);
  };

  const currentEntityConfig = ENTITY_OPTIONS.find(e => e.value === selectedEntity) || ENTITY_OPTIONS[0];

  if (!isAdmin) {
    return (
      <div style={{
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: 600,
        margin: '40px auto',
        background: 'rgba(20, 20, 26, 0.7)',
        borderRadius: 16,
        border: '1px solid rgba(220, 20, 60, 0.2)'
      }}>
        <AlertTriangle size={48} color="#DC143C" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, color: '#F9F6F3', marginBottom: 8 }}>Admin Access Required</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          Database Verification is restricted to Administrator accounts only.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Control Card */}
      <div style={{
        background: 'rgba(20, 20, 26, 0.9)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} color="#DC143C" />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F9F6F3', margin: 0 }}>
              Live MySQL Database Verification
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
              Directly query MySQL table records to verify CRUD operation persistence.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Select Entity / Table
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => { setSelectedEntity(e.target.value); setVerificationResult(null); setError(''); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#0a0a0d',
                color: '#F9F6F3',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: 14,
                outline: 'none'
              }}
            >
              {ENTITY_OPTIONS.map((ent) => (
                <option key={ent.value} value={ent.value}>
                  {ent.label} (Table: {ent.value}, PK: {ent.pk})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Record ID <span style={{ fontSize: 11, color: '#DC143C' }}>({currentEntityConfig.pk})</span>
            </label>
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder={`Enter ${currentEntityConfig.pk} e.g. 1`}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#0a0a0d',
                color: '#F9F6F3',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                border: 'none',
                borderRadius: 10,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(220, 20, 60, 0.3)'
              }}
            >
              <Search size={16} />
              {loading ? 'Verifying...' : 'Verify Record'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.7)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </form>

        {error && (
          <div style={{
            background: 'rgba(220, 20, 60, 0.12)',
            border: '1px solid rgba(220, 20, 60, 0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#FF6B81',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification Output Card */}
      {verificationResult && (
        <div style={{
          background: 'rgba(20, 20, 26, 0.9)',
          borderRadius: 16,
          border: verificationResult.found
            ? '1px solid rgba(74, 222, 128, 0.3)'
            : '1px solid rgba(220, 20, 60, 0.3)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* Header Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {verificationResult.found ? (
                <CheckCircle size={22} color="#4ADE80" />
              ) : (
                <AlertTriangle size={22} color="#FF6B81" />
              )}
              <div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: verificationResult.found ? '#4ADE80' : '#FF6B81'
                }}>
                  {verificationResult.found ? 'RECORD VERIFIED IN MYSQL DATABASE' : 'RECORD NOT FOUND'}
                </span>
                <div style={{ fontSize: 14, color: '#F9F6F3', marginTop: 2 }}>
                  Entity: <code style={{ color: '#DC143C' }}>{verificationResult.entity}</code> | PK Column: <code style={{ color: '#DC143C' }}>{verificationResult.pkColumn}</code> = <strong>{verificationResult.id}</strong>
                </div>
              </div>
            </div>

            <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 20,
              background: verificationResult.found ? 'rgba(74, 222, 128, 0.12)' : 'rgba(220, 20, 60, 0.12)',
              color: verificationResult.found ? '#4ADE80' : '#FF6B81',
              border: verificationResult.found ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(220, 20, 60, 0.3)'
            }}>
              {verificationResult.found ? 'Active Record' : 'Deleted / Nonexistent'}
            </span>
          </div>

          {/* Record Details */}
          {verificationResult.found ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Fetched Row Fields (Direct MySQL Query):
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12
              }}>
                {Object.entries(verificationResult.data).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      background: '#0a0a0d',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#DC143C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {key}
                    </div>
                    <div style={{ fontSize: 14, color: '#F9F6F3', marginTop: 4, wordBreak: 'break-all' }}>
                      {value === null || value === undefined ? (
                        <em style={{ color: 'rgba(255,255,255,0.3)' }}>NULL</em>
                      ) : typeof value === 'boolean' ? (
                        value ? 'TRUE' : 'FALSE'
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(220, 20, 60, 0.08)',
              border: '1px solid rgba(220, 20, 60, 0.2)',
              borderRadius: 12,
              padding: '20px',
              textAlign: 'center',
              color: '#FF6B81',
              fontSize: 14
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {verificationResult.message || 'Record not found — verified deleted from database.'}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Direct query <code>SELECT * FROM {verificationResult.entity} WHERE {verificationResult.pkColumn} = {verificationResult.id}</code> returned 0 rows.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Demo Workflow Guide */}
      <div style={{
        background: 'rgba(20, 20, 26, 0.7)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Info size={18} color="#DC143C" />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F9F6F3', margin: 0 }}>
            Faculty Verification Demo Guide
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
            <strong style={{ color: '#DC143C', fontSize: 12, display: 'block', marginBottom: 4 }}>1. CREATE TEST</strong>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Add a record from Donors/Receivers. Copy the returned ID and verify here to prove it persisted to MySQL.
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
            <strong style={{ color: '#DC143C', fontSize: 12, display: 'block', marginBottom: 4 }}>2. UPDATE TEST</strong>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Edit the record on the main page. Re-verify the ID here to confirm updated column values in MySQL.
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
            <strong style={{ color: '#DC143C', fontSize: 12, display: 'block', marginBottom: 4 }}>3. DELETE TEST</strong>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Delete the record. Re-verify the ID here to confirm "Record not found — verified deleted from database".
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
