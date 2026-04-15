import { thresholdClass } from '../utils/format'

export default function MetricCard({ title, value, unit, sub, icon, iconBg, pctValue }) {
  return (
    <div className="metric-card fade-in" style={{ '--accent-color': iconBg }}>
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        {icon && (
          <div className="metric-card-icon" style={{ background: iconBg + '22', color: iconBg }}>
            {icon}
          </div>
        )}
      </div>

      <div className="metric-card-value">
        {value ?? '—'}
        {unit && <span>{unit}</span>}
      </div>

      {pctValue !== undefined && (
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${thresholdClass(pctValue)}`}
            style={{ width: `${Math.min(pctValue, 100)}%` }}
          />
        </div>
      )}

      {sub && <div className="metric-card-sub">{sub}</div>}
    </div>
  )
}
