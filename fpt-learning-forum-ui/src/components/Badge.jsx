import React from 'react'
import { cn } from '../lib/cn'

export default function Badge({ children, tone = 'slate', className }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    sky: 'bg-sky-100 text-sky-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-rose-100 text-rose-700'
  }
  return (
    <span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}
