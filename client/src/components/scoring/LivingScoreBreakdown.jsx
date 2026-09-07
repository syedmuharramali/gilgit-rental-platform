import { Droplets, Flame, Gauge, PlugZap, Route, Snowflake } from 'lucide-react'
import { motion } from 'motion/react'

const rows = [
  ['heating', 'Heating', Flame, 20],
  ['hotWater', 'Hot water', Droplets, 20],
  ['electricityBackup', 'Power backup', PlugZap, 15],
  ['waterAvailability', 'Water reliability', Gauge, 15],
  ['roadAccess', 'Road access', Route, 15],
  ['winterAccessible', 'Winter access', Snowflake, 15],
]

function LivingScoreBreakdown({ breakdown = {} }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([key, label, Icon, max], index) => {
        const value = Number(breakdown?.[key] || 0)
        const percent = Math.round((value / max) * 100)

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_12px_35px_rgba(0,0,0,.14)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Icon className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="text-xs text-slate-500">{value} / {max} points</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-300">{percent}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: .8, delay: .15 + index * .04 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500" />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default LivingScoreBreakdown
