import { useEffect, useMemo, useState } from 'react'
import { Bell, FileCheck2, Plus, Send, ShieldCheck, Star, Trash2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '../../features/messages/messagesApi'
import { useGetAgreementsQuery, useSignAgreementMutation } from '../../features/agreements/agreementsApi'
import {
  useConfirmConditionReportMutation,
  useCreateConditionReportMutation,
  useGetConditionReportsQuery,
  useUploadConditionEvidenceMutation,
} from '../../features/conditionReports/conditionReportsApi'
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
      <div className="grid min-h-[620px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm lg:grid-cols-[330px_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="p-4"><p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">Conversations</p></div>
          {conversations.length ? conversations.map((conversation) => {
            const ownerId = conversation.owner?._id || conversation.owner?.id
            const other = ownerId === user?.id ? conversation.renter : conversation.owner
            return (
              <button key={conversation._id} onClick={() => setSelected(conversation._id)} className={`flex w-full gap-3 border-t border-slate-100 p-4 text-left ${active === conversation._id ? 'bg-[#edf5f1]' : 'hover:bg-slate-50'}`}>
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 font-black">{other?.avatar?.url ? <img src={other.avatar.url} alt="" className="h-full w-full object-cover" /> : other?.name?.[0] || 'U'}</div>
                <div className="min-w-0"><p className="truncate text-sm font-black">{other?.name || 'Rental conversation'}</p><p className="truncate text-xs text-slate-400">{conversation.property?.title}</p><p className="mt-1 truncate text-xs text-slate-500">{conversation.lastMessage?.body || 'Start the conversation'}</p></div>
                {conversation.unreadCount > 0 && <span className="ml-auto self-start rounded-full bg-rose-500 px-2 py-1 text-[9px] font-black text-white">{conversation.unreadCount}</span>}
              </button>
            )
          }) : <div className="p-4"><EmptyState title="No conversations" text="Open a property and message its owner to start one." /></div>}
        </aside>
        <section className="flex min-h-[500px] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8faf9] p-5">
            {active ? (messageData?.messages || []).map((message) => {
              const senderId = message.sender?._id || message.sender?.id
              const mine = senderId === user?.id
              return <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] rounded-[22px] px-4 py-3 text-sm leading-6 ${mine ? 'bg-[#102f26] text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>{message.body}<p className={`mt-1 text-[9px] ${mine ? 'text-white/40' : 'text-slate-400'}`}>{dateTime(message.createdAt)}</p></div></div>
            }) : <EmptyState title="Choose a conversation" />}
          </div>
          {active && <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-4"><TextInput value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} placeholder="Write a message…" /><PrimaryButton disabled={sendState.isLoading} aria-label="Send"><Send className="h-4 w-4" /></PrimaryButton></form>}
        </section>
      </div>
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
      setActive(null); setLegalName('')
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
                <div><StatusBadge value={agreement.status} /><h2 className="mt-3 text-lg font-black">{agreement.property?.title}</h2><p className="mt-1 text-sm text-slate-500">{money(agreement.monthlyRent)}/month · {agreement.durationMonths} months · starts {shortDate(agreement.startDate)}</p><div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">{(agreement.clauses || []).map((clause, index) => <p key={`${agreement._id}-${index}`} className="rounded-2xl bg-slate-50 p-3"><span className="font-black text-emerald-700">{index + 1}.</span> {clause}</p>)}</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-600">Owner: {agreement.ownerSignature?.signed ? 'signed' : 'awaiting'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-600">Renter: {agreement.renterSignature?.signed ? 'signed' : 'awaiting'}</span></div></div>
                {!mySignature?.signed && agreement.status !== 'cancelled' && <PrimaryButton onClick={() => setActive(agreement)}>Review & accept</PrimaryButton>}
              </div>
            </Panel>
          )
        }) : <EmptyState title="No agreements yet" />}
      </div>
      <Modal open={Boolean(active)} onClose={() => setActive(null)} title="Accept rental agreement"><p className="mb-4 text-sm leading-6 text-slate-500">By continuing you confirm that you reviewed the displayed terms and explicitly accept this rental agreement.</p><TextInput value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Your legal name" /><PrimaryButton className="mt-4 w-full" onClick={submit}>I accept this agreement</PrimaryButton></Modal>
    </>
  )
}

export function ConditionReportsPage({ owner = false }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const requestedTenancy = params.get('tenancy')
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const tenancies = owner ? ownedTenancies.data?.tenancies || [] : myTenancies.data?.tenancies || []
  const [tenancyId, setTenancyId] = useState(requestedTenancy || '')
  const selected = tenancyId || requestedTenancy || tenancies[0]?._id
  const { data, isLoading, refetch } = useGetConditionReportsQuery(selected, { skip: !selected })
  const [create] = useCreateConditionReportMutation()
  const [confirm] = useConfirmConditionReportMutation()
  const [upload] = useUploadConditionEvidenceMutation()
  const [type, setType] = useState('move_in')
  const [items, setItems] = useState([{ area: 'Living area', condition: 'good', notes: '' }])
  const [overallNotes, setOverallNotes] = useState('')

  const addItem = () => setItems((current) => [...current, { area: '', condition: 'good', notes: '' }])
  const updateItem = (index, key, value) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  const removeItem = (index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))

  const submit = async () => {
    try {
      await create({ tenancyId: selected, reportType: type, items: items.filter((item) => item.area.trim()), overallNotes }).unwrap()
      toast.success('Condition report created')
      refetch()
    } catch (error) { toast.error(errorMessage(error)) }
  }

  return (
    <>
      <PageHeader eyebrow="Property condition" title="Condition reports" text="Create move-in and move-out records, attach private evidence and confirm the shared record." action={tenancies.length ? <Select value={selected || ''} onChange={(event) => setTenancyId(event.target.value)}>{tenancies.map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title}</option>)}</Select> : null} />
      {!selected ? <EmptyState title="No tenancy available" /> : <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Panel><h2 className="font-black">Create report</h2><div className="mt-4 space-y-3"><Select value={type} onChange={(event) => setType(event.target.value)}><option value="move_in">Move in</option><option value="move_out">Move out</option></Select>{items.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-2"><TextInput value={item.area} onChange={(event) => updateItem(index, 'area', event.target.value)} placeholder="Area / room" /><Select value={item.condition} onChange={(event) => updateItem(index, 'condition', event.target.value)}>{['excellent','good','fair','poor','damaged'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select></div><TextArea className="mt-2 min-h-20" value={item.notes} onChange={(event) => updateItem(index, 'notes', event.target.value)} placeholder="Notes" />{items.length > 1 && <button onClick={() => removeItem(index)} className="mt-2 text-xs font-black text-rose-600">Remove item</button>}</div>)}<SecondaryButton onClick={addItem}><Plus className="h-4 w-4" /> Add area</SecondaryButton><TextArea value={overallNotes} onChange={(event) => setOverallNotes(event.target.value)} placeholder="Overall notes" /><PrimaryButton className="w-full" onClick={submit}>Create condition report</PrimaryButton></div></Panel>
        <div className="space-y-4">{isLoading ? <LoadingState /> : (data?.reports || []).length ? data.reports.map((report) => <Panel key={report._id}><div className="flex items-start justify-between gap-4"><div><StatusBadge value={report.status} /><h3 className="mt-2 font-black">{pretty(report.reportType)} report</h3></div>{report.status !== 'confirmed' && <SecondaryButton onClick={async () => { try { await confirm(report._id).unwrap(); toast.success('Report confirmed'); refetch() } catch (error) { toast.error(errorMessage(error)) } }}>Confirm my side</SecondaryButton>}</div><div className="mt-4 space-y-2">{report.items?.map((item) => <div key={item._id || item.area} className="rounded-2xl bg-slate-50 p-3 text-sm"><strong>{item.area}</strong><span className="ml-2 text-slate-500">{pretty(item.condition)}</span>{item.notes && <p className="mt-1 text-slate-500">{item.notes}</p>}</div>)}</div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400"><span>Owner {report.ownerConfirmation?.confirmed ? '✓ confirmed' : 'awaiting'}</span><span>Renter {report.renterConfirmation?.confirmed ? '✓ confirmed' : 'awaiting'}</span><span>{report.evidence?.length || 0} evidence file(s)</span></div>{report.status !== 'confirmed' && !report.ownerConfirmation?.confirmed && !report.renterConfirmation?.confirmed && <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-black text-emerald-700">Add evidence<input type="file" accept="image/png,image/jpeg" multiple className="hidden" onChange={async (event) => { const files = [...event.target.files]; if (!files.length) return; try { await upload({ id: report._id, files }).unwrap(); toast.success('Evidence uploaded'); refetch() } catch (error) { toast.error(errorMessage(error)) } }} /></label>}</Panel>) : <EmptyState title="No condition reports yet" />}</div>
      </div>}
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
        <Panel><h2 className="font-black">Written by you</h2><div className="mt-4 space-y-3">{mine?.reviews?.length ? mine.reviews.map((review) => <div key={review._id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><strong className="text-sm">{review.property?.title}</strong><span className="text-amber-500">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-500">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-400">No reviews written yet.</p>}</div></Panel>
        <Panel><h2 className="font-black">Received</h2><div className="mt-4 space-y-3">{received?.reviews?.length ? received.reviews.map((review) => <div key={review._id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><strong className="text-sm">{review.reviewer?.name}</strong><span className="text-amber-500">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-slate-500">{review.comment || 'No written comment'}</p></div>) : <p className="text-sm text-slate-400">No reviews received yet.</p>}</div></Panel>
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
  return <><PageHeader eyebrow="Activity centre" title="Notifications" text="Important rental lifecycle updates land here." action={<SecondaryButton onClick={() => readAll()}>Mark all read</SecondaryButton>} /><div className="space-y-3">{items.length ? items.map((notification) => <Panel key={notification._id} className={!notification.isRead ? 'ring-2 ring-emerald-100' : ''}><div className="flex gap-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${notification.isRead ? 'bg-slate-100 text-slate-500' : 'bg-[#e8f2ed] text-emerald-700'}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{notification.title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{notification.message}</p><p className="mt-2 text-[10px] font-bold text-slate-400">{dateTime(notification.createdAt)}</p></div><button onClick={() => remove(notification._id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></div>{!notification.isRead && <button onClick={() => read(notification._id)} className="mt-3 text-xs font-black text-emerald-700">Mark read</button>}</div></div></Panel>) : <EmptyState title="You're all caught up" />}</div></>
}

export function ProfilePage() {
  const user = useSelector((state) => state.auth.user)
  const { data: verification } = useGetMyVerificationQuery()
  return <><PageHeader eyebrow="Account" title="Your profile" text="Your authenticated identity and verification state used across the rental platform." /><div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><Panel><div className="flex items-center gap-4">{user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-20 w-20 rounded-[24px] object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-[#e8f2ed] text-2xl font-black text-[#245545]">{user?.name?.[0]}</div>}<div><h2 className="text-xl font-black">{user?.name}</h2><p className="text-sm text-slate-500">{user?.email}</p></div></div><div className="mt-6 flex flex-wrap gap-2"><StatusBadge value={user?.emailVerified ? 'verified' : 'pending'} /><StatusBadge value={user?.accountStatus || 'active'} /></div></Panel><Panel><h2 className="font-black">Account details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Email',user?.email],['Phone',user?.phone || 'Not provided'],['Role',pretty(user?.role)],['Owner verification',verification?.ownerVerified ? 'Verified owner' : pretty(verification?.verification?.status || 'Not submitted')],['Account created',shortDate(user?.createdAt)],['Phone status',user?.phoneVerified ? 'Verified' : 'Not verified']].map(([label,value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-400">Profile editing is not exposed by the current backend API, so this screen intentionally presents verified account data without fake edit controls.</p></Panel></div></>
}

export function ReportsPage() {
  const { data } = useGetMyReportsQuery()
  const [create] = useCreateReportMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ targetType: 'property', targetId: '', reason: 'misleading_listing', description: '' })
  const submit = async () => { try { await create(form).unwrap(); toast.success('Report submitted'); setOpen(false) } catch (error) { toast.error(errorMessage(error)) } }
  return <><PageHeader eyebrow="Safety" title="Your reports" text="Report a property or user for review by platform administrators." action={<PrimaryButton onClick={() => setOpen(true)}>New report</PrimaryButton>} /><div className="space-y-3">{data?.reports?.length ? data.reports.map((report) => <Panel key={report._id}><div className="flex items-center justify-between gap-4"><div><StatusBadge value={report.status} /><p className="mt-2 font-black">{pretty(report.reason)}</p><p className="mt-1 text-sm text-slate-500">{report.property?.title || report.reportedUser?.name || pretty(report.targetType)}</p></div><ShieldCheck className="h-5 w-5 text-slate-400" /></div></Panel>) : <EmptyState title="No reports submitted" />}</div><Modal open={open} onClose={() => setOpen(false)} title="Submit a safety report"><div className="space-y-3"><Select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value })}><option value="property">Property</option><option value="user">User</option></Select><TextInput value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} placeholder="Target ID" /><Select value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}>{['fraud','misleading_listing','harassment','inappropriate_content','duplicate_listing','safety_concern','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the issue" /><PrimaryButton className="w-full" onClick={submit}>Submit report</PrimaryButton></div></Modal></>
}

export function OwnerVerificationPage() {
  const { data, isLoading } = useGetMyVerificationQuery()
  const [submit, submitState] = useSubmitVerificationMutation()
  const [form, setForm] = useState({ cnicLast4: '', cnicFront: null, cnicBack: null, selfie: null })
  if (isLoading) return <LoadingState />
  const current = data?.verification
  const canSubmit = !current || ['rejected','resubmission_required'].includes(current.status)
  const send = async () => { try { await submit(form).unwrap(); toast.success('Verification submitted') } catch (error) { toast.error(errorMessage(error)) } }
  return <><PageHeader eyebrow="Trust & safety" title="Owner verification" text="Identity verification is required before listing a property. Documents are private and reviewed by administrators." /><div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><Panel><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f2ed] text-emerald-700"><ShieldCheck className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-black">Verification status</h2><div className="mt-3"><StatusBadge value={data?.ownerVerified ? 'verified' : current?.status || 'not_submitted'} /></div>{current?.rejectionReason && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{current.rejectionReason}</p>}{current && <p className="mt-4 text-xs text-slate-400">Attempt #{current.attemptNumber} · submitted {shortDate(current.submittedAt)}</p>}</Panel><Panel><h2 className="font-black">{canSubmit ? 'Submit identity documents' : data?.ownerVerified ? 'Identity verified' : 'Under review'}</h2>{canSubmit ? <div className="mt-5 space-y-4"><TextInput maxLength={4} inputMode="numeric" value={form.cnicLast4} onChange={(event) => setForm({ ...form, cnicLast4: event.target.value.replace(/\D/g,'') })} placeholder="Last 4 CNIC digits" />{[['cnicFront','CNIC front'],['cnicBack','CNIC back'],['selfie','Selfie']].map(([key,label]) => <label key={key} className="block rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-600">{label}<input type="file" accept="image/png,image/jpeg" className="mt-2 block w-full text-xs" onChange={(event) => setForm({ ...form, [key]: event.target.files?.[0] || null })} /></label>)}<PrimaryButton disabled={submitState.isLoading || form.cnicLast4.length !== 4 || !form.cnicFront || !form.cnicBack || !form.selfie} className="w-full" onClick={send}>Submit for review</PrimaryButton></div> : <p className="mt-4 text-sm leading-6 text-slate-500">{data?.ownerVerified ? 'You can now create and submit property listings.' : 'Your documents are waiting for an administrator decision.'}</p>}</Panel></div></>
}

export function OwnerPropertiesPage() {
  const { data, isLoading } = useGetMyPropertiesQuery()
  const [submit] = useSubmitPropertyMutation()
  const [remove] = useDeletePropertyMutation()
  if (isLoading) return <LoadingState />
  const properties = data?.properties || []
  return <><PageHeader eyebrow="Portfolio" title="Your properties" text="Create, edit, upload images and submit listings for admin publication." action={<a href="/owner/properties/new" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#102f26] px-4 text-sm font-black text-white"><Plus className="h-4 w-4" /> Add property</a>} /><div className="grid gap-4 xl:grid-cols-2">{properties.length ? properties.map((property) => <Panel key={property._id}><div className="flex gap-4">{property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" className="h-24 w-28 rounded-2xl object-cover" /> : <div className="grid h-24 w-28 place-items-center rounded-2xl bg-slate-100"><FileCheck2 className="h-5 w-5 text-slate-300" /></div>}<div className="min-w-0 flex-1"><StatusBadge value={property.listingStatus} /><h2 className="mt-2 truncate font-black">{property.title}</h2><p className="mt-1 text-sm text-slate-500">{property.address?.area} · {money(property.monthlyRent)}</p></div></div>{property.rejectionReason && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{property.rejectionReason}</p>}<div className="mt-5 flex flex-wrap gap-2"><a href={`/owner/properties/${property._id}/edit`} className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black">Edit listing</a>{['draft','rejected'].includes(property.listingStatus) && <PrimaryButton onClick={async () => { try { await submit(property._id).unwrap(); toast.success('Property submitted for review') } catch (error) { toast.error(errorMessage(error)) } }}>Submit for review</PrimaryButton>}{property.listingStatus !== 'rented' && <SecondaryButton onClick={async () => { if (!window.confirm('Delete this property?')) return; try { await remove(property._id).unwrap(); toast.success('Property deleted') } catch (error) { toast.error(errorMessage(error)) } }}>Delete</SecondaryButton>}</div></Panel>) : <EmptyState title="No properties yet" text="Create your first property after owner verification is approved." />}</div></>
}
