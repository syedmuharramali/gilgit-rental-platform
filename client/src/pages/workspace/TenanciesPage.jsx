import { Building2 } from 'lucide-react'
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
  const [endTenancy] = useEndTenancyMutation()
  const [generateRentSchedule] = useGenerateRentScheduleMutation()

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
    if (!window.confirm('End this rental? This will move the property out of the active tenancy lifecycle.')) return

    try {
      await endTenancy({ id, reason: 'Tenancy completed' }).unwrap()
      toast.success('Tenancy ended')
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
          ? 'Track upcoming and active rentals created after both parties accept the rental agreement.'
          : 'Your rental appears here after both sides accept the agreement, then becomes active on the agreed move-in date.'}
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
                    The agreement is complete. This rental will become active automatically when the move-in date arrives.
                  </div>
                )}

                {item.status === 'active' && (
                  <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 text-sm leading-6 text-cyan-100/85">
                    This rental is active. Rent records, condition reports and maintenance now belong to this rental.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-60 lg:flex-col">
                <Link to={`${base}/agreements`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                  View agreement
                </Link>
                <Link to={`${base}/condition-reports?tenancy=${item._id}`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                  Condition reports
                </Link>
                {item.status === 'active' && (
                  <Link to={`${base}/rent`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
                    Rent ledger
                  </Link>
                )}
                {owner && item.status === 'active' && (
                  <>
                    <PrimaryButton onClick={() => generateLedger(item._id)}>Generate rent ledger</PrimaryButton>
                    <SecondaryButton onClick={() => endRental(item._id)}>End tenancy</SecondaryButton>
                  </>
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
