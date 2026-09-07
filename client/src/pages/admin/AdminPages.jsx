import { useState } from 'react'
import { Building2, CheckCircle2, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
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
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery()
  const { data: properties } = useGetAdminPropertiesQuery({ status: 'pending_review', limit: 5 })
  const { data: verifications } = useGetVerificationsQuery({ status: 'pending', limit: 5 })
  const { data: reports } = useGetAdminReportsQuery({ status: 'pending' })

  if (isLoading) return <LoadingState />
  if (isError) return <EmptyState title="Unable to load the admin overview" text="The moderation queues are still protected. Retry the dashboard request to refresh their current counts." action={<SecondaryButton onClick={refetch}>Try again</SecondaryButton>} />

  const cards = [
    ['Property reviews', properties?.total || properties?.properties?.length || 0, Building2],
    ['Owner verifications', verifications?.pagination?.total || verifications?.verifications?.length || 0, UsersRound],
    ['Safety reports', reports?.count || reports?.reports?.length || 0, TriangleAlert],
  ]

  return (
    <>
      <PageHeader eyebrow="Administration" title="Platform control room" text={`Signed in as ${data?.admin?.name || 'administrator'}. Review the queues that require a human decision.`} />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, value, Icon], index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }}>
            <Panel className="h-full overflow-hidden transition hover:border-cyan-300/20">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/14 to-violet-500/12 text-cyan-200"><Icon className="h-5 w-5" /></div>
                <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">0{index + 1}</span>
              </div>
              <p className="mt-7 text-3xl font-black tracking-[-.05em] text-white">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
              <div className="mt-5 h-px bg-gradient-to-r from-cyan-300/20 via-white/5 to-transparent" />
            </Panel>
          </motion.div>
        ))}
      </div>

      <Panel className="relative mt-6 overflow-hidden bg-[radial-gradient(circle_at_86%_18%,rgba(56,189,248,.15),transparent_30%),radial-gradient(circle_at_16%_85%,rgba(139,92,246,.10),transparent_28%),linear-gradient(135deg,#0b111f,#0d1423)]">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="grid h-14 w-14 place-items-center rounded-[20px] border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_18px_45px_rgba(0,0,0,.2)]"><ShieldCheck className="h-7 w-7" /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[.17em] text-cyan-300">Human moderation</p>
            <h2 className="mt-2 text-xl font-black tracking-[-.035em] text-white">Every trust decision stays explicit.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">Owner identity, property publication and safety reports remain separate review queues so each decision has a clear purpose, controlled access and audit trail.</p>
          </div>
        </div>
      </Panel>
    </>
  )
}

export function AdminPropertiesPage() {
  const [status, setStatus] = useState('pending_review')
  const { data, isLoading } = useGetAdminPropertiesQuery({ status, limit: 100 })
  const [approve] = useApprovePropertyMutation()
  const [reject] = useRejectPropertyMutation()
  const action = async (fn, payload, success) => { try { await fn(payload).unwrap(); toast.success(success) } catch (error) { toast.error(errorMessage(error)) } }
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Moderation" title="Property review queue" text="Inspect owner submissions before they become visible to renters." action={<Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending_review">Pending review</option><option value="published">Published</option><option value="rejected">Rejected</option></Select>} /><div className="space-y-4">{data?.properties?.length ? data.properties.map((property) => <Panel key={property._id}><div className="grid gap-5 lg:grid-cols-[140px_1fr_auto] lg:items-center">{property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" loading="lazy" decoding="async" className="h-28 w-full rounded-2xl object-cover" /> : <div className="grid h-28 place-items-center rounded-2xl bg-white/[0.04]"><Building2 className="text-slate-600" /></div>}<div><div className="flex flex-wrap gap-2"><StatusBadge value={property.listingStatus} /><span className="text-xs font-bold text-slate-400">{pretty(property.propertyType)}</span></div><h2 className="mt-2 text-lg font-black text-white">{property.title}</h2><p className="mt-1 text-sm text-slate-400">{property.owner?.name} · {property.owner?.email} · {property.address?.area} · {money(property.monthlyRent)}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{property.description}</p></div>{property.listingStatus === 'pending_review' && <div className="flex gap-2 lg:flex-col"><PrimaryButton onClick={() => action(approve, property._id, 'Property approved')}>Approve</PrimaryButton><SecondaryButton onClick={() => action(reject, { id: property._id, reason: 'Listing needs changes before publication.' }, 'Property rejected')}>Reject</SecondaryButton></div>}</div></Panel>) : <EmptyState title="Queue is empty" />}</div></>
}

export function AdminVerificationsPage() {
  const [status, setStatus] = useState('pending')
  const { data, isLoading } = useGetVerificationsQuery({ status, limit: 100 })
  const [approve] = useApproveVerificationMutation()
  const [reject] = useRejectVerificationMutation()
  const action = async (fn, payload, success) => { try { await fn(payload).unwrap(); toast.success(success) } catch (error) { toast.error(errorMessage(error)) } }
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Identity" title="Owner verification queue" text="Review identity submissions before users can publish rental listings." action={<Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="verified">Verified</option><option value="resubmission_required">Resubmission required</option><option value="rejected">Rejected</option></Select>} /><div className="space-y-4">{data?.verifications?.length ? data.verifications.map((verification) => <Panel key={verification._id}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge value={verification.status} /><h2 className="mt-2 font-black text-white">{verification.user?.name}</h2><p className="mt-1 text-sm text-slate-400">{verification.user?.email} · CNIC ending {verification.cnicLast4} · attempt #{verification.attemptNumber}</p><p className="mt-2 text-xs text-slate-500">Submitted {shortDate(verification.submittedAt)}</p></div>{verification.status === 'pending' && <div className="flex gap-2"><PrimaryButton onClick={() => action(approve, verification._id, 'Owner verified')}>Approve</PrimaryButton><SecondaryButton onClick={() => action(reject, { id: verification._id, reason: 'Please resubmit clearer identity images.', allowResubmission: true }, 'Resubmission requested')}>Request resubmission</SecondaryButton></div>}</div></Panel>) : <EmptyState title="No verification requests" />}</div></>
}

export function AdminReportsPage() {
  const [status, setStatus] = useState('pending')
  const [notes, setNotes] = useState({})
  const { data, isLoading } = useGetAdminReportsQuery(status ? { status } : {})
  const [update] = useUpdateAdminReportMutation()
  if (isLoading) return <LoadingState />
  const setReport = async (id, nextStatus) => { try { await update({ id, status: nextStatus, adminNotes: notes[id] || '' }).unwrap(); toast.success('Report updated') } catch (error) { toast.error(errorMessage(error)) } }
  return <><PageHeader eyebrow="Trust & safety" title="Safety reports" text="Review user-submitted reports and record the moderation outcome." action={<Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></Select>} /><div className="space-y-4">{data?.reports?.length ? data.reports.map((report) => <Panel key={report._id}><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><div><div className="flex gap-2"><StatusBadge value={report.status} /><span className="text-xs font-black text-slate-400">{pretty(report.targetType)}</span></div><h2 className="mt-2 font-black text-white">{pretty(report.reason)}</h2><p className="mt-1 text-sm text-slate-400">Reporter: {report.reporter?.name} · target: {report.property?.title || report.reportedUser?.name || 'Unknown'}</p>{report.description && <p className="mt-4 text-sm leading-6 text-slate-300">{report.description}</p>}</div><div><TextArea value={notes[report._id] ?? report.adminNotes ?? ''} onChange={(event) => setNotes({ ...notes, [report._id]: event.target.value })} placeholder="Admin notes" /><div className="mt-2 flex gap-2"><PrimaryButton onClick={() => setReport(report._id, 'resolved')}><CheckCircle2 className="h-4 w-4" /> Resolve</PrimaryButton><SecondaryButton onClick={() => setReport(report._id, 'dismissed')}>Dismiss</SecondaryButton></div></div></div></Panel>) : <EmptyState title="No reports in this queue" />}</div></>
}
