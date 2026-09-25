import { BedDouble, CalendarDays, CheckCircle2, Clock, MessageCircle, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateBookingMutation, useGetStayAvailabilityQuery } from '../../features/bookings/bookingsApi'
import { localToday } from '../../utils/formatters'
import { PrimaryButton, SecondaryButton, TextArea, TextInput, money } from '../workspace/WorkspaceUI'

const DAY_MS = 24 * 60 * 60 * 1000
const nightsBetween = (checkIn, checkOut) => Math.round((new Date(checkOut) - new Date(checkIn)) / DAY_MS)

/**
 * Booking box for hotels and guest houses: pick dates, a room type, rooms
 * and guests, see what's free and the total, and send a request. The hotel
 * confirms or declines; payment happens at the hotel.
 */
export default function StayBookingPanel({ property, isOwner, requireAuth, onMessageOwner, messageLoading }) {
  const { t } = useTranslation()
  const rooms = property.roomTypes || []
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomTypeId, setRoomTypeId] = useState(rooms[0]?._id || '')
  const [roomCount, setRoomCount] = useState('1')
  const [guests, setGuests] = useState('2')
  const [message, setMessage] = useState('')
  const [createBooking, bookingState] = useCreateBookingMutation()

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const datesValid = nights >= 1 && nights <= 30 && checkIn >= localToday()

  const { data: availability, isFetching: checking, error: availabilityError } = useGetStayAvailabilityQuery(
    { propertyId: property._id, checkIn, checkOut },
    { skip: !datesValid },
  )

  const freeById = useMemo(() => {
    const map = new Map()
    for (const item of availability?.rooms || []) map.set(String(item.roomTypeId), item.free)
    return map
  }, [availability])

  const selected = rooms.find((room) => String(room._id) === String(roomTypeId)) || null
  const free = datesValid && availability ? freeById.get(String(selected?._id)) ?? 0 : null
  const count = Number(roomCount) || 0
  const guestCount = Number(guests) || 0
  const total = selected && datesValid ? selected.nightlyPrice * nights * count : 0

  // The server has the last word on dates (e.g. more than a year ahead, or
  // the viewer's calendar already on tomorrow while Gilgit is not).
  const problem = datesValid && availabilityError
    ? availabilityError.data?.message || t('common.somethingWrong')
    : !datesValid
    ? (checkIn || checkOut) && nights > 30 ? t('stay.err.tooLong') : null
    : !selected
      ? t('stay.err.pickRoom')
      : free !== null && free < count
        ? t('stay.err.notEnough', { count: free })
        : guestCount > selected.maxGuests * count
          ? t('stay.err.tooManyGuests', { count: selected.maxGuests * count })
          : null

  const canRequest = datesValid && selected && count >= 1 && guestCount >= 1 && !problem && !checking && free !== null

  const submit = async () => {
    try {
      await createBooking({
        propertyId: property._id,
        roomTypeId: selected._id,
        checkIn,
        checkOut,
        rooms: count,
        guests: guestCount,
        message: message.trim() || undefined,
      }).unwrap()
      toast.success(t('stay.toastRequested'))
      setMessage('')
    } catch (error) {
      toast.error(error?.data?.message || t('common.somethingWrong'))
    }
  }

  const fromPrice = rooms.length ? Math.min(...rooms.map((room) => room.nightlyPrice)) : 0

  return (
    <>
      <p className="text-sm text-slate-500">{t('stay.from')}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.045em]">{money(fromPrice)}<span className="text-sm font-bold text-slate-500"> {t('card.perNight')}</span></p>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-cyan-300" /> {t('stay.checkInAt', { time: property.checkInTime || '14:00' })}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-violet-300" /> {t('stay.checkOutAt', { time: property.checkOutTime || '12:00' })}</span>
      </div>

      {isOwner ? (
        <div className="mt-5 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-slate-400">
          {t('stay.ownerNote')} <Link to="/owner/bookings" className="font-black text-cyan-200">{t('stay.openBookings')}</Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> {t('stay.checkIn')}</span><TextInput type="date" min={localToday()} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut('') }} /></label>
            <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> {t('stay.checkOut')}</span><TextInput type="date" min={checkIn || localToday()} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
          </div>

          <div className="mt-4 space-y-2" role="radiogroup" aria-label={t('stay.chooseRoom')}>
            {rooms.map((room) => {
              const roomFree = datesValid && availability ? freeById.get(String(room._id)) ?? 0 : null
              const soldOut = roomFree === 0
              const active = String(room._id) === String(roomTypeId)
              return (
                <button
                  key={room._id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={soldOut}
                  onClick={() => setRoomTypeId(room._id)}
                  className={`w-full rounded-[18px] border p-3 text-start transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'border-cyan-300/40 bg-cyan-300/[0.07]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-black text-white"><BedDouble className="h-4 w-4 text-cyan-300" /> {room.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><UsersRound className="h-3.5 w-3.5" /> {t('stay.upToGuests', { count: room.maxGuests })}</p>
                      {room.description && <p className="mt-1 text-[11px] leading-5 text-slate-500">{room.description}</p>}
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-sm font-black text-white">{money(room.nightlyPrice)}</p>
                      <p className="text-[10px] text-slate-500">{t('card.perNight')}</p>
                      {roomFree !== null && <p className={`mt-1 text-[10px] font-black ${soldOut ? 'text-rose-300' : 'text-emerald-300'}`}>{soldOut ? t('stay.soldOut') : t('stay.roomsLeft', { count: roomFree })}</p>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-300">{t('stay.rooms')}</span><TextInput type="number" min="1" max={Math.min(selected?.quantity || 1, 20)} value={roomCount} onChange={(event) => setRoomCount(event.target.value)} /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-300">{t('stay.guests')}</span><TextInput type="number" min="1" max="100" value={guests} onChange={(event) => setGuests(event.target.value)} /></label>
          </div>

          <TextArea className="mt-3" maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('stay.messagePlaceholder')} />

          {datesValid && selected && (
            <div className="mt-4 space-y-2 rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between gap-4 text-slate-400"><span>{t('stay.priceLine', { price: money(selected.nightlyPrice), nights, rooms: count })}</span><span>{money(total)}</span></div>
              <div className="flex justify-between gap-4 border-t border-white/[0.07] pt-2 font-black"><span>{t('stay.total')}</span><span>{money(total)}</span></div>
              <p className="text-[11px] leading-5 text-slate-500">{t('stay.payAtHotel')}</p>
            </div>
          )}

          {problem && <p className="mt-3 text-xs font-bold text-amber-200">{problem}</p>}
          {!datesValid && !problem && <p className="mt-3 text-xs text-slate-500">{t('stay.pickDates')}</p>}

          <PrimaryButton disabled={!canRequest || bookingState.isLoading} className="mt-4 w-full" onClick={() => requireAuth(submit)}>
            {bookingState.isLoading ? t('stay.sending') : t('stay.requestCta')}
          </PrimaryButton>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> {t('stay.policy')}</p>

          <SecondaryButton disabled={messageLoading} className="mt-3 w-full" onClick={() => requireAuth(onMessageOwner)}><MessageCircle className="h-4 w-4" /> {t('stay.messageHotel')}</SecondaryButton>
        </>
      )}
    </>
  )
}
