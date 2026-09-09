import { Building2, ClipboardCheck, MessageCircle, Star, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useEndTenancyMutation,
  useGetMyTenanciesQuery,
  useGetOwnedTenanciesQuery,
} from '../../features/tenancies/tenanciesApi'
import { useGenerateRentScheduleMutation } from '../../features/rent/rentApi'
import {
  EmptyState,
  LoadingState,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  money,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

function TenanciesPage({ owner = false }) {
  const myQuery = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedQuery = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const query = owner ? ownedQuery : myQuery
  const [endTenancy, endState] = useEndTenancyMutation()
  const [generateRentSchedule, generateState] = useGenerateRentScheduleMutation()

  if (query.isLoading) return <LoadingState />

  const items = query.data?.tenancies || []
  const base = owner ? '/owner' : '/dashboard'

  const generateLedger = async (id) => {
    try {
      await generateRentSchedule(id).unwrap()
      toast.success('Rent schedule created')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const endRental = async (id) => {
    const confirmed = window.confirm(
      'End this rental? A move-out condition report must already be confirmed by both parties before the rental can end.'
    )
    if (!confirmed) return

    try {
      await endTenancy({ id, reason: 'Tenancy completed' }).unwrap()
      toast.success('Tenancy ended. Reviews are now available to both parties.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rental lifecycle"
        title={owner ? 'Managed rentals' : 'My rental'}
        text={owner
          ? 'Manage each rental from agreement completion through rent, condition reports, maintenance, move-out and reviews.'
          : 'Your rental stays here from move-in through rent records, condition reports, maintenance, move-out and reviews.'}
      />

      <div className="space-y-4">
        {items.length ? items.map((item) => (
          <Panel key={item._id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.status} />
                  <span className="text-xs font-bold text-slate-500">{item.durationMonths} months</span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-white">{item.property?.title || 'Rental property'}</h2>
                    <p className="mt-1 text-sm text-slate-400">{item.property?.address?.area || ''} · starts {shortDate(item.startDate)}</p>
                  </div>
                </div>

                <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ['Monthly rent', money(item.agreedMonthlyRent)],
                    ['Deposit', money(item.securityDeposit)],
                    [owner ? 'Renter' : 'Owner', owner ? item.renter?.name : item.owner?.name],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                      <p className="text-xs text-slate-500">{label}</p>
                      <strong className="mt-1 block text-sm text-white">{value || '—'}</strong>
                    </div>
                  ))}
                </div>

                {item.status === 'upcoming' && (
                  <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.045] p-4 text-sm leading-6 text-violet-100/85">
                    The agreement is complete. This rental becomes active when the agreed move-in date arrives. Rent, condition reports and maintenance unlock after activation.
                  </div>
                )}

                {item.status === 'active' && (
                  <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 text-sm leading-6 text-cyan-100/85">
                    This rental is active. Keep the shared rental record up to date with rent entries, condition reports and maintenance. Before ending the rental, create a move-out condition report and have both parties confirm it.
                  </div>
                )}

                {item.status === 'ended' && (
                  <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-4 text-sm leading-6 text-emerald-100/85">
                    This rental has ended. Its history remains available, and both parties can now leave a review based on the completed rental relationship.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-64 lg:flex-col">
                <Link to={`${base}/agreements`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                  View agreement
                </Link>

                {item.status !== 'upcoming' && (
                  <Link to={`${base}/condition-reports?tenancy=${item._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                    <ClipboardCheck className="h-4 w-4" /> Condition reports
                  </Link>
                )}

                {item.status === 'active' && (
                  <>
                    <Link to={`${base}/rent`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                      Rent ledger
                    </Link>
                    <Link to={`${base}/maintenance`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                      <Wrench className="h-4 w-4" /> Maintenance
                    </Link>
                    <Link to={`${base}/messages`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                      <MessageCircle className="h-4 w-4" /> Messages
                    </Link>
                  </>
                )}

                {owner && item.status === 'active' && (
                  <>
                    <PrimaryButton disabled={generateState.isLoading} onClick={() => generateLedger(item._id)}>
                      Generate rent ledger
                    </PrimaryButton>
                    <Link to={`${base}/condition-reports?tenancy=${item._id}`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] px-4 text-sm font-black text-violet-100 transition hover:bg-violet-300/[0.1]">
                      Prepare move-out report
                    </Link>
                    <SecondaryButton disabled={endState.isLoading} onClick={() => endRental(item._id)}>
                      End tenancy
                    </SecondaryButton>
                  </>
                )}

                {item.status === 'ended' && (
                  <Link to={`${base}/reviews`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] px-4 text-sm font-black text-amber-100 transition hover:bg-amber-300/[0.1]">
                    <Star className="h-4 w-4" /> Leave review
                  </Link>
                )}
              </div>
            </div>
          </Panel>
        )) : (
          <EmptyState
            title="No rental records yet"
            text="A rental appears here after the agreement is accepted by both parties."
          />
        )}
      </div>
    </>
  )
}

export default TenanciesPage
