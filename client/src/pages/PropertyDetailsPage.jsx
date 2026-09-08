import { useState } from 'react'
import {
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Images,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UsersRound,
  Waves,
  X,
  Zap,
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
  const [previewIndex, setPreviewIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(null)
  const [application, setApplication] = useState({ applicationType: 'individual', roommates: [], message: '', preferredMoveInDate: '', expectedStayMonths: '6', occupants: '1' })
  const [viewing, setViewing] = useState({ requestedDateTime: '', message: '' })
  const [report, setReport] = useState({ reason: 'misleading_listing', description: '' })

  if (isLoading) return <main className="min-h-[70vh] bg-[#070b14] px-5 py-10"><div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-[55vh] rounded-[36px] bg-white/[0.05]" /><div className="mt-8 h-10 w-1/2 rounded bg-white/[0.05]" /></div></main>

  if (error || !property) return <main className="grid min-h-[70vh] place-items-center bg-[#070b14] px-5 py-16 text-center text-white"><div><p className="text-2xl font-black">Property not found</p><p className="mt-2 text-sm text-slate-500">This listing may no longer be publicly available.</p><Link to="/properties" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e]">Back to rentals</Link></div></main>

  const images = [...(property.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const cover = images.find((image) => image.isCover) || images[0]
  const galleryImages = cover ? [cover, ...images.filter((image) => image.id !== cover.id)] : images
  const displayedImage = galleryImages[previewIndex] || cover
  const secondary = galleryImages.slice(1, 5)
  const activeGalleryImage = galleryIndex == null ? null : galleryImages[galleryIndex]
  const ownerId = property.owner?._id || property.owner?.id || property.owner
  const isOwner = String(ownerId) === String(user?.id)

  const requireAuth = (next) => {
    if (!token) return navigate('/login', { state: { from: `/properties/${id}` } })
    next()
  }
  const updateRoommate = (index, key, value) => setApplication((current) => ({ ...current, roommates: current.roommates.map((roommate, roommateIndex) => roommateIndex === index ? { ...roommate, [key]: value } : roommate) }))
  const addRoommate = () => {
    if (application.roommates.length >= Math.min(9, Math.max(0, (property.maxOccupants || 10) - 1))) return
    setApplication((current) => ({ ...current, roommates: [...current.roommates, blankRoommate()] }))
  }
  const removeRoommate = (index) => setApplication((current) => ({ ...current, roommates: current.roommates.filter((_, roommateIndex) => roommateIndex !== index) }))

  const openGallery = (index = previewIndex) => {
    if (!galleryImages.length) return
    setGalleryIndex(index)
  }

  const previousGalleryImage = () => setGalleryIndex((current) => {
    if (current == null || galleryImages.length <= 1) return current
    return current === 0 ? galleryImages.length - 1 : current - 1
  })

  const nextGalleryImage = () => setGalleryIndex((current) => {
    if (current == null || galleryImages.length <= 1) return current
    return current === galleryImages.length - 1 ? 0 : current + 1
  })

  const submitApplication = async () => {
    try {
      const payload = { propertyId: id, applicationType: application.applicationType, message: application.message, preferredMoveInDate: application.preferredMoveInDate || undefined, expectedStayMonths: application.expectedStayMonths ? Number(application.expectedStayMonths) : undefined }
      if (application.applicationType === 'group') payload.roommates = application.roommates.map((roommate) => ({ name: roommate.name.trim(), email: roommate.email.trim(), phone: roommate.phone.trim() || undefined }))
      else payload.occupants = Number(application.occupants)
      await createApplication(payload).unwrap(); toast.success('Application submitted'); setModal(null)
    } catch (requestError) { toast.error(errorMessage(requestError)) }
  }

  const submitViewing = async () => {
    try { await createViewing({ propertyId: id, requestedDateTime: viewing.requestedDateTime, message: viewing.message }).unwrap(); toast.success('Viewing requested'); setModal(null) }
    catch (requestError) { toast.error(errorMessage(requestError)) }
  }

  const messageOwner = async () => {
    try {
      const result = await startConversation(id).unwrap()
      const conversationId = result?.data?.conversation?._id || result?.conversation?._id
      toast.success('Conversation ready'); navigate('/dashboard/messages', { state: { conversationId } })
    } catch (requestError) { toast.error(errorMessage(requestError)) }
  }

  const submitReport = async () => {
    try { await createReport({ targetType: 'property', targetId: id, ...report }).unwrap(); toast.success('Report submitted'); setModal(null) }
    catch (requestError) { toast.error(errorMessage(requestError)) }
  }

  return (
    <main className="relative overflow-hidden bg-[#070b14] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(56,189,248,.10),transparent_22%),radial-gradient(circle_at_15%_45%,rgba(139,92,246,.08),transparent_28%)]" />

      <section className="relative z-10 px-4 py-4 sm:px-8 sm:py-5 lg:px-10">
        <div className="mx-auto max-w-[1440px]"><Link to="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"><ChevronLeft className="h-4 w-4" /> Back to rentals</Link></div>
      </section>

      <section className="relative z-10 px-3 sm:px-8 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1440px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-2 shadow-[0_35px_110px_rgba(0,0,0,.32)] sm:rounded-[32px] sm:p-3">
          <div className="grid gap-2 lg:h-[540px] lg:grid-cols-[1.28fr_.72fr] xl:h-[580px]">
            <button
              type="button"
              onClick={() => openGallery(previewIndex)}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-[#111827] text-left sm:aspect-[16/10] sm:rounded-[26px] lg:aspect-auto lg:h-full"
              aria-label={galleryImages.length > 1 ? `Open photo gallery with ${galleryImages.length} images` : 'View property photo'}
            >
              {displayedImage?.url ? <img src={displayedImage.url} alt={displayedImage.alt || property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]" /> : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.18),transparent_34%),linear-gradient(145deg,#111827,#0b1220)] font-bold text-white/60">No property image</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/65 via-transparent to-[#040711]/10" />
              {galleryImages.length > 1 && <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#070b14]/75 px-3 py-2 text-[10px] font-black uppercase tracking-[.1em] text-white shadow-lg backdrop-blur-xl sm:right-4 sm:top-4"><Images className="h-3.5 w-3.5 text-cyan-300" /> {galleryImages.length} photos</span>}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 sm:bottom-5 sm:left-5"><span className="rounded-full border border-white/15 bg-[#070b14]/75 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] backdrop-blur-2xl">{pretty(property.propertyType)}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#070b14]/75 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] backdrop-blur-2xl"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Verified</span></div>
            </button>

            <div className="hidden min-h-0 grid-cols-2 grid-rows-2 gap-2 lg:grid">
              {secondary.map((image, index) => {
                const actualIndex = index + 1
                const hiddenCount = galleryImages.length - 5
                return (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => openGallery(actualIndex)}
                    className="group relative min-h-0 overflow-hidden rounded-[22px] bg-[#111827]"
                    aria-label={`Open photo ${actualIndex + 1} of ${galleryImages.length}`}
                  >
                    <img src={image.url} alt={image.alt || property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    {index === 3 && hiddenCount > 0 && <span className="absolute inset-0 grid place-items-center bg-[#050816]/62 text-sm font-black backdrop-blur-[2px]">+{hiddenCount} more photo{hiddenCount === 1 ? '' : 's'}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label={`Show photo ${index + 1} of ${galleryImages.length}`
                  }
                  aria-pressed={previewIndex === index}
                  className={`relative h-[72px] w-[94px] shrink-0 overflow-hidden rounded-[16px] border transition sm:h-[88px] sm:w-[118px] ${previewIndex === index ? 'border-cyan-300/70 ring-2 ring-cyan-300/15' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#050816]/75 px-1 text-[9px] font-black text-white backdrop-blur">{index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <section className="relative z-10 px-4 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_390px]">
          <div>
            <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Premium rental in Gilgit</p>
                <h1 className="mt-3 text-3xl font-black leading-[1.04] tracking-[-0.055em] sm:text-5xl lg:text-[56px]">{property.title}</h1>
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4 shrink-0 text-cyan-300" /> {property.address?.area}, {property.address?.city}</p>
              </div>
              <FavoriteButton propertyId={property._id} showLabel className="min-h-12 shrink-0 border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-white shadow-sm backdrop-blur-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-white/[0.08] py-8 sm:grid-cols-4">
              {[[BedDouble, `${property.bedrooms || 0} bedrooms`],[Bath, `${property.bathrooms || 0} bathrooms`],[UsersRound, `Up to ${property.maxOccupants || 1}`],[CalendarDays, `${property.minimumStayMonths || 1}+ month stay`]].map(([Icon,label]) => <motion.div key={label} whileHover={{ y: -4 }} className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4"><Icon className="h-4 w-4 text-cyan-300" /><p className="mt-3 text-sm font-black">{label}</p></motion.div>)}
            </div>

            <div className="py-9"><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">The property</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">About this place</h2><p className="mt-4 max-w-3xl whitespace-pre-line text-[15px] leading-8 text-slate-400">{property.description}</p></div>

            {score && <div className="grid gap-5 border-t border-white/[0.08] py-9 lg:grid-cols-[220px_1fr]"><motion.div whileHover={{ y: -4 }} className="rounded-[28px] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/10 via-blue-500/10 to-violet-500/10 p-5"><ScoreRing score={score.gilgitLivingScore} label={score.label} light /></motion.div><LivingScoreBreakdown breakdown={score.breakdown} /></div>}

            <div className="border-t border-white/[0.08] py-9"><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Included</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Amenities</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{(property.amenities || []).map((amenity) => <div key={amenity._id} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm font-semibold text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> {amenity.name}</div>)}</div></div>

            <div className="grid gap-3 border-t border-white/[0.08] py-9 sm:grid-cols-3">{[[Flame,'Heating',property.livingInfo?.heatingAvailable ? 'Available' : 'Not listed'],[Waves,'Hot water',property.livingInfo?.hotWaterAvailable ? 'Available' : 'Not listed'],[Zap,'Power backup',property.livingInfo?.electricityBackup ? 'Available' : 'Not listed']].map(([Icon,label,value]) => <div key={label} className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4"><Icon className="h-4 w-4 text-violet-300" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}</div>

            <div className="border-t border-white/[0.08] py-9"><h2 className="text-2xl font-black tracking-[-0.04em]">Location</h2><p className="mt-2 text-sm text-slate-500">{[property.address?.street, property.address?.area, property.address?.city, property.address?.landmark].filter(Boolean).join(' · ')}</p><div className="mt-5 overflow-hidden rounded-[28px] border border-white/[0.08]"><PropertyMap latitude={property.address?.latitude} longitude={property.address?.longitude} title={property.title} className="h-[360px]" /></div></div>

            <div className="border-t border-white/[0.08] py-9"><div className="flex items-center justify-between"><h2 className="text-2xl font-black tracking-[-0.04em]">Renter reviews</h2><span className="flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {reviewData?.averageRating || 0} ({reviewData?.count || 0})</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{reviewData?.reviews?.length ? reviewData.reviews.map((reviewItem) => <div key={reviewItem._id} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-center justify-between"><strong className="text-sm">{reviewItem.reviewer?.name}</strong><span className="text-amber-400">{'★'.repeat(reviewItem.rating)}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{reviewItem.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-500">No completed-tenancy reviews yet.</p>}</div></div>
          </div>

          <aside>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24 overflow-hidden rounded-[30px] border border-white/10 bg-[#0c1220]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.34)] backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
              <p className="text-sm text-slate-500">Monthly rent</p><p className="mt-1 text-3xl font-black tracking-[-0.045em]">{money(property.monthlyRent)}</p>
              {property.negotiable && <span className="mt-2 inline-block rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-200 ring-1 ring-amber-300/20">Negotiable</span>}
              <div className="mt-6 space-y-3 rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Security deposit</span><strong>{money(property.securityDeposit)}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Furnishing</span><strong>{pretty(property.furnishedStatus)}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Available</span><strong>{shortDate(property.availableFrom)}</strong></div></div>
              {!isOwner && <><PrimaryButton disabled={applicationState.isLoading} className="mt-5 w-full" onClick={() => requireAuth(() => setModal('apply'))}>Apply for this home</PrimaryButton><SecondaryButton disabled={viewingState.isLoading} className="mt-2 w-full" onClick={() => requireAuth(() => setModal('viewing'))}>Schedule a viewing</SecondaryButton><SecondaryButton disabled={messageState.isLoading} className="mt-2 w-full" onClick={() => requireAuth(messageOwner)}><MessageCircle className="h-4 w-4" /> Message owner</SecondaryButton></>}
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">{property.owner?.avatar?.url ? <img src={property.owner.avatar.url} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-200">{property.owner?.name?.[0] || 'O'}</div>}<div><p className="text-sm font-black">{property.owner?.name || 'Property owner'}</p><p className="text-xs text-slate-500">Verified rental owner</p></div></div>
              {!isOwner && <button onClick={() => requireAuth(() => setModal('report'))} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-rose-300"><Flag className="h-3.5 w-3.5" /> Report listing</button>}
            </motion.div>
          </aside>
        </div>
      </section>

      {galleryIndex != null && activeGalleryImage && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#03050b]/96 p-3 backdrop-blur-xl sm:p-5" role="dialog" aria-modal="true" aria-label="Property photo gallery">
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Property photos</p>
              <p className="mt-1 text-sm font-bold text-slate-400">{galleryIndex + 1} of {galleryImages.length}</p>
            </div>
            <button type="button" onClick={() => setGalleryIndex(null)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1]" aria-label="Close gallery"><X className="h-5 w-5" /></button>
          </div>

          <div className="relative mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.08] bg-black/30 sm:rounded-[30px]">
            <motion.img key={activeGalleryImage.id} initial={{ opacity: 0.45, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} src={activeGalleryImage.url} alt={activeGalleryImage.alt || property.title} className="max-h-full max-w-full object-contain" />
            {galleryImages.length > 1 && <><button type="button" onClick={previousGalleryImage} className="absolute left-2 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#070b14]/75 text-white shadow-xl backdrop-blur-xl transition hover:bg-[#070b14] sm:left-4 sm:h-12 sm:w-12" aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={nextGalleryImage} className="absolute right-2 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#070b14]/75 text-white shadow-xl backdrop-blur-xl transition hover:bg-[#070b14] sm:right-4 sm:h-12 sm:w-12" aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button></>}
          </div>

          {galleryImages.length > 1 && <div className="mx-auto mt-3 flex w-full max-w-[1500px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{galleryImages.map((image, index) => <button key={image.id} type="button" onClick={() => setGalleryIndex(index)} aria-label={`View photo ${index + 1}`} aria-pressed={galleryIndex === index} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition sm:h-20 sm:w-28 ${galleryIndex === index ? 'border-cyan-300 ring-2 ring-cyan-300/15' : 'border-white/10 opacity-55 hover:opacity-100'}`}><img src={image.url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </div>
      )}

      <Modal open={modal === 'apply'} onClose={() => setModal(null)} title="Apply for this home">
        <div className="space-y-5">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
            <p className="text-sm font-black text-cyan-100">Tell the owner about your rental plan</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Choose whether you are applying alone or with roommates, then add your preferred move-in date and expected stay. You can update the details with the owner later if needed.</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-slate-200">Who is applying?</p>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
              <button type="button" onClick={() => setApplication((current) => ({ ...current, applicationType: 'individual', roommates: [] }))} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${application.applicationType === 'individual' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Individual</button>
              <button type="button" onClick={() => setApplication((current) => ({ ...current, applicationType: 'group', roommates: current.roommates.length ? current.roommates : [blankRoommate()] }))} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${application.applicationType === 'group' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Group / roommates</button>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Choose “Individual” if this application is only for you. Choose “Group / roommates” if other people are applying with you.</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-200">Message to the owner <span className="font-semibold text-slate-600">(optional)</span></span>
            <TextArea maxLength={1000} value={application.message} onChange={(event) => setApplication((current) => ({ ...current, message: event.target.value }))} placeholder="Example: I am a working professional looking for a quiet long-term rental. I would like to move in around the selected date." />
            <span className="mt-2 block text-[11px] leading-5 text-slate-500">Briefly introduce yourself and mention anything useful for the owner. Maximum 1000 characters.</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-200">Preferred move-in date <span className="font-semibold text-slate-600">(optional)</span></span>
            <TextInput aria-label="Preferred move-in date" type="date" value={application.preferredMoveInDate} onChange={(event) => setApplication((current) => ({ ...current, preferredMoveInDate: event.target.value }))} />
            <span className="mt-2 block text-[11px] leading-5 text-slate-500">Choose the date you would ideally like to start the tenancy.</span>
          </label>

          <div className={`grid gap-4 ${application.applicationType === 'individual' ? 'sm:grid-cols-2' : ''}`}>
            <label className="block">
              <span className="mb-2 block text-xs font-black text-slate-200">Expected stay</span>
              <TextInput aria-label="Expected stay in months" type="number" min="1" max="120" value={application.expectedStayMonths} onChange={(event) => setApplication((current) => ({ ...current, expectedStayMonths: event.target.value }))} placeholder="6" />
              <span className="mt-2 block text-[11px] leading-5 text-slate-500">Number of months you expect to rent the property (1–120).</span>
            </label>

            {application.applicationType === 'individual' && (
              <label className="block">
                <span className="mb-2 block text-xs font-black text-slate-200">Number of occupants</span>
                <TextInput aria-label="Number of occupants" type="number" min="1" max={property.maxOccupants || 20} value={application.occupants} onChange={(event) => setApplication((current) => ({ ...current, occupants: event.target.value }))} placeholder="1" />
                <span className="mt-2 block text-[11px] leading-5 text-slate-500">Total people who would live here. This property allows up to {property.maxOccupants || 20}.</span>
              </label>
            )}
          </div>

          {application.applicationType === 'group' && (
            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black">Roommates</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Add the name and email of each person applying with you.</p>
                </div>
                <SecondaryButton type="button" onClick={addRoommate}><Plus className="h-4 w-4" /> Add roommate</SecondaryButton>
              </div>
              {application.roommates.map((roommate, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-[#0b111e] p-3">
                  <p className="mb-3 text-xs font-black text-slate-300">Roommate {index + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-400">Full name</span><TextInput value={roommate.name} onChange={(event) => updateRoommate(index, 'name', event.target.value)} placeholder="Full name" /></label>
                    <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-400">Email</span><TextInput type="email" value={roommate.email} onChange={(event) => updateRoommate(index, 'email', event.target.value)} placeholder="Email address" /></label>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <label className="block flex-1"><span className="mb-1.5 block text-[11px] font-bold text-slate-400">Phone <span className="font-semibold text-slate-600">(optional)</span></span><TextInput value={roommate.phone} onChange={(event) => updateRoommate(index, 'phone', event.target.value)} placeholder="Phone number" /></label>
                    <button type="button" onClick={() => removeRoommate(index)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-400/10 text-rose-300" aria-label={`Remove roommate ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs leading-5 text-slate-500">Submitting sends this application to the verified property owner for review. It does not create a tenancy or charge you any money.</div>

          <PrimaryButton disabled={applicationState.isLoading || (application.applicationType === 'group' && application.roommates.length === 0)} className="w-full" onClick={submitApplication}>{applicationState.isLoading ? 'Submitting…' : 'Submit application'}</PrimaryButton>
        </div>
      </Modal>

      <Modal open={modal === 'viewing'} onClose={() => setModal(null)} title="Request a viewing"><div className="space-y-3"><TextInput type="datetime-local" value={viewing.requestedDateTime} onChange={(event) => setViewing({ ...viewing, requestedDateTime: event.target.value })} /><TextArea value={viewing.message} onChange={(event) => setViewing({ ...viewing, message: event.target.value })} placeholder="Optional note for the owner" /><PrimaryButton disabled={viewingState.isLoading || !viewing.requestedDateTime} className="w-full" onClick={submitViewing}>Send viewing request</PrimaryButton></div></Modal>
      <Modal open={modal === 'report'} onClose={() => setModal(null)} title="Report this listing"><div className="space-y-3"><Select value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })}>{['fraud','misleading_listing','inappropriate_content','duplicate_listing','safety_concern','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextArea value={report.description} onChange={(event) => setReport({ ...report, description: event.target.value })} placeholder="Tell the admin team what is wrong" /><PrimaryButton disabled={reportState.isLoading} className="w-full" onClick={submitReport}>Submit report</PrimaryButton></div></Modal>
    </main>
  )
}

export default PropertyDetailsPage
