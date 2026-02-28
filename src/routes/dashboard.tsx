import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Brain, ClipboardList, ChevronRight, Clock } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useUser()
  const strategies = useQuery(api.strategies.listUserStrategies)

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">
            Welcome back, {user.firstName ?? 'there'}
          </h1>
          <p className="text-gray-400 mt-1">Your past life strategies</p>
        </div>

        {strategies === undefined && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
          </div>
        )}

        {strategies !== undefined && strategies.length === 0 && (
          <div className="text-center py-20 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">
              You haven't generated any strategies yet.
            </p>
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition"
            >
              <ClipboardList className="w-4 h-4" />
              Get My Strategy
            </Link>
          </div>
        )}

        {strategies !== undefined && strategies.length > 0 && (
          <div className="space-y-3">
            {strategies.map((s) => {
              const name =
                (s.answers as Record<string, string>)?.name || 'Unnamed'
              const date = new Date(s.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              return (
                <Link
                  key={s._id}
                  to="/strategy/$id"
                  params={{ id: s._id }}
                  className="flex items-center justify-between bg-slate-800/60 border border-slate-700 hover:border-cyan-500/40 rounded-2xl p-5 transition group"
                >
                  <div>
                    <p className="font-semibold text-white group-hover:text-cyan-400 transition">
                      {name}'s Life Strategy
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {date}
                      {s.isComplete && (
                        <span className="ml-2 text-emerald-400 text-xs font-medium">
                          Complete
                        </span>
                      )}
                      {!s.isComplete && (
                        <span className="ml-2 text-yellow-400 text-xs font-medium">
                          In progress
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition" />
                </Link>
              )
            })}

            <div className="pt-4 text-center">
              <Link
                to="/questionnaire"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition"
              >
                <ClipboardList className="w-4 h-4" />
                New Strategy
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
