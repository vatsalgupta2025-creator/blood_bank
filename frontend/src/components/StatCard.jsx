// Reusable stat card with icon, value, label, and optional color theme
export default function StatCard({ icon: Icon, value, label, color = 'var(--crimson)', colorRgb = '220,20,60', subtitle }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-color-rgb': colorRgb }}>
      <div className="stat-icon">
        {Icon && <Icon size={20} />}
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {subtitle && <div className="stat-change">{subtitle}</div>}
    </div>
  );
}
