import { BedDouble, Check, Clock, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { money } from '../workspace/WorkspaceUI'
import { MEALS, WEEK_DAYS } from '../../utils/listingFields'

/*
 * Hostel pieces shared by the listing page and the admin review page:
 * the seater options with prices and free places, and the mess.
 */

// Seater options as cards. With onSelect they work as a radio group.
export function HostelRoomOptions({ property, selectedId = null, onSelect = null }) {
  const { t } = useTranslation()
  const perRoom = property.hostelPricing === 'per_room'
  const rooms = property.hostelRooms || []

  if (!rooms.length) return <p className="text-sm text-slate-500">{t('hostel.noOptions')}</p>

  return (
    <div className="grid gap-3 sm:grid-cols-2" role={onSelect ? 'radiogroup' : undefined} aria-label={onSelect ? t('hostel.chooseRoom') : undefined}>
      {rooms.map((room) => {
        const full = !(room.available > 0)
        const selected = String(selectedId) === String(room._id)
        const Tag = onSelect ? 'button' : 'div'
        return (
          <Tag
            key={room._id}
            {...(onSelect && { type: 'button', role: 'radio', 'aria-checked': selected, disabled: full, onClick: () => onSelect(room) })}
            className={`flex items-start justify-between gap-3 rounded-[22px] border p-4 text-left transition ${selected ? 'border-cyan-300/40 bg-cyan-300/[0.09]' : 'border-white/[0.08] bg-white/[0.035]'} ${onSelect && !full ? 'hover:border-white/20' : ''} ${full ? 'opacity-55' : ''}`}
          >
            <span className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-cyan-200"><BedDouble className="h-4 w-4" /></span>
              <span>
                <span className="block text-sm font-black text-white">{t('ed.hostel.seater', { count: room.seater })}</span>
                <span className="mt-1 block text-sm font-black text-cyan-100">{money(room.price)} <span className="text-[11px] font-semibold text-slate-500">{perRoom ? t('hostel.perRoomMonth') : t('hostel.perPersonMonth')}</span></span>
                <span className={`mt-1 block text-[11px] font-bold ${full ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {full ? t('hostel.full') : perRoom ? t('hostel.freeRooms', { count: room.available }) : t('hostel.freeBeds', { count: room.available })}
                </span>
              </span>
            </span>
            {onSelect && <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-cyan-300 bg-cyan-300 text-[#07101e]' : 'border-white/15 text-transparent'}`}><Check className="h-3 w-3" /></span>}
          </Tag>
        )
      })}
    </div>
  )
}

export function MessDetails({ mess }) {
  const { t } = useTranslation()
  const plan = mess?.plan

  if (!plan) return <p className="text-sm text-slate-500">{t('hostel.messNotSaid')}</p>

  const timings = MEALS.filter((meal) => mess.timings?.[meal])
  const menu = WEEK_DAYS.map((day) => (mess.menu || []).find((row) => row.day === day)).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-black text-white"><Utensils className="h-3.5 w-3.5 text-cyan-300" /> {t(`hostel.messPlan.${plan}`)}</span>
        {plan === 'optional' && mess.monthlyCharge != null && <span className="text-xs font-bold text-slate-400">{t('hostel.messCharge', { price: money(mess.monthlyCharge) })}</span>}
      </div>
      {timings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {timings.map((meal) => <span key={meal} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300"><Clock className="h-3 w-3 text-slate-500" /> {t(`ed.mess.meals.${meal}`)} {mess.timings[meal]}</span>)}
        </div>
      )}
      {menu.length > 0 && (
        <div className="overflow-x-auto rounded-[20px] border border-white/[0.08]">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[.12em] text-slate-500">
              <tr><th className="px-3 py-2.5 font-black">{t('hostel.day')}</th>{MEALS.map((meal) => <th key={meal} className="px-3 py-2.5 font-black">{t(`ed.mess.meals.${meal}`)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {menu.map((row) => <tr key={row.day}><td className="px-3 py-2.5 font-black text-slate-300">{t(`ed.days.${row.day}`)}</td>{MEALS.map((meal) => <td key={meal} className="px-3 py-2.5 text-slate-400">{row[meal] || '—'}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )}
      {mess.notes && <p className="text-xs leading-5 text-slate-400">{mess.notes}</p>}
    </div>
  )
}
