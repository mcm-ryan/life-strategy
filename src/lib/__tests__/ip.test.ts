import { getClientIp } from '@/lib/ip'

describe('getClientIp', () => {
  it('returns first IP from comma-separated x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('trims whitespace from x-forwarded-for value', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  9.9.9.9  , 1.1.1.1' },
    })
    expect(getClientIp(req)).toBe('9.9.9.9')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const req = new Request('http://localhost')
    expect(getClientIp(req)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip when both are present', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
      },
    })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })
})
