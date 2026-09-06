import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import { format } from 'date-fns'
import { LoaderCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))
export const money = (value) => `PKR ${new Intl.NumberFormat('en-PK').format(Number(value || 0))}`
export const pretty = (value = '') => String(value).replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
export const dateTime = (value) => (value ? format(new Date(value), 'MMM d, yyyy · h:mm a') : '—')
export const shortDate = (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—')

export function PageHeader({ eyebrow, title, text, action }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950 sm:text-4xl">{title}</h1>{text && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{text}</p>}</div>{action}</div>
}

export function Panel({ children, className = '' }) {
  return <section className={cn('rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.05)] sm:p-6', className)}>{children}</section>
}

const badgeVariants = cva('inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] ring-1', {
  variants: {
    tone: {
      positive: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      negative: 'bg-rose-50 text-rose-700 ring-rose-200',
      neutral: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function StatusBadge({ value }) {
  const positive = ['accepted', 'confirmed', 'completed', 'paid', 'active', 'published', 'verified', 'executed', 'resolved']
  const negative = ['rejected', 'cancelled', 'withdrawn', 'ended', 'dismissed']
  const tone = positive.includes(value) ? 'positive' : negative.includes(value) ? 'negative' : 'neutral'
  return <span className={badgeVariants({ tone })}>{pretty(value || 'unknown')}</span>
}

export function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here.' }) {
  return <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center"><p className="font-black text-slate-900">{title}</p><p className="mt-2 text-sm text-slate-500">{text}</p></div>
}

export function LoadingState() {
  return <div className="grid min-h-52 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-700" /></div>
}

export function Modal({ open, onClose, title, children }) {
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black tracking-[-.03em]">{title}</h2><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><X className="h-4 w-4" /></button></div>{children}</motion.div></motion.div>}</AnimatePresence>
}

const controlClass = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50'

export function TextInput({ className = '', ...props }) { return <input {...props} className={cn(controlClass, className)} /> }
export function TextArea({ className = '', ...props }) { return <textarea {...props} className={cn('min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50', className)} /> }
export function Select({ className = '', ...props }) { return <select {...props} className={cn(controlClass, className)} /> }

const buttonVariants = cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition disabled:cursor-wait disabled:opacity-50', {
  variants: {
    variant: {
      primary: 'bg-[#102f26] text-white hover:-translate-y-.5',
      secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    },
  },
  defaultVariants: { variant: 'primary' },
})

export function PrimaryButton({ children, className = '', ...props }) { return <button {...props} className={cn(buttonVariants({ variant: 'primary' }), className)}>{children}</button> }
export function SecondaryButton({ children, className = '', ...props }) { return <button {...props} className={cn(buttonVariants({ variant: 'secondary' }), className)}>{children}</button> }
