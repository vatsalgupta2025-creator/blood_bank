import React, { useState } from 'react';
import { executeSqlQuery } from '../api';
import { Play, RotateCcw, Terminal, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

const EXAMPLE_QUERIES = [
  { label: 'All Donors', sql: 'SELECT * FROM donor;' },
  { label: 'O+ Donors', sql: "SELECT first_name, last_name, blood_group, phone FROM donor WHERE blood_group = 'O+';" },
  { label: 'O+ Donors in Jaipur', sql: "SELECT first_name, last_name, blood_group, city FROM donor WHERE blood_group = 'O+' AND city = 'Jaipur';" },
  { label: 'Available Blood Units', sql: "SELECT * FROM blood_unit WHERE status = 'Available';" },
  { label: 'Critical Requests', sql: "SELECT * FROM blood_request WHERE urgency = 'Critical';" }
];

export default function SqlConsolePage() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].sql);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

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

  const handleRunQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query.');
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await executeSqlQuery(query);
      if (res.success) {
        setResults(res);
      } else {
        setError(res.message || 'Failed to execute query.');
      }
    } catch (err) {
      setError(err.message || 'Execution error.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setResults(null);
  };

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
        <AlertCircle size={48} color="#DC143C" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, color: '#F9F6F3', marginBottom: 8 }}>Admin Access Required</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
          The SQL Console is restricted to Administrator accounts only.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner / Examples */}
      <div style={{
        background: 'rgba(20, 20, 26, 0.8)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 24px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Terminal size={20} color="#DC143C" />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F9F6F3', margin: 0 }}>
            Example Queries
          </h2>
          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: 10
          }}>
            Click to load
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {EXAMPLE_QUERIES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(ex.sql); setError(''); }}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '7px 14px',
                borderRadius: 8,
                background: query === ex.sql ? 'rgba(220, 20, 60, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: query === ex.sql ? '1px solid rgba(220, 20, 60, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: query === ex.sql ? '#FF6B81' : 'rgba(255, 255, 255, 0.75)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Database size={13} />
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Card */}
      <div style={{
        background: 'rgba(20, 20, 26, 0.9)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
            SQL Query Terminal <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>(SELECT queries only)</span>
          </label>
          <span style={{ fontSize: 12, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> Read-Only Mode Active
          </span>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SELECT query here..."
          rows={5}
          style={{
            width: '100%',
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 14,
            padding: '16px',
            borderRadius: 10,
            background: '#0a0a0d',
            color: '#F9F6F3',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.5'
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleRunQuery}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
              background: 'linear-gradient(135deg, #DC143C, #8B0000)',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 2px 12px rgba(220, 20, 60, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={16} />
            {loading ? 'Executing...' : 'Run Query'}
          </button>

          <button
            onClick={handleClear}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={15} />
            Clear
          </button>
        </div>

        {/* Error message */}
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
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Card */}
      {results && (
        <div style={{
          background: 'rgba(20, 20, 26, 0.9)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F9F6F3', margin: 0 }}>
              Query Execution Result
            </h3>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#4ADE80',
              background: 'rgba(74, 222, 128, 0.1)',
              padding: '4px 12px',
              borderRadius: 12,
              border: '1px solid rgba(74, 222, 128, 0.2)'
            }}>
              {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'} returned
            </span>
          </div>

          {results.rows.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: 14
            }}>
              No records returned for this query.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {results.columns.map((col, idx) => (
                      <th
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          fontWeight: 600,
                          color: '#DC143C',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      {results.columns.map((col, colIdx) => {
                        const val = row[col];
                        let displayVal = val;
                        if (val === null || val === undefined) displayVal = <span style={{ color: 'rgba(255,255,255,0.25)', italic: true }}>NULL</span>;
                        else if (typeof val === 'object') displayVal = JSON.stringify(val);
                        else displayVal = String(val);

                        return (
                          <td key={colIdx} style={{ padding: '10px 16px', color: 'rgba(255, 255, 255, 0.85)', whiteSpace: 'nowrap' }}>
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
