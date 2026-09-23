import { Building2, ChevronRight, FileCheck2, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetMyApplicationsQuery, useGetReceivedApplicationsQuery } from '../../features/applications/applicationsApi'
import { useGetAgreementsQuery } from '../../features/agreements/agreementsApi'
import { PageHeader, Panel, StatusBadge } from '../../components/workspace/WorkspaceUI'

function DashboardOverviewPage({ owner = false }) {
  const { t } = useTranslation()
  const user = useSelector((state) => state.auth.user)
  const myApps = useGetMyApplicationsQuery(undefined, { skip: owner })
  const receivedApps = useGetReceivedApplicationsQuery(undefined, { skip: !owner })
  const { data: agreementData } = useGetAgreementsQuery()

  const applications = owner ? receivedApps.data?.applications || [] : myApps.data?.applications || []
  const agreements = agreementData?.agreements || []

  const applicationCount = owner
    ? applications.filter((item) => item.status === 'pending').length
    : applications.filter((item) => ['pending', 'accepted'].includes(item.status)).length

  const agreementNeedingMe = agreements.find((agreement) => {
    if (agreement.status === 'executed' || agreement.status === 'cancelled') return false
    const signature = owner ? agreement.ownerSignature : agreement.renterSignature
    return !signature?.signed
  })

  const cards = [
    {
      label: owner ? t('overview.applicationsWaiting') : t('overview.openApplications'),
      value: applicationCount,
      to: owner ? '/owner/applications' : '/dashboard/applications',
      Icon: FileCheck2,
    },
    {
      label: t('overview.agreementsToReview'),
      value: agreements.filter((agreement) => agreement.status !== 'executed' && agreement.status !== 'cancelled').length,
      to: owner ? '/owner/agreements' : '/dashboard/agreements',
      Icon: FileCheck2,
    },
    {
      label: owner ? t('overview.myProperties') : t('ws.smartMatches'),
      value: owner ? t('overview.manage') : t('overview.explore'),
      to: owner ? '/owner/properties' : '/dashboard/matches',
      Icon: owner ? Building2 : Sparkles,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={owner ? t('overview.eyebrowOwner') : t('overview.eyebrowRenter')}
        title={t('overview.welcome', { name: user?.name?.split(' ')[0] || t('overview.there') })}
        text={owner ? t('overview.textOwner') : t('overview.textRenter')}
      />

      {agreementNeedingMe && (
        <Panel className="mb-6 border-violet-300/15 bg-violet-300/[0.045]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge value={agreementNeedingMe.status} /><span className="text-xs font-black uppercase tracking-[.12em] text-violet-200">{t('overview.needsAttention')}</span></div>
              <h2 className="mt-3 text-lg font-black text-white">{t('overview.agreementWaiting')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('overview.agreementWaitingText', { property: agreementNeedingMe.property?.title || t('overview.rentalProperty') })}</p>
            </div>
            <Link to={owner ? '/owner/agreements' : '/dashboard/agreements'} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 text-sm font-black text-[#07101e]">{t('overview.reviewAgreement')} <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, to, Icon }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -5 }}>
            <Link to={to}>
              <Panel className="group h-full overflow-hidden transition hover:border-cyan-300/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 text-cyan-200 ring-1 ring-white/10"><Icon className="h-5 w-5" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">0{index + 1}</span>
                </div>
                <p className="mt-7 truncate text-2xl font-black tracking-[-.04em] text-white">{value}</p>
                <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
                <div className="mt-5 h-px bg-gradient-to-r from-cyan-300/20 via-white/5 to-transparent" />
              </Panel>
            </Link>
          </motion.div>
        ))}
      </div>

      {!agreementNeedingMe && (
        <Panel className="relative mt-6 overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,.14),transparent_28%),linear-gradient(135deg,#0c1322,#11182a)]">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{t('overview.keepMoving')}</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{owner ? t('overview.keepMovingOwner') : t('overview.keepMovingRenter')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{owner ? t('overview.keepMovingOwnerText') : t('overview.keepMovingRenterText')}</p>
            </div>
            <Link to={owner ? '/owner/properties' : '/properties'} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e] shadow-lg">{t('overview.continue')} <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Panel>
      )}
    </>
  )
}

export default DashboardOverviewPage
