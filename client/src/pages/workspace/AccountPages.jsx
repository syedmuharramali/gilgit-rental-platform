import { useState } from 'react'
import { FileCheck2, Plus, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
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

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'
const glass = 'rounded-2xl border border-white/[0.07] bg-white/[0.035]'

export function ReviewsPage({ owner = false }) {
  const { data: mine } = useGetMyReviewsQuery()
  const { data: received } = useGetReceivedReviewsQuery()
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const tenancies = owner ? ownedTenancies.data?.tenancies || [] : myTenancies.data?.tenancies || []
  const [create] = useCreateReviewMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ tenancyId: '', rating: 5, comment: '' })

  const submit = async () => {
    try { await create(form).unwrap(); toast.success('Review submitted'); setOpen(false) } catch (error) { toast.error(errorMessage(error)) }
  }

  return (
    <>
      <PageHeader eyebrow="Reputation" title="Reviews" text="Reviews unlock once a rental has started, keeping feedback tied to a real rental relationship." action={<PrimaryButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Write review</PrimaryButton>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel><h2 className="font-black text-white">Written by you</h2><div className="mt-4 space-y-3">{mine?.reviews?.length ? mine.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.property?.title}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-500">No reviews written yet.</p>}</div></Panel>
        <Panel><h2 className="font-black text-white">Received</h2><div className="mt-4 space-y-3">{received?.reviews?.length ? received.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.reviewer?.name}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-500">No reviews received yet.</p>}</div></Panel>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Write a review"><div className="space-y-3"><Select value={form.tenancyId} onChange={(event) => setForm({ ...form, tenancyId: event.target.value })}><option value="">Choose a started rental</option>{tenancies.filter((tenancy) => ['active', 'ended'].includes(tenancy.status)).map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title}</option>)}</Select><Select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</Select><TextArea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Share your experience" /><PrimaryButton className="w-full" onClick={submit}>Submit review</PrimaryButton></div></Modal>
    </>
  )
}

export function ProfilePage() {
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
      toast.success('Profile updated')
      setEditing(false)
    } else {
      toast.error(result.payload || 'Unable to update profile')
    }
  }

  const cancelEditing = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' })
    setEditing(false)
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" text="Keep your contact details current while your email, role and verification status stay protected." action={!editing ? <SecondaryButton onClick={beginEditing}>Edit profile</SecondaryButton> : null} />
      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <Panel>
          <div className="flex items-center gap-4">{user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-20 w-20 rounded-[24px] object-cover ring-1 ring-white/10" /> : <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-cyan-300/20 to-violet-500/20 text-2xl font-black text-cyan-100 ring-1 ring-white/10">{user?.name?.[0]}</div>}<div><h2 className="text-xl font-black text-white">{user?.name}</h2><p className="text-sm text-slate-400">{user?.email}</p></div></div>
          <div className="mt-6 flex flex-wrap gap-2"><StatusBadge value={user?.emailVerified ? 'verified' : 'pending'} /><StatusBadge value={user?.accountStatus || 'active'} /></div>
        </Panel>
        <Panel>
          {editing ? <form onSubmit={saveProfile}><h2 className="font-black text-white">Edit profile</h2><p className="mt-2 text-sm leading-6 text-slate-400">You can change your display name and contact number. Changing your phone number clears its verification status until it is verified again.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-black text-slate-300">Full name</span><TextInput value={form.name} minLength={2} maxLength={80} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="block"><span className="mb-2 block text-xs font-black text-slate-300">Phone number <span className="font-medium text-slate-500">(optional)</span></span><TextInput value={form.phone} maxLength={30} inputMode="tel" placeholder="+92 300 1234567" onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div><div className="mt-5 flex flex-wrap gap-3"><PrimaryButton type="submit">Save changes</PrimaryButton><SecondaryButton onClick={cancelEditing}>Cancel</SecondaryButton></div></form> : <><h2 className="font-black text-white">Account details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Email',user?.email],['Phone',user?.phone || 'Not provided'],['Role',pretty(user?.role)],['Owner verification',verification?.ownerVerified ? 'Verified owner' : pretty(verification?.verification?.status || 'Not submitted')],['Account created',shortDate(user?.createdAt)],['Phone status',user?.phoneVerified ? 'Verified' : 'Not verified']].map(([label,value]) => <div key={label} className={`${glass} p-4`}><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">Email, role and account verification details are protected. Use Edit profile to update your name or phone number.</p></>}
        </Panel>
      </div>
    </>
  )
}

export function ReportsPage() {
  const { data } = useGetMyReportsQuery()
  const [create] = useCreateReportMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ targetType: 'property', targetId: '', reason: 'misleading_listing', description: '' })
  const submit = async () => { try { await create(form).unwrap(); toast.success('Report submitted'); setOpen(false) } catch (error) { toast.error(errorMessage(error)) } }

  return (
    <>
      <PageHeader eyebrow="Safety" title="Your reports" text="Report a property or user for review by platform administrators." action={<PrimaryButton onClick={() => setOpen(true)}>New report</PrimaryButton>} />
      <div className="space-y-3">{data?.reports?.length ? data.reports.map((report) => <Panel key={report._id}><div className="flex items-center justify-between gap-4"><div><StatusBadge value={report.status} /><p className="mt-2 font-black text-white">{pretty(report.reason)}</p><p className="mt-1 text-sm text-slate-400">{report.property?.title || report.reportedUser?.name || pretty(report.targetType)}</p></div><ShieldCheck className="h-5 w-5 text-slate-600" /></div></Panel>) : <EmptyState title="No reports submitted" />}</div>
      <Modal open={open} onClose={() => setOpen(false)} title="Submit a safety report"><div className="space-y-3"><Select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value })}><option value="property">Property</option><option value="user">User</option></Select><TextInput value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} placeholder="Target ID" /><Select value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}>{['fraud','misleading_listing','harassment','inappropriate_content','duplicate_listing','safety_concern','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the issue" /><PrimaryButton className="w-full" onClick={submit}>Submit report</PrimaryButton></div></Modal>
    </>
  )
}

export function OwnerPropertiesPage() {
  const { data, isLoading } = useGetMyPropertiesQuery()
  const [submit] = useSubmitPropertyMutation()
  const [remove] = useDeletePropertyMutation()
  if (isLoading) return <LoadingState />
  const properties = data?.properties || []

  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Your properties" text="Create, edit, upload images and submit listings for admin publication." action={<Link to="/owner/properties/new" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-sm font-black text-[#07101e]"><Plus className="h-4 w-4" /> Add property</Link>} />
      <div className="grid gap-4 xl:grid-cols-2">
        {properties.length ? properties.map((property, index) => <motion.div key={property._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}><Panel className="h-full"><div className="flex gap-4">{property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" className="h-24 w-28 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="grid h-24 w-28 place-items-center rounded-2xl bg-white/[0.04]"><FileCheck2 className="h-5 w-5 text-slate-600" /></div>}<div className="min-w-0 flex-1"><StatusBadge value={property.listingStatus} /><h2 className="mt-2 truncate font-black text-white">{property.title}</h2><p className="mt-1 text-sm text-slate-400">{property.address?.area} · {money(property.monthlyRent)}</p></div></div>{property.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-sm text-rose-300">{property.rejectionReason}</p>}<div className="mt-5 flex flex-wrap gap-2"><Link to={`/owner/properties/${property._id}/edit`} className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25">Edit listing</Link>{['draft','rejected'].includes(property.listingStatus) && <PrimaryButton onClick={async () => { try { await submit(property._id).unwrap(); toast.success('Property submitted for review') } catch (error) { toast.error(errorMessage(error)) } }}>Submit for review</PrimaryButton>}{property.listingStatus !== 'rented' && <SecondaryButton onClick={async () => { if (!window.confirm('Delete this property?')) return; try { await remove(property._id).unwrap(); toast.success('Property deleted') } catch (error) { toast.error(errorMessage(error)) } }}>Delete</SecondaryButton>}</div></Panel></motion.div>) : <EmptyState title="No properties yet" text="Create your first property after owner verification is approved." />}
      </div>
    </>
  )
}
