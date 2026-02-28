import { buildPrompt } from '@/lib/prompt'

describe('buildPrompt', () => {
  it('includes name when provided', () => {
    const result = buildPrompt({ name: 'Alice' })
    expect(result).toContain('Alice')
  })

  it('falls back to "Not provided" for missing name', () => {
    const result = buildPrompt({})
    expect(result).toContain('Name: Not provided')
  })

  it('falls back to "Not provided" for missing age', () => {
    const result = buildPrompt({})
    expect(result).toContain('Age: Not provided')
  })

  it('formats height correctly when both ft and in provided', () => {
    const result = buildPrompt({ heightFt: '5', heightIn: '10' })
    expect(result).toContain("5'10\"")
  })

  it('formats height with 0 inches when only ft provided', () => {
    const result = buildPrompt({ heightFt: '6' })
    expect(result).toContain("6'0\"")
  })

  it('shows "Not provided" for height when heightFt is absent', () => {
    const result = buildPrompt({ heightIn: '5' })
    expect(result).toContain('Height: Not provided')
  })

  it('formats weight with unit appended', () => {
    const result = buildPrompt({ weight: '180', weightUnit: 'lbs' })
    expect(result).toContain('180 lbs')
  })

  it('formats monthlySavings with dollar sign and per-month suffix', () => {
    const result = buildPrompt({ monthlySavings: '500' })
    expect(result).toContain('$500/month')
  })

  it('formats careerSatisfaction as X/10', () => {
    const result = buildPrompt({ careerSatisfaction: '8' })
    expect(result).toContain('8/10')
  })

  it('formats yearsExperience with years suffix', () => {
    const result = buildPrompt({ yearsExperience: '5' })
    expect(result).toContain('5 years')
  })

  it('formats sleepHours with hours/night suffix', () => {
    const result = buildPrompt({ sleepHours: '7' })
    expect(result).toContain('7 hours/night')
  })

  it('formats dailySteps with steps/day suffix', () => {
    const result = buildPrompt({ dailySteps: '8000' })
    expect(result).toContain('8000 steps/day')
  })

  it('contains ---GOALS_JSON--- instruction at the end', () => {
    const result = buildPrompt({ name: 'Bob' })
    expect(result).toContain('---GOALS_JSON---')
  })

  it('uses "this person" as fallback in closing line when no name', () => {
    const result = buildPrompt({})
    expect(result).toContain('this person')
  })

  it('uses provided name in the closing line', () => {
    const result = buildPrompt({ name: 'Carol' })
    expect(result).toMatch(/help Carol progress/)
  })

  it('includes all major section headers', () => {
    const result = buildPrompt({})
    expect(result).toContain('Personal Information')
    expect(result).toContain('Health & Wellness')
    expect(result).toContain('Interests & Skills')
    expect(result).toContain('Career')
    expect(result).toContain('Finances')
    expect(result).toContain('Life Vision')
  })
})
