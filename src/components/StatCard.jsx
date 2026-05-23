export default function StatCard({ title, value, subtitle, color = 'primary', icon }) {
  const colorMap = {
    primary: 'bg-primary-500/20 text-primary-300',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="card flex items-start gap-4 hover:bg-zinc-900/70 transition-colors">
      {icon && (
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary} ring-1 ring-white/5`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      )}
      <div>
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
