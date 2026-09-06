import { LoaderCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { dateTime, money, pretty, shortDate } from '../../utils/formatters'

export { dateTime, money, pretty, shortDate }

export function PageHeader({ eyebrow, title, text, action }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950 sm:text-4xl">{title}</h1>{text && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{text}</p>}</div>{action}</div>
}

export function Panel({ children, className = '' }) { return <section className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.05)] sm:p-6 ${className}`}>{children}</section> }

export function StatusBadge({ value }) {
  const positive = ['accepted','confirmed','completed','paid','active','published','verified','executed','resolved']
  const negative = ['rejected','cancelled','withdrawn','ended','dismissed']
  const style = positive.includes(value) ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : negative.includes(value) ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-amber-50 text-amber-700 ring-amber-200'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] ring-1 ${style}`}>{pretty(value || 'unknown')}</span>
}

export function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here.' }) { return <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center"><p className="font-black text-slate-900">{title}</p><p className="mt-2 text-sm text-slate-500">{text}</p></div> }

export function LoadingState() { return <div className="grid min-h-52 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-700" /></div> }

export function Modal({ open, onClose, title, children }) {
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}><motion.div initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black tracking-[-.03em]">{title}</h2><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100" aria-label={`Close ${title}`}><X className="h-4 w-4" /></button></div>{children}</motion.div></motion.div>}</AnimatePresence>
}

export function TextInput({ className = '', ...props }) { return <input {...props} className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 ${className}`} /> }
export function TextArea({ className = '', ...props }) { return <textarea {...props} className={`min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 ${className}`} /> }
export function Select({ className = '', ...props }) { return <select {...props} className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ${className}`} /> }
export function PrimaryButton({ children, className = '', type = 'button', ...props }) { return <button type={type} {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#102f26] px-4 text-sm font-black text-white transition hover:-translate-y-.5 disabled:cursor-wait disabled:opacity-50 ${className}`}>{children}</button> }
export function SecondaryButton({ children, className = '', type = 'button', ...props }) { return <button type={type} {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 ${className}`}>{children}</button> }
