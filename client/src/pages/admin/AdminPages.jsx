import { useState } from 'react'
import { Building2, CheckCircle2, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useApprovePropertyMutation,
  useApproveVerificationMutation,
  useGetAdminDashboardQuery,
  useGetAdminPropertiesQuery,
  useGetVerificationsQuery,
  useRejectPropertyMutation,
  useRejectVerificationMutation,
} from '../../features/admin/adminApi'
import { useGetAdminReportsQuery, useUpdateAdminReportMutation } from '../../features/reports/reportsApi'
import { EmptyState, LoadingState, PageHeader, Panel, PrimaryButton, SecondaryButton, Select, StatusBadge, TextArea, money, pretty, shortDate } from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

export function AdminGuard({ children }) {
  const user = useSelector((state) => state.auth.user)
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

export function AdminDashboardPage() {
  const { data, isLoading } = useGetAdminDashboardQuery()
  const { data: properties } = useGetAdminPropertiesQuery({ status: 'pending_review', limit: 5 })
  const { data: verifications } = useGetVerificationsQuery({ status: 'pending', limit: 5 })
  const { data: reports } = useGetAdminReportsQuery({ status: 'pending' })
  if (isLoading) return <LoadingState />
  const cards = [
    ['Property reviews', properties?.total || properties?.properties?.length || 0, Building2],
    ['Owner verifications', verifications?.pagination?.total || verifications?.verifications?.length || 0, UsersRound],
    ['Safety reports', reports?.count || reports?.reports?.length || 0, TriangleAlert],
  ]
  return <><PageHeader eyebrow="Administration" title="Platform control room" text={`Signed in as ${data?.admin?.name || 'administrator'}. Review the queues that require a human decision.`} /><div className="grid gap-4 md:grid-cols-3">{cards.map(([label, value, Icon]) => <Panel key={label}><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></Panel>)}</div><Panel className="mt-6 bg-[#102f26] text-white"><ShieldCheck className="h-7 w-7 text-emerald-300" /><h2 className="mt-4 text-xl font-black">Moderation stays explicit.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Owner identity, property publication and safety reports are separate review queues so each decision has a clear purpose and audit trail.</p></Panel></>
}

export function AdminPropertiesPage() {
  const [status, setStatus] = useState('pending_review')
  const { data, isLoading } = useGetAdminPropertiesQuery({ status, limit: 100 })
  const [approve] = useApprovePropertyMutation(); const [reject] = useRejectPropertyMutation()
  const action = async (fn, payload, success) => { try { await fn(payload).unwrap(); toast.success(success) } catch (e) { toast.error(errorMessage(e)) } }
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Moderation" title="Property review queue" text="Inspect owner submissions before they become visible to renters." action={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending_review">Pending review</option><option value="published">Published</option><option value="rejected">Rejected</option></Select>} /><div className="space-y-4">{data?.properties?.length ? data.properties.map((p) => <Panel key={p._id}><div className="grid gap-5 lg:grid-cols-[140px_1fr_auto] lg:items-center">{p.images?.[0]?.url ? <img src={p.images.find((i) => i.isCover)?.url || p.images[0].url} alt="" className="h-28 w-full rounded-2xl object-cover" /> : <div className="grid h-28 place-items-center rounded-2xl bg-slate-100"><Building2 className="text-slate-300" /></div>}<div><div className="flex flex-wrap gap-2"><StatusBadge value={p.listingStatus} /><span className="text-xs font-bold text-slate-400">{pretty(p.propertyType)}</span></div><h2 className="mt-2 text-lg font-black">{p.title}</h2><p className="mt-1 text-sm text-slate-500">{p.owner?.name} · {p.owner?.email} · {p.address?.area} · {money(p.monthlyRent)}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{p.description}</p></div>{p.listingStatus === 'pending_review' && <div className="flex gap-2 lg:flex-col"><PrimaryButton onClick={() => action(approve, p._id, 'Property approved')}>Approve</PrimaryButton><SecondaryButton onClick={() => action(reject, { id: p._id, reason: 'Listing needs changes before publication.' }, 'Property rejected')}>Reject</SecondaryButton></div>}</div></Panel>) : <EmptyState title="Queue is empty" />}</div></>
}

export function AdminVerificationsPage() {
  const [status, setStatus] = useState('pending')
  const { data, isLoading } = useGetVerificationsQuery({ status, limit: 100 })
  const [approve] = useApproveVerificationMutation(); const [reject] = useRejectVerificationMutation()
  const action = async (fn, payload, success) => { try { await fn(payload).unwrap(); toast.success(success) } catch (e) { toast.error(errorMessage(e)) } }
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Identity" title="Owner verification queue" text="Review identity submissions before users can publish rental listings." action={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Pending</option><option value="verified">Verified</option><option value="resubmission_required">Resubmission required</option><option value="rejected">Rejected</option></Select>} /><div className="space-y-4">{data?.verifications?.length ? data.verifications.map((v) => <Panel key={v._id}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge value={v.status} /><h2 className="mt-2 font-black">{v.user?.name}</h2><p className="mt-1 text-sm text-slate-500">{v.user?.email} · CNIC ending {v.cnicLast4} · attempt #{v.attemptNumber}</p><p className="mt-2 text-xs text-slate-400">Submitted {shortDate(v.submittedAt)}</p></div>{v.status === 'pending' && <div className="flex gap-2"><PrimaryButton onClick={() => action(approve, v._id, 'Owner verified')}>Approve</PrimaryButton><SecondaryButton onClick={() => action(reject, { id: v._id, reason: 'Please resubmit clearer identity images.', allowResubmission: true }, 'Resubmission requested')}>Request resubmission</SecondaryButton></div>}</div></Panel>) : <EmptyState title="No verification requests" />}</div></>
}

export function AdminReportsPage() {
  const [status, setStatus] = useState('pending'); const [notes, setNotes] = useState({})
  const { data, isLoading } = useGetAdminReportsQuery(status ? { status } : {})
  const [update] = useUpdateAdminReportMutation()
  if (isLoading) return <LoadingState />
  const setReport = async (id, nextStatus) => { try { await update({ id, status: nextStatus, adminNotes: notes[id] || '' }).unwrap(); toast.success('Report updated') } catch (e) { toast.error(errorMessage(e)) } }
  return <><PageHeader eyebrow="Trust & safety" title="Safety reports" text="Review user-submitted reports and record the moderation outcome." action={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Pending</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></Select>} /><div className="space-y-4">{data?.reports?.length ? data.reports.map((r) => <Panel key={r._id}><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><div><div className="flex gap-2"><StatusBadge value={r.status} /><span className="text-xs font-black text-slate-400">{pretty(r.targetType)}</span></div><h2 className="mt-2 font-black">{pretty(r.reason)}</h2><p className="mt-1 text-sm text-slate-500">Reporter: {r.reporter?.name} · target: {r.property?.title || r.reportedUser?.name || 'Unknown'}</p>{r.description && <p className="mt-4 text-sm leading-6 text-slate-600">{r.description}</p>}</div><div><TextArea value={notes[r._id] ?? r.adminNotes ?? ''} onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })} placeholder="Admin notes" /><div className="mt-2 flex gap-2"><PrimaryButton onClick={() => setReport(r._id, 'resolved')}><CheckCircle2 className="h-4 w-4" /> Resolve</PrimaryButton><SecondaryButton onClick={() => setReport(r._id, 'dismissed')}>Dismiss</SecondaryButton></div></div></div></Panel>) : <EmptyState title="No reports in this queue" />}</div></>
}
