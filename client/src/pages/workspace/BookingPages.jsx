import { BedDouble, CalendarDays, MessageCircle, Star, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useDeclineBookingMutation,
  useGetMyBookingsQuery,
  useGetReceivedBookingsQuery,
  useReviewBookingMutation,
} from '../../features/bookings/bookingsApi'
import { useStartConversationMutation } from '../../features/messages/messagesApi'
import { stayDate } from '../../utils/formatters'
import {
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextArea,
  money,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error, t) => error?.data?.message || error?.error || t('common.somethingWrong')

const OPEN = ['requested', 'confirmed']
const DAY_MS = 24 * 60 * 60 * 1000

// Same rule as the server: a guest can cancel a confirmed stay until 24 hours
// before the hotel's check-in time (Gilgit is UTC+5).
const canGuestCancelConfirmed = (booking) => {
  const [hours, minutes] = String(booking.property?.checkInTime || '14:00').split(':').map(Number)
  const checkInMoment = new Date(booking.checkIn).getTime() + ((hours || 0) * 60 + (minutes || 0)) * 60000 - 5 * 3600000
  return Date.now() < checkInMoment - DAY_MS
}

function Tabs({ value, onChange, items }) {
  return (
    <div className="mb-5 inline-flex flex-wrap rounded-full border border-white/10 bg-white/[0.04] p-1" role="tablist">
      {items.map(([key, label, count]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)} className={`rounded-full px-4 py-2 text-xs font-black transition ${value === key ? 'bg-white text-[#07101e]' : 'text-white/45 hover:text-white/75'}`}>
          {label}{count ? ` · ${count}` : ''}
        </button>
      ))}
    </div>
  )
}

function StayFacts({ booking }) {
  const { t } = useTranslation()
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {[
        [CalendarDays, `${stayDate(booking.checkIn)} → ${stayDate(booking.checkOut)}`],
        [BedDouble, `${booking.rooms} × ${booking.roomType?.name}`],
        [UsersRound, t('trips.guests', { count: booking.guests })],
        [null, `${money(booking.totalPrice)} · ${t('trips.nights', { count: booking.nights })}`],
      ].map(([Icon, text]) => (
        <div key={text} className="flex items-center gap-1.5 rounded-xl bg-black/15 px-3 py-2 font-bold text-slate-300">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}<span className="truncate">{text}</span>
        </div>
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={t('trips.rating')}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={t('trips.stars', { count: star })} onClick={() => onChange(star)} className="p-1">
          <Star className={`h-6 w-6 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Guest: My trips
|--------------------------------------------------------------------------
*/

export function TripsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useGetMyBookingsQuery()
  const [cancelBooking, cancelState] = useCancelBookingMutation()
  const [reviewBooking, reviewState] = useReviewBookingMutation()
  const [startConversation] = useStartConversationMutation()
  const [tab, setTab] = useState('upcoming')
  const [reviewing, setReviewing] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  if (isLoading) return <LoadingState />
  const bookings = data?.bookings || []
  const upcoming = bookings.filter((booking) => OPEN.includes(booking.status)).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
  const past = bookings.filter((booking) => !OPEN.includes(booking.status))
  const items = tab === 'upcoming' ? upcoming : past

  const cancel = async (booking) => {
    if (!window.confirm(booking.status === 'requested' ? t('trips.confirmCancelRequest') : t('trips.confirmCancelStay'))) return
    try { await cancelBooking({ id: booking._id }).unwrap(); toast.success(t('trips.toastCancelled')) } catch (error) { toast.error(errorMessage(error, t)) }
  }

  const messageHotel = async (booking) => {
    try {
      const result = await startConversation(booking.property?._id).unwrap()
      navigate('/dashboard/messages', { state: { conversationId: result?.data?.conversation?._id } })
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  const submitReview = async () => {
    try {
      await reviewBooking({ id: reviewing._id, rating, comment: comment.trim() || undefined, propertyId: reviewing.property?._id }).unwrap()
      toast.success(t('trips.toastReviewed'))
      setReviewing(null)
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  return (
    <>
      <PageHeader eyebrow={t('trips.eyebrow')} title={t('trips.title')} text={t('trips.text')} action={<Link to="/properties?category=stays" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-200">{t('trips.findStay')}</Link>} />
      <Tabs value={tab} onChange={setTab} items={[['upcoming', t('trips.upcoming'), upcoming.length], ['past', t('trips.past'), 0]]} />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((booking, index) => (
          <motion.div key={booking._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Panel className="h-full">
              <div className="flex gap-4">
                {booking.property?.coverImageUrl ? <img src={booking.property.coverImageUrl} alt="" className="h-20 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="grid h-20 w-24 shrink-0 place-items-center rounded-2xl bg-white/[0.04]"><BedDouble className="h-5 w-5 text-slate-600" /></div>}
                <div className="min-w-0">
                  <StatusBadge value={booking.status} />
                  <Link to={`/properties/${booking.property?._id}`} className="mt-2 block truncate font-black text-white hover:text-cyan-200">{booking.property?.title}</Link>
                  <p className="mt-1 text-xs text-slate-500">{booking.property?.address?.area} · {t('stay.checkInAt', { time: booking.property?.checkInTime || '14:00' })}</p>
                </div>
              </div>
              <StayFacts booking={booking} />
              {booking.ownerResponse && <p className="mt-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-sm text-slate-300">{t('trips.hotelSaid', { message: booking.ownerResponse })}</p>}
              {booking.status === 'cancelled' && <p className="mt-3 text-xs text-slate-500">{booking.cancelledBy === 'owner' ? t('trips.cancelledByHotel') : t('trips.cancelledByYou')}</p>}
              {booking.status === 'expired' && <p className="mt-3 text-xs text-slate-500">{t('trips.expiredNote')}</p>}
              {booking.status === 'confirmed' && <p className="mt-3 text-xs text-slate-500">{t('stay.payAtHotel')}</p>}
              {booking.review?.rating && <p className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-200"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {t('trips.yourRating', { count: booking.review.rating })}</p>}

              <div className="mt-5 flex flex-wrap gap-2">
                {booking.status === 'requested' && <SecondaryButton disabled={cancelState.isLoading} onClick={() => cancel(booking)}>{t('trips.cancelRequest')}</SecondaryButton>}
                {booking.status === 'confirmed' && (canGuestCancelConfirmed(booking)
                  ? <SecondaryButton disabled={cancelState.isLoading} onClick={() => cancel(booking)}>{t('trips.cancelStay')}</SecondaryButton>
                  : <span className="self-center text-xs font-bold text-slate-500">{t('trips.tooLateToCancel')}</span>)}
                {booking.status === 'completed' && !booking.review?.rating && <PrimaryButton onClick={() => { setReviewing(booking); setRating(5); setComment('') }}><Star className="h-4 w-4" /> {t('trips.leaveReview')}</PrimaryButton>}
                {OPEN.includes(booking.status) && <SecondaryButton onClick={() => messageHotel(booking)}><MessageCircle className="h-4 w-4" /> {t('stay.messageHotel')}</SecondaryButton>}
              </div>
            </Panel>
          </motion.div>
        )) : <EmptyState title={tab === 'upcoming' ? t('trips.emptyUpcoming') : t('trips.emptyPast')} text={t('trips.emptyText')} />}
      </div>

      <Modal open={Boolean(reviewing)} onClose={() => setReviewing(null)} title={t('trips.reviewTitle', { title: reviewing?.property?.title || '' })}>
        <div className="space-y-4">
          <StarPicker value={rating} onChange={setRating} />
          <TextArea maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t('trips.reviewPlaceholder')} />
          <PrimaryButton disabled={reviewState.isLoading} className="w-full" onClick={submitReview}>{t('trips.submitReview')}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

/*
|--------------------------------------------------------------------------
| Hotel: Bookings
|--------------------------------------------------------------------------
*/

export function HotelBookingsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useGetReceivedBookingsQuery()
  const [confirmBooking, confirmState] = useConfirmBookingMutation()
  const [declineBooking, declineState] = useDeclineBookingMutation()
  const [cancelBooking, cancelState] = useCancelBookingMutation()
  const [tab, setTab] = useState('requests')
  const [action, setAction] = useState(null) // { kind: 'confirm'|'decline'|'cancel', booking }
  const [note, setNote] = useState('')

  if (isLoading) return <LoadingState />
  const bookings = data?.bookings || []
  const requests = bookings.filter((booking) => booking.status === 'requested').sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
  const upcoming = bookings.filter((booking) => booking.status === 'confirmed').sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
  const past = bookings.filter((booking) => !OPEN.includes(booking.status))
  const items = tab === 'requests' ? requests : tab === 'upcoming' ? upcoming : past

  const open = (kind, booking) => { setAction({ kind, booking }); setNote('') }

  const submit = async () => {
    const { kind, booking } = action
    try {
      if (kind === 'confirm') await confirmBooking({ id: booking._id, message: note.trim() || undefined }).unwrap()
      if (kind === 'decline') await declineBooking({ id: booking._id, message: note.trim() || undefined }).unwrap()
      if (kind === 'cancel') await cancelBooking({ id: booking._id, reason: note.trim() }).unwrap()
      toast.success(t(`hotel.toast.${kind}`))
      setAction(null)
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  const busy = confirmState.isLoading || declineState.isLoading || cancelState.isLoading

  return (
    <>
      <PageHeader eyebrow={t('hotel.eyebrow')} title={t('hotel.title')} text={t('hotel.text')} />
      <Tabs value={tab} onChange={setTab} items={[['requests', t('hotel.requests'), requests.length], ['upcoming', t('hotel.upcoming'), upcoming.length], ['past', t('hotel.past'), 0]]} />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((booking, index) => (
          <motion.div key={booking._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Panel className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <StatusBadge value={booking.status} />
                  <h2 className="mt-2 truncate font-black text-white">{booking.guest?.name}</h2>
                  <p className="force-ltr mt-1 truncate text-xs text-slate-500">{[booking.guest?.email, booking.guest?.phone].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1 truncate text-xs font-bold text-slate-400">{booking.property?.title}</p>
                </div>
              </div>
              <StayFacts booking={booking} />
              {booking.message && <p className="mt-3 text-sm leading-6 text-slate-300">“{booking.message}”</p>}
              {booking.ownerResponse && <p className="mt-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-xs text-slate-400">{t('hotel.yourNote', { message: booking.ownerResponse })}</p>}
              {booking.status === 'cancelled' && <p className="mt-3 text-xs text-slate-500">{booking.cancelledBy === 'guest' ? t('hotel.cancelledByGuest') : t('hotel.cancelledByYou')}</p>}
              {booking.review?.rating && <p className="mt-3 text-xs text-amber-200"><Star className="me-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />{t('trips.yourRating', { count: booking.review.rating })}{booking.review.comment ? ` — ${booking.review.comment}` : ''}</p>}

              <div className="mt-5 flex flex-wrap gap-2">
                {booking.status === 'requested' && <><PrimaryButton disabled={busy} onClick={() => open('confirm', booking)}>{t('hotel.confirm')}</PrimaryButton><SecondaryButton disabled={busy} onClick={() => open('decline', booking)}>{t('hotel.decline')}</SecondaryButton></>}
                {booking.status === 'confirmed' && <SecondaryButton disabled={busy} onClick={() => open('cancel', booking)}>{t('hotel.cancel')}</SecondaryButton>}
              </div>
            </Panel>
          </motion.div>
        )) : <EmptyState title={t(`hotel.empty.${tab}`)} text={null} />}
      </div>

      <Modal open={Boolean(action)} onClose={() => setAction(null)} title={action ? t(`hotel.modal.${action.kind}`) : ''}>
        <div className="space-y-4">
          {action && <p className="text-sm text-slate-400">{t('hotel.modalSummary', { name: action.booking.guest?.name, room: action.booking.roomType?.name, rooms: action.booking.rooms, from: stayDate(action.booking.checkIn), to: stayDate(action.booking.checkOut) })}</p>}
          <TextArea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder={action?.kind === 'cancel' ? t('hotel.reasonRequired') : t('hotel.noteOptional')} />
          <PrimaryButton disabled={busy || (action?.kind === 'cancel' && note.trim().length < 5)} className="w-full" onClick={submit}>{action ? t(`hotel.submit.${action.kind}`) : ''}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}
