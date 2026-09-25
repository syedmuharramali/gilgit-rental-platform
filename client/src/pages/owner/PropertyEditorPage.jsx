import {
  Check,
  CheckCircle2,
  ImagePlus,
  Info,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LoadingState,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextArea,
  TextInput,
  amenityLabel,
  money,
  pretty,
} from '../../components/workspace/WorkspaceUI'
import { useGetAmenitiesQuery } from '../../features/amenities/amenitiesApi'
import {
  useCreatePropertyMutation,
  useDeletePropertyImageMutation,
  useGetPropertyQuery,
  useSetCoverImageMutation,
  useUpdatePropertyMutation,
  useUploadPropertyImagesMutation,
} from '../../features/properties/propertiesApi'

import { localToday } from '../../utils/formatters'
import { PROPERTY_TYPES, isLegacyPropertyType } from '../../utils/propertyTypes'

const LocationPicker = lazy(() => import('../../components/properties/LocationPicker'))

const ONE_MB = 1024 * 1024

const blank = {
  title: '',
  description: '',
  propertyType: 'apartment',
  monthlyRent: '',
  securityDeposit: '0',
  negotiable: false,
  availableFrom: '', // filled with the viewer's local today when the page opens
  minimumStayMonths: '1',
  bedrooms: '1',
  bathrooms: '1',
  floor: '',
  totalAreaValue: '',
  totalAreaUnit: 'sqft',
  furnishedStatus: 'unfurnished',
  maxOccupants: '1',
  area: '',
  street: '',
  city: 'Gilgit',
  landmark: '',
  latitude: '',
  longitude: '',
  amenities: [],
  heatingAvailable: false,
  hotWaterAvailable: false,
  electricityBackup: false,
  waterAvailability: 'unknown',
  roadAccess: 'unknown',
  winterAccessible: true,
}

const stepKeys = ['basics', 'pricing', 'details', 'location', 'amenities', 'living', 'images', 'review']

const errorMessage = (error, t) => error?.data?.message || error?.error || t('common.somethingWrong')
const choiceClass = (active) => `rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-300/35 bg-cyan-300/[0.09] text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,.06)]' : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.045] hover:text-slate-200'}`
const formatBytes = (bytes = 0) => bytes < ONE_MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / ONE_MB).toFixed(2)} MB`

function Field({ label, hint, required = false, optional = false, optionalLabel = '', children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-200">
          {label}
          {required && <span className="ml-1 text-cyan-300">*</span>}
        </span>
        {optional && <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">{optionalLabel}</span>}
      </div>
      {children}
      {hint && <p className="mt-2 text-[11px] leading-5 text-slate-500">{hint}</p>}
    </label>
  )
}

function ToggleCard({ checked, onChange, title, text }) {
  return (
    <label className={`${choiceClass(checked)} cursor-pointer`}>
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? 'border-cyan-300 bg-cyan-300 text-[#07101e]' : 'border-white/15 bg-white/[0.03] text-transparent'}`}>
          <Check className="h-3.5 w-3.5" />
        </span>
        <span>
          <span className="block text-sm font-black">{title}</span>
          <span className="mt-1 block text-[11px] font-medium leading-5 opacity-60">{text}</span>
        </span>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
    </label>
  )
}

function StepNotice({ children }) {
  return (
    <div className="mb-5 flex gap-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4 text-sm leading-6 text-cyan-100/75">
      <Info className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
      <p>{children}</p>
    </div>
  )
}

// Shape the form into the API payload (also used to tell whether anything
// changed since the last save).
const buildPayload = (f) => ({
    title: f.title.trim(),
    description: f.description.trim(),
    propertyType: f.propertyType,
    monthlyRent: Number(f.monthlyRent),
    securityDeposit: Number(f.securityDeposit || 0),
    negotiable: f.negotiable,
    availableFrom: f.availableFrom,
    minimumStayMonths: Number(f.minimumStayMonths),
    bedrooms: Number(f.bedrooms || 0),
    bathrooms: Number(f.bathrooms || 0),
    floor: f.floor === '' ? null : Number(f.floor),
    totalArea: {
      value: f.totalAreaValue === '' ? null : Number(f.totalAreaValue),
      unit: f.totalAreaUnit,
    },
    furnishedStatus: f.furnishedStatus,
    maxOccupants: Number(f.maxOccupants || 1),
    amenities: f.amenities,
    address: {
      area: f.area.trim(),
      street: f.street.trim() || null,
      city: f.city.trim() || 'Gilgit',
      landmark: f.landmark.trim() || null,
      latitude: f.latitude === '' ? null : Number(f.latitude),
      longitude: f.longitude === '' ? null : Number(f.longitude),
    },
    livingInfo: {
      heatingAvailable: f.heatingAvailable,
      hotWaterAvailable: f.hotWaterAvailable,
      electricityBackup: f.electricityBackup,
      waterAvailability: f.waterAvailability,
      roadAccess: f.roadAccess,
      winterAccessible: f.winterAccessible,
    },
})

export default function PropertyEditorPage() {
  const { t } = useTranslation()
  const steps = stepKeys.map((key) => ({ key, title: t(`ed.step.${key}`), text: t(`ed.step.${key}Text`) }))
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const requestedStep = Number(new URLSearchParams(location.search).get('step'))
  const initialStep = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < steps.length ? requestedStep : 0

  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState(() => ({ ...blank, availableFrom: localToday() }))
  const [newFiles, setNewFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loaded: 0, total: 0, saving: false })
  const { data: property, isLoading } = useGetPropertyQuery(id, { skip: !editing })
  const {
    data: amenityData,
    isLoading: amenitiesLoading,
    isFetching: amenitiesFetching,
    isError: amenitiesError,
    refetch: refetchAmenities,
  } = useGetAmenitiesQuery()
  const stepStripRef = useRef(null)
  const [createProperty, createState] = useCreatePropertyMutation()
  const [updateProperty, updateState] = useUpdatePropertyMutation()
  const [uploadImages, uploadState] = useUploadPropertyImagesMutation()
  const [setCover, coverState] = useSetCoverImageMutation()
  const [deleteImage, deleteState] = useDeletePropertyImageMutation()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1,
    maxSize: ONE_MB,
    disabled: uploadState.isLoading,
    onDrop: (acceptedFiles) => setNewFiles(acceptedFiles.slice(0, 1)),
    onDropRejected: (rejections) => {
      const rejectedFile = rejections?.[0]?.file
      if (rejectedFile?.size > ONE_MB) {
        toast.error(t('ed.err.imageSize', { name: rejectedFile.name, size: formatBytes(rejectedFile.size) }))
        return
      }
      toast.error(t('ed.err.imageType'))
    },
  })

  // Fill the form from the server once per listing. Uploading, deleting or
  // re-ordering photos refetches the property, and re-filling on every
  // refetch silently threw away whatever the owner had typed but not saved.
  const hydratedId = useRef(null)
  const savedPayload = useRef(null)

  useEffect(() => {
    if (!property || hydratedId.current === property._id) return
    hydratedId.current = property._id
    const hydrated = {
      title: property.title || '',
      description: property.description || '',
      // A retired type (private/shared room) starts empty so the owner must choose.
      propertyType: isLegacyPropertyType(property.propertyType) ? '' : property.propertyType || 'apartment',
      monthlyRent: String(property.monthlyRent ?? ''),
      securityDeposit: String(property.securityDeposit ?? 0),
      negotiable: Boolean(property.negotiable),
      availableFrom: property.availableFrom ? property.availableFrom.slice(0, 10) : localToday(),
      minimumStayMonths: String(property.minimumStayMonths ?? 1),
      bedrooms: String(property.bedrooms ?? 0),
      bathrooms: String(property.bathrooms ?? 0),
      floor: property.floor == null ? '' : String(property.floor),
      totalAreaValue: property.totalArea?.value == null ? '' : String(property.totalArea.value),
      totalAreaUnit: property.totalArea?.unit || 'sqft',
      furnishedStatus: property.furnishedStatus || 'unfurnished',
      maxOccupants: String(property.maxOccupants ?? 1),
      area: property.address?.area || '',
      street: property.address?.street || '',
      city: property.address?.city || 'Gilgit',
      landmark: property.address?.landmark || '',
      latitude: property.address?.latitude == null ? '' : String(property.address.latitude),
      longitude: property.address?.longitude == null ? '' : String(property.address.longitude),
      amenities: (property.amenities || []).map((amenity) => amenity._id || amenity),
      heatingAvailable: Boolean(property.livingInfo?.heatingAvailable),
      hotWaterAvailable: Boolean(property.livingInfo?.hotWaterAvailable),
      electricityBackup: Boolean(property.livingInfo?.electricityBackup),
      waterAvailability: property.livingInfo?.waterAvailability || 'unknown',
      roadAccess: property.livingInfo?.roadAccess || 'unknown',
      winterAccessible: property.livingInfo?.winterAccessible !== false,
    }
    // What the server has, so edit mode knows whether there is anything to save.
    savedPayload.current = JSON.stringify(buildPayload(hydrated))
    setForm(hydrated)
  }, [property])

  const payload = useMemo(() => buildPayload(form), [form])

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload])
  const isDirty = editing && savedPayload.current !== null && payloadKey !== savedPayload.current

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const setPin = useCallback(({ latitude, longitude }) => {
    setForm((current) => ({
      ...current,
      latitude: latitude === '' ? '' : String(latitude),
      longitude: longitude === '' ? '' : String(longitude),
    }))
  }, [])

  // Fill empty address fields from the pinned map location; never overwrite what the owner typed.
  const applyAddressSuggestion = useCallback(({ area, street }) => {
    setForm((current) => ({
      ...current,
      area: current.area.trim() ? current.area : area || current.area,
      street: current.street.trim() ? current.street : street || current.street,
    }))
  }, [])

  // Keep the active step pill visible in the horizontal step strip.
  useEffect(() => {
    const active = stepStripRef.current?.querySelector('[aria-current="step"]')
    active?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [step])
  const toggleAmenity = (amenityId) => set(
    'amenities',
    form.amenities.includes(amenityId)
      ? form.amenities.filter((value) => value !== amenityId)
      : [...form.amenities, amenityId],
  )

  const getStepError = (index) => {
    if (index === 0) {
      if (form.title.trim().length < 5) return t('ed.err.title')
      if (form.description.trim().length < 20) return t('ed.err.description')
      if (!PROPERTY_TYPES.includes(form.propertyType)) return t('ed.err.type')
    }

    if (index === 1) {
      if (form.monthlyRent === '' || Number(form.monthlyRent) < 0) return t('ed.err.rent')
      if (Number(form.securityDeposit || 0) < 0) return t('ed.err.deposit')
      if (!form.availableFrom) return t('ed.err.availableFrom')
    }

    if (index === 2) {
      const stay = Number(form.minimumStayMonths)
      if (!Number.isFinite(stay) || stay < 1 || stay > 120) return t('ed.err.stay')
      if (Number(form.bedrooms) < 0 || Number(form.bedrooms) > 100) return t('ed.err.bedrooms')
      if (Number(form.bathrooms) < 0 || Number(form.bathrooms) > 100) return t('ed.err.bathrooms')
      if (Number(form.maxOccupants) < 1) return t('ed.err.occupants')
      if (form.totalAreaValue !== '' && Number(form.totalAreaValue) < 0) return t('ed.err.area')
    }

    if (index === 3) {
      if (!form.area.trim()) return t('ed.err.areaRequired')
      if (!form.city.trim()) return t('ed.err.cityRequired')
      if (form.latitude === '' || form.longitude === '') return t('ed.err.pin')
      if (Number(form.latitude) < -90 || Number(form.latitude) > 90 || Number(form.longitude) < -180 || Number(form.longitude) > 180) return t('ed.err.pinInvalid')
    }

    if (index === 4 && form.amenities.length === 0) {
      return t('ed.err.amenity')
    }

    if (index === 6 && editing && (property?.images?.length || 0) < 3) {
      return t('ed.err.images')
    }

    return null
  }

  const completion = [
    !getStepError(0),
    !getStepError(1),
    !getStepError(2),
    !getStepError(3),
    !getStepError(4),
    step > 5 || editing,
    editing && (property?.images?.length || 0) >= 3,
    false,
  ]

  const save = async ({ goToImages = false } = {}) => {
    for (let index = 0; index <= 4; index += 1) {
      const message = getStepError(index)
      if (message) {
        setStep(index)
        toast.error(message)
        return false
      }
    }

    try {
      const result = editing
        ? await updateProperty({ id, ...payload }).unwrap()
        : await createProperty(payload).unwrap()
      const propertyId = editing ? id : result?.data?.property?._id || result?.property?._id
      savedPayload.current = payloadKey
      toast.success(editing ? t('ed.toast.saved') : t('ed.toast.created'))

      if (!editing && propertyId) {
        navigate(`/owner/properties/${propertyId}/edit${goToImages ? '?step=6' : ''}`, { replace: true })
        if (goToImages) setStep(6)
      }

      return true
    } catch (error) {
      toast.error(errorMessage(error, t))
      return false
    }
  }

  const goToStep = (target) => {
    if (target <= step) {
      setStep(target)
      return
    }

    if (!editing && target >= 6) {
      toast.error(t('ed.err.saveFirst'))
      return
    }

    for (let index = 0; index < target; index += 1) {
      const message = getStepError(index)
      if (message) {
        setStep(index)
        toast.error(message)
        return
      }
    }

    setStep(target)
  }

  const nextStep = async () => {
    const message = getStepError(step)
    if (message) {
      toast.error(message)
      return
    }

    if (!editing && step === 5) {
      await save({ goToImages: true })
      return
    }

    // In edit mode the details steps end at 5. Moving on used to leave the
    // changes unsaved, and the review step only offered "Back to properties",
    // which threw them away.
    if (editing && step === 5 && isDirty) {
      const saved = await save()
      if (!saved) return
    }

    setStep((value) => Math.min(steps.length - 1, value + 1))
  }

  const finishEditing = async () => {
    if (isDirty) {
      const saved = await save()
      if (!saved) return
    }
    navigate('/owner/properties')
  }

  const upload = async () => {
    if (!newFiles.length || !id || uploadState.isLoading) return

    const file = newFiles[0]
    setUploadProgress({ percent: 0, loaded: 0, total: file.size, saving: false })

    try {
      await uploadImages({
        id,
        files: [file],
        onProgress: ({ loaded, total, percent }) => {
          setUploadProgress({ percent, loaded, total: total || file.size, saving: percent >= 100 })
        },
      }).unwrap()
      setNewFiles([])
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
      toast.success(t('ed.toast.uploaded'))
    } catch (error) {
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
      toast.error(errorMessage(error, t))
    }
  }

  const chooseCover = async (imageId) => {
    try {
      await setCover({ id, imageId }).unwrap()
      toast.success(t('ed.toast.cover'))
    } catch (error) {
      toast.error(errorMessage(error, t))
    }
  }

  const removeImage = async (imageId) => {
    try {
      await deleteImage({ id, imageId }).unwrap()
      toast.success(t('ed.toast.removed'))
    } catch (error) {
      toast.error(errorMessage(error, t))
    }
  }

  if (editing && isLoading) return <LoadingState />

  const images = property?.images || []
  const hasCover = images.some((image) => image.isCover)
  const saving = createState.isLoading || updateState.isLoading

  return (
    <>
      <PageHeader
        eyebrow={t('ed.eyebrow')}
        title={editing ? t('ed.editTitle') : t('ed.createTitle')}
        text={t('ed.text')}
      />

      <div ref={stepStripRef} className="mb-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {steps.map((item, index) => {
            const completed = Boolean(completion[index]) && index !== step
            const locked = !editing && index >= 6
            return (
              <button
                key={item.title}
                type="button"
                disabled={locked}
                onClick={() => goToStep(index)}
                aria-current={step === index ? 'step' : undefined}
                title={locked ? t('ed.lockedStep') : item.title}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${
                  step === index
                    ? 'border-cyan-300/30 bg-gradient-to-r from-cyan-300/15 via-blue-400/12 to-violet-500/12 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,.06)]'
                    : completed
                      ? 'border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-200'
                      : 'border-white/[0.08] bg-white/[0.025] text-slate-500 hover:border-white/15 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-35'
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] ${completed ? 'bg-cyan-300 text-[#07101e]' : step === index ? 'bg-cyan-300/15 text-cyan-200' : 'bg-white/[0.06] text-slate-500'}`}>
                  {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                </span>
                {item.title}
              </button>
            )
          })}
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.17em] text-cyan-300">{t('ed.stepOf', { current: step + 1, total: steps.length })}</p>
            <h2 className="mt-1 text-xl font-black text-white">{steps[step].title}</h2>
            <p className="mt-1 text-sm text-slate-500">{steps[step].text}</p>
          </div>
          <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-white/[0.06] sm:w-40">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
          {step === 0 && (
            <div>
              <StepNotice>{t('ed.notice.basics')}</StepNotice>
              <div className="grid gap-5">
                <Field label={t('ed.field.title')} required hint={t('ed.field.titleHint')}>
                  <TextInput value={form.title} maxLength={120} onChange={(event) => set('title', event.target.value)} placeholder={t('ed.field.titleHint')} />
                </Field>
                <Field label={t('ed.field.description')} required hint={t('ed.field.descriptionHint', { count: form.description.trim().length })}>
                  <TextArea value={form.description} maxLength={3000} onChange={(event) => set('description', event.target.value)} placeholder={t('ed.field.descriptionPlaceholder')} />
                </Field>
                <Field label={t('ed.field.type')} required hint={t('ed.field.typeHint')}>
                  <Select aria-label={t('ed.field.type')} value={form.propertyType} onChange={(event) => set('propertyType', event.target.value)}>
                    {form.propertyType === '' && <option value="" disabled>{t('ed.field.chooseType')}</option>}
                    {PROPERTY_TYPES.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <StepNotice>{t('ed.notice.pricing')}</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('ed.field.rent')} required hint={t('ed.field.rentHint')}><TextInput type="number" min="0" inputMode="numeric" value={form.monthlyRent} onChange={(event) => set('monthlyRent', event.target.value)} placeholder="45000" /></Field>
                <Field label={t('ed.field.deposit')} hint={t('ed.field.depositHint')}><TextInput type="number" min="0" inputMode="numeric" value={form.securityDeposit} onChange={(event) => set('securityDeposit', event.target.value)} placeholder="90000" /></Field>
                <Field label={t('ed.field.availableFrom')} required hint={t('ed.field.availableFromHint')}><TextInput type="date" value={form.availableFrom} onChange={(event) => set('availableFrom', event.target.value)} /></Field>
                <div><div className="mb-2 text-xs font-black text-slate-200">{t('ed.field.negotiation')}</div><ToggleCard checked={form.negotiable} onChange={(event) => set('negotiable', event.target.checked)} title={t('ed.field.negotiable')} text={t('ed.field.negotiableText')} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepNotice>{t('ed.notice.details')}</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={t('ed.field.minimumStay')} required hint={t('ed.field.minimumStayHint')}><TextInput type="number" min="1" max="120" value={form.minimumStayMonths} onChange={(event) => set('minimumStayMonths', event.target.value)} placeholder="6" /></Field>
                <Field label={t('ed.field.bedrooms')} required hint={t('ed.field.bedroomsHint')}><TextInput type="number" min="0" max="100" value={form.bedrooms} onChange={(event) => set('bedrooms', event.target.value)} placeholder="2" /></Field>
                <Field label={t('ed.field.bathrooms')} required hint={t('ed.field.bathroomsHint')}><TextInput type="number" min="0" max="100" value={form.bathrooms} onChange={(event) => set('bathrooms', event.target.value)} placeholder="2" /></Field>
                <Field label={t('ed.field.floor')} optional optionalLabel={t('ed.optional')} hint={t('ed.field.floorHint')}><TextInput type="number" value={form.floor} onChange={(event) => set('floor', event.target.value)} placeholder="1" /></Field>
                <Field label={t('ed.field.totalArea')} optional optionalLabel={t('ed.optional')} hint={t('ed.field.totalAreaHint')}><TextInput type="number" min="0" value={form.totalAreaValue} onChange={(event) => set('totalAreaValue', event.target.value)} placeholder="1200" /></Field>
                <Field label={t('ed.field.areaUnit')} hint={t('ed.field.areaUnitHint')}><Select aria-label={t('ed.field.areaUnit')} value={form.totalAreaUnit} onChange={(event) => set('totalAreaUnit', event.target.value)}>{['sqft','sqm','kanal','marla'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select></Field>
                <Field label={t('ed.field.furnishing')} hint={t('ed.field.furnishingHint')}><Select aria-label={t('ed.field.furnishing')} value={form.furnishedStatus} onChange={(event) => set('furnishedStatus', event.target.value)}>{['furnished','semi_furnished','unfurnished'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select></Field>
                <Field label={t('ed.field.maxOccupants')} required hint={t('ed.field.maxOccupantsHint')}><TextInput type="number" min="1" value={form.maxOccupants} onChange={(event) => set('maxOccupants', event.target.value)} placeholder="4" /></Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepNotice>{t('ed.notice.location')}</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('ed.field.area')} required hint={t('ed.field.areaHint')}><TextInput value={form.area} onChange={(event) => set('area', event.target.value)} placeholder="Jutial" /></Field>
                <Field label={t('ed.field.street')} optional optionalLabel={t('ed.optional')} hint={t('ed.field.streetHint')}><TextInput value={form.street} onChange={(event) => set('street', event.target.value)} placeholder="Main Jutial Road" /></Field>
                <Field label={t('ed.field.city')} required hint={t('ed.field.cityHint')}><TextInput value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Gilgit" /></Field>
                <Field label={t('ed.field.landmark')} optional optionalLabel={t('ed.optional')} hint={t('ed.field.landmarkHint')}><TextInput value={form.landmark} onChange={(event) => set('landmark', event.target.value)} placeholder="Near Jutial Bus Stand" /></Field>
                <div className="sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-slate-200">{t('ed.field.mapLocation')}<span className="ml-1 text-cyan-300">*</span></span>
                  </div>
                  <Suspense fallback={<div className="grid h-[340px] place-items-center rounded-[24px] border border-white/10 bg-white/[0.02] sm:h-[420px]"><LoadingState /></div>}>
                    <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={setPin} onAddressSuggestion={applyAddressSuggestion} />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepNotice>{t('ed.notice.amenities')}</StepNotice>
              <div className="mb-4 flex items-center justify-between gap-4"><p className="text-sm font-black text-white">{t('ed.availableAmenities')}</p><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-black text-cyan-200">{t('ed.selectedCount', { count: form.amenities.length })}</span></div>
              {amenitiesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('ed.loadingAmenities')}>
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[74px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />)}
                </div>
              ) : amenitiesError || !(amenityData?.amenities || []).length ? (
                <div className="rounded-[24px] border border-dashed border-amber-300/20 bg-amber-300/[0.04] p-8 text-center">
                  <p className="font-black text-amber-100">{amenitiesError ? t('ed.amenitiesError') : t('ed.amenitiesEmpty')}</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{amenitiesError ? t('ed.amenitiesErrorText') : t('ed.amenitiesEmptyText')}</p>
                  <SecondaryButton className="mt-4" disabled={amenitiesFetching} onClick={() => refetchAmenities()}><RefreshCw className={`h-4 w-4 ${amenitiesFetching ? 'animate-spin' : ''}`} />{t('common.tryAgain')}</SecondaryButton>
                </div>
              ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(amenityData?.amenities || []).map((amenity) => {
                  const selected = form.amenities.includes(amenity._id)
                  return <button type="button" aria-pressed={selected} key={amenity._id} onClick={() => toggleAmenity(amenity._id)} className={`${choiceClass(selected)} flex items-start justify-between gap-3`}><span><span className="block text-sm font-black">{amenityLabel(amenity)}</span><span className="mt-1 block text-[10px] font-semibold opacity-55">{pretty(amenity.category)}</span></span><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? 'border-cyan-300 bg-cyan-300 text-[#07101e]' : 'border-white/10 bg-white/[0.03] text-transparent'}`}><Check className="h-3.5 w-3.5" /></span></button>
                })}
              </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <StepNotice>{t('ed.notice.living')}</StepNotice>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ToggleCard checked={form.heatingAvailable} onChange={(event) => set('heatingAvailable', event.target.checked)} title={t('ed.toggle.heating')} text={t('ed.toggle.heatingText')} />
                <ToggleCard checked={form.hotWaterAvailable} onChange={(event) => set('hotWaterAvailable', event.target.checked)} title={t('ed.toggle.hotWater')} text={t('ed.toggle.hotWaterText')} />
                <ToggleCard checked={form.electricityBackup} onChange={(event) => set('electricityBackup', event.target.checked)} title={t('ed.toggle.power')} text={t('ed.toggle.powerText')} />
                <ToggleCard checked={form.winterAccessible} onChange={(event) => set('winterAccessible', event.target.checked)} title={t('ed.toggle.winter')} text={t('ed.toggle.winterText')} />
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label={t('ed.field.water')} hint={t('ed.field.waterHint')}><Select aria-label={t('ed.field.water')} value={form.waterAvailability} onChange={(event) => set('waterAvailability', event.target.value)}>{['unknown','excellent','good','limited','unreliable'].map((value) => <option key={value} value={value}>{t(`ed.water.${value}`)}</option>)}</Select></Field>
                <Field label={t('ed.field.road')} hint={t('ed.field.roadHint')}><Select aria-label={t('ed.field.road')} value={form.roadAccess} onChange={(event) => set('roadAccess', event.target.value)}>{['unknown','excellent','good','limited','difficult'].map((value) => <option key={value} value={value}>{value === 'unknown' ? t('ed.water.unknown') : t(`ed.road.${value}`)}</option>)}</Select></Field>
              </div>
              {!editing && <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.055] p-4"><p className="text-sm font-black text-violet-100">{t('ed.nextPhotos')}</p><p className="mt-1 text-xs leading-5 text-slate-400">{t('ed.nextPhotosText')}</p></div>}
            </div>
          )}

          {step === 6 && (
            <div>
              <StepNotice>{t('ed.notice.images')}</StepNotice>
              {!editing ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-9 text-center"><ImagePlus className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 font-black text-white">{t('ed.saveFirst')}</p><p className="mt-1 text-sm text-slate-500">{t('ed.saveFirstText')}</p></div>
              ) : (
                <>
                  <div {...getRootProps()} className={`rounded-[28px] border-2 border-dashed p-9 text-center transition ${uploadState.isLoading ? 'cursor-not-allowed border-white/8 bg-white/[0.015] opacity-55' : isDragActive ? 'cursor-pointer border-cyan-300/45 bg-cyan-300/[0.08]' : 'cursor-pointer border-white/12 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-8 w-8 text-cyan-300" />
                    <p className="mt-3 font-black text-white">{t('ed.dragPhoto')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('ed.dragPhotoHint')}</p>
                  </div>

                  {newFiles.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><p className="text-sm font-black text-cyan-100">{newFiles[0].name}</p><p className="mt-1 text-[11px] text-slate-500">{t('ed.readyToUpload', { size: formatBytes(newFiles[0].size) })}</p></div>
                        <PrimaryButton disabled={uploadState.isLoading} onClick={upload}>{uploadState.isLoading ? t('ed.uploading') : t('ed.uploadImage')}</PrimaryButton>
                      </div>

                      {uploadState.isLoading && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                            <span>{uploadProgress.saving ? t('ed.uploadComplete') : t('ed.uploadingPercent', { percent: uploadProgress.percent })}</span>
                            <span>{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total || newFiles[0].size)}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 transition-[width] duration-200" style={{ width: `${uploadProgress.percent}%` }} /></div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4"><p className="text-sm font-black text-white">{t('ed.uploadedPhotos')}</p><span className={`rounded-full px-3 py-1.5 text-xs font-black ${images.length >= 3 ? 'bg-cyan-300/10 text-cyan-200' : 'bg-amber-300/10 text-amber-200'}`}>{t('ed.minimumImages', { count: images.length })}</span></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {images.map((image) => (
                      <div key={image.id} className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
                        <img src={image.url} alt={image.alt || property.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                        <div className="absolute inset-x-2 bottom-2 flex gap-2">
                          <button type="button" disabled={coverState.isLoading || image.isCover} onClick={() => chooseCover(image.id)} className={`rounded-full px-3 py-2 text-[10px] font-black backdrop-blur-xl ${image.isCover ? 'bg-cyan-300 text-[#07101e]' : 'bg-[#07101e]/80 text-white ring-1 ring-white/15'}`}>{image.isCover ? t('ed.cover') : t('ed.setCover')}</button>
                          <button type="button" disabled={deleteState.isLoading} onClick={() => removeImage(image.id)} className="rounded-full bg-[#07101e]/80 px-3 py-2 text-[10px] font-black text-rose-300 ring-1 ring-white/15 backdrop-blur-xl">{t('ed.delete')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{t('ed.preview')}</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{form.title || t('ed.untitled')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{form.description || t('ed.addDescription')}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    [t('ed.field.rent'), form.monthlyRent ? money(form.monthlyRent) : '—'],
                    [t('ed.field.type'), pretty(form.propertyType)],
                    [t('details.location'), form.area ? `${form.area}, ${form.city}` : '—'],
                    [t('ed.field.bedrooms'), form.bedrooms],
                    [t('ed.field.bathrooms'), form.bathrooms],
                    [t('ed.step.amenities'), form.amenities.length],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}
                </div>
              </div>

              <div className="rounded-[26px] border border-cyan-300/15 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.13),transparent_35%),#0a111e] p-5 text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 font-black">{t('ed.readyTitle')}</p>
                <div className="mt-4 space-y-3 text-xs">
                  {[
                    [t('ed.readyDetails'), [0,1,2,3,4].every((index) => !getStepError(index))],
                    [t('ed.readyImages', { count: images.length }), images.length >= 3],
                    [t('ed.readyCover'), hasCover && images.filter((image) => image.isCover).length === 1],
                    [t('ed.readyAmenity', { count: form.amenities.length }), form.amenities.length >= 1],
                  ].map(([label, ready]) => <div key={label} className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full ${ready ? 'bg-cyan-300 text-[#07101e]' : 'bg-amber-300/10 text-amber-200'}`}>{ready ? <Check className="h-3 w-3" /> : <span className="text-[9px] font-black">!</span>}</span><span className={ready ? 'text-slate-300' : 'text-amber-200'}>{label}</span></div>)}
                </div>
                <p className="mt-4 border-t border-white/[0.07] pt-4 text-xs leading-6 text-slate-500">{t('ed.readyNote')}</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <SecondaryButton disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>{t('ed.back')}</SecondaryButton>
          <div className="flex flex-col gap-2 sm:flex-row">
            {editing && step <= 5 && <SecondaryButton disabled={saving || !isDirty} onClick={() => save()}>{saving ? t('ed.saving') : t('ed.saveChanges')}</SecondaryButton>}
            {step < steps.length - 1 && <PrimaryButton disabled={saving || uploadState.isLoading} onClick={nextStep}>{!editing && step === 5 ? t('ed.saveDraftPhotos') : step === 6 ? t('ed.reviewListing') : t('ed.continue')}</PrimaryButton>}
            {editing && step === steps.length - 1 && <PrimaryButton disabled={saving} onClick={finishEditing}>{isDirty ? t('ed.saveAndFinish') : t('ed.backToProperties')}</PrimaryButton>}
          </div>
        </div>
        {isDirty && ['published', 'pending_review'].includes(property?.listingStatus) && (
          <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100">{t('ed.republishWarning')}</p>
        )}
      </Panel>
    </>
  )
}
