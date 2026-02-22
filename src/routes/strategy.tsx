import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, RefreshCw, Brain, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/strategy')({ component: StrategyPage })

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
        <h1
          key={i}
          className="text-2xl font-black text-white mt-6 mb-4"
        >
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

function inlineMarkdown(text: string): React.ReactNode {
  // Handle **bold**
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

function StrategyPage() {
  const navigate = useNavigate()
  const [strategy, setStrategy] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('life-strategy-answers')
    if (!raw) {
      navigate({ to: '/questionnaire' })
      return
    }

    let data: Record<string, string>
    try {
      data = JSON.parse(raw) as Record<string, string>
    } catch {
      navigate({ to: '/questionnaire' })
      return
    }

    const controller = new AbortController()

    fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Server error ${res.status}`)
        }
        setLoading(false)
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          const chunk = decoder.decode(value, { stream: true })
          setStrategy((prev) => prev + chunk)
        }
        setDone(true)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setLoading(false)
        setError(err instanceof Error ? err.message : 'An error occurred.')
      })

    return () => controller.abort()
  }, [navigate])

  // Auto-scroll while streaming
  useEffect(() => {
    if (!done && strategy) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [strategy, done])

  const userName = (() => {
    try {
      const raw = sessionStorage.getItem('life-strategy-answers')
      if (!raw) return ''
      const d = JSON.parse(raw) as Record<string, string>
      return d.name || ''
    } catch {
      return ''
    }
  })()

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
          <button
            onClick={() => {
              sessionStorage.removeItem('life-strategy-answers')
              navigate({ to: '/questionnaire' })
            }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Start over
          </button>
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
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <p className="text-gray-500 text-xs">
              Make sure ANTHROPIC_API_KEY is set in your environment.
            </p>
          </div>
        )}

        {/* Streamed content */}
        {strategy && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-1">
            {renderMarkdown(strategy)}
            {!done && (
              <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        )}

        {/* Done CTA */}
        {done && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4 text-sm">
              Ready to begin? Save this strategy or start fresh.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition border border-slate-600 text-sm font-medium"
              >
                Save / Print
              </button>
              <Link
                to="/"
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl transition font-bold text-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
