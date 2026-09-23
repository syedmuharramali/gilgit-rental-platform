import { useState } from 'react'
import { FileCheck2, Plus, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { useGetMyTenanciesQuery, useGetOwnedTenanciesQuery } from '../../features/tenancies/tenanciesApi'
import { useCreateReviewMutation, useGetMyReviewsQuery, useGetReceivedReviewsQuery } from '../../features/reviews/reviewsApi'
import { useCreateReportMutation, useGetMyReportsQuery } from '../../features/reports/reportsApi'
import { useGetMyVerificationQuery } from '../../features/verification/verificationApi'
import {
  useDeletePropertyMutation,
  useGetMyPropertiesQuery,
  useSubmitPropertyMutation,
} from '../../features/properties/propertiesApi'
import { updateProfile } from '../../features/auth/authSlice'
import {
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
  TextInput,
  money,
  pretty,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const glass = 'rounded-2xl border border-white/[0.07] bg-white/[0.035]'

export function ReviewsPage({ owner = false }) {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const { data: mine } = useGetMyReviewsQuery()
  const { data: received } = useGetReceivedReviewsQuery()
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const tenancies = owner ? ownedTenancies.data?.tenancies || [] : myTenancies.data?.tenancies || []
  const [create] = useCreateReviewMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ tenancyId: '', rating: 5, comment: '' })

  const submit = async () => {
    try { await create(form).unwrap(); toast.success(t('rev.toast')); setOpen(false) } catch (error) { toast.error(errorMessage(error)) }
  }

  return (
    <>
      <PageHeader eyebrow={t('rev.eyebrow')} title={t('rev.title')} text={t('rev.text')} action={<PrimaryButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {t('rev.write')}</PrimaryButton>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel><h2 className="font-black text-white">{t('rev.writtenByYou')}</h2><div className="mt-4 space-y-3">{mine?.reviews?.length ? mine.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.property?.title}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || t('rev.noComment')}</p></div>) : <p className="text-sm text-slate-500">{t('rev.noWritten')}</p>}</div></Panel>
        <Panel><h2 className="font-black text-white">{t('rev.received')}</h2><div className="mt-4 space-y-3">{received?.reviews?.length ? received.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.reviewer?.name}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || t('rev.noComment')}</p></div>) : <p className="text-sm text-slate-500">{t('rev.noReceived')}</p>}</div></Panel>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('rev.modalTitle')}><div className="space-y-3"><Select value={form.tenancyId} onChange={(event) => setForm({ ...form, tenancyId: event.target.value })}><option value="">{t('rev.chooseRental')}</option>{tenancies.filter((tenancy) => ['active', 'ended'].includes(tenancy.status)).map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title}</option>)}</Select><Select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{t('rev.stars', { count: rating })}</option>)}</Select><TextArea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder={t('rev.placeholder')} /><PrimaryButton className="w-full" onClick={submit}>{t('rev.submit')}</PrimaryButton></div></Modal>
    </>
  )
}

export function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { data: verification } = useGetMyVerificationQuery()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })

  const beginEditing = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' })
    setEditing(true)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const result = await dispatch(updateProfile({ name: form.name, phone: form.phone || null }))

    if (updateProfile.fulfilled.match(result)) {
      toast.success(t('prof.toastUpdated'))
      setEditing(false)
    } else {
      toast.error(result.payload || t('prof.toastError'))
    }
  }

  const cancelEditing = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' })
    setEditing(false)
  }

  return (
    <>
      <PageHeader eyebrow={t('prof.eyebrow')} title={t('prof.title')} text={t('prof.text')} action={!editing ? <SecondaryButton onClick={beginEditing}>{t('prof.edit')}</SecondaryButton> : null} />
      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <Panel>
          <div className="flex items-center gap-4">{user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-20 w-20 rounded-[24px] object-cover ring-1 ring-white/10" /> : <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-cyan-300/20 to-violet-500/20 text-2xl font-black text-cyan-100 ring-1 ring-white/10">{user?.name?.[0]}</div>}<div><h2 className="text-xl font-black text-white">{user?.name}</h2><p className="text-sm text-slate-400">{user?.email}</p></div></div>
          <div className="mt-6 flex flex-wrap gap-2"><StatusBadge value={user?.emailVerified ? 'verified' : 'pending'} /><StatusBadge value={user?.accountStatus || 'active'} /></div>
        </Panel>
        <Panel>
          {editing ? <form onSubmit={saveProfile}><h2 className="font-black text-white">{t('prof.editTitle')}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{t('prof.editText')}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-black text-slate-300">{t('prof.fullName')}</span><TextInput value={form.name} minLength={2} maxLength={80} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="block"><span className="mb-2 block text-xs font-black text-slate-300">{t('prof.phone')} <span className="font-medium text-slate-500">{t('prof.optional')}</span></span><TextInput value={form.phone} maxLength={30} inputMode="tel" placeholder="+92 300 1234567" onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div><div className="mt-5 flex flex-wrap gap-3"><PrimaryButton type="submit">{t('prof.save')}</PrimaryButton><SecondaryButton onClick={cancelEditing}>{t('prof.cancel')}</SecondaryButton></div></form> : <><h2 className="font-black text-white">{t('prof.details')}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[[t('prof.email'),user?.email],[t('prof.phoneLabel'),user?.phone || t('prof.notProvided')],[t('prof.role'),pretty(user?.role)],[t('prof.ownerVerification'),verification?.ownerVerified ? t('prof.verifiedOwner') : (verification?.verification?.status ? pretty(verification.verification.status) : t('prof.notSubmitted'))],[t('prof.created'),shortDate(user?.createdAt)],[t('prof.phoneStatus'),user?.phoneVerified ? t('prof.verified') : t('prof.notVerified')]].map(([label,value]) => <div key={label} className={`${glass} p-4`}><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">{t('prof.protectedNote')}</p></>}
        </Panel>
      </div>
    </>
  )
}

export function ReportsPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const { data } = useGetMyReportsQuery()
  const [create] = useCreateReportMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ targetType: 'property', targetId: '', reason: 'misleading_listing', description: '' })
  const submit = async () => { try { await create(form).unwrap(); toast.success(t('rep.toast')); setOpen(false) } catch (error) { toast.error(errorMessage(error)) } }

  return (
    <>
      <PageHeader eyebrow={t('rep.eyebrow')} title={t('rep.title')} text={t('rep.text')} action={<PrimaryButton onClick={() => setOpen(true)}>{t('rep.new')}</PrimaryButton>} />
      <div className="space-y-3">{data?.reports?.length ? data.reports.map((report) => <Panel key={report._id}><div className="flex items-center justify-between gap-4"><div><StatusBadge value={report.status} /><p className="mt-2 font-black text-white">{pretty(report.reason)}</p><p className="mt-1 text-sm text-slate-400">{report.property?.title || report.reportedUser?.name || pretty(report.targetType)}</p></div><ShieldCheck className="h-5 w-5 text-slate-600" /></div></Panel>) : <EmptyState title={t('rep.empty')} text={null} />}</div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('rep.modalTitle')}><div className="space-y-3"><Select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value })}><option value="property">{pretty('property')}</option><option value="user">{pretty('user')}</option></Select><TextInput value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} placeholder={t('rep.targetId')} /><Select value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}>{['fraud','misleading_listing','harassment','inappropriate_content','duplicate_listing','safety_concern','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('rep.describe')} /><PrimaryButton className="w-full" onClick={submit}>{t('rep.submit')}</PrimaryButton></div></Modal>
    </>
  )
}

export function OwnerPropertiesPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const { data, isLoading } = useGetMyPropertiesQuery()
  const [submit] = useSubmitPropertyMutation()
  const [remove] = useDeletePropertyMutation()
  if (isLoading) return <LoadingState />
  const properties = data?.properties || []

  return (
    <>
      <PageHeader eyebrow={t('own.eyebrow')} title={t('own.title')} text={t('own.text')} action={<Link to="/owner/properties/new" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-sm font-black text-[#07101e]"><Plus className="h-4 w-4" /> {t('own.add')}</Link>} />
      <div className="grid gap-4 xl:grid-cols-2">
        {properties.length ? properties.map((property, index) => <motion.div key={property._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}><Panel className="h-full"><div className="flex gap-4">{property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" className="h-24 w-28 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="grid h-24 w-28 place-items-center rounded-2xl bg-white/[0.04]"><FileCheck2 className="h-5 w-5 text-slate-600" /></div>}<div className="min-w-0 flex-1"><StatusBadge value={property.listingStatus} /><h2 className="mt-2 truncate font-black text-white">{property.title}</h2><p className="mt-1 text-sm text-slate-400">{property.address?.area} · {money(property.monthlyRent)}</p></div></div>{property.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-sm text-rose-300">{property.rejectionReason}</p>}<div className="mt-5 flex flex-wrap gap-2"><Link to={`/owner/properties/${property._id}/edit`} className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25">{t('own.edit')}</Link>{['draft','rejected'].includes(property.listingStatus) && <PrimaryButton onClick={async () => { try { await submit(property._id).unwrap(); toast.success(t('own.toastSubmitted')) } catch (error) { toast.error(errorMessage(error)) } }}>{t('own.submitReview')}</PrimaryButton>}{property.listingStatus !== 'rented' && <SecondaryButton onClick={async () => { if (!window.confirm(t('own.confirmDelete'))) return; try { await remove(property._id).unwrap(); toast.success(t('own.toastDeleted')) } catch (error) { toast.error(errorMessage(error)) } }}>{t('own.delete')}</SecondaryButton>}</div></Panel></motion.div>) : <EmptyState title={t('own.emptyTitle')} text={t('own.emptyText')} />}
      </div>
    </>
  )
}
