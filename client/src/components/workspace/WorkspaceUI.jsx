import { LoaderCircle, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { dateTime, money, pretty, shortDate } from '../../utils/formatters'

export { dateTime, money, pretty, shortDate }

export function PageHeader({ eyebrow, title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> {eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.055em] text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {text && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{text}</p>}
      </div>
      {action}
    </motion.div>
  )
}

export function Panel({ children, className = '' }) {
  return <section className={`rounded-[28px] border border-white/[0.08] bg-[#0d1423]/88 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,.20)] backdrop-blur-2xl sm:p-6 ${className}`}>{children}</section>
}

export function StatusBadge({ value }) {
  const positive = ['accepted','confirmed','completed','paid','active','published','verified','executed','resolved']
  const negative = ['rejected','cancelled','withdrawn','ended','dismissed']
  const style = positive.includes(value)
    ? 'bg-cyan-300/10 text-cyan-200 ring-cyan-300/20'
    : negative.includes(value)
      ? 'bg-rose-400/10 text-rose-300 ring-rose-400/20'
      : 'bg-amber-300/10 text-amber-200 ring-amber-300/20'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] ring-1 ${style}`}>{pretty(value || 'unknown')}</span>
}

export function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here.', action = null }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.025] px-6 py-14 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-[#07101e]"><Sparkles className="h-4 w-4" /></div>
      <p className="mt-4 font-black text-white">{title}</p>
      {text && <p className="mt-2 text-sm text-slate-400">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  )
}

export function LoadingState() {
  return <div className="grid min-h-52 place-items-center" role="status" aria-label="Loading"><LoaderCircle className="h-6 w-6 animate-spin text-cyan-300" /></div>
}

export function Modal({ open, onClose, title, children }) {
  const titleId = useId()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKeyDown)
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-[#02050c]/80 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <motion.div initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#0d1423] p-6 text-white shadow-[0_40px_120px_rgba(0,0,0,.55)]">
            <div className="mb-5 flex items-center justify-between gap-4"><h2 id={titleId} className="text-xl font-black tracking-[-.03em]">{title}</h2><button ref={closeRef} type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50" aria-label={`Close ${title}`}><X className="h-4 w-4" /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const control = 'w-full rounded-2xl border border-white/10 bg-white/[0.045] text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-white/[0.065] focus:ring-4 focus:ring-cyan-300/[0.06]'

export function TextInput({ className = '', ...props }) {
  const ariaLabel = props['aria-label'] || props.placeholder
  return <input {...props} aria-label={ariaLabel} className={`h-12 px-4 ${control} ${className}`} />
}
export function TextArea({ className = '', ...props }) {
  const ariaLabel = props['aria-label'] || props.placeholder
  return <textarea {...props} aria-label={ariaLabel} className={`min-h-28 p-4 ${control} ${className}`} />
}
export function Select({ className = '', ...props }) { return <select {...props} className={`h-12 px-4 [color-scheme:dark] [&>option]:bg-[#0d1423] [&>option]:text-slate-100 ${control} ${className}`} /> }
export function PrimaryButton({ children, className = '', type = 'button', ...props }) { return <motion.button whileTap={{ scale: .98 }} type={type} {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-sm font-black text-[#07101e] shadow-[0_14px_35px_rgba(56,189,248,.16)] transition hover:-translate-y-.5 disabled:cursor-wait disabled:opacity-50 ${className}`}>{children}</motion.button> }
export function SecondaryButton({ children, className = '', type = 'button', ...props }) { return <motion.button whileTap={{ scale: .98 }} type={type} {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-slate-200 transition hover:-translate-y-.5 hover:border-cyan-300/25 hover:bg-white/[0.075] disabled:opacity-50 ${className}`}>{children}</motion.button> }
