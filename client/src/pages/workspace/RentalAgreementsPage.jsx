import { useMemo, useState } from 'react'
import { FileCheck2, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

function RentalAgreementsPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
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
  // The terms list holds both sides of the user's deals. Someone who rents one
  // home and owns another saw every deal in both workspaces, and "Create
  // agreement" on one where they are the renter failed with a 404.
  const partyIdOf = (value) => String(value?._id || value?.id || value || '')
  const acceptedTerms = (termsData?.terms || []).filter((terms) =>
    terms.status === 'accepted' &&
    (ownerMode ? partyIdOf(terms.owner) === String(user?.id) : partyIdOf(terms.renter) === String(user?.id)))

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
      toast.success(t('agr.toastCreated'))
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
        toast.error(t('agr.conversationFailed'))
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
      toast.success(t('agr.toastAccepted'))
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
        eyebrow={t('agr.eyebrow')}
        title={t('agr.title')}
        text={ownerMode ? t('agr.textOwner') : t('agr.textRenter')}
      />

      {readyTerms.length > 0 && (
        <div className="mb-6 space-y-4">
          {readyTerms.map((terms) => (
            <Panel key={terms._id} className="border-cyan-300/15 bg-cyan-300/[0.035]">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-cyan-200 ring-1 ring-cyan-300/20">{t('agr.termsAccepted')}</span>
                    <span className="text-xs font-bold text-slate-500">{t('agr.nextStep')}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-white">{terms.property?.title || t('agr.rentalProperty')}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[[t('apps.rent'), money(terms.monthlyRent)], [t('apps.deposit'), money(terms.securityDeposit)], [t('apps.moveIn'), shortDate(terms.startDate)], [t('apps.duration'), t('apps.durationMonths', { count: terms.durationMonths })], [t('apps.occupants'), terms.occupants]].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-black/15 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p>
                        <p className="mt-1 text-xs font-black text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {ownerMode ? t('agr.ownerNote') : t('agr.renterNote')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <SecondaryButton disabled={conversationState.isLoading} onClick={() => openConversation(terms)}><MessageCircle className="h-4 w-4" /> {t('agr.messageParty', { party: ownerMode ? t('apps.renter') : t('apps.owner') })}</SecondaryButton>
                  {ownerMode && <PrimaryButton disabled={createState.isLoading} onClick={() => generateAgreement(terms)}><FileCheck2 className="h-4 w-4" /> {createState.isLoading ? t('agr.creating') : t('agr.create')}</PrimaryButton>}
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

          return (
            <Panel key={agreement._id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={agreement.status} />
                  </div>
                  <h2 className="mt-3 text-xl font-black text-white">{agreement.property?.title || t('agr.title')}</h2>
                  <p className="mt-2 text-sm text-slate-400">{t('agr.perMonthDuration', { rent: money(agreement.monthlyRent), months: agreement.durationMonths, date: shortDate(agreement.startDate) })}</p>
                  <p className="mt-1 text-sm text-slate-500">{t('agr.depositOccupants', { deposit: money(agreement.securityDeposit), count: agreement.occupants || 1 })}</p>

                  <div className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    {(agreement.clauses || []).map((clause, index) => (
                      <p key={`${agreement._id}-${index}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
                        <span className="font-black text-cyan-300">{index + 1}.</span> {clause}
                      </p>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">{t('agr.ownerStatus', { status: agreement.ownerSignature?.signed ? t('agr.acceptedWord') : t('agr.awaitingWord') })}</span>
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-400">{t('agr.renterStatus', { status: agreement.renterSignature?.signed ? t('agr.acceptedWord') : t('agr.awaitingWord') })}</span>
                  </div>

                  {agreement.status === 'executed' && <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 text-sm leading-6 text-cyan-100/85">{t('agr.executedNote')}</div>}

                  {!mySignature?.signed && otherSignature?.signed && agreement.status !== 'cancelled' && (
                    <p className="mt-3 text-xs font-bold text-violet-200">{t('agr.otherAccepted')}</p>
                  )}
                </div>

                {!mySignature?.signed && agreement.status !== 'cancelled' && (
                  <PrimaryButton className="self-start whitespace-nowrap" onClick={() => { setActiveAgreement(agreement); setLegalName(user?.name || '') }}>{t('agr.reviewAccept')}</PrimaryButton>
                )}
              </div>
            </Panel>
          )
        }) : readyTerms.length === 0 ? <EmptyState title={t('agr.emptyTitle')} text={t('agr.emptyText')} /> : null}
      </div>

      <Modal open={Boolean(activeAgreement)} onClose={() => setActiveAgreement(null)} title={t('agr.modalTitle')}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
            <p className="text-sm font-black text-cyan-100">{t('agr.modalIntroTitle')}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{t('agr.modalIntroText')}</p>
          </div>
          {activeAgreement && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:grid-cols-4">
              {[[t('apps.rent'), money(activeAgreement.monthlyRent)], [t('apps.deposit'), money(activeAgreement.securityDeposit)], [t('agr.start'), shortDate(activeAgreement.startDate)], [t('apps.duration'), t('apps.durationMonths', { count: activeAgreement.durationMonths })]].map(([label, value]) => (
                <div key={label}><p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p><p className="mt-1 text-xs font-black text-slate-200">{value}</p></div>
              ))}
            </div>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-200">{t('agr.legalName')}</span>
            <TextInput value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder={t('agr.legalNamePlaceholder')} />
            <span className="mt-2 block text-[11px] leading-5 text-slate-500">{t('agr.legalNameHint')}</span>
          </label>
          <PrimaryButton disabled={signState.isLoading || legalName.trim().length < 2} className="w-full" onClick={submitAcceptance}>{signState.isLoading ? t('agr.accepting') : t('agr.acceptButton')}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

export default RentalAgreementsPage
