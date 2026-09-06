import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, ExternalLink, FileImage, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useApprovePropertyMutation,
  useApproveVerificationMutation,
  useGetAdminPropertiesQuery,
  useGetAdminPropertyQuery,
  useGetVerificationQuery,
  useGetVerificationsQuery,
  useLazyGetVerificationDocumentQuery,
  useRejectPropertyMutation,
  useRejectVerificationMutation,
} from '../../features/admin/adminApi'
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
  money,
  pretty,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

export function AdminPropertiesQueuePage() {
  const [status, setStatus] = useState('pending_review')
  const { data, isLoading } = useGetAdminPropertiesQuery({ status, limit: 100 })
  if (isLoading) return <LoadingState />
  const properties = data?.properties || []

  return (
    <>
      <PageHeader eyebrow="Moderation" title="Property review queue" text="Open a submission to inspect its complete listing, images, amenities and owner details before deciding." action={<Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending_review">Pending review</option><option value="published">Published</option><option value="rejected">Rejected</option></Select>} />
      <div className="space-y-4">
        {properties.length ? properties.map((property) => (
          <Panel key={property._id}>
            <div className="grid gap-5 lg:grid-cols-[140px_1fr_auto] lg:items-center">
              {property.images?.[0]?.url ? <img src={property.images.find((image) => image.isCover)?.url || property.images[0].url} alt="" className="h-28 w-full rounded-2xl object-cover" /> : <div className="grid h-28 place-items-center rounded-2xl bg-slate-100"><Building2 className="text-slate-300" /></div>}
              <div><div className="flex flex-wrap gap-2"><StatusBadge value={property.listingStatus} /><span className="text-xs font-bold text-slate-400">{pretty(property.propertyType)}</span></div><h2 className="mt-2 text-lg font-black">{property.title}</h2><p className="mt-1 text-sm text-slate-500">{property.owner?.name} · {property.address?.area} · {money(property.monthlyRent)}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{property.description}</p></div>
              <Link to={`/admin/properties/${property._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">Review <ExternalLink className="h-4 w-4" /></Link>
            </div>
          </Panel>
        )) : <EmptyState title="Queue is empty" />}
      </div>
    </>
  )
}

export function AdminPropertyReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: property, isLoading } = useGetAdminPropertyQuery(id)
  const [approve, approveState] = useApprovePropertyMutation()
  const [reject, rejectState] = useRejectPropertyMutation()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) return <LoadingState />
  if (!property) return <EmptyState title="Property not found" />

  const decide = async (decision) => {
    try {
      if (decision === 'approve') await approve(id).unwrap()
      else await reject({ id, reason }).unwrap()
      toast.success(decision === 'approve' ? 'Property approved and published' : 'Property rejected')
      navigate('/admin/properties')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  return (
    <>
      <Link to="/admin/properties" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500"><ArrowLeft className="h-4 w-4" /> Review queue</Link>
      <PageHeader eyebrow="Property moderation" title={property.title} text={`${property.owner?.name || 'Owner'} · ${property.owner?.email || ''}`} />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-6">
          <Panel className="p-3"><div className="grid gap-3 sm:grid-cols-2">{property.images?.length ? property.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-2xl"><img src={image.url} alt={image.alt || property.title} className="aspect-[4/3] h-full w-full object-cover" />{image.isCover && <span className="absolute left-3 top-3 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-black text-[#102f26]">Cover</span>}</div>) : <div className="col-span-2 grid min-h-60 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-400">No images</div>}</div></Panel>
          <Panel><div className="flex flex-wrap gap-2"><StatusBadge value={property.listingStatus} /><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{pretty(property.propertyType)}</span></div><h2 className="mt-5 text-xl font-black">Listing details</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{property.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Monthly rent',money(property.monthlyRent)],['Security',money(property.securityDeposit)],['Furnishing',pretty(property.furnishedStatus)],['Bedrooms',property.bedrooms],['Bathrooms',property.bathrooms],['Occupants',property.maxOccupants]].map(([label,value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}</div></Panel>
          <Panel><h2 className="font-black">Amenities & Gilgit living data</h2><div className="mt-4 flex flex-wrap gap-2">{property.amenities?.map((amenity) => <span key={amenity._id} className="rounded-full bg-[#edf5f1] px-3 py-2 text-xs font-bold text-[#245545]">{amenity.name}</span>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['Heating',property.livingInfo?.heatingAvailable],['Hot water',property.livingInfo?.hotWaterAvailable],['Power backup',property.livingInfo?.electricityBackup],['Winter access',property.livingInfo?.winterAccessible],['Water',pretty(property.livingInfo?.waterAvailability)],['Road',pretty(property.livingInfo?.roadAccess)]].map(([label,value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-bold text-slate-500">{label}</span><strong className="float-right">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</strong></div>)}</div></Panel>
        </div>
        <aside className="space-y-5"><Panel className="sticky top-8"><ShieldCheck className="h-6 w-6 text-emerald-700" /><h2 className="mt-4 text-lg font-black">Moderation decision</h2><p className="mt-2 text-sm leading-6 text-slate-500">Submitted {shortDate(property.submittedAt)}. Confirm the listing is coherent and suitable for publication.</p>{property.rejectionReason && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">Previous rejection: {property.rejectionReason}</p>}{property.listingStatus === 'pending_review' && <div className="mt-5 space-y-2"><PrimaryButton disabled={approveState.isLoading} className="w-full" onClick={() => decide('approve')}>Approve & publish</PrimaryButton><SecondaryButton className="w-full" onClick={() => setRejectOpen(true)}>Reject with reason</SecondaryButton></div>}</Panel></aside>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject property"><TextArea value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Explain what must be changed before resubmission" /><PrimaryButton disabled={rejectState.isLoading || !reason.trim()} className="mt-4 w-full" onClick={() => decide('reject')}>Reject listing</PrimaryButton></Modal>
    </>
  )
}

export function AdminVerificationsQueuePage() {
  const [status, setStatus] = useState('pending')
  const { data, isLoading } = useGetVerificationsQuery({ status, limit: 100 })
  if (isLoading) return <LoadingState />
  const requests = data?.verifications || []

  return (
    <>
      <PageHeader eyebrow="Identity" title="Owner verification queue" text="Review private identity submissions before a user can publish rental properties." action={<Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="verified">Verified</option><option value="resubmission_required">Resubmission required</option><option value="rejected">Rejected</option></Select>} />
      <div className="space-y-4">{requests.length ? requests.map((verification) => <Panel key={verification._id}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge value={verification.status} /><h2 className="mt-2 font-black">{verification.user?.name}</h2><p className="mt-1 text-sm text-slate-500">{verification.user?.email} · CNIC ending {verification.cnicLast4} · attempt #{verification.attemptNumber}</p><p className="mt-2 text-xs text-slate-400">Submitted {shortDate(verification.submittedAt)}</p></div><Link to={`/admin/verifications/${verification._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">Inspect documents <ExternalLink className="h-4 w-4" /></Link></div></Panel>) : <EmptyState title="No verification requests" />}</div>
    </>
  )
}

export function AdminVerificationReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: verification, isLoading } = useGetVerificationQuery(id)
  const [loadDocument] = useLazyGetVerificationDocumentQuery()
  const [approve, approveState] = useApproveVerificationMutation()
  const [reject, rejectState] = useRejectVerificationMutation()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [documentUrl, setDocumentUrl] = useState(null)
  const [documentLabel, setDocumentLabel] = useState('')

  useEffect(() => () => { if (documentUrl) URL.revokeObjectURL(documentUrl) }, [documentUrl])
  if (isLoading) return <LoadingState />
  if (!verification) return <EmptyState title="Verification request not found" />

  const viewDocument = async (documentType, label) => {
    try {
      const blob = await loadDocument({ id, documentType }).unwrap()
      if (documentUrl) URL.revokeObjectURL(documentUrl)
      setDocumentUrl(URL.createObjectURL(blob))
      setDocumentLabel(label)
    } catch (error) { toast.error(errorMessage(error)) }
  }

  const decide = async (decision) => {
    try {
      if (decision === 'approve') await approve(id).unwrap()
      else await reject({ id, reason, allowResubmission }).unwrap()
      toast.success(decision === 'approve' ? 'Owner identity verified' : 'Verification decision saved')
      navigate('/admin/verifications')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  return (
    <>
      <Link to="/admin/verifications" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500"><ArrowLeft className="h-4 w-4" /> Verification queue</Link>
      <PageHeader eyebrow="Private identity review" title={verification.user?.name || 'Verification request'} text={`${verification.user?.email || ''} · CNIC ending ${verification.cnicLast4}`} />
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Panel><StatusBadge value={verification.status} /><h2 className="mt-5 font-black">Submission details</h2><div className="mt-4 space-y-3 text-sm">{[['Attempt',`#${verification.attemptNumber}`],['Submitted',shortDate(verification.submittedAt)],['Account',verification.user?.accountStatus],['Phone',verification.user?.phone || 'Not provided']].map(([label,value]) => <div key={label} className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-3"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>)}</div>{verification.rejectionReason && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{verification.rejectionReason}</p>}{verification.status === 'pending' && <div className="mt-5 space-y-2"><PrimaryButton disabled={approveState.isLoading} className="w-full" onClick={() => decide('approve')}>Approve identity</PrimaryButton><SecondaryButton className="w-full" onClick={() => setRejectOpen(true)}>Reject / request resubmission</SecondaryButton></div>}</Panel>
        <Panel><div className="flex items-center gap-3"><FileImage className="h-5 w-5 text-emerald-700" /><h2 className="font-black">Private documents</h2></div><p className="mt-2 text-xs leading-5 text-slate-400">These files are fetched only through the protected administrator endpoint and are not public URLs.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['cnicFront','CNIC front'],['cnicBack','CNIC back'],['selfie','Selfie']].map(([type,label]) => <button key={type} onClick={() => viewDocument(type,label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-black transition hover:border-emerald-300 hover:bg-emerald-50">{label}<span className="mt-1 block text-[10px] font-semibold text-slate-400">Open securely</span></button>)}</div>{documentUrl ? <div className="mt-5 overflow-hidden rounded-[24px] bg-slate-100"><div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white"><span className="text-xs font-black">{documentLabel}</span><a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-emerald-300">Open full size</a></div><img src={documentUrl} alt={documentLabel} className="max-h-[620px] w-full object-contain" /></div> : <div className="mt-5 grid min-h-72 place-items-center rounded-[24px] bg-slate-50 text-sm font-bold text-slate-400">Select a document to inspect</div>}</Panel>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Verification decision"><TextArea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why the identity submission cannot be approved" /><label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" checked={allowResubmission} onChange={(event) => setAllowResubmission(event.target.checked)} /> Allow the user to resubmit clearer documents</label><PrimaryButton disabled={rejectState.isLoading || !reason.trim()} className="mt-4 w-full" onClick={() => decide('reject')}>Save decision</PrimaryButton></Modal>
    </>
  )
}
