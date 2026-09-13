import { useMemo, useState } from 'react'
import { FileCheck2, MessageCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useCreateAgreementFromTermsMutation,
  useGetAgreementsQuery,
  useSignAgreementMutation,
} from '../../features/agreements/agreementsApi'
import { useGetMyRentalTermsQuery } from '../../features/rentalTerms/rentalTermsApi'
import { useStartApplicationConversationMutation } from '../../features/messages/messagesApi'
import {
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextInput,
  money,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

function RentalAgreementsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const ownerMode = location.pathname.startsWith('/owner')
  const { data: agreementData, isLoading: agreementsLoading } = useGetAgreementsQuery()
  const { data: termsData, isLoading: termsLoading } = useGetMyRentalTermsQuery()
  const [createAgreement, createState] = useCreateAgreementFromTermsMutation()
  const [signAgreement, signState] = useSignAgreementMutation()
  const [startConversation, conversationState] = useStartApplicationConversationMutation()
  const [activeAgreement, setActiveAgreement] = useState(null)
  const [legalName, setLegalName] = useState('')

  const agreements = agreementData?.agreements || []
  const acceptedTerms = (termsData?.terms || []).filter((terms) => terms.status === 'accepted')

  const agreementsByTerms = useMemo(() => {
    const map = new Map()
    for (const agreement of agreements) {
      const termsId = agreement.rentalTerms?._id || agreement.rentalTerms
      if (termsId) map.set(String(termsId), agreement)
    }
    return map
  }, [agreements])

  const readyTerms = acceptedTerms.filter((terms) => !agreementsByTerms.has(String(terms._id)))

  const generateAgreement = async (terms) => {
    try {
      await createAgreement({ termsId: terms._id }).unwrap()
      toast.success('Rental agreement created')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openConversation = async (terms) => {
    try {
      const applicationId = terms.application?._id || terms.application
      const result = await startConversation(applicationId).unwrap()
      const conversationId = result?.data?.conversation?._id || result?.conversation?._id

      if (!conversationId) {
        toast.error('Conversation could not be opened')
        return
      }

      navigate(ownerMode ? '/owner/messages' : '/dashboard/messages', {
        state: { conversationId },
      })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const submitAcceptance = async () => {
    try {
      await signAgreement({
        id: activeAgreement._id,
        legalName,
      }).unwrap()
      toast.success('Agreement accepted')
      setActiveAgreement(null)
      setLegalName('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (agreementsLoading || termsLoading) return <LoadingState />

  return (
    <>
      <PageHeader
        eyebrow="Rental agreement"
        title="Agreements"
        text={ownerMode
          ? 'Turn accepted rental terms into a clear agreement, then wait for both sides to accept it before the rental begins.'
          : 'Review the agreement created from the rental terms you already accepted, then explicitly confirm it using your legal name.'}
      />

      {readyTerms.length > 0 && (
        <div className="mb-6 space-y-4">
          {readyTerms.map((terms) => (
            <Panel key={terms._id} className="border-cyan-300/15 bg-cyan-300/[0.035]">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-cyan-200 ring-1 ring-cyan-300/20">Terms accepted</span>
                    <span className="text-xs font-bold text-slate-500">Agreement is the next step</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-white">{terms.property?.title || 'Rental property'}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[['Rent', money(terms.monthlyRent)], ['Deposit', money(terms.securityDeposit)], ['Move-in', shortDate(terms.startDate)], ['Duration', `${terms.durationMonths} months`], ['Occupants', terms.occupants]].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-black/15 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p>
                        <p className="mt-1 text-xs font-black text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {ownerMode
                      ? 'These terms were accepted by the renter. Create the agreement from these exact values; neither side needs to re-enter the deal.'
                      : 'The owner has not created the rental agreement yet. Your accepted terms remain reserved and unchanged.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <SecondaryButton disabled={conversationState.isLoading} onClick={() => openConversation(terms)}><MessageCircle className="h-4 w-4" /> Message {ownerMode ? 'renter' : 'owner'}</SecondaryButton>
                  {ownerMode && <PrimaryButton disabled={createState.isLoading} onClick={() => generateAgreement(terms)}><FileCheck2 className="h-4 w-4" /> {createState.isLoading ? 'Creating…' : 'Create rental agreement'}</PrimaryButton>}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {agreements.length ? agreements.map((agreement) => {
          const ownerId = agreement.owner?._id || agreement.owner?.id || agreement.owner
          const isOwnerParty = String(ownerId) === String(user?.id)
          const mySignature = isOwnerParty ? agreement.ownerSignature : agreement.renterSignature
          const otherSignature = isOwnerParty ? agreement.renterSignature : agreement.ownerSignature
          const visibleTenancyStatus = agreement.tenancy?.status && agreement.tenancy.status !== 'pending_agreement'

          return (
            <Panel key={agreement._id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={agreement.status} />
                    {visibleTenancyStatus && <StatusBadge value={agreement.tenancy.status} />}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-white">{agreement.property?.title || 'Rental agreement'}</h2>
                  <p className="mt-2 text-sm text-slate-400">{money(agreement.monthlyRent)}/month · {agreement.durationMonths} months · starts {shortDate(agreement.startDate)}</p>
                  <p className="mt-1 text-sm text-slate-500">Security deposit {money(agreement.securityDeposit)} · {agreement.occupants || 1} occupant(s)</p>

                  <div className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    {(agreement.clauses || []).map((clause, index) => (
                      <p key={`${agreement._id}-${index}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
                        <span className="font-black text-cyan-300">{index + 1}.</span> {clause}
                      </p>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">Owner: {agreement.ownerSignature?.signed ? 'accepted' : 'awaiting'}</span>
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">Renter: {agreement.renterSignature?.signed ? 'accepted' : 'awaiting'}</span>
                  </div>

                  {agreement.status === 'executed' && <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 text-sm leading-6 text-cyan-100/85">Both sides accepted the agreement. Your rental agreement is complete.</div>}

                  {!mySignature?.signed && otherSignature?.signed && agreement.status !== 'cancelled' && (
                    <p className="mt-3 text-xs font-bold text-violet-200">The other party has already accepted. Your acceptance will finalize the agreement.</p>
                  )}
                </div>

                {!mySignature?.signed && agreement.status !== 'cancelled' && (
                  <PrimaryButton className="self-start whitespace-nowrap" onClick={() => { setActiveAgreement(agreement); setLegalName(user?.name || '') }}>Review & accept</PrimaryButton>
                )}
              </div>
            </Panel>
          )
        }) : readyTerms.length === 0 ? <EmptyState title="No rental agreements yet" text="An agreement appears after final rental terms have been accepted." /> : null}
      </div>

      <Modal open={Boolean(activeAgreement)} onClose={() => setActiveAgreement(null)} title="Accept rental agreement">
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
            <p className="text-sm font-black text-cyan-100">Confirm the agreement you reviewed</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">This records your explicit electronic acceptance. It is not a cryptographic digital signature. Once both parties accept, the rental agreement is complete.</p>
          </div>
          {activeAgreement && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:grid-cols-4">
              {[['Rent', money(activeAgreement.monthlyRent)], ['Deposit', money(activeAgreement.securityDeposit)], ['Start', shortDate(activeAgreement.startDate)], ['Duration', `${activeAgreement.durationMonths} months`]].map(([label, value]) => (
                <div key={label}><p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p><p className="mt-1 text-xs font-black text-slate-200">{value}</p></div>
              ))}
            </div>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-200">Your legal name</span>
            <TextInput value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Enter your full legal name" />
            <span className="mt-2 block text-[11px] leading-5 text-slate-500">Enter the name you are using to accept this rental agreement.</span>
          </label>
          <PrimaryButton disabled={signState.isLoading || legalName.trim().length < 2} className="w-full" onClick={submitAcceptance}>{signState.isLoading ? 'Accepting…' : 'I accept this rental agreement'}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

export default RentalAgreementsPage
