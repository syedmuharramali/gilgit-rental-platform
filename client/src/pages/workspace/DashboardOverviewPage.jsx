import { Building2, ChevronRight, FileCheck2, Sparkles, Wrench } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetMyApplicationsQuery, useGetReceivedApplicationsQuery } from '../../features/applications/applicationsApi'
import { useGetAgreementsQuery } from '../../features/agreements/agreementsApi'
import { useGetMyTenanciesQuery, useGetOwnedTenanciesQuery } from '../../features/tenancies/tenanciesApi'
import { useGetMyMaintenanceQuery, useGetReceivedMaintenanceQuery } from '../../features/maintenance/maintenanceApi'
import { PageHeader, Panel, StatusBadge, shortDate } from '../../components/workspace/WorkspaceUI'

const visibleTenancies = (items = []) => items.filter((item) => item.status !== 'pending_agreement')

function DashboardOverviewPage({ owner = false }) {
  const user = useSelector((state) => state.auth.user)
  const myApps = useGetMyApplicationsQuery(undefined, { skip: owner })
  const receivedApps = useGetReceivedApplicationsQuery(undefined, { skip: !owner })
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const myMaintenance = useGetMyMaintenanceQuery(undefined, { skip: owner })
  const receivedMaintenance = useGetReceivedMaintenanceQuery(undefined, { skip: !owner })
  const { data: agreementData } = useGetAgreementsQuery()

  const applications = owner ? receivedApps.data?.applications || [] : myApps.data?.applications || []
  const tenancies = visibleTenancies(owner ? ownedTenancies.data?.tenancies || [] : myTenancies.data?.tenancies || [])
  const maintenance = owner ? receivedMaintenance.data?.requests || [] : myMaintenance.data?.requests || []
  const agreements = agreementData?.agreements || []

  const currentRental = tenancies.find((item) => item.status === 'active') || tenancies.find((item) => item.status === 'upcoming') || null
  const openMaintenance = maintenance.filter((item) => !['resolved', 'cancelled'].includes(item.status)).length
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
      label: owner ? 'Applications waiting' : 'Open applications',
      value: applicationCount,
      to: owner ? '/owner/applications' : '/dashboard/applications',
      Icon: FileCheck2,
    },
    {
      label: currentRental?.status === 'upcoming' ? 'Upcoming rental' : currentRental?.status === 'active' ? 'Active rental' : 'My rental',
      value: currentRental ? (currentRental.status === 'upcoming' ? shortDate(currentRental.startDate) : 'Active') : 'None',
      to: owner ? '/owner/tenancies' : '/dashboard/tenancies',
      Icon: Building2,
    },
    {
      label: 'Open maintenance',
      value: openMaintenance,
      to: owner ? '/owner/maintenance' : '/dashboard/maintenance',
      Icon: Wrench,
    },
    {
      label: owner ? 'My properties' : 'Smart matches',
      value: owner ? 'Manage' : 'Explore',
      to: owner ? '/owner/properties' : '/dashboard/matches',
      Icon: owner ? Building2 : Sparkles,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={owner ? 'Owner command centre' : 'Rental command centre'}
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}.`}
        text={owner
          ? 'See what needs your attention now, then move directly into the relevant part of the rental lifecycle.'
          : 'See your current rental status, applications and next actions without digging through every workspace tool.'}
      />

      {agreementNeedingMe && (
        <Panel className="mb-6 border-violet-300/15 bg-violet-300/[0.045]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge value={agreementNeedingMe.status} /><span className="text-xs font-black uppercase tracking-[.12em] text-violet-200">Needs your attention</span></div>
              <h2 className="mt-3 text-lg font-black text-white">Rental agreement waiting for your acceptance</h2>
              <p className="mt-1 text-sm text-slate-400">{agreementNeedingMe.property?.title || 'Rental property'} · review the agreement before the rental can be finalized.</p>
            </div>
            <Link to={owner ? '/owner/agreements' : '/dashboard/agreements'} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 text-sm font-black text-[#07101e]">Review agreement <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Panel>
      )}

      {currentRental && (
        <Panel className="mb-6 border-cyan-300/12 bg-cyan-300/[0.035]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge value={currentRental.status} /><span className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">Your rental</span></div>
              <h2 className="mt-3 text-xl font-black text-white">{currentRental.property?.title || 'Rental property'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{currentRental.status === 'upcoming' ? `Your agreement is complete and the rental is scheduled to begin on ${shortDate(currentRental.startDate)}.` : 'Your rental is active. Rent records, condition reports and maintenance now belong to this rental relationship.'}</p>
            </div>
            <Link to={owner ? '/owner/tenancies' : '/dashboard/tenancies'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:border-cyan-300/25">Open rental <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {!currentRental && !agreementNeedingMe && (
        <Panel className="relative mt-6 overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,.14),transparent_28%),linear-gradient(135deg,#0c1322,#11182a)]">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Next step</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{owner ? 'Keep your listings and renter requests moving.' : 'Keep looking for the right rental.'}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{owner ? 'Applications, agreements and property operations stay connected inside this workspace.' : 'Saved homes, smart matches, applications and messages stay connected to the same rental journey.'}</p>
            </div>
            <Link to={owner ? '/owner/properties' : '/properties'} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e] shadow-lg">Continue <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Panel>
      )}
    </>
  )
}

export default DashboardOverviewPage
