import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { ArrowLeft, RefreshCw, Brain, TrendingUp } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { renderMarkdown } from '@/lib/markdown'
import { GoalCard, type Goal } from '@/components/GoalCard'

export const Route = createFileRoute('/strategy/$id')({
  component: StrategyPage,
})

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
