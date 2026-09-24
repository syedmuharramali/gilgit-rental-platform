import { useState } from 'react'
import { Building2, CheckCircle2, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useGetAdminDashboardQuery,
  useGetAdminPropertiesQuery,
  useGetVerificationsQuery,
} from '../../features/admin/adminApi'
import { useGetAdminReportsQuery, useUpdateAdminReportMutation } from '../../features/reports/reportsApi'
import { EmptyState, LoadingState, PageHeader, Panel, PrimaryButton, SecondaryButton, Select, StatusBadge, TextArea, pretty } from '../../components/workspace/WorkspaceUI'

export function AdminGuard({ children }) {
  const user = useSelector((state) => state.auth.user)
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery()
  const { data: properties } = useGetAdminPropertiesQuery({ status: 'pending_review', limit: 5 })
  const { data: verifications } = useGetVerificationsQuery({ status: 'pending', limit: 5 })
  const { data: reports } = useGetAdminReportsQuery({ status: 'pending' })

  if (isLoading) return <LoadingState />
  if (isError) return <EmptyState title={t('admin.overviewError')} text={t('admin.overviewErrorText')} action={<SecondaryButton onClick={refetch}>{t('common.tryAgain')}</SecondaryButton>} />

  const cards = [
    [t('admin.cardProperties'), properties?.total || properties?.properties?.length || 0, Building2],
    [t('admin.cardVerifications'), verifications?.pagination?.total || verifications?.verifications?.length || 0, UsersRound],
    [t('admin.cardReports'), reports?.count || reports?.reports?.length || 0, TriangleAlert],
  ]

  return (
    <>
      <PageHeader eyebrow={t('admin.eyebrow')} title={t('admin.controlRoom')} text={t('admin.signedInAs', { name: data?.admin?.name || t('admin.administrator') })} />
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
            <p className="text-xs font-black uppercase tracking-[.17em] text-cyan-300">{t('admin.humanModeration')}</p>
            <h2 className="mt-2 text-xl font-black tracking-[-.035em] text-white">{t('admin.explicitTitle')}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{t('admin.explicitText')}</p>
          </div>
        </div>
      </Panel>
    </>
  )
}

export function AdminReportsPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const [status, setStatus] = useState('pending')
  const [notes, setNotes] = useState({})
  const { data, isLoading } = useGetAdminReportsQuery(status ? { status } : {})
  const [update] = useUpdateAdminReportMutation()
  if (isLoading) return <LoadingState />
  // Send notes only if they were edited here; sending '' for untouched notes erased what was already saved.
  const setReport = async (id, nextStatus) => { try { await update({ id, status: nextStatus, ...(notes[id] !== undefined && { adminNotes: notes[id] }) }).unwrap(); toast.success(t('admin.reportUpdated')) } catch (error) { toast.error(errorMessage(error)) } }
  return <><PageHeader eyebrow={t('ver.eyebrow')} title={t('admin.safetyReports')} text={t('admin.reportsText')} action={<Select value={status} onChange={(event) => setStatus(event.target.value)}>{['pending','under_review','resolved','dismissed'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select>} /><div className="space-y-4">{data?.reports?.length ? data.reports.map((report) => <Panel key={report._id}><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><div><div className="flex gap-2"><StatusBadge value={report.status} /><span className="text-xs font-black text-slate-400">{pretty(report.targetType)}</span></div><h2 className="mt-2 font-black text-white">{pretty(report.reason)}</h2><p className="mt-1 text-sm text-slate-400">{t('admin.reporter', { name: report.reporter?.name, target: report.property?.title || report.reportedUser?.name || t('admin.unknownTarget') })}</p>{report.description && <p className="mt-4 text-sm leading-6 text-slate-300">{report.description}</p>}</div><div><TextArea value={notes[report._id] ?? report.adminNotes ?? ''} onChange={(event) => setNotes({ ...notes, [report._id]: event.target.value })} placeholder={t('admin.adminNotes')} /><div className="mt-2 flex gap-2"><PrimaryButton onClick={() => setReport(report._id, 'resolved')}><CheckCircle2 className="h-4 w-4" /> {t('admin.resolve')}</PrimaryButton><SecondaryButton onClick={() => setReport(report._id, 'dismissed')}>{t('admin.dismiss')}</SecondaryButton></div></div></div></Panel>) : <EmptyState title={t('admin.noReports')} text={null} />}</div></>
}
