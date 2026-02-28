import { render } from '@testing-library/react'
import { inlineMarkdown, renderMarkdown } from '@/lib/markdown'

describe('inlineMarkdown', () => {
  it('returns plain text unchanged when no bold markers', () => {
    const { container } = render(<span>{inlineMarkdown('hello world')}</span>)
    expect(container.textContent).toBe('hello world')
    expect(container.querySelector('strong')).toBeNull()
  })

  it('converts **text** to a strong element', () => {
    const { container } = render(<span>{inlineMarkdown('Hello **world** today')}</span>)
    const strong = container.querySelector('strong')
    expect(strong).toBeInTheDocument()
    expect(strong?.textContent).toBe('world')
  })

  it('renders text before and after bold correctly', () => {
    const { container } = render(<span>{inlineMarkdown('Hello **world** today')}</span>)
    expect(container.textContent).toBe('Hello world today')
  })

  it('handles multiple bold segments in one string', () => {
    const { container } = render(<span>{inlineMarkdown('**A** and **B**')}</span>)
    const strongs = container.querySelectorAll('strong')
    expect(strongs).toHaveLength(2)
    expect(strongs[0].textContent).toBe('A')
    expect(strongs[1].textContent).toBe('B')
  })

  it('does not render as bold when only opening marker exists', () => {
    const { container } = render(<span>{inlineMarkdown('**unclosed text')}</span>)
    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toBe('**unclosed text')
  })

  it('returns plain string directly when no bold markers (no React node needed)', () => {
    const result = inlineMarkdown('plain text')
    expect(result).toBe('plain text')
  })
})

describe('renderMarkdown', () => {
  it('renders # heading as h1 with correct text', () => {
    const nodes = renderMarkdown('# My Title')
    const { container } = render(<div>{nodes}</div>)
    const h1 = container.querySelector('h1')
    expect(h1).toBeInTheDocument()
    expect(h1?.textContent).toBe('My Title')
  })

  it('renders ## heading as h2', () => {
    const nodes = renderMarkdown('## Section Header')
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('h2')?.textContent).toBe('Section Header')
  })

  it('renders ### heading as h3', () => {
    const nodes = renderMarkdown('### Sub Section')
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('h3')?.textContent).toContain('Sub Section')
  })

  it('renders - bullet as li', () => {
    const nodes = renderMarkdown('- Do the thing')
    const { container } = render(<ul>{nodes}</ul>)
    const li = container.querySelector('li')
    expect(li).toBeInTheDocument()
    expect(li?.textContent).toContain('Do the thing')
  })

  it('renders * bullet as li', () => {
    const nodes = renderMarkdown('* Another item')
    const { container } = render(<ul>{nodes}</ul>)
    expect(container.querySelector('li')).toBeInTheDocument()
    expect(container.querySelector('li')?.textContent).toContain('Another item')
  })

  it('renders numbered list item with number prefix', () => {
    const nodes = renderMarkdown('1. First step')
    const { container } = render(<ul>{nodes}</ul>)
    const li = container.querySelector('li')
    expect(li?.textContent).toContain('First step')
    expect(li?.textContent).toContain('1.')
  })

  it('renders numbered list items preserving their numbers', () => {
    const nodes = renderMarkdown('3. Third step')
    const { container } = render(<ul>{nodes}</ul>)
    expect(container.querySelector('li')?.textContent).toContain('3.')
  })

  it('renders empty line as a spacer div', () => {
    const nodes = renderMarkdown('')
    const { container } = render(<div>{nodes}</div>)
    const spacer = container.querySelector('div.h-2')
    expect(spacer).toBeInTheDocument()
  })

  it('renders plain text line as a paragraph', () => {
    const nodes = renderMarkdown('Just a paragraph.')
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('p')?.textContent).toBe('Just a paragraph.')
  })

  it('renders bold inline within a heading', () => {
    const nodes = renderMarkdown('## **Bold** Section')
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('h2 strong')?.textContent).toBe('Bold')
  })

  it('renders bold inline within a paragraph', () => {
    const nodes = renderMarkdown('Start **emphasized** end')
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('p strong')?.textContent).toBe('emphasized')
  })

  it('handles multi-line input with mixed element types', () => {
    const input = '# Title\n\n## Section\n- Item one\n- Item two'
    const nodes = renderMarkdown(input)
    const { container } = render(<div>{nodes}</div>)
    expect(container.querySelector('h1')).toBeInTheDocument()
    expect(container.querySelector('h2')).toBeInTheDocument()
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('returns an array of React nodes', () => {
    const nodes = renderMarkdown('Line 1\nLine 2')
    expect(Array.isArray(nodes)).toBe(true)
    expect(nodes).toHaveLength(2)
  })
})
