import { motion } from 'motion/react'

function ScoreRing({ score = 0, label, size = 150, compact = false }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0))
  const stroke = compact ? 8 : 10
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeScore / 100) * circumference

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(15,23,42,.08)" strokeWidth={stroke} />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#2f7d66"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={compact ? 'text-2xl font-black text-slate-950' : 'text-4xl font-black tracking-[-0.05em] text-slate-950'}>{safeScore}</div>
        <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">/ 100</div>
        {label ? <div className="mt-1 text-xs font-bold text-emerald-700">{label}</div> : null}
      </div>
    </div>
  )
}

export default ScoreRing
