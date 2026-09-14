import { useState, useRef, useEffect } from 'react';
import { Columns3, Check, RotateCcw } from 'lucide-react';

/**
 * ColumnSelector — a "Columns" button that opens a dropdown panel
 * with checkboxes for each toggleable column.
 *
 * Props:
 *   columns       - full column definition array [{ key, label, alwaysVisible? }]
 *   visibleKeys   - Set of currently visible column keys
 *   onChange      - (newSet) => void  — called with updated Set
 *   onReset       - () => void        — called to reset to defaults
 */
export default function ColumnSelector({ columns, visibleKeys, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Toggleable columns only (not alwaysVisible)
  const toggleable = columns.filter(c => !c.alwaysVisible);

  const toggle = (key) => {
    const next = new Set(visibleKeys);
    if (next.has(key)) {
      // Prevent hiding the last visible data column
      const visibleToggleable = toggleable.filter(c => next.has(c.key));
      if (visibleToggleable.length <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(columns.map(c => c.key)));
  };

  const visibleCount  = toggleable.filter(c => visibleKeys.has(c.key)).length;
  const hiddenCount   = toggleable.length - visibleCount;

  return (
    <div className="col-selector-wrap" ref={ref}>
      <button
        className={`btn btn-ghost col-selector-btn${open ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Select visible columns"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns3 size={15} />
        Columns
        {hiddenCount > 0 && (
          <span className="col-badge">{hiddenCount} hidden</span>
        )}
      </button>

      {open && (
        <div className="col-selector-panel" role="listbox" aria-multiselectable="true">
          <div className="col-selector-header">
            <span className="col-selector-title">Visible Columns</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={selectAll} title="Show all columns">
                All
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onReset} title="Reset to defaults">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          <div className="col-selector-list">
            {toggleable.map(col => {
              const checked = visibleKeys.has(col.key);
              const isLast  = visibleCount === 1 && checked;
              return (
                <label
                  key={col.key}
                  className={`col-selector-item${isLast ? ' col-selector-item--disabled' : ''}`}
                  title={isLast ? 'At least one column must remain visible' : ''}
                >
                  <span className={`col-checkbox${checked ? ' checked' : ''}`}>
                    {checked && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="col-selector-label">{col.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isLast}
                    onChange={() => toggle(col.key)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    aria-label={col.label}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
