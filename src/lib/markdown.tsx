import { CheckCircle } from 'lucide-react'

export function inlineMarkdown(text: string): React.ReactNode {
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

export function renderMarkdown(text: string): React.ReactNode[] {
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
        <h1 key={i} className="text-2xl font-black text-white mt-6 mb-4">
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
