import { Activity, DollarSign, TrendingUp } from 'lucide-react'

export interface Goal {
  id: string
  category: string
  title: string
  metric: string
  unit: string
  currentValue: number
  targetValue: number
  deadline?: string
  trackingSources: string[]
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  health: <Activity className="w-4 h-4" />,
  finance: <DollarSign className="w-4 h-4" />,
  fitness: <Activity className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  health: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  fitness: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  finance: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

export function GoalCard({ goal }: { goal: Goal }) {
  const pct = Math.min(
    100,
    Math.round(
      goal.targetValue > goal.currentValue
        ? (goal.currentValue / goal.targetValue) * 100
        : (goal.targetValue / goal.currentValue) * 100,
    ),
  )

  const colorClass =
    CATEGORY_COLORS[goal.category] ??
    'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  const icon = CATEGORY_ICONS[goal.category] ?? (
    <TrendingUp className="w-4 h-4" />
  )

  const deadlineStr = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null

  const formatValue = (v: number) => {
    if (goal.unit === 'USD' || goal.unit === 'USD/month') {
      return `$${v.toLocaleString()}`
    }
    return v.toLocaleString()
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${colorClass}`}
          >
            {icon}
            {goal.category}
          </span>
          <span className="text-white font-semibold text-sm truncate">
            {goal.title}
          </span>
        </div>
        {deadlineStr && (
          <span className="text-gray-500 text-xs flex-shrink-0">
            {deadlineStr}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-gray-400 text-sm">
          {formatValue(goal.currentValue)}{' '}
          <span className="text-gray-600">{goal.unit}</span>
        </span>
        <span className="text-gray-600">→</span>
        <span className="text-white font-semibold text-sm">
          {formatValue(goal.targetValue)}{' '}
          <span className="text-gray-400 font-normal">{goal.unit}</span>
        </span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {goal.trackingSources.length > 0 && (
        <p className="text-gray-600 text-xs">
          Connect via:{' '}
          {goal.trackingSources
            .map((s) => s.replace('_', ' '))
            .join(', ')}
        </p>
      )}
    </div>
  )
}
