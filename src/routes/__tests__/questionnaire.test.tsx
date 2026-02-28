import { render, screen, fireEvent } from '@testing-library/react'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    createFileRoute: () => (config: unknown) => config,
    useNavigate: () => mockNavigate,
  }
})

import { QuestionnairePage } from '@/routes/questionnaire'

describe('QuestionnairePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('starts on step 1 — About You', () => {
    render(<QuestionnairePage />)
    // The current step name appears in both the step indicator and the h2 heading
    expect(screen.getByRole('heading', { level: 2, name: 'About You' })).toBeInTheDocument()
  })

  it('Next button advances to the next step', () => {
    render(<QuestionnairePage />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByRole('heading', { level: 2, name: 'Health' })).toBeInTheDocument()
  })

  it('Back button is disabled on the first step', () => {
    render(<QuestionnairePage />)
    const backBtn = screen.getByText('Back').closest('button')
    expect(backBtn).toBeDisabled()
  })

  it('Back button goes to the previous step after advancing', () => {
    render(<QuestionnairePage />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByRole('heading', { level: 2, name: 'Health' })).toBeInTheDocument()
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByRole('heading', { level: 2, name: 'About You' })).toBeInTheDocument()
  })

  it('shows Generate My Strategy button on the last step', () => {
    render(<QuestionnairePage />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    expect(screen.getByText('Generate My Strategy')).toBeInTheDocument()
  })

  it('saves form data to sessionStorage on submit', () => {
    render(<QuestionnairePage />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    fireEvent.click(screen.getByText('Generate My Strategy'))
    const saved = sessionStorage.getItem('strategy_answers')
    expect(saved).not.toBeNull()
    const parsed = JSON.parse(saved!) as Record<string, unknown>
    expect(typeof parsed).toBe('object')
  })

  it('calls navigate to /strategy on submit', () => {
    render(<QuestionnairePage />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    fireEvent.click(screen.getByText('Generate My Strategy'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/strategy' })
  })

  it('updates form field value on input change', () => {
    render(<QuestionnairePage />)
    const nameInput = screen.getByPlaceholderText('e.g. Alex')
    fireEvent.change(nameInput, { target: { value: 'Alice' } })
    expect((nameInput as HTMLInputElement).value).toBe('Alice')
  })

  it('saves updated field values to sessionStorage on submit', () => {
    render(<QuestionnairePage />)
    const nameInput = screen.getByPlaceholderText('e.g. Alex')
    fireEvent.change(nameInput, { target: { value: 'Alice' } })
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    fireEvent.click(screen.getByText('Generate My Strategy'))
    const saved = sessionStorage.getItem('strategy_answers')
    const parsed = JSON.parse(saved!) as Record<string, string>
    expect(parsed.name).toBe('Alice')
  })
})
