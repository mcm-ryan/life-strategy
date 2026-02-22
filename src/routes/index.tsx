import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Brain, Heart, TrendingUp, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const pillars = [
    {
      icon: <Heart className="w-8 h-8 text-rose-400" />,
      title: 'Happy',
      description:
        'Discover what truly brings you joy and build a life aligned with your values and passions.',
      color: 'border-rose-500/30 hover:border-rose-500/60',
      glow: 'hover:shadow-rose-500/10',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      title: 'Healthy',
      description:
        'Get a personalized health roadmap covering fitness, nutrition, sleep, and mental wellbeing.',
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      glow: 'hover:shadow-emerald-500/10',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-cyan-400" />,
      title: 'Wealthy',
      description:
        'Build a clear financial strategy from where you are today to where you want to be.',
      color: 'border-cyan-500/30 hover:border-cyan-500/60',
      glow: 'hover:shadow-cyan-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-rose-500/5" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-14 h-14 text-cyan-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 [letter-spacing:-0.04em]">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
              Life Strategy
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Answer a few questions about yourself and receive a comprehensive,
            AI-powered strategy to become{' '}
            <span className="text-rose-400 font-medium">happier</span>,{' '}
            <span className="text-emerald-400 font-medium">healthier</span>, and{' '}
            <span className="text-cyan-400 font-medium">wealthier</span>.
          </p>
          <Link
            to="/questionnaire"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 hover:scale-105 active:scale-100"
          >
            Get My Strategy
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Takes about 5 minutes · Powered by Claude Opus
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${pillar.color} ${pillar.glow}`}
            >
              <div className="mb-4">{pillar.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {pillar.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Answer Questions',
              desc: 'Share details about your health, career, finances, and goals.',
            },
            {
              step: '02',
              title: 'AI Analyzes',
              desc: 'Claude Opus processes your profile and thinks deeply about your situation.',
            },
            {
              step: '03',
              title: 'Get Your Strategy',
              desc: 'Receive a detailed, personalized action plan to transform your life.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="text-5xl font-black text-slate-700 mb-3">
                {step}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 mt-12 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all border border-slate-600 hover:border-slate-500"
        >
          Start Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
