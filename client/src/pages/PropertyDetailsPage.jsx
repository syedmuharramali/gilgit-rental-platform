import { useState } from 'react'
import {
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Flag,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import FavoriteButton from '../components/properties/FavoriteButton'
import PropertyMap from '../components/properties/PropertyMap'
import LivingScoreBreakdown from '../components/scoring/LivingScoreBreakdown'
import ScoreRing from '../components/scoring/ScoreRing'
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
  money,
  pretty,
  shortDate,
} from '../components/workspace/WorkspaceUI'
import { useGetPropertyQuery } from '../features/properties/propertiesApi'
import { useGetLivingScoreQuery } from '../features/scoring/scoringApi'
import { useCreateApplicationMutation } from '../features/applications/applicationsApi'
import { useCreateViewingMutation } from '../features/viewings/viewingsApi'
import { useStartConversationMutation } from '../features/messages/messagesApi'
import { useCreateReportMutation } from '../features/reports/reportsApi'
import { useGetPropertyReviewsQuery } from '../features/reviews/reviewsApi'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

const blankRoommate = () => ({ name: '', email: '', phone: '' })

function PropertyDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useSelector((state) => state.auth.token)
  const user = useSelector((state) => state.auth.user)
  const { data: property, isLoading, error } = useGetPropertyQuery(id)
  const { data: score } = useGetLivingScoreQuery(id)
  const { data: reviewData } = useGetPropertyReviewsQuery(id)
  const [createApplication, applicationState] = useCreateApplicationMutation()
  const [createViewing, viewingState] = useCreateViewingMutation()
  const [startConversation, messageState] = useStartConversationMutation()
  const [createReport, reportState] = useCreateReportMutation()
  const [modal, setModal] = useState(null)
  const [application, setApplication] = useState({
    applicationType: 'individual',
    roommates: [],
    message: '',
    preferredMoveInDate: '',
    expectedStayMonths: '6',
    occupants: '1',
  })
  const [viewing, setViewing] = useState({ requestedDateTime: '', message: '' })
  const [report, setReport] = useState({ reason: 'misleading_listing', description: '' })

  if (isLoading) {
    return <main className="min-h-[70vh] bg-[#f6f8f7] px-5 py-10"><div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-[55vh] rounded-[34px] bg-slate-200" /><div className="mt-8 h-10 w-1/2 rounded bg-slate-200" /></div></main>
  }

  if (error || !property) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#f6f8f7] px-5 py-16 text-center"><div><p className="text-2xl font-black text-slate-950">Property not found</p><Link to="/properties" className="mt-5 inline-flex rounded-full bg-[#102f26] px-5 py-3 text-sm font-bold text-white">Back to rentals</Link></div></main>
  }

  const images = property.images || []
  const cover = images.find((image) => image.isCover) || images[0]
  const secondary = images.filter((image) => image.id !== cover?.id).slice(0, 2)
  const ownerId = property.owner?._id || property.owner?.id || property.owner
  const isOwner = String(ownerId) === String(user?.id)

  const requireAuth = (next) => {
    if (!token) {
      navigate('/login', { state: { from: `/properties/${id}` } })
      return
    }
    next()
  }

  const updateRoommate = (index, key, value) => {
    setApplication((current) => ({
      ...current,
      roommates: current.roommates.map((roommate, roommateIndex) => roommateIndex === index ? { ...roommate, [key]: value } : roommate),
    }))
  }

  const addRoommate = () => {
    if (application.roommates.length >= Math.min(9, Math.max(0, (property.maxOccupants || 10) - 1))) return
    setApplication((current) => ({ ...current, roommates: [...current.roommates, blankRoommate()] }))
  }

  const removeRoommate = (index) => {
    setApplication((current) => ({ ...current, roommates: current.roommates.filter((_, roommateIndex) => roommateIndex !== index) }))
  }

  const submitApplication = async () => {
    try {
      const payload = {
        propertyId: id,
        applicationType: application.applicationType,
        message: application.message,
        preferredMoveInDate: application.preferredMoveInDate || undefined,
        expectedStayMonths: application.expectedStayMonths ? Number(application.expectedStayMonths) : undefined,
      }

      if (application.applicationType === 'group') {
        payload.roommates = application.roommates.map((roommate) => ({
          name: roommate.name.trim(),
          email: roommate.email.trim(),
          phone: roommate.phone.trim() || undefined,
        }))
      } else {
        payload.occupants = Number(application.occupants)
      }

      await createApplication(payload).unwrap()
      toast.success('Application submitted')
      setModal(null)
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    }
  }

  const submitViewing = async () => {
    try {
      await createViewing({ propertyId: id, requestedDateTime: viewing.requestedDateTime, message: viewing.message }).unwrap()
      toast.success('Viewing requested')
      setModal(null)
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    }
  }

  const messageOwner = async () => {
    try {
      const result = await startConversation(id).unwrap()
      const conversationId = result?.data?.conversation?._id || result?.conversation?._id
      toast.success('Conversation ready')
      navigate('/dashboard/messages', { state: { conversationId } })
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    }
  }

  const submitReport = async () => {
    try {
      await createReport({ targetType: 'property', targetId: id, ...report }).unwrap()
      toast.success('Report submitted')
      setModal(null)
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    }
  }

  return (
    <main className="bg-[#f6f8f7] pb-20">
      <section className="px-5 py-5 sm:px-8 lg:px-10"><div className="mx-auto max-w-[1440px]"><Link to="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"><ChevronLeft className="h-4 w-4" /> Back to rentals</Link></div></section>

      <section className="px-5 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-3 overflow-hidden rounded-[34px] lg:grid-cols-[1.3fr_.7fr] lg:grid-rows-2">
          <div className="min-h-[360px] overflow-hidden bg-slate-200 lg:row-span-2 lg:min-h-[620px]">{cover?.url ? <img src={cover.url} alt={cover.alt || property.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[#d7e6de] font-bold text-slate-600">No property image</div>}</div>
          {secondary.map((image) => <div key={image.id} className="hidden overflow-hidden bg-slate-200 lg:block"><img src={image.url} alt={image.alt || property.title} className="h-full w-full object-cover" /></div>)}
        </div>
      </section>

      <section className="px-5 pt-9 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e6f2ec] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#245545]">{pretty(property.propertyType)}</span><span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"><ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Verified listing</span></div>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">{property.title}</h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {property.address?.area}, {property.address?.city}</p>
              </div>
              <FavoriteButton propertyId={property._id} showLabel className="min-h-12 shrink-0 border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 py-7 sm:grid-cols-4">
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><BedDouble className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.bedrooms || 0} bedrooms</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><Bath className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.bathrooms || 0} bathrooms</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><UsersRound className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">Up to {property.maxOccupants || 1}</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><CalendarDays className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.minimumStayMonths || 1}+ month stay</p></div>
            </div>

            <div className="py-8"><h2 className="text-2xl font-black tracking-[-0.04em]">About this place</h2><p className="mt-4 max-w-3xl whitespace-pre-line text-[15px] leading-8 text-slate-600">{property.description}</p></div>

            {score && <div className="grid gap-5 border-t border-slate-200 py-8 lg:grid-cols-[220px_1fr]"><div className="rounded-[28px] bg-[#102f26] p-5 text-white"><ScoreRing score={score.gilgitLivingScore} label={score.label} light /></div><LivingScoreBreakdown breakdown={score.breakdown} /></div>}

            <div className="border-t border-slate-200 py-8"><h2 className="text-2xl font-black tracking-[-0.04em]">Amenities</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{(property.amenities || []).map((amenity) => <div key={amenity._id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> {amenity.name}</div>)}</div></div>

            <div className="border-t border-slate-200 py-8">
              <div className="mb-5"><h2 className="text-2xl font-black tracking-[-0.04em]">Location</h2><p className="mt-2 text-sm text-slate-500">{[property.address?.street, property.address?.area, property.address?.city, property.address?.landmark].filter(Boolean).join(' · ')}</p></div>
              <PropertyMap latitude={property.address?.latitude} longitude={property.address?.longitude} title={property.title} className="h-[360px]" />
            </div>

            <div className="border-t border-slate-200 py-8"><div className="flex items-center justify-between"><h2 className="text-2xl font-black tracking-[-0.04em]">Renter reviews</h2><span className="flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {reviewData?.averageRating || 0} ({reviewData?.count || 0})</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{reviewData?.reviews?.length ? reviewData.reviews.map((reviewItem) => <div key={reviewItem._id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div className="flex items-center justify-between"><strong className="text-sm">{reviewItem.reviewer?.name}</strong><span className="text-amber-500">{'★'.repeat(reviewItem.rating)}</span></div><p className="mt-2 text-sm leading-6 text-slate-500">{reviewItem.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-400">No completed-tenancy reviews yet.</p>}</div></div>
          </div>

          <aside>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24 rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.10)]">
              <p className="text-sm text-slate-500">Monthly rent</p><p className="mt-1 text-3xl font-black tracking-[-0.045em]">{money(property.monthlyRent)}</p>
              {property.negotiable && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">Negotiable</span>}
              <div className="mt-6 space-y-3 rounded-[22px] bg-[#f6f8f7] p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Security deposit</span><strong>{money(property.securityDeposit)}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Furnishing</span><strong>{pretty(property.furnishedStatus)}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Available</span><strong>{shortDate(property.availableFrom)}</strong></div></div>
              {!isOwner && <><PrimaryButton disabled={applicationState.isLoading} className="mt-5 w-full" onClick={() => requireAuth(() => setModal('apply'))}>Apply for this home</PrimaryButton><SecondaryButton disabled={viewingState.isLoading} className="mt-2 w-full" onClick={() => requireAuth(() => setModal('viewing'))}>Schedule a viewing</SecondaryButton><SecondaryButton disabled={messageState.isLoading} className="mt-2 w-full" onClick={() => requireAuth(messageOwner)}><MessageCircle className="h-4 w-4" /> Message owner</SecondaryButton></>}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">{property.owner?.avatar?.url ? <img src={property.owner.avatar.url} alt="" className="h-11 w-11 rounded-2xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f2ed] font-black text-[#245545]">{property.owner?.name?.[0] || 'O'}</div>}<div><p className="text-sm font-black">{property.owner?.name || 'Property owner'}</p><p className="text-xs text-slate-400">Verified rental owner</p></div></div>
              {!isOwner && <button onClick={() => requireAuth(() => setModal('report'))} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-rose-600"><Flag className="h-3.5 w-3.5" /> Report listing</button>}
            </motion.div>
          </aside>
        </div>
      </section>

      <Modal open={modal === 'apply'} onClose={() => setModal(null)} title="Apply for this home">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1"><button type="button" onClick={() => setApplication((current) => ({ ...current, applicationType: 'individual', roommates: [] }))} className={`rounded-xl px-3 py-2 text-xs font-black ${application.applicationType === 'individual' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Individual</button><button type="button" onClick={() => setApplication((current) => ({ ...current, applicationType: 'group', roommates: current.roommates.length ? current.roommates : [blankRoommate()] }))} className={`rounded-xl px-3 py-2 text-xs font-black ${application.applicationType === 'group' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Group / roommates</button></div>
          <TextArea value={application.message} onChange={(event) => setApplication({ ...application, message: event.target.value })} placeholder="Introduce yourself to the owner" />
          <TextInput type="date" value={application.preferredMoveInDate} onChange={(event) => setApplication({ ...application, preferredMoveInDate: event.target.value })} />
          <div className="grid grid-cols-2 gap-3"><TextInput type="number" min="1" max="120" value={application.expectedStayMonths} onChange={(event) => setApplication({ ...application, expectedStayMonths: event.target.value })} placeholder="Stay months" />{application.applicationType === 'individual' && <TextInput type="number" min="1" max={property.maxOccupants || 20} value={application.occupants} onChange={(event) => setApplication({ ...application, occupants: event.target.value })} placeholder="Occupants" />}</div>
          {application.applicationType === 'group' && <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-black">Roommates</p><SecondaryButton type="button" onClick={addRoommate}><Plus className="h-4 w-4" /> Add roommate</SecondaryButton></div>{application.roommates.map((roommate, index) => <div key={index} className="rounded-2xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-2"><TextInput value={roommate.name} onChange={(event) => updateRoommate(index, 'name', event.target.value)} placeholder="Full name" /><TextInput type="email" value={roommate.email} onChange={(event) => updateRoommate(index, 'email', event.target.value)} placeholder="Email" /></div><div className="mt-2 flex gap-2"><TextInput value={roommate.phone} onChange={(event) => updateRoommate(index, 'phone', event.target.value)} placeholder="Phone (optional)" /><button type="button" onClick={() => removeRoommate(index)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
          <PrimaryButton disabled={applicationState.isLoading || (application.applicationType === 'group' && application.roommates.length === 0)} className="w-full" onClick={submitApplication}>Submit application</PrimaryButton>
        </div>
      </Modal>

      <Modal open={modal === 'viewing'} onClose={() => setModal(null)} title="Request a viewing"><div className="space-y-3"><TextInput type="datetime-local" value={viewing.requestedDateTime} onChange={(event) => setViewing({ ...viewing, requestedDateTime: event.target.value })} /><TextArea value={viewing.message} onChange={(event) => setViewing({ ...viewing, message: event.target.value })} placeholder="Optional note for the owner" /><PrimaryButton disabled={viewingState.isLoading || !viewing.requestedDateTime} className="w-full" onClick={submitViewing}>Send viewing request</PrimaryButton></div></Modal>

      <Modal open={modal === 'report'} onClose={() => setModal(null)} title="Report this listing"><div className="space-y-3"><Select value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })}>{['fraud','misleading_listing','inappropriate_content','duplicate_listing','safety_concern','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextArea value={report.description} onChange={(event) => setReport({ ...report, description: event.target.value })} placeholder="Tell the admin team what is wrong" /><PrimaryButton disabled={reportState.isLoading} className="w-full" onClick={submitReport}>Submit report</PrimaryButton></div></Modal>
    </main>
  )
}

export default PropertyDetailsPage
