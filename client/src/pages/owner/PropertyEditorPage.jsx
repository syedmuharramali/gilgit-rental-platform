import {
  Check,
  CheckCircle2,
  ImagePlus,
  Info,
  MapPin,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
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

const ONE_MB = 1024 * 1024

const blank = {
  title: '',
  description: '',
  propertyType: 'apartment',
  monthlyRent: '',
  securityDeposit: '0',
  negotiable: false,
  availableFrom: new Date().toISOString().slice(0, 10),
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

const steps = [
  { title: 'Basics', text: 'Give renters a clear first impression of the property.' },
  { title: 'Pricing', text: 'Explain the monthly cost, deposit and move-in timing.' },
  { title: 'Details', text: 'Describe the physical setup and who the home suits.' },
  { title: 'Location', text: 'Tell renters exactly where the property is in Gilgit.' },
  { title: 'Amenities', text: 'Select only the facilities that are genuinely available.' },
  { title: 'Living score', text: 'Capture the Gilgit-specific conditions that affect everyday living.' },
  { title: 'Images', text: 'Add at least three clear photos and choose one cover image.' },
  { title: 'Review', text: 'Check the listing before sending it to the admin review queue.' },
]

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'
const choiceClass = (active) => `rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-300/35 bg-cyan-300/[0.09] text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,.06)]' : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.045] hover:text-slate-200'}`
const formatBytes = (bytes = 0) => bytes < ONE_MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / ONE_MB).toFixed(2)} MB`

function Field({ label, hint, required = false, optional = false, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-200">
          {label}
          {required && <span className="ml-1 text-cyan-300">*</span>}
        </span>
        {optional && <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">Optional</span>}
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

export default function PropertyEditorPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const requestedStep = Number(new URLSearchParams(location.search).get('step'))
  const initialStep = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < steps.length ? requestedStep : 0

  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState(blank)
  const [newFiles, setNewFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loaded: 0, total: 0, saving: false })
  const { data: property, isLoading } = useGetPropertyQuery(id, { skip: !editing })
  const { data: amenityData } = useGetAmenitiesQuery()
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
        toast.error(`${rejectedFile.name} is ${formatBytes(rejectedFile.size)}. Property images must be smaller than 1 MB.`)
        return
      }
      toast.error('Choose one JPG or PNG image smaller than 1 MB.')
    },
  })

  useEffect(() => {
    if (!property) return
    setForm({
      title: property.title || '',
      description: property.description || '',
      propertyType: property.propertyType || 'apartment',
      monthlyRent: String(property.monthlyRent ?? ''),
      securityDeposit: String(property.securityDeposit ?? 0),
      negotiable: Boolean(property.negotiable),
      availableFrom: property.availableFrom ? property.availableFrom.slice(0, 10) : blank.availableFrom,
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
    })
  }, [property])

  const payload = useMemo(() => ({
    title: form.title.trim(),
    description: form.description.trim(),
    propertyType: form.propertyType,
    monthlyRent: Number(form.monthlyRent),
    securityDeposit: Number(form.securityDeposit || 0),
    negotiable: form.negotiable,
    availableFrom: form.availableFrom,
    minimumStayMonths: Number(form.minimumStayMonths),
    bedrooms: Number(form.bedrooms || 0),
    bathrooms: Number(form.bathrooms || 0),
    floor: form.floor === '' ? null : Number(form.floor),
    totalArea: {
      value: form.totalAreaValue === '' ? null : Number(form.totalAreaValue),
      unit: form.totalAreaUnit,
    },
    furnishedStatus: form.furnishedStatus,
    maxOccupants: Number(form.maxOccupants || 1),
    amenities: form.amenities,
    address: {
      area: form.area.trim(),
      street: form.street.trim() || null,
      city: form.city.trim() || 'Gilgit',
      landmark: form.landmark.trim() || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
    },
    livingInfo: {
      heatingAvailable: form.heatingAvailable,
      hotWaterAvailable: form.hotWaterAvailable,
      electricityBackup: form.electricityBackup,
      waterAvailability: form.waterAvailability,
      roadAccess: form.roadAccess,
      winterAccessible: form.winterAccessible,
    },
  }), [form])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleAmenity = (amenityId) => set(
    'amenities',
    form.amenities.includes(amenityId)
      ? form.amenities.filter((value) => value !== amenityId)
      : [...form.amenities, amenityId],
  )

  const getStepError = (index) => {
    if (index === 0) {
      if (form.title.trim().length < 5) return 'Property title must be at least 5 characters.'
      if (form.description.trim().length < 20) return 'Property description must be at least 20 characters.'
    }

    if (index === 1) {
      if (form.monthlyRent === '' || Number(form.monthlyRent) < 0) return 'Enter a valid monthly rent.'
      if (Number(form.securityDeposit || 0) < 0) return 'Security deposit cannot be negative.'
      if (!form.availableFrom) return 'Choose when the property is available from.'
    }

    if (index === 2) {
      const stay = Number(form.minimumStayMonths)
      if (!Number.isFinite(stay) || stay < 1 || stay > 120) return 'Minimum stay must be between 1 and 120 months.'
      if (Number(form.bedrooms) < 0 || Number(form.bedrooms) > 100) return 'Bedrooms must be between 0 and 100.'
      if (Number(form.bathrooms) < 0 || Number(form.bathrooms) > 100) return 'Bathrooms must be between 0 and 100.'
      if (Number(form.maxOccupants) < 1) return 'Maximum occupants must be at least 1.'
      if (form.totalAreaValue !== '' && Number(form.totalAreaValue) < 0) return 'Total area cannot be negative.'
    }

    if (index === 3) {
      if (!form.area.trim()) return 'Enter the area or neighbourhood.'
      if (!form.city.trim()) return 'Enter the city.'
      if (form.latitude !== '' && (Number(form.latitude) < -90 || Number(form.latitude) > 90)) return 'Latitude must be between -90 and 90.'
      if (form.longitude !== '' && (Number(form.longitude) < -180 || Number(form.longitude) > 180)) return 'Longitude must be between -180 and 180.'
    }

    if (index === 4 && form.amenities.length === 0) {
      return 'Select at least one amenity before continuing.'
    }

    if (index === 6 && editing && (property?.images?.length || 0) < 3) {
      return 'Upload at least 3 property images before reviewing the listing.'
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
      toast.success(editing ? 'Property changes saved' : 'Draft property created')

      if (!editing && propertyId) {
        navigate(`/owner/properties/${propertyId}/edit${goToImages ? '?step=6' : ''}`, { replace: true })
        if (goToImages) setStep(6)
      }

      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  const goToStep = (target) => {
    if (target <= step) {
      setStep(target)
      return
    }

    if (!editing && target >= 6) {
      toast.error('Complete the listing details and save the draft before adding photos.')
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

    setStep((value) => Math.min(steps.length - 1, value + 1))
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
      toast.success('Property image uploaded')
    } catch (error) {
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
      toast.error(errorMessage(error))
    }
  }

  const chooseCover = async (imageId) => {
    try {
      await setCover({ id, imageId }).unwrap()
      toast.success('Cover image updated')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const removeImage = async (imageId) => {
    try {
      await deleteImage({ id, imageId }).unwrap()
      toast.success('Image removed')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (editing && isLoading) return <LoadingState />

  const images = property?.images || []
  const hasCover = images.some((image) => image.isCover)
  const saving = createState.isLoading || updateState.isLoading

  return (
    <>
      <PageHeader
        eyebrow="Property studio"
        title={editing ? 'Edit property' : 'Create property'}
        text="Complete one clear section at a time. Required fields are labelled, optional details can be skipped, and your listing stays a draft until you submit it for admin review."
      />

      <div className="mb-6 overflow-x-auto pb-2">
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
                title={locked ? 'Save the draft before opening this step' : item.title}
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
            <p className="text-[10px] font-black uppercase tracking-[.17em] text-cyan-300">Step {step + 1} of {steps.length}</p>
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
              <StepNotice>Use a specific title and a useful description. Renters should understand what the property is before they open the listing.</StepNotice>
              <div className="grid gap-5">
                <Field label="Property title" required hint="Example: Modern 2-Bed Apartment in Jutial">
                  <TextInput value={form.title} maxLength={120} onChange={(event) => set('title', event.target.value)} placeholder="Modern 2-Bed Apartment in Jutial" />
                </Field>
                <Field label="Property description" required hint={`${form.description.trim().length}/3000 characters · minimum 20 characters`}>
                  <TextArea value={form.description} maxLength={3000} onChange={(event) => set('description', event.target.value)} placeholder="Describe the condition, surroundings, nearby places and the kind of renter this property suits." />
                </Field>
                <Field label="Property type" required hint="Choose the option that best describes what the renter will actually occupy.">
                  <Select aria-label="Property type" value={form.propertyType} onChange={(event) => set('propertyType', event.target.value)}>
                    {['hostel','hostel_bed','shared_room','private_room','apartment','house','upper_portion','lower_portion','studio'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <StepNotice>Enter amounts in Pakistani rupees. The security deposit can be zero, and negotiable rent simply tells renters that discussion is possible.</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Monthly rent (PKR)" required hint="Amount charged each month, for example 45000."><TextInput type="number" min="0" inputMode="numeric" value={form.monthlyRent} onChange={(event) => set('monthlyRent', event.target.value)} placeholder="45000" /></Field>
                <Field label="Security deposit (PKR)" hint="One-time refundable deposit. Enter 0 if no deposit is required."><TextInput type="number" min="0" inputMode="numeric" value={form.securityDeposit} onChange={(event) => set('securityDeposit', event.target.value)} placeholder="90000" /></Field>
                <Field label="Available from" required hint="The earliest date a renter can move in."><TextInput type="date" value={form.availableFrom} onChange={(event) => set('availableFrom', event.target.value)} /></Field>
                <div><div className="mb-2 text-xs font-black text-slate-200">Negotiation</div><ToggleCard checked={form.negotiable} onChange={(event) => set('negotiable', event.target.checked)} title="Rent is negotiable" text="Turn this on only if you are willing to discuss the listed monthly rent." /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepNotice>These details help renters compare properties. Use 0 bedrooms for hostel beds or room-style listings when a separate bedroom count does not apply.</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Minimum stay" required hint="Minimum number of months the renter must stay (1–120)."><TextInput type="number" min="1" max="120" value={form.minimumStayMonths} onChange={(event) => set('minimumStayMonths', event.target.value)} placeholder="6" /></Field>
                <Field label="Bedrooms" required hint="Number of bedrooms included in the rental."><TextInput type="number" min="0" max="100" value={form.bedrooms} onChange={(event) => set('bedrooms', event.target.value)} placeholder="2" /></Field>
                <Field label="Bathrooms" required hint="Number of bathrooms available to the renter."><TextInput type="number" min="0" max="100" value={form.bathrooms} onChange={(event) => set('bathrooms', event.target.value)} placeholder="2" /></Field>
                <Field label="Floor" optional hint="Example: 1 for first floor. Leave empty if it does not apply."><TextInput type="number" value={form.floor} onChange={(event) => set('floor', event.target.value)} placeholder="1" /></Field>
                <Field label="Total area" optional hint="Enter the size, then choose its unit."><TextInput type="number" min="0" value={form.totalAreaValue} onChange={(event) => set('totalAreaValue', event.target.value)} placeholder="1200" /></Field>
                <Field label="Area unit" hint="Unit used for the total property area."><Select aria-label="Area unit" value={form.totalAreaUnit} onChange={(event) => set('totalAreaUnit', event.target.value)}><option value="sqft">Square feet (sqft)</option><option value="sqm">Square metres (sqm)</option><option value="kanal">Kanal</option><option value="marla">Marla</option></Select></Field>
                <Field label="Furnishing" hint="Choose the condition in which the property will be handed over."><Select aria-label="Furnishing status" value={form.furnishedStatus} onChange={(event) => set('furnishedStatus', event.target.value)}><option value="furnished">Furnished</option><option value="semi_furnished">Semi furnished</option><option value="unfurnished">Unfurnished</option></Select></Field>
                <Field label="Maximum occupants" required hint="Highest number of people you allow to live in the property."><TextInput type="number" min="1" value={form.maxOccupants} onChange={(event) => set('maxOccupants', event.target.value)} placeholder="4" /></Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepNotice>Area and city are required. Street, landmark and map coordinates are optional, but they make the listing easier to understand.</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Area / neighbourhood" required hint="Example: Jutial, Danyore, Konodas or another local area."><TextInput value={form.area} onChange={(event) => set('area', event.target.value)} placeholder="Jutial" /></Field>
                <Field label="Street / road" optional hint="Street, road or block information if available."><TextInput value={form.street} onChange={(event) => set('street', event.target.value)} placeholder="Main Jutial Road" /></Field>
                <Field label="City" required hint="Defaults to Gilgit but can be changed if the property is elsewhere in the supported area."><TextInput value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Gilgit" /></Field>
                <Field label="Nearby landmark" optional hint="A well-known nearby place that helps renters recognize the location."><TextInput value={form.landmark} onChange={(event) => set('landmark', event.target.value)} placeholder="Near Jutial Bus Stand" /></Field>
                <Field label="Latitude" optional hint="Only enter this if you know the exact coordinate. Otherwise leave it empty."><TextInput type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => set('latitude', event.target.value)} placeholder="35.9208" /></Field>
                <Field label="Longitude" optional hint="Only enter this if you know the exact coordinate. Otherwise leave it empty."><TextInput type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => set('longitude', event.target.value)} placeholder="74.3089" /></Field>
                <div className="sm:col-span-2 flex gap-3 rounded-[22px] border border-cyan-300/15 bg-cyan-300/[0.055] p-4 text-sm leading-6 text-cyan-100/75"><MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-300" /><p>Coordinates power the map pin. Leave them empty rather than guessing—the written area and city are enough to save the draft.</p></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepNotice>Click a card to select or remove an amenity. At least one amenity is required before the listing can be submitted for review.</StepNotice>
              <div className="mb-4 flex items-center justify-between gap-4"><p className="text-sm font-black text-white">Available amenities</p><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-black text-cyan-200">{form.amenities.length} selected</span></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(amenityData?.amenities || []).map((amenity) => {
                  const selected = form.amenities.includes(amenity._id)
                  return <button type="button" aria-pressed={selected} key={amenity._id} onClick={() => toggleAmenity(amenity._id)} className={`${choiceClass(selected)} flex items-start justify-between gap-3`}><span><span className="block text-sm font-black">{amenity.name}</span><span className="mt-1 block text-[10px] font-semibold opacity-55">{pretty(amenity.category)}</span></span><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? 'border-cyan-300 bg-cyan-300 text-[#07101e]' : 'border-white/10 bg-white/[0.03] text-transparent'}`}><Check className="h-3.5 w-3.5" /></span></button>
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <StepNotice>These fields power the Gilgit Living Score. Use the real condition of the property—unknown is better than guessing.</StepNotice>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ToggleCard checked={form.heatingAvailable} onChange={(event) => set('heatingAvailable', event.target.checked)} title="Heating" text="A usable heating system is available inside the rental." />
                <ToggleCard checked={form.hotWaterAvailable} onChange={(event) => set('hotWaterAvailable', event.target.checked)} title="Hot water" text="Reliable hot water is available for normal daily use." />
                <ToggleCard checked={form.electricityBackup} onChange={(event) => set('electricityBackup', event.target.checked)} title="Power backup" text="UPS, generator, solar or another backup source is available." />
                <ToggleCard checked={form.winterAccessible} onChange={(event) => set('winterAccessible', event.target.checked)} title="Winter accessible" text="The property remains reasonably reachable during winter conditions." />
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Water availability" hint="Rate the normal reliability of running water at the property."><Select aria-label="Water availability" value={form.waterAvailability} onChange={(event) => set('waterAvailability', event.target.value)}><option value="unknown">Unknown / not confirmed</option><option value="excellent">Excellent — consistently reliable</option><option value="good">Good — usually reliable</option><option value="limited">Limited — available with restrictions</option><option value="unreliable">Unreliable — frequent interruptions</option></Select></Field>
                <Field label="Road access" hint="Rate how easily renters can normally reach the property by road."><Select aria-label="Road access" value={form.roadAccess} onChange={(event) => set('roadAccess', event.target.value)}><option value="unknown">Unknown / not confirmed</option><option value="excellent">Excellent — easy vehicle access</option><option value="good">Good — generally accessible</option><option value="limited">Limited — some access restrictions</option><option value="difficult">Difficult — challenging road access</option></Select></Field>
              </div>
              {!editing && <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.055] p-4"><p className="text-sm font-black text-violet-100">Next: save the draft and add photos</p><p className="mt-1 text-xs leading-5 text-slate-400">Your property record must exist before images can be attached. The next button will create the draft and take you directly to the Images step.</p></div>}
            </div>
          )}

          {step === 6 && (
            <div>
              <StepNotice>Upload at least three clear JPG or PNG photos. Upload one image at a time and keep every image smaller than 1 MB. The first uploaded image becomes the initial cover automatically.</StepNotice>
              {!editing ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-9 text-center"><ImagePlus className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 font-black text-white">Save the listing first</p><p className="mt-1 text-sm text-slate-500">Complete steps 1–6 and save the draft before adding property photos.</p></div>
              ) : (
                <>
                  <div {...getRootProps()} className={`rounded-[28px] border-2 border-dashed p-9 text-center transition ${uploadState.isLoading ? 'cursor-not-allowed border-white/8 bg-white/[0.015] opacity-55' : isDragActive ? 'cursor-pointer border-cyan-300/45 bg-cyan-300/[0.08]' : 'cursor-pointer border-white/12 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-8 w-8 text-cyan-300" />
                    <p className="mt-3 font-black text-white">Drag one photo here or click to choose a file</p>
                    <p className="mt-1 text-xs text-slate-500">JPG or PNG · one image at a time · 1 MB maximum per image · 10 images per property</p>
                  </div>

                  {newFiles.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><p className="text-sm font-black text-cyan-100">{newFiles[0].name}</p><p className="mt-1 text-[11px] text-slate-500">{formatBytes(newFiles[0].size)} · ready to upload</p></div>
                        <PrimaryButton disabled={uploadState.isLoading} onClick={upload}>{uploadState.isLoading ? 'Uploading…' : 'Upload image'}</PrimaryButton>
                      </div>

                      {uploadState.isLoading && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                            <span>{uploadProgress.saving ? 'Upload complete · saving securely…' : `Uploading ${uploadProgress.percent}%`}</span>
                            <span>{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total || newFiles[0].size)}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 transition-[width] duration-200" style={{ width: `${uploadProgress.percent}%` }} /></div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4"><p className="text-sm font-black text-white">Uploaded photos</p><span className={`rounded-full px-3 py-1.5 text-xs font-black ${images.length >= 3 ? 'bg-cyan-300/10 text-cyan-200' : 'bg-amber-300/10 text-amber-200'}`}>{images.length}/3 minimum</span></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {images.map((image) => (
                      <div key={image.id} className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
                        <img src={image.url} alt={image.alt || property.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                        <div className="absolute inset-x-2 bottom-2 flex gap-2">
                          <button type="button" disabled={coverState.isLoading || image.isCover} onClick={() => chooseCover(image.id)} className={`rounded-full px-3 py-2 text-[10px] font-black backdrop-blur-xl ${image.isCover ? 'bg-cyan-300 text-[#07101e]' : 'bg-[#07101e]/80 text-white ring-1 ring-white/15'}`}>{image.isCover ? 'Cover' : 'Set cover'}</button>
                          <button type="button" disabled={deleteState.isLoading} onClick={() => removeImage(image.id)} className="rounded-full bg-[#07101e]/80 px-3 py-2 text-[10px] font-black text-rose-300 ring-1 ring-white/15 backdrop-blur-xl">Delete</button>
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
                <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Listing preview</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{form.title || 'Untitled property'}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{form.description || 'Add a property description.'}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ['Monthly rent', form.monthlyRent ? `PKR ${Number(form.monthlyRent).toLocaleString()}` : '—'],
                    ['Property type', pretty(form.propertyType)],
                    ['Location', form.area ? `${form.area}, ${form.city}` : '—'],
                    ['Bedrooms', form.bedrooms],
                    ['Bathrooms', form.bathrooms],
                    ['Amenities', form.amenities.length],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}
                </div>
              </div>

              <div className="rounded-[26px] border border-cyan-300/15 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.13),transparent_35%),#0a111e] p-5 text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 font-black">Ready for admin review?</p>
                <div className="mt-4 space-y-3 text-xs">
                  {[
                    ['Required listing details complete', [0,1,2,3,4].every((index) => !getStepError(index))],
                    [`At least 3 images (${images.length} uploaded)`, images.length >= 3],
                    ['Exactly one cover image selected', hasCover && images.filter((image) => image.isCover).length === 1],
                    [`At least 1 amenity (${form.amenities.length} selected)`, form.amenities.length >= 1],
                  ].map(([label, ready]) => <div key={label} className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full ${ready ? 'bg-cyan-300 text-[#07101e]' : 'bg-amber-300/10 text-amber-200'}`}>{ready ? <Check className="h-3 w-3" /> : <span className="text-[9px] font-black">!</span>}</span><span className={ready ? 'text-slate-300' : 'text-amber-200'}>{label}</span></div>)}
                </div>
                <p className="mt-4 border-t border-white/[0.07] pt-4 text-xs leading-6 text-slate-500">When everything is ready, return to Your Properties and click “Submit for review”. The property remains a private draft until then.</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <SecondaryButton disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</SecondaryButton>
          <div className="flex flex-col gap-2 sm:flex-row">
            {editing && step <= 5 && <SecondaryButton disabled={saving} onClick={() => save()}>{saving ? 'Saving…' : 'Save changes'}</SecondaryButton>}
            {step < steps.length - 1 && <PrimaryButton disabled={saving || uploadState.isLoading} onClick={nextStep}>{!editing && step === 5 ? 'Save draft & add photos' : step === 6 ? 'Review listing' : 'Continue'}</PrimaryButton>}
            {editing && step === steps.length - 1 && <PrimaryButton onClick={() => navigate('/owner/properties')}>Back to your properties</PrimaryButton>}
          </div>
        </div>
      </Panel>
    </>
  )
}
