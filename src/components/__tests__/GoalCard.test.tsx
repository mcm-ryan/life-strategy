import { render, screen } from '@testing-library/react'
import { GoalCard, type Goal } from '@/components/GoalCard'

const baseGoal: Goal = {
  id: 'test-goal',
  category: 'health',
  title: 'Lose weight',
  metric: 'body_weight',
  unit: 'lbs',
  currentValue: 200,
  targetValue: 180,
  deadline: '2026-06-15', // mid-month avoids UTC-midnight timezone boundary issues
  trackingSources: ['apple_health', 'manual'],
}

describe('GoalCard', () => {
  it('renders the goal title', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText('Lose weight')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText('health')).toBeInTheDocument()
  })

  it('renders current value', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText(/200/)).toBeInTheDocument()
  })

  it('renders target value', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText(/180/)).toBeInTheDocument()
  })

  it('renders a formatted deadline', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText(/Jun 2026/)).toBeInTheDocument()
  })

  it('does not render deadline when it is absent', () => {
    const goal: Goal = { ...baseGoal, deadline: undefined }
    const { container } = render(<GoalCard goal={goal} />)
    expect(container.querySelector('.text-gray-500')).toBeNull()
  })

  it('renders tracking sources with underscores replaced by spaces', () => {
    render(<GoalCard goal={baseGoal} />)
    expect(screen.getByText(/apple health/)).toBeInTheDocument()
    expect(screen.getByText(/manual/)).toBeInTheDocument()
  })

  it('does not render tracking sources section when array is empty', () => {
    const goal: Goal = { ...baseGoal, trackingSources: [] }
    render(<GoalCard goal={goal} />)
    expect(screen.queryByText(/Connect via/)).toBeNull()
  })

  it('formats USD values with dollar sign and locale formatting', () => {
    const goal: Goal = {
      ...baseGoal,
      category: 'finance',
      unit: 'USD/month',
      currentValue: 1000,
      targetValue: 5000,
    }
    render(<GoalCard goal={goal} />)
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument()
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument()
  })

  it('formats non-USD values without dollar sign', () => {
    render(<GoalCard goal={baseGoal} />)
    // 200 and 180 should appear without $ prefix
    expect(screen.queryByText(/\$200/)).toBeNull()
    expect(screen.queryByText(/\$180/)).toBeNull()
  })

  it('applies emerald color class for health category', () => {
    const { container } = render(<GoalCard goal={baseGoal} />)
    expect(container.querySelector('.text-emerald-400')).toBeInTheDocument()
  })

  it('applies blue color class for finance category', () => {
    const goal: Goal = { ...baseGoal, category: 'finance' }
    const { container } = render(<GoalCard goal={goal} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('falls back to cyan color class for unknown category', () => {
    const goal: Goal = { ...baseGoal, category: 'career' }
    const { container } = render(<GoalCard goal={goal} />)
    expect(container.querySelector('.text-cyan-400')).toBeInTheDocument()
  })

  it('renders progress bar with correct width when reducing toward target', () => {
    // currentValue=200 > targetValue=180, so pct = round((180/200)*100) = 90
    const { container } = render(<GoalCard goal={baseGoal} />)
    const progressBar = container.querySelector('[style*="width"]') as HTMLElement
    expect(progressBar?.style.width).toBe('90%')
  })

  it('renders progress bar with correct width when increasing toward target', () => {
    // currentValue=2000 < targetValue=10000, pct = round((2000/10000)*100) = 20
    const goal: Goal = {
      ...baseGoal,
      currentValue: 2000,
      targetValue: 10000,
    }
    const { container } = render(<GoalCard goal={goal} />)
    const progressBar = container.querySelector('[style*="width"]') as HTMLElement
    expect(progressBar?.style.width).toBe('20%')
  })

  it('shows 100% progress when current value equals target value', () => {
    // When currentValue === targetValue the goal is exactly met
    const goal: Goal = { ...baseGoal, currentValue: 180, targetValue: 180 }
    const { container } = render(<GoalCard goal={goal} />)
    const progressBar = container.querySelector('[style*="width"]') as HTMLElement
    expect(progressBar?.style.width).toBe('100%')
  })
})
