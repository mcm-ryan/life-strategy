import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  CheckCircle,
  Printer,
  Save,
  Activity,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/strategy/')({
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
// Markdown renderer (shared with strategy.$id.tsx)
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
  finance: <DollarSign className="w-4 h-4" />,
  fitness: <Activity className="w-4 h-4" />,
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
          {goal.trackingSources
            .map((s) => s.replace('_', ' '))
            .join(', ')}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function StrategyPage() {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()
  const { isAuthenticated } = useConvexAuth()
  const { openSignIn } = useClerk()
  const saveAnonymousStrategy = useMutation(api.strategies.saveAnonymousStrategy)

  const [streamedText, setStreamedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const hasStartedStreaming = useRef(false)
  const fullTextRef = useRef('')
  const answersRef = useRef<Record<string, string>>({})
  const pendingSaveRef = useRef(false)

  // On mount: read sessionStorage or redirect
  useEffect(() => {
    const raw = sessionStorage.getItem('strategy_answers')
    if (!raw) {
      void navigate({ to: '/questionnaire' })
      return
    }
    answersRef.current = JSON.parse(raw) as Record<string, string>

    if (hasStartedStreaming.current) return
    hasStartedStreaming.current = true
    setLoading(true)

    const controller = new AbortController()

    void (async () => {
      try {
        const res = await fetch('/api/strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answersRef.current),
          signal: controller.signal,
        })

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error(
              "You've reached the limit of 3 strategies per hour. Please try again later.",
            )
          }
          const text = await res.text()
          throw new Error(text || `Server error ${res.status}`)
        }

        setLoading(false)
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamedText((prev) => prev + chunk)
        }

        fullTextRef.current = fullText

        // Parse goals from end of stream
        const match = fullText.match(
          /---GOALS_JSON---\n?([\s\S]+?)(?:\n?---END_GOALS---|$)/,
        )
        if (match) {
          try {
            const parsed = JSON.parse(match[1]) as { goals: Goal[] }
            setGoals(parsed.goals ?? [])
          } catch {
            // malformed JSON — skip goals
          }
        }

        setDone(true)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setLoading(false)
        setError(err instanceof Error ? err.message : 'An error occurred.')
      }
    })()

    return () => controller.abort()
  }, [navigate])

  // Auto-scroll while streaming
  useEffect(() => {
    if (!done && streamedText) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamedText, done])

  // Auto-save after sign-in — use isAuthenticated from Convex so we only fire
  // once Convex actually has the auth token (not just when Clerk's state updates)
  useEffect(() => {
    if (isAuthenticated && pendingSaveRef.current && done) {
      pendingSaveRef.current = false
      void doSave()
    }
  }, [isAuthenticated, done]) // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = async () => {
    setSaving(true)
    try {
      await saveAnonymousStrategy({
        answers: answersRef.current,
        strategyText: fullTextRef.current,
        goals,
      })
      setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    if (!isSignedIn) {
      pendingSaveRef.current = true
      openSignIn()
      return
    }
    if (!isAuthenticated) {
      // Clerk session exists but Convex hasn't received the token yet — defer
      pendingSaveRef.current = true
      return
    }
    void doSave()
  }

  const userName = answersRef.current.name

  // Strip goals JSON from displayed text
  const displayText = streamedText.includes('---GOALS_JSON---')
    ? streamedText.split('---GOALS_JSON---')[0]
    : streamedText

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/questionnaire"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Brain className="w-4 h-4 text-cyan-400" />
            {loading
              ? 'Claude is analyzing your profile...'
              : done
                ? 'Strategy complete'
                : 'Generating...'}
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
            {userName ? `${userName}'s Life Strategy` : `Your Life Strategy`}
          </h1>
          <p className="text-gray-400">
            Personalized plan to help you become happy, healthy, and wealthy.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <Brain className="w-7 h-7 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 animate-pulse">
              Thinking deeply about your situation...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
            <p className="text-rose-400 font-semibold mb-2">
              Something went wrong
            </p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {/* Streamed content (narrative only) */}
        {displayText && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-1">
            {renderMarkdown(displayText)}
            {!done && (
              <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        )}

        {/* Goals cards — shown after streaming completes */}
        {done && goals.length > 0 && (
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

        {/* Done CTA */}
        {done && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4 text-sm">
              Ready to begin? Save this strategy to track your progress.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition border border-slate-600 text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {saved ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl transition font-bold text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Strategies
                </Link>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl transition font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Strategy'}
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
