import { useEffect, useState } from 'react'
import { Bell, FileCheck2, Plus, Send, ShieldCheck, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '../../features/messages/messagesApi'
import { useGetAgreementsQuery, useSignAgreementMutation } from '../../features/agreements/agreementsApi'
import { useGetMyTenanciesQuery, useGetOwnedTenanciesQuery } from '../../features/tenancies/tenanciesApi'
import { useCreateReviewMutation, useGetMyReviewsQuery, useGetReceivedReviewsQuery } from '../../features/reviews/reviewsApi'
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../features/notifications/notificationsApi'
import { useCreateReportMutation, useGetMyReportsQuery } from '../../features/reports/reportsApi'
import { useGetMyVerificationQuery, useSubmitVerificationMutation } from '../../features/verification/verificationApi'
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
  dateTime,
  money,
  pretty,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'
const glass = 'rounded-2xl border border-white/[0.07] bg-white/[0.035]'

export function MessagesPage() {
  const location = useLocation()
  const { data, isLoading } = useGetConversationsQuery(undefined, { pollingInterval: 15000 })
  const conversations = data?.conversations || []
  const [selected, setSelected] = useState(location.state?.conversationId || null)
  const active = selected || conversations[0]?._id
  const { data: messageData } = useGetConversationMessagesQuery({ conversationId: active, page: 1, limit: 100 }, { skip: !active, pollingInterval: 8000 })
  const [sendMessage, sendState] = useSendMessageMutation()
  const [markRead] = useMarkConversationReadMutation()
  const [body, setBody] = useState('')
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    if (active) markRead(active)
  }, [active, markRead])

  const submit = async (event) => {
    event.preventDefault()
    if (!body.trim()) return
    try {
      await sendMessage({ conversationId: active, body }).unwrap()
      setBody('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages" text="Conversations stay attached to a property so the rental context never gets lost." />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid min-h-[620px] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0d1423] shadow-[0_30px_90px_rgba(0,0,0,.25)] lg:grid-cols-[330px_1fr]">
        <aside className="border-b border-white/[0.07] bg-[#0a101c] lg:border-b-0 lg:border-r lg:border-white/[0.07]">
          <div className="p-4"><p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Conversations</p></div>
          {conversations.length ? conversations.map((conversation) => {
            const ownerId = conversation.owner?._id || conversation.owner?.id
            const other = ownerId === user?.id ? conversation.renter : conversation.owner
            return (
              <button key={conversation._id} onClick={() => setSelected(conversation._id)} className={`flex w-full gap-3 border-t border-white/[0.05] p-4 text-left transition ${active === conversation._id ? 'bg-cyan-300/[0.07]' : 'hover:bg-white/[0.035]'}`}>
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-100 ring-1 ring-white/10">{other?.avatar?.url ? <img src={other.avatar.url} alt="" className="h-full w-full object-cover" /> : other?.name?.[0] || 'U'}</div>
                <div className="min-w-0"><p className="truncate text-sm font-black text-white">{other?.name || 'Rental conversation'}</p><p className="truncate text-xs text-slate-500">{conversation.property?.title}</p><p className="mt-1 truncate text-xs text-slate-400">{conversation.lastMessage?.body || 'Start the conversation'}</p></div>
                {conversation.unreadCount > 0 && <span className="ml-auto self-start rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 px-2 py-1 text-[9px] font-black text-[#07101e]">{conversation.unreadCount}</span>}
              </button>
            )
          }) : <div className="p-4"><EmptyState title="No conversations" text="Open a property and message its owner to start one." /></div>}
        </aside>

        <section className="flex min-h-[500px] flex-col bg-[radial-gradient(circle_at_60%_0%,rgba(56,189,248,.05),transparent_32%),#0b111e]">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {active ? (messageData?.messages || []).map((message) => {
              const senderId = message.sender?._id || message.sender?.id
              const mine = senderId === user?.id
              return <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] rounded-[22px] px-4 py-3 text-sm leading-6 ${mine ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-[#07101e]' : 'border border-white/[0.07] bg-white/[0.045] text-slate-200 shadow-sm'}`}>{message.body}<p className={`mt-1 text-[9px] ${mine ? 'text-[#07101e]/55' : 'text-slate-500'}`}>{dateTime(message.createdAt)}</p></div></div>
            }) : <EmptyState title="Choose a conversation" />}
          </div>
          {active && <form onSubmit={submit} className="flex gap-2 border-t border-white/[0.07] bg-[#0a101c] p-4"><TextInput value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} placeholder="Write a message…" /><PrimaryButton disabled={sendState.isLoading} aria-label="Send"><Send className="h-4 w-4" /></PrimaryButton></form>}
        </section>
      </motion.div>
    </>
  )
}

export function AgreementsPage() {
  const { data, isLoading } = useGetAgreementsQuery()
  const [signAgreement] = useSignAgreementMutation()
  const [active, setActive] = useState(null)
  const [legalName, setLegalName] = useState('')
  const user = useSelector((state) => state.auth.user)

  const submit = async () => {
    try {
      await signAgreement({ id: active._id, legalName }).unwrap()
      toast.success('Agreement accepted')
      setActive(null)
      setLegalName('')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  if (isLoading) return <LoadingState />
  const items = data?.agreements || []

  return (
    <>
      <PageHeader eyebrow="Electronic acceptance" title="Rental agreements" text="Review tenancy terms and explicitly accept them using your legal name. This is electronic acceptance, not a cryptographic digital signature." />
      <div className="space-y-4">
        {items.length ? items.map((agreement) => {
          const ownerId = agreement.owner?._id || agreement.owner?.id || agreement.owner
          const isOwner = String(ownerId) === String(user?.id)
          const mySignature = isOwner ? agreement.ownerSignature : agreement.renterSignature
          return (
            <Panel key={agreement._id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <StatusBadge value={agreement.status} />
                  <h2 className="mt-3 text-lg font-black text-white">{agreement.property?.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{money(agreement.monthlyRent)}/month · {agreement.durationMonths} months · starts {shortDate(agreement.startDate)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">{(agreement.clauses || []).map((clause, index) => <p key={`${agreement._id}-${index}`} className={`${glass} p-3`}><span className="font-black text-cyan-300">{index + 1}.</span> {clause}</p>)}</div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">Owner: {agreement.ownerSignature?.signed ? 'signed' : 'awaiting'}</span><span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">Renter: {agreement.renterSignature?.signed ? 'signed' : 'awaiting'}</span></div>
                </div>
                {!mySignature?.signed && agreement.status !== 'cancelled' && <PrimaryButton onClick={() => setActive(agreement)}>Review & accept</PrimaryButton>}
              </div>
            </Panel>
          )
        }) : <EmptyState title="No agreements yet" />}
      </div>
      <Modal open={Boolean(active)} onClose={() => setActive(null)} title="Accept rental agreement"><p className="mb-4 text-sm leading-6 text-slate-400">By continuing you confirm that you reviewed the displayed terms and explicitly accept this rental agreement.</p><TextInput value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Your legal name" /><PrimaryButton className="mt-4 w-full" onClick={submit}>I accept this agreement</PrimaryButton></Modal>
    </>
  )
}

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
      <PageHeader eyebrow="Reputation" title="Reviews" text="Reviews unlock only after a tenancy has ended, keeping feedback tied to a real rental relationship." action={<PrimaryButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Write review</PrimaryButton>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel><h2 className="font-black text-white">Written by you</h2><div className="mt-4 space-y-3">{mine?.reviews?.length ? mine.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.property?.title}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-500">No reviews written yet.</p>}</div></Panel>
        <Panel><h2 className="font-black text-white">Received</h2><div className="mt-4 space-y-3">{received?.reviews?.length ? received.reviews.map((review) => <div key={review._id} className={`${glass} p-4`}><div className="flex items-center justify-between"><strong className="text-sm text-white">{review.reviewer?.name}</strong><span className="text-amber-300">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-400">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-500">No reviews received yet.</p>}</div></Panel>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Write a review"><div className="space-y-3"><Select value={form.tenancyId} onChange={(event) => setForm({ ...form, tenancyId: event.target.value })}><option value="">Choose ended tenancy</option>{tenancies.filter((tenancy) => tenancy.status === 'ended').map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title}</option>)}</Select><Select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</Select><TextArea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Share your experience" /><PrimaryButton className="w-full" onClick={submit}>Submit review</PrimaryButton></div></Modal>
    </>
  )
}

export function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 50 }, { pollingInterval: 20000 })
  const [read] = useMarkNotificationReadMutation()
  const [readAll] = useMarkAllNotificationsReadMutation()
  const [remove] = useDeleteNotificationMutation()
  if (isLoading) return <LoadingState />
  const items = data?.notifications || []

  return (
    <>
      <PageHeader eyebrow="Activity centre" title="Notifications" text="Important rental lifecycle updates land here." action={<SecondaryButton onClick={() => readAll()}>Mark all read</SecondaryButton>} />
      <div className="space-y-3">{items.length ? items.map((notification, index) => <motion.div key={notification._id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .025 }}><Panel className={!notification.isRead ? 'border-cyan-300/20 bg-cyan-300/[0.035]' : ''}><div className="flex gap-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${notification.isRead ? 'bg-white/[0.04] text-slate-500' : 'bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15'}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{notification.title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{notification.message}</p><p className="mt-2 text-[10px] font-bold text-slate-500">{dateTime(notification.createdAt)}</p></div><button onClick={() => remove(notification._id)} className="text-slate-600 transition hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>{!notification.isRead && <button onClick={() => read(notification._id)} className="mt-3 text-xs font-black text-cyan-300">Mark read</button>}</div></div></Panel></motion.div>) : <EmptyState title="You're all caught up" />}</div>
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

export function OwnerVerificationPage() {
  const { data, isLoading } = useGetMyVerificationQuery()
  const [submit, submitState] = useSubmitVerificationMutation()
  const [form, setForm] = useState({ cnicLast4: '', cnicFront: null, cnicBack: null, selfie: null })
  if (isLoading) return <LoadingState />
  const current = data?.verification
  const canSubmit = !current || ['rejected','resubmission_required'].includes(current.status)
  const send = async () => { try { await submit(form).unwrap(); toast.success('Verification submitted') } catch (error) { toast.error(errorMessage(error)) } }

  return (
    <>
      <PageHeader eyebrow="Trust & safety" title="Owner verification" text="Identity verification is required before listing a property. Documents are private and reviewed by administrators." />
      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <Panel>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><ShieldCheck className="h-6 w-6" /></div>
          <h2 className="mt-5 text-xl font-black text-white">Verification status</h2>
          <div className="mt-3"><StatusBadge value={data?.ownerVerified ? 'verified' : current?.status || 'not_submitted'} /></div>
          {current?.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4 text-sm text-rose-300">{current.rejectionReason}</p>}
          {current && <p className="mt-4 text-xs text-slate-500">Attempt #{current.attemptNumber} · submitted {shortDate(current.submittedAt)}</p>}
        </Panel>
        <Panel>
          <h2 className="font-black text-white">{canSubmit ? 'Submit identity documents' : data?.ownerVerified ? 'Identity verified' : 'Under review'}</h2>
          {canSubmit ? <div className="mt-5 space-y-4"><TextInput maxLength={4} inputMode="numeric" value={form.cnicLast4} onChange={(event) => setForm({ ...form, cnicLast4: event.target.value.replace(/\D/g,'') })} placeholder="Last 4 CNIC digits" />{[['cnicFront','CNIC front'],['cnicBack','CNIC back'],['selfie','Selfie']].map(([key,label]) => <label key={key} className="block rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm font-bold text-slate-300 transition hover:border-cyan-300/25">{label}<input type="file" accept="image/png,image/jpeg" className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300/10 file:px-3 file:py-2 file:font-bold file:text-cyan-200" onChange={(event) => setForm({ ...form, [key]: event.target.files?.[0] || null })} /></label>)}<PrimaryButton disabled={submitState.isLoading || form.cnicLast4.length !== 4 || !form.cnicFront || !form.cnicBack || !form.selfie} className="w-full" onClick={send}>Submit for review</PrimaryButton></div> : <p className="mt-4 text-sm leading-6 text-slate-400">{data?.ownerVerified ? 'You can now create and submit property listings.' : 'Your documents are waiting for an administrator decision.'}</p>}
        </Panel>
      </div>
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
