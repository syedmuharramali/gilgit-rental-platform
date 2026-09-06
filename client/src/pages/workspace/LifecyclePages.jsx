import { useState } from 'react'
import { Building2, ChevronRight, FileCheck2, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import {
  useAcceptApplicationMutation,
  useGetMyApplicationsQuery,
  useGetReceivedApplicationsQuery,
  useRejectApplicationMutation,
  useWithdrawApplicationMutation,
} from '../../features/applications/applicationsApi'
import {
  useCancelViewingMutation,
  useCompleteViewingMutation,
  useConfirmViewingMutation,
  useGetMyViewingsQuery,
  useGetReceivedViewingsQuery,
  useRejectViewingMutation,
} from '../../features/viewings/viewingsApi'
import {
  useCreateTenancyMutation,
  useEndTenancyMutation,
  useGetMyTenanciesQuery,
  useGetOwnedTenanciesQuery,
} from '../../features/tenancies/tenanciesApi'
import {
  useGenerateRentScheduleMutation,
  useGetMyRentRecordsQuery,
  useGetOwnedRentRecordsQuery,
  useRecordPaymentMutation,
} from '../../features/rent/rentApi'
import {
  useCancelMaintenanceMutation,
  useCreateMaintenanceMutation,
  useGetMyMaintenanceQuery,
  useGetReceivedMaintenanceQuery,
  useUpdateMaintenanceMutation,
} from '../../features/maintenance/maintenanceApi'
import { useCreateAgreementMutation } from '../../features/agreements/agreementsApi'
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

export function DashboardOverviewPage({ owner = false }) {
  const user = useSelector((state) => state.auth.user)
  const myApps = useGetMyApplicationsQuery(undefined, { skip: owner })
  const receivedApps = useGetReceivedApplicationsQuery(undefined, { skip: !owner })
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const myMaintenance = useGetMyMaintenanceQuery(undefined, { skip: owner })
  const receivedMaintenance = useGetReceivedMaintenanceQuery(undefined, { skip: !owner })

  const apps = owner ? receivedApps.data?.applications : myApps.data?.applications
  const tenancies = owner ? ownedTenancies.data?.tenancies : myTenancies.data?.tenancies
  const maintenance = owner ? receivedMaintenance.data?.requests : myMaintenance.data?.requests

  const cards = [
    ['Applications', apps?.length || 0, owner ? '/owner/applications' : '/dashboard/applications', FileCheck2],
    ['Active tenancies', (tenancies || []).filter((item) => item.status === 'active').length, owner ? '/owner/tenancies' : '/dashboard/tenancies', Building2],
    ['Maintenance', maintenance?.length || 0, owner ? '/owner/maintenance' : '/dashboard/maintenance', Wrench],
    [owner ? 'My properties' : 'Smart matches', owner ? 'Manage' : 'Explore', owner ? '/owner/properties' : '/matches', owner ? Building2 : Sparkles],
  ]

  return (
    <>
      <PageHeader
        eyebrow={owner ? 'Owner command centre' : 'Rental command centre'}
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}.`}
        text={owner ? 'Manage listings, renter requests, tenancy operations and property care from one connected workspace.' : 'Track everything from discovery to applications, tenancy, rent, agreements and property care.'}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, to, Icon]) => (
          <Link key={label} to={to}>
            <Panel className="h-full transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f2ed] text-[#245545]"><Icon className="h-5 w-5" /></div>
              <p className="mt-6 text-3xl font-black tracking-[-.05em]">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
            </Panel>
          </Link>
        ))}
      </div>
      <Panel className="mt-6 overflow-hidden bg-[#102f26] text-white">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Rental lifecycle</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Every next step stays connected.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Applications, viewings, agreements, rent records, condition reports, maintenance and reviews all connect back to the same property journey.</p>
          </div>
          <Link to={owner ? '/owner/properties' : '/properties'} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-[#102f26]">Continue <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </Panel>
    </>
  )
}

export function ApplicationsPage({ owner = false }) {
  const myQuery = useGetMyApplicationsQuery(undefined, { skip: owner })
  const receivedQuery = useGetReceivedApplicationsQuery(undefined, { skip: !owner })
  const query = owner ? receivedQuery : myQuery
  const [accept] = useAcceptApplicationMutation()
  const [reject] = useRejectApplicationMutation()
  const [withdraw] = useWithdrawApplicationMutation()
  const [createTenancy, createTenancyState] = useCreateTenancyMutation()
  const [tenancyApplication, setTenancyApplication] = useState(null)
  const [tenancyForm, setTenancyForm] = useState({ startDate: '', durationMonths: '', agreedMonthlyRent: '', securityDeposit: '' })

  const act = async (fn, payload, success) => {
    try {
      await fn(payload).unwrap()
      toast.success(success)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openTenancy = (application) => {
    setTenancyApplication(application)
    setTenancyForm({
      startDate: application.preferredMoveInDate?.slice(0, 10) || '',
      durationMonths: application.expectedStayMonths ? String(application.expectedStayMonths) : '',
      agreedMonthlyRent: application.property?.monthlyRent ? String(application.property.monthlyRent) : '',
      securityDeposit: '',
    })
  }

  const createFromApplication = async () => {
    try {
      await createTenancy({
        applicationId: tenancyApplication._id,
        ...(tenancyForm.startDate && { startDate: tenancyForm.startDate }),
        ...(tenancyForm.durationMonths && { durationMonths: Number(tenancyForm.durationMonths) }),
        ...(tenancyForm.agreedMonthlyRent && { agreedMonthlyRent: Number(tenancyForm.agreedMonthlyRent) }),
        ...(tenancyForm.securityDeposit && { securityDeposit: Number(tenancyForm.securityDeposit) }),
      }).unwrap()
      toast.success('Tenancy created')
      setTenancyApplication(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (query.isLoading) return <LoadingState />
  const items = query.data?.applications || []

  return (
    <>
      <PageHeader eyebrow={owner ? 'Owner inbox' : 'Your applications'} title="Rental applications" text={owner ? 'Review renter requests and move accepted applications into tenancy.' : 'Follow the status of every home you have applied for.'} />
      <div className="space-y-4">
        {items.length ? items.map((item) => (
          <Panel key={item._id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge value={item.status} /><span className="text-xs font-bold text-slate-400">{pretty(item.applicationType)}</span></div>
                <h2 className="mt-3 text-lg font-black">{item.property?.title || 'Property'}</h2>
                <p className="mt-1 text-sm text-slate-500">{owner ? `${item.applicant?.name || 'Applicant'} · ${item.applicant?.email || ''}` : `${item.property?.address?.area || ''} · ${money(item.property?.monthlyRent)}/month`}</p>
                {item.applicationType === 'group' && <p className="mt-2 text-xs font-bold text-violet-600">Group application · {(item.roommates?.length || 0) + 1} people</p>}
                {item.message && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{item.message}</p>}
                {item.rejectionReason && <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{item.rejectionReason}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {owner && item.status === 'pending' && <><PrimaryButton onClick={() => act(accept, item._id, 'Application accepted')}>Accept</PrimaryButton><SecondaryButton onClick={() => act(reject, { id: item._id, reason: 'Application was not selected at this time.' }, 'Application rejected')}>Reject</SecondaryButton></>}
                {owner && item.status === 'accepted' && <PrimaryButton onClick={() => openTenancy(item)}>Create tenancy</PrimaryButton>}
                {!owner && item.status === 'pending' && <SecondaryButton onClick={() => act(withdraw, item._id, 'Application withdrawn')}>Withdraw</SecondaryButton>}
              </div>
            </div>
          </Panel>
        )) : <EmptyState title="No applications yet" text={owner ? 'Applications for your published properties will appear here.' : 'Browse rentals and apply when you find the right home.'} />}
      </div>
      <Modal open={Boolean(tenancyApplication)} onClose={() => setTenancyApplication(null)} title="Create tenancy">
        <div className="space-y-3">
          <TextInput type="date" value={tenancyForm.startDate} onChange={(e) => setTenancyForm({ ...tenancyForm, startDate: e.target.value })} />
          <TextInput type="number" min="1" max="120" value={tenancyForm.durationMonths} onChange={(e) => setTenancyForm({ ...tenancyForm, durationMonths: e.target.value })} placeholder="Duration in months" />
          <TextInput type="number" min="0" value={tenancyForm.agreedMonthlyRent} onChange={(e) => setTenancyForm({ ...tenancyForm, agreedMonthlyRent: e.target.value })} placeholder="Agreed monthly rent" />
          <TextInput type="number" min="0" value={tenancyForm.securityDeposit} onChange={(e) => setTenancyForm({ ...tenancyForm, securityDeposit: e.target.value })} placeholder="Security deposit (optional)" />
          <PrimaryButton disabled={createTenancyState.isLoading} className="w-full" onClick={createFromApplication}>Create tenancy</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

export function ViewingsPage({ owner = false }) {
  const myQuery = useGetMyViewingsQuery(undefined, { skip: owner })
  const receivedQuery = useGetReceivedViewingsQuery(undefined, { skip: !owner })
  const query = owner ? receivedQuery : myQuery
  const [confirm] = useConfirmViewingMutation()
  const [reject] = useRejectViewingMutation()
  const [complete] = useCompleteViewingMutation()
  const [cancel] = useCancelViewingMutation()

  const act = async (fn, payload, success) => {
    try { await fn(payload).unwrap(); toast.success(success) } catch (error) { toast.error(errorMessage(error)) }
  }

  if (query.isLoading) return <LoadingState />
  const items = query.data?.viewings || []

  return (
    <>
      <PageHeader eyebrow="Visits" title={owner ? 'Viewing requests' : 'Your viewings'} text="Schedule and track in-person property visits without losing the conversation context." />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((item) => (
          <Panel key={item._id}>
            <div className="flex items-start justify-between gap-4"><div><StatusBadge value={item.status} /><h2 className="mt-3 font-black">{item.property?.title}</h2><p className="mt-1 text-sm text-slate-500">{dateTime(item.requestedDateTime)}</p>{owner && <p className="mt-2 text-sm font-bold text-slate-700">{item.renter?.name}</p>}</div><FileCheck2 className="h-5 w-5 text-emerald-700" /></div>
            {item.message && <p className="mt-4 text-sm leading-6 text-slate-600">{item.message}</p>}
            {item.ownerResponse && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Owner response: {item.ownerResponse}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {owner && item.status === 'requested' && <><PrimaryButton onClick={() => act(confirm, { id: item._id, ownerResponse: 'Viewing confirmed. See you at the requested time.' }, 'Viewing confirmed')}>Confirm</PrimaryButton><SecondaryButton onClick={() => act(reject, { id: item._id, ownerResponse: 'Unable to host this viewing time.' }, 'Viewing rejected')}>Reject</SecondaryButton></>}
              {owner && item.status === 'confirmed' && <PrimaryButton onClick={() => act(complete, item._id, 'Viewing completed')}>Mark completed</PrimaryButton>}
              {!owner && ['requested', 'confirmed'].includes(item.status) && <SecondaryButton onClick={() => act(cancel, item._id, 'Viewing cancelled')}>Cancel</SecondaryButton>}
            </div>
          </Panel>
        )) : <EmptyState title="No viewings yet" />}
      </div>
    </>
  )
}

export function TenanciesPage({ owner = false }) {
  const myQuery = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedQuery = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const query = owner ? ownedQuery : myQuery
  const [end] = useEndTenancyMutation()
  const [generate] = useGenerateRentScheduleMutation()
  const [createAgreement] = useCreateAgreementMutation()

  const act = async (fn, payload, success) => {
    try { await fn(payload).unwrap(); toast.success(success) } catch (error) { toast.error(errorMessage(error)) }
  }

  if (query.isLoading) return <LoadingState />
  const items = query.data?.tenancies || []

  return (
    <>
      <PageHeader eyebrow="Rental lifecycle" title={owner ? 'Managed tenancies' : 'My tenancy'} text="The tenancy is the centre of agreements, rent, condition reports, maintenance and post-tenancy reviews." />
      <div className="space-y-4">
        {items.length ? items.map((item) => (
          <Panel key={item._id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex gap-2"><StatusBadge value={item.status} /><span className="text-xs font-bold text-slate-400">{item.durationMonths} months</span></div>
                <h2 className="mt-3 text-xl font-black">{item.property?.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.property?.address?.area} · starts {shortDate(item.startDate)}</p>
                <div className="mt-5 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Monthly rent</p><strong className="text-sm">{money(item.agreedMonthlyRent)}</strong></div><div><p className="text-xs text-slate-400">Deposit</p><strong className="text-sm">{money(item.securityDeposit)}</strong></div><div><p className="text-xs text-slate-400">{owner ? 'Renter' : 'Owner'}</p><strong className="text-sm">{owner ? item.renter?.name : item.owner?.name}</strong></div></div>
              </div>
              <div className="flex flex-wrap gap-2 lg:max-w-56 lg:flex-col">
                {item.status === 'active' && owner && <><PrimaryButton onClick={() => act(generate, item._id, 'Rent schedule created')}>Generate rent ledger</PrimaryButton><SecondaryButton onClick={() => act(createAgreement, { tenancyId: item._id }, 'Agreement created')}>Create agreement</SecondaryButton><SecondaryButton onClick={() => act(end, { id: item._id, reason: 'Tenancy completed' }, 'Tenancy ended')}>End tenancy</SecondaryButton></>}
                <Link to={`${owner ? '/owner' : '/dashboard'}/condition-reports?tenancy=${item._id}`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black">Condition reports</Link>
              </div>
            </div>
          </Panel>
        )) : <EmptyState title="No tenancy records yet" />}
      </div>
    </>
  )
}

export function RentPage({ owner = false }) {
  const myQuery = useGetMyRentRecordsQuery(undefined, { skip: owner })
  const ownedQuery = useGetOwnedRentRecordsQuery(undefined, { skip: !owner })
  const query = owner ? ownedQuery : myQuery
  const [recordPayment] = useRecordPaymentMutation()
  const [payment, setPayment] = useState(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const submit = async () => {
    try {
      await recordPayment({ id: payment._id, amount: Number(amount), notes }).unwrap()
      toast.success('Payment recorded')
      setPayment(null); setAmount(''); setNotes('')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  if (query.isLoading) return <LoadingState />
  const records = query.data?.records || []
  const totals = records.reduce((acc, record) => ({ due: acc.due + Number(record.amountDue || 0), paid: acc.paid + Number(record.amountPaid || 0) }), { due: 0, paid: 0 })

  return (
    <>
      <PageHeader eyebrow="Financial record" title="Rent ledger" text="Manual payment records keep both parties aligned without pretending a payment gateway exists." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><Panel><p className="text-xs font-bold text-slate-400">Total scheduled</p><p className="mt-2 text-2xl font-black">{money(totals.due)}</p></Panel><Panel><p className="text-xs font-bold text-slate-400">Recorded paid</p><p className="mt-2 text-2xl font-black text-emerald-700">{money(totals.paid)}</p></Panel><Panel><p className="text-xs font-bold text-slate-400">Outstanding</p><p className="mt-2 text-2xl font-black text-amber-700">{money(totals.due - totals.paid)}</p></Panel></div>
      <div className="space-y-3">{records.length ? records.map((record) => <Panel key={record._id}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><StatusBadge value={record.status} /><span className="text-xs font-bold text-slate-400">{record.period}</span></div><p className="mt-2 font-black">{record.property?.title}</p><p className="mt-1 text-sm text-slate-500">Due {shortDate(record.dueDate)} · {money(record.amountPaid)} / {money(record.amountDue)}</p>{record.notes && <p className="mt-2 text-xs text-slate-400">{record.notes}</p>}</div>{owner && record.status !== 'paid' && <PrimaryButton onClick={() => { setPayment(record); setAmount(String(Number(record.amountDue) - Number(record.amountPaid))) }}>Record payment</PrimaryButton>}</div></Panel>) : <EmptyState title="No rent records yet" />}</div>
      <Modal open={Boolean(payment)} onClose={() => setPayment(null)} title="Record rent payment"><div className="space-y-4"><TextInput type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Payment amount" /><TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional payment note" /><PrimaryButton className="w-full" onClick={submit}>Save payment</PrimaryButton></div></Modal>
    </>
  )
}

export function MaintenancePage({ owner = false }) {
  const myQuery = useGetMyMaintenanceQuery(undefined, { skip: owner })
  const receivedQuery = useGetReceivedMaintenanceQuery(undefined, { skip: !owner })
  const query = owner ? receivedQuery : myQuery
  const { data: tenancyData } = useGetMyTenanciesQuery(undefined, { skip: owner })
  const [create] = useCreateMaintenanceMutation()
  const [update] = useUpdateMaintenanceMutation()
  const [cancel] = useCancelMaintenanceMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ tenancyId: '', title: '', description: '', category: 'other', priority: 'medium' })

  const submit = async () => {
    try { await create(form).unwrap(); toast.success('Maintenance request submitted'); setOpen(false) } catch (error) { toast.error(errorMessage(error)) }
  }

  if (query.isLoading) return <LoadingState />
  const items = query.data?.requests || []

  return (
    <>
      <PageHeader eyebrow="Property care" title="Maintenance" text={owner ? 'Track renter issues and keep each request moving toward resolution.' : 'Report an issue from an active tenancy and follow the owner response.'} action={!owner ? <PrimaryButton onClick={() => setOpen(true)}>New request</PrimaryButton> : null} />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((request) => (
          <Panel key={request._id}>
            <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><StatusBadge value={request.status} /><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">{pretty(request.priority)}</span></div><h2 className="mt-3 font-black">{request.title}</h2><p className="mt-1 text-xs text-slate-400">{request.property?.title} · {pretty(request.category)}</p></div><Wrench className="h-5 w-5 text-emerald-700" /></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{request.description}</p>
            {request.ownerResponse && <p className="mt-4 rounded-2xl bg-[#edf5f1] p-3 text-sm text-[#245545]"><strong>Owner:</strong> {request.ownerResponse}</p>}
            <div className="mt-5 flex gap-2">{owner && request.status !== 'resolved' && request.status !== 'cancelled' && <PrimaryButton onClick={async () => { try { await update({ id: request._id, status: request.status === 'pending' ? 'in_progress' : 'resolved', ownerResponse: request.status === 'pending' ? 'We are working on this request.' : 'This issue has been resolved.' }).unwrap(); toast.success('Maintenance updated') } catch (error) { toast.error(errorMessage(error)) } }}>{request.status === 'pending' ? 'Start work' : 'Resolve'}</PrimaryButton>}{!owner && request.status === 'pending' && <SecondaryButton onClick={async () => { try { await cancel(request._id).unwrap(); toast.success('Request cancelled') } catch (error) { toast.error(errorMessage(error)) } }}>Cancel</SecondaryButton>}</div>
          </Panel>
        )) : <EmptyState title="No maintenance requests" />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New maintenance request"><div className="space-y-3"><Select value={form.tenancyId} onChange={(event) => setForm({ ...form, tenancyId: event.target.value })}><option value="">Choose tenancy</option>{tenancyData?.tenancies?.filter((tenancy) => tenancy.status === 'active').map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title}</option>)}</Select><TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Issue title" /><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the problem" /><div className="grid grid-cols-2 gap-3"><Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['electricity','water','heating','plumbing','appliance','security','structural','internet','other'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['low','medium','high','urgent'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select></div><PrimaryButton className="w-full" onClick={submit}>Submit request</PrimaryButton></div></Modal>
    </>
  )
}
