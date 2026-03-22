import React from 'react'
import { cn } from '../lib/cn'

export default function Badge({ children, tone = 'slate', className }) {
  const tones = {
    slate: 'border border-slate-200 bg-slate-100 text-slate-700',
    sky: 'border border-sky-100 bg-[var(--blue-soft)] text-[var(--fpt-blue)]',
    green: 'border border-emerald-100 bg-[var(--green-soft)] text-[var(--fpt-green)]',
    amber: 'border border-orange-100 bg-[var(--orange-soft)] text-[var(--fpt-orange)]',
    red: 'border border-rose-100 bg-rose-50 text-rose-700'
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', tones[tone], className)}>
      {children}
    </span>
  )
}
