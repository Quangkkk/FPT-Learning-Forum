import React from 'react'

// Very small markdown-ish renderer for demo:
// - headings starting with # / ##
// - bold **text**
// - bullets "- "
export default function MarkdownLite({ text }) {
  const lines = String(text || '').split(/\r?\n/)
  return (
    <div className="text-slate-800">
      {lines.map((line, idx) => {
        if (line.startsWith('## '))
          return (
            <div key={idx} className="mt-4 text-lg font-bold">
              {line.slice(3)}
            </div>
          )
        if (line.startsWith('# '))
          return (
            <div key={idx} className="mt-3 text-xl font-extrabold">
              {line.slice(2)}
            </div>
          )
        if (line.startsWith('- '))
          return (
            <div key={idx} className="ml-4 list-item text-sm leading-6">
              {renderInline(line.slice(2))}
            </div>
          )
        if (!line.trim()) return <div key={idx} className="h-3" />
        return (
          <div key={idx} className="text-sm leading-6">
            {renderInline(line)}
          </div>
        )
      })}
    </div>
  )
}

function renderInline(s) {
  const parts = []
  let rest = s
  while (rest.includes('**')) {
    const a = rest.indexOf('**')
    const b = rest.indexOf('**', a + 2)
    if (b === -1) break
    if (a > 0) parts.push({ t: 'text', v: rest.slice(0, a) })
    parts.push({ t: 'bold', v: rest.slice(a + 2, b) })
    rest = rest.slice(b + 2)
  }
  if (rest) parts.push({ t: 'text', v: rest })
  return parts.map((p, i) => (p.t === 'bold' ? <strong key={i}>{p.v}</strong> : <span key={i}>{p.v}</span>))
}
