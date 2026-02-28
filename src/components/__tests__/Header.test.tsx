import { render, screen, fireEvent } from '@testing-library/react'
import { vi, type MockedFunction } from 'vitest'
import type { useUser as UseUserType } from '@clerk/clerk-react'

vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(),
  UserButton: () => <button data-testid="user-button">Account</button>,
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({
      to,
      children,
      onClick,
      className,
    }: {
      to: string
      children: React.ReactNode
      onClick?: () => void
      className?: string
      activeProps?: object
    }) => (
      <a href={to} onClick={onClick} className={className}>
        {children}
      </a>
    ),
  }
})

import { useUser } from '@clerk/clerk-react'
import Header from '@/components/Header'

const mockUseUser = useUser as MockedFunction<typeof UseUserType>

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Life Strategy AI logo text', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    expect(screen.getByText(/Life Strategy/)).toBeInTheDocument()
  })

  it('renders the Open menu button', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('shows SignInButton when user is not signed in and auth is loaded', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
  })

  it('shows UserButton when user is signed in', () => {
    mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })

  it('hides auth controls while auth is still loading', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: false } as ReturnType<typeof UseUserType>)
    render(<Header />)
    expect(screen.queryByTestId('sign-in-button')).toBeNull()
    expect(screen.queryByTestId('user-button')).toBeNull()
  })

  it('opens sidebar when Open menu button is clicked', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
  })

  it('closes sidebar when Close menu button is clicked', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    fireEvent.click(screen.getByLabelText('Close menu'))
    const aside = document.querySelector('aside')
    expect(aside?.className).toContain('-translate-x-full')
  })

  it('shows My Strategies link in sidebar when signed in', () => {
    mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByText('My Strategies')).toBeInTheDocument()
  })

  it('hides My Strategies link in sidebar when not signed in', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.queryByText('My Strategies')).toBeNull()
  })

  it('closes sidebar when backdrop is clicked', () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as ReturnType<typeof UseUserType>)
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    const backdrop = document.querySelector('.bg-black\\/50')
    expect(backdrop).toBeInTheDocument()
    if (backdrop) fireEvent.click(backdrop)
    const aside = document.querySelector('aside')
    expect(aside?.className).toContain('-translate-x-full')
  })
})
