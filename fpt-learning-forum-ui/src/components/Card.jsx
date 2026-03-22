import React from 'react'
import { cn } from '../lib/cn'

export function Card({ className, children }) {
  return <div className={cn('app-surface rounded-[28px]', className)}>{children}</div>
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-[var(--border)] px-5 py-4', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>
}
