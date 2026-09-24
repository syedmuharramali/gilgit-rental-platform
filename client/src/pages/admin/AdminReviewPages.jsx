import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, ExternalLink, FileImage, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useApprovePropertyMutation,
  useApproveVerificationMutation,
  useGetAdminPropertiesQuery,
  useGetAdminPropertyQuery,
  useGetVerificationQuery,
  useGetVerificationsQuery,
  useLazyGetVerificationDocumentQuery,
  useRejectPropertyMutation,
  useRejectVerificationMutation,
} from '../../features/admin/adminApi'
import {
  amenityLabel,
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  StatusBadge,
  TextArea,
  money,
  pretty,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error, t) => error?.data?.message || error?.error || t('common.somethingWrong')
const softCard = 'rounded-2xl border border-white/[0.07] bg-white/[0.035]'

export function AdminPropertiesQueuePage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('pending_review')
  const { data, isLoading } = useGetAdminPropertiesQuery({ status, limit: 100 })
  if (isLoading) return <LoadingState />
  const properties = data?.properties || []

  return (
    <>
      <PageHeader eyebrow={t('adm.moderation')} title={t('adm.queueTitle')} text={t('adm.queueText')} action={<Select value={status} onChange={(event) => setStatus(event.target.value)}>{['pending_review','published','rejected'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select>} />
      <div className="space-y-4">
        {properties.length ? properties.map((property, index) => (
          <motion.div key={property._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }}>
            <Panel className="hover:border-cyan-300/15">
              <div className="grid gap-5 lg:grid-cols-[140px_1fr_auto] lg:items-center">
                {property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" className="h-28 w-full rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="grid h-28 place-items-center rounded-2xl bg-white/[0.04]"><Building2 className="text-slate-600" /></div>}
                <div><div className="flex flex-wrap gap-2"><StatusBadge value={property.listingStatus} /><span className="text-xs font-bold text-slate-500">{pretty(property.propertyType)}</span></div><h2 className="mt-2 text-lg font-black text-white">{property.title}</h2><p className="mt-1 text-sm text-slate-400">{property.owner?.name} · {property.address?.area} · {money(property.monthlyRent)}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{property.description}</p></div>
                <Link to={`/admin/properties/${property._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-sm font-black text-[#07101e]">{t('adm.review')} <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </Panel>
          </motion.div>
        )) : <EmptyState title={t('adm.queueEmpty')} text={null} />}
      </div>
    </>
  )
}

export function AdminPropertyReviewPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: property, isLoading } = useGetAdminPropertyQuery(id)
  const [approve, approveState] = useApprovePropertyMutation()
  const [reject, rejectState] = useRejectPropertyMutation()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) return <LoadingState />
  if (!property) return <EmptyState title={t('adm.propertyNotFound')} text={null} />

  const decide = async (decision) => {
    try {
      if (decision === 'approve') await approve(id).unwrap()
      else await reject({ id, reason }).unwrap()
      toast.success(decision === 'approve' ? t('adm.toastApproved') : t('adm.toastRejected'))
      navigate('/admin/properties')
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  return (
    <>
      <Link to="/admin/properties" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-cyan-300"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('adm.backToPropertyQueue')}</Link>
      <PageHeader eyebrow={t('adm.propertyModeration')} title={property.title} text={`${property.owner?.name || t('adm.owner')} · ${property.owner?.email || ''}`} />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-6">
          <Panel className="p-3"><div className="grid gap-3 sm:grid-cols-2">{property.images?.length ? property.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-2xl ring-1 ring-white/10"><img src={image.url} alt={image.alt || property.title} className="aspect-[4/3] h-full w-full object-cover" />{image.isCover && <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 px-3 py-1 text-[10px] font-black text-[#07101e]">{t('adm.cover')}</span>}</div>) : <div className="col-span-2 grid min-h-60 place-items-center rounded-2xl bg-white/[0.035] text-sm font-bold text-slate-500">{t('adm.noImages')}</div>}</div></Panel>
          <Panel><div className="flex flex-wrap gap-2"><StatusBadge value={property.listingStatus} /><span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-300">{pretty(property.propertyType)}</span></div><h2 className="mt-5 text-xl font-black text-white">{t('adm.listingDetails')}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{property.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[[t('adm.monthlyRent'),money(property.monthlyRent)],[t('adm.security'),money(property.securityDeposit)],[t('adm.furnishing'),pretty(property.furnishedStatus)],[t('adm.bedrooms'),property.bedrooms],[t('adm.bathrooms'),property.bathrooms],[t('adm.occupants'),property.maxOccupants]].map(([label,value]) => <div key={label} className={`${softCard} p-4`}><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}</div></Panel>
          <Panel><h2 className="font-black text-white">{t('adm.amenitiesLiving')}</h2><div className="mt-4 flex flex-wrap gap-2">{property.amenities?.map((amenity) => <span key={amenity._id} className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.06] px-3 py-2 text-xs font-bold text-cyan-100">{amenityLabel(amenity)}</span>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[[t('adm.heating'),property.livingInfo?.heatingAvailable],[t('adm.hotWater'),property.livingInfo?.hotWaterAvailable],[t('adm.powerBackup'),property.livingInfo?.electricityBackup],[t('adm.winterAccess'),property.livingInfo?.winterAccessible],[t('adm.water'),pretty(property.livingInfo?.waterAvailability)],[t('adm.road'),pretty(property.livingInfo?.roadAccess)]].map(([label,value]) => <div key={label} className={`${softCard} p-3 text-sm`}><span className="font-bold text-slate-400">{label}</span><strong className="float-right text-white">{typeof value === 'boolean' ? (value ? t('adm.yes') : t('adm.no')) : value}</strong></div>)}</div></Panel>
        </div>
        <aside className="space-y-5"><Panel className="sticky top-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><ShieldCheck className="h-6 w-6" /></div><h2 className="mt-4 text-lg font-black text-white">{t('adm.decision')}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{t('adm.submittedOn', { date: shortDate(property.submittedAt) })}</p>{property.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-sm text-rose-300">{t('adm.previousRejection', { reason: property.rejectionReason })}</p>}{property.listingStatus === 'pending_review' && <div className="mt-5 space-y-2"><PrimaryButton disabled={approveState.isLoading} className="w-full" onClick={() => decide('approve')}>{t('adm.approvePublish')}</PrimaryButton><SecondaryButton className="w-full" onClick={() => setRejectOpen(true)}>{t('adm.rejectWithReason')}</SecondaryButton></div>}</Panel></aside>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('adm.rejectModalTitle')}><TextArea value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder={t('adm.rejectPlaceholder')} /><PrimaryButton disabled={rejectState.isLoading || !reason.trim()} className="mt-4 w-full" onClick={() => decide('reject')}>{t('adm.rejectListing')}</PrimaryButton></Modal>
    </>
  )
}

export function AdminVerificationsQueuePage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('pending')
  const { data, isLoading } = useGetVerificationsQuery({ status, limit: 100 })
  if (isLoading) return <LoadingState />
  const requests = data?.verifications || []

  return (
    <>
      <PageHeader eyebrow={t('adm.identity')} title={t('adm.verificationQueue')} text={t('adm.verificationQueueText')} action={<Select value={status} onChange={(event) => setStatus(event.target.value)}>{['pending','verified','resubmission_required','rejected'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select>} />
      <div className="space-y-4">{requests.length ? requests.map((verification, index) => <motion.div key={verification._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }}><Panel><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge value={verification.status} /><h2 className="mt-2 font-black text-white">{verification.user?.name}</h2><p className="mt-1 text-sm text-slate-400">{t('adm.verificationLine', { email: verification.user?.email, digits: verification.cnicLast4, attempt: verification.attemptNumber })}</p><p className="mt-2 text-xs text-slate-500">{t('adm.submittedLine', { date: shortDate(verification.submittedAt) })}</p></div><Link to={`/admin/verifications/${verification._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-sm font-black text-[#07101e]">{t('adm.inspectDocuments')} <ExternalLink className="h-4 w-4" /></Link></div></Panel></motion.div>) : <EmptyState title={t('adm.noVerificationRequests')} text={null} />}</div>
    </>
  )
}

export function AdminVerificationReviewPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: verification, isLoading } = useGetVerificationQuery(id)
  const [loadDocument] = useLazyGetVerificationDocumentQuery()
  const [approve, approveState] = useApproveVerificationMutation()
  const [reject, rejectState] = useRejectVerificationMutation()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [documentUrl, setDocumentUrl] = useState(null)
  const [documentLabel, setDocumentLabel] = useState('')

  useEffect(() => () => { if (documentUrl) URL.revokeObjectURL(documentUrl) }, [documentUrl])
  if (isLoading) return <LoadingState />
  if (!verification) return <EmptyState title={t('adm.verificationNotFound')} text={null} />

  const viewDocument = async (documentType, label) => {
    try {
      const blob = await loadDocument({ id, documentType }).unwrap()
      if (documentUrl) URL.revokeObjectURL(documentUrl)
      setDocumentUrl(URL.createObjectURL(blob))
      setDocumentLabel(label)
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  const decide = async (decision) => {
    try {
      if (decision === 'approve') await approve(id).unwrap()
      else await reject({ id, reason, allowResubmission }).unwrap()
      toast.success(decision === 'approve' ? t('adm.toastVerified') : t('adm.toastDecisionSaved'))
      navigate('/admin/verifications')
    } catch (error) { toast.error(errorMessage(error, t)) }
  }

  return (
    <>
      <Link to="/admin/verifications" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-cyan-300"><ArrowLeft className="h-4 w-4" /> {t('adm.backToQueue')}</Link>
      <PageHeader eyebrow={t('adm.privateReview')} title={verification.user?.name || t('adm.verificationRequest')} text={t('adm.cnicEnding', { email: verification.user?.email || '', digits: verification.cnicLast4 })} />
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Panel><StatusBadge value={verification.status} /><h2 className="mt-5 font-black text-white">{t('adm.submissionDetails')}</h2><div className="mt-4 space-y-3 text-sm">{[[t('adm.attempt'),`#${verification.attemptNumber}`],[t('adm.submitted'),shortDate(verification.submittedAt)],[t('adm.account'),pretty(verification.user?.accountStatus)],[t('adm.phone'),verification.user?.phone || t('adm.notProvided')]].map(([label,value]) => <div key={label} className={`flex justify-between gap-4 ${softCard} p-3`}><span className="text-slate-400">{label}</span><strong className="text-white">{value}</strong></div>)}</div>{verification.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4 text-sm text-rose-300">{verification.rejectionReason}</p>}{verification.status === 'pending' && <div className="mt-5 space-y-2"><PrimaryButton disabled={approveState.isLoading} className="w-full" onClick={() => decide('approve')}>{t('adm.approveIdentity')}</PrimaryButton><SecondaryButton className="w-full" onClick={() => setRejectOpen(true)}>{t('adm.rejectResubmission')}</SecondaryButton></div>}</Panel>
        <Panel><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-400/10 text-violet-200 ring-1 ring-violet-300/15"><FileImage className="h-5 w-5" /></div><h2 className="font-black text-white">{t('adm.privateDocuments')}</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">{t('adm.privateDocumentsText')}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['cnicFront',t('ver.cnicFront')],['cnicBack',t('ver.cnicBack')],['selfie',t('ver.selfie')]].map(([type,label]) => <button key={type} onClick={() => viewDocument(type,label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]">{label}<span className="mt-1 block text-[10px] font-semibold text-slate-500">{t('adm.openSecurely')}</span></button>)}</div>{documentUrl ? <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[#080d17]"><div className="flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3 text-white"><span className="text-xs font-black">{documentLabel}</span><a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-cyan-300">{t('adm.openFullSize')}</a></div><img src={documentUrl} alt={documentLabel} className="max-h-[620px] w-full object-contain" /></div> : <div className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.025] text-sm font-bold text-slate-500">{t('adm.selectDocument')}</div>}</Panel>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('adm.verificationDecision')}><TextArea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('adm.verificationRejectPlaceholder')} /><label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm font-bold text-slate-300"><input type="checkbox" checked={allowResubmission} onChange={(event) => setAllowResubmission(event.target.checked)} /> {t('adm.allowResubmit')}</label><PrimaryButton disabled={rejectState.isLoading || !reason.trim()} className="mt-4 w-full" onClick={() => decide('reject')}>{t('adm.saveDecision')}</PrimaryButton></Modal>
    </>
  )
}
