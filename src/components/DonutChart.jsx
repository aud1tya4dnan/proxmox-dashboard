import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const COLOR_MAP = {
  good:   '#3fb950',
  warn:   '#e3b341',
  danger: '#f85149',
  accent: '#58a6ff',
  purple: '#bc8cff',
}

export default function DonutChart({ pct = 0, size = 110, label, sublabel, colorKey = 'accent' }) {
  const color = COLOR_MAP[colorKey] || COLOR_MAP.accent
  const safeVal = Math.min(Math.max(pct, 0), 100)

  const data = {
    datasets: [{
      data: [safeVal, 100 - safeVal],
      backgroundColor: [color, 'rgba(255,255,255,0.05)'],
      borderWidth: 0,
      borderRadius: 4,
      spacing: 2,
    }],
  }

  const options = {
    cutout: '72%',
    responsive: false,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    animation: { duration: 600, easing: 'easeInOutQuart' },
  }

  return (
    <div className="chart-container" style={{ width: size, height: size }}>
      <Doughnut data={data} options={options} width={size} height={size} />
      <div className="donut-label">
        <div className="donut-label-value" style={{ color }}>
          {safeVal}%
        </div>
        {(label || sublabel) && (
          <div className="donut-label-sub">{label || sublabel}</div>
        )}
      </div>
    </div>
  )
}
