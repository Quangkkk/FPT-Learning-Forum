import React from 'react'
import { cn } from '../lib/cn'

export function Card({ className, children }) {
  return <div className={cn('rounded-2xl bg-white shadow-soft', className)}>{children}</div>
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b px-4 py-3', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('px-4 py-4', className)}>{children}</div>
}
