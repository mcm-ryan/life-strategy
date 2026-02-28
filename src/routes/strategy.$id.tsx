import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  CheckCircle,
  TrendingUp,
  Activity,
  DollarSign,
} from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/strategy/$id')({
  component: StrategyPage,
})

interface Goal {
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

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      nodes.push(
        <h3
          key={i}
          className="text-lg font-bold text-cyan-300 mt-6 mb-2 flex items-center gap-2"
        >
          <span className="w-1 h-5 bg-cyan-500 rounded-full inline-block" />
          {inlineMarkdown(line.slice(4))}
        </h3>,
      )
    } else if (line.startsWith('## ')) {
      nodes.push(
        <h2
          key={i}
          className="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-slate-700"
        >
          {inlineMarkdown(line.slice(3))}
        </h2>,
      )
    } else if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} className="text-2xl font-black text-white mt-6 mb-4">
          {inlineMarkdown(line.slice(2))}
        </h1>,
      )
    } else if (line.match(/^[-*]\s/)) {
      nodes.push(
        <li
          key={i}
          className="flex items-start gap-2 text-gray-300 leading-relaxed ml-2"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <span>{inlineMarkdown(line.slice(2))}</span>
        </li>,
      )
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      if (match) {
        nodes.push(
          <li
            key={i}
            className="flex items-start gap-3 text-gray-300 leading-relaxed ml-2"
          >
            <span className="text-cyan-400 font-bold text-sm min-w-[1.5rem] mt-0.5">
              {match[1]}.
            </span>
            <span>{inlineMarkdown(match[2])}</span>
          </li>,
        )
      }
    } else if (line === '') {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(
        <p key={i} className="text-gray-300 leading-relaxed">
          {inlineMarkdown(line)}
        </p>,
      )
    }

    i++
  }

  return nodes
}

// ---------------------------------------------------------------------------
// Goal card
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  health: <Activity className="w-4 h-4" />,
  fitness: <Activity className="w-4 h-4" />,
  finance: <DollarSign className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  health: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  fitness: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  finance: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

function GoalCard({ goal }: { goal: Goal }) {
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
          {goal.trackingSources.map((s) => s.replace('_', ' ')).join(', ')}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function StrategyPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useUser()
  const bottomRef = useRef<HTMLDivElement>(null)

  const strategy = useQuery(
    api.strategies.getStrategy,
    isSignedIn ? { id: id as Id<'strategies'> } : 'skip',
  )

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void navigate({ to: '/sign-in' })
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
      </div>
    )
  }

  if (strategy === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
      </div>
    )
  }

  if (strategy === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Strategy not found.</p>
          <Link
            to="/dashboard"
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            My Strategies
          </Link>
        </div>
      </div>
    )
  }

  const userName = (strategy.answers as Record<string, string> | undefined)?.name
  const goals = (strategy.goals ?? []) as Goal[]

  // Strip goals JSON from the displayed narrative text
  const rawText = strategy.strategyText ?? ''
  const displayText = rawText.includes('---GOALS_JSON---')
    ? rawText.split('---GOALS_JSON---')[0]
    : rawText

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            My Strategies
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Brain className="w-4 h-4 text-cyan-400" />
            Strategy complete
          </div>
          <Link
            to="/questionnaire"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New strategy
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            {userName ? `${userName}'s Life Strategy` : 'Your Life Strategy'}
          </h1>
          <p className="text-gray-400">
            Personalized plan to help you become happy, healthy, and wealthy.
          </p>
        </div>

        {/* Narrative */}
        {displayText && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-1">
            {renderMarkdown(displayText)}
          </div>
        )}

        {/* Structured goals */}
        {goals.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Trackable Goals
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition border border-slate-600 text-sm font-medium"
            >
              Print
            </button>
            <Link
              to="/questionnaire"
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl transition font-bold text-sm"
            >
              New Strategy
            </Link>
          </div>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
