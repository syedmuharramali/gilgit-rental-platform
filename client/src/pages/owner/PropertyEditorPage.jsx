import { CheckCircle2, ImagePlus, MapPin, ShieldCheck, UploadCloud } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, Panel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput, pretty } from '../../components/workspace/WorkspaceUI'
import { useGetAmenitiesQuery } from '../../features/amenities/amenitiesApi'
import {
  useCreatePropertyMutation,
  useDeletePropertyImageMutation,
  useGetPropertyQuery,
  useSetCoverImageMutation,
  useUpdatePropertyMutation,
  useUploadPropertyImagesMutation,
} from '../../features/properties/propertiesApi'

const blank = {
  title: '', description: '', propertyType: 'apartment', monthlyRent: '', securityDeposit: '0', negotiable: false,
  availableFrom: new Date().toISOString().slice(0, 10), minimumStayMonths: '1', bedrooms: '1', bathrooms: '1', floor: '',
  totalAreaValue: '', totalAreaUnit: 'sqft', furnishedStatus: 'unfurnished', maxOccupants: '1', area: '', street: '', city: 'Gilgit', landmark: '',
  latitude: '', longitude: '', amenities: [], heatingAvailable: false, hotWaterAvailable: false, electricityBackup: false,
  waterAvailability: 'unknown', roadAccess: 'unknown', winterAccessible: true,
}

const steps = ['Basics', 'Pricing', 'Details', 'Location', 'Amenities', 'Living score', 'Images', 'Review']
const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'
const choiceClass = (active) => `rounded-2xl border p-4 text-left text-sm font-black transition ${active ? 'border-cyan-300/30 bg-cyan-300/[0.09] text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,.06)]' : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.045] hover:text-slate-200'}`

export default function PropertyEditorPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(blank)
  const [newFiles, setNewFiles] = useState([])
  const { data: property, isLoading } = useGetPropertyQuery(id, { skip: !editing })
  const { data: amenityData } = useGetAmenitiesQuery()
  const [createProperty, createState] = useCreatePropertyMutation()
  const [updateProperty, updateState] = useUpdatePropertyMutation()
  const [uploadImages, uploadState] = useUploadPropertyImagesMutation()
  const [setCover, coverState] = useSetCoverImageMutation()
  const [deleteImage, deleteState] = useDeletePropertyImageMutation()
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] }, maxFiles: 8, maxSize: 5 * 1024 * 1024, onDrop: setNewFiles,
  })

  useEffect(() => {
    if (!property) return
    setForm({
      title: property.title || '', description: property.description || '', propertyType: property.propertyType || 'apartment', monthlyRent: String(property.monthlyRent ?? ''), securityDeposit: String(property.securityDeposit ?? 0), negotiable: Boolean(property.negotiable),
      availableFrom: property.availableFrom ? property.availableFrom.slice(0, 10) : blank.availableFrom, minimumStayMonths: String(property.minimumStayMonths ?? 1), bedrooms: String(property.bedrooms ?? 0), bathrooms: String(property.bathrooms ?? 0), floor: property.floor == null ? '' : String(property.floor),
      totalAreaValue: property.totalArea?.value == null ? '' : String(property.totalArea.value), totalAreaUnit: property.totalArea?.unit || 'sqft', furnishedStatus: property.furnishedStatus || 'unfurnished', maxOccupants: String(property.maxOccupants ?? 1), area: property.address?.area || '', street: property.address?.street || '', city: property.address?.city || 'Gilgit', landmark: property.address?.landmark || '',
      latitude: property.address?.latitude == null ? '' : String(property.address.latitude), longitude: property.address?.longitude == null ? '' : String(property.address.longitude), amenities: (property.amenities || []).map((amenity) => amenity._id || amenity), heatingAvailable: Boolean(property.livingInfo?.heatingAvailable), hotWaterAvailable: Boolean(property.livingInfo?.hotWaterAvailable), electricityBackup: Boolean(property.livingInfo?.electricityBackup), waterAvailability: property.livingInfo?.waterAvailability || 'unknown', roadAccess: property.livingInfo?.roadAccess || 'unknown', winterAccessible: property.livingInfo?.winterAccessible !== false,
    })
  }, [property])

  const payload = useMemo(() => ({
    title: form.title.trim(), description: form.description.trim(), propertyType: form.propertyType,
    monthlyRent: Number(form.monthlyRent), securityDeposit: Number(form.securityDeposit || 0), negotiable: form.negotiable,
    availableFrom: form.availableFrom, minimumStayMonths: Number(form.minimumStayMonths), bedrooms: Number(form.bedrooms || 0), bathrooms: Number(form.bathrooms || 0), floor: form.floor === '' ? null : Number(form.floor),
    totalArea: { value: form.totalAreaValue === '' ? null : Number(form.totalAreaValue), unit: form.totalAreaUnit }, furnishedStatus: form.furnishedStatus, maxOccupants: Number(form.maxOccupants || 1), amenities: form.amenities,
    address: { area: form.area.trim(), street: form.street.trim() || null, city: form.city.trim() || 'Gilgit', landmark: form.landmark.trim() || null, latitude: form.latitude === '' ? null : Number(form.latitude), longitude: form.longitude === '' ? null : Number(form.longitude) },
    livingInfo: { heatingAvailable: form.heatingAvailable, hotWaterAvailable: form.hotWaterAvailable, electricityBackup: form.electricityBackup, waterAvailability: form.waterAvailability, roadAccess: form.roadAccess, winterAccessible: form.winterAccessible },
  }), [form])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleAmenity = (amenityId) => set('amenities', form.amenities.includes(amenityId) ? form.amenities.filter((value) => value !== amenityId) : [...form.amenities, amenityId])

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.monthlyRent || !form.area.trim()) {
      toast.error('Add a title, description, monthly rent and area before saving')
      return
    }
    try {
      const result = editing ? await updateProperty({ id, ...payload }).unwrap() : await createProperty(payload).unwrap()
      const propertyId = editing ? id : result?.data?.property?._id || result?.property?._id
      toast.success(editing ? 'Property updated' : 'Property created')
      if (!editing && propertyId) navigate(`/owner/properties/${propertyId}/edit`, { replace: true })
    } catch (error) { toast.error(errorMessage(error)) }
  }

  const upload = async () => {
    if (!newFiles.length || !id) return
    try {
      await uploadImages({ id, files: newFiles }).unwrap()
      setNewFiles([])
      toast.success('Property images uploaded')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  const chooseCover = async (imageId) => {
    try { await setCover({ id, imageId }).unwrap(); toast.success('Cover image updated') } catch (error) { toast.error(errorMessage(error)) }
  }

  const removeImage = async (imageId) => {
    try { await deleteImage({ id, imageId }).unwrap(); toast.success('Image removed') } catch (error) { toast.error(errorMessage(error)) }
  }

  if (editing && isLoading) return <LoadingState />

  return (
    <>
      <PageHeader eyebrow="Property studio" title={editing ? 'Edit property' : 'Create property'} text="Build a complete listing in focused steps, then submit it for administrator review from your properties workspace." />

      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {steps.map((label, index) => (
            <button key={label} type="button" onClick={() => setStep(index)} aria-current={step === index ? 'step' : undefined} className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${step === index ? 'border-cyan-300/30 bg-gradient-to-r from-cyan-300/15 via-blue-400/12 to-violet-500/12 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,.06)]' : 'border-white/[0.08] bg-white/[0.025] text-slate-500 hover:border-white/15 hover:text-slate-300'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] ${step > index ? 'bg-cyan-300 text-[#07101e]' : step === index ? 'bg-cyan-300/15 text-cyan-200' : 'bg-white/[0.06] text-slate-500'}`}>{step > index ? <CheckCircle2 className="h-3 w-3" /> : index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-cyan-300">Step {step + 1} of {steps.length}</p><h2 className="mt-1 text-xl font-black text-white">{steps[step]}</h2></div>
          <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.06] sm:block"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
          {step === 0 && <div className="grid gap-4"><TextInput value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Property title" /><TextArea value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Describe the property, surroundings and ideal renter" /><Select value={form.propertyType} onChange={(event) => set('propertyType', event.target.value)}>{['hostel','hostel_bed','shared_room','private_room','apartment','house','upper_portion','lower_portion','studio'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select></div>}

          {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><TextInput type="number" min="0" value={form.monthlyRent} onChange={(event) => set('monthlyRent', event.target.value)} placeholder="Monthly rent" /><TextInput type="number" min="0" value={form.securityDeposit} onChange={(event) => set('securityDeposit', event.target.value)} placeholder="Security deposit" /><label className={choiceClass(form.negotiable)}><span className="flex items-center gap-3"><input type="checkbox" checked={form.negotiable} onChange={(event) => set('negotiable', event.target.checked)} className="accent-cyan-300" /> Rent is negotiable</span></label><TextInput type="date" value={form.availableFrom} onChange={(event) => set('availableFrom', event.target.value)} /></div>}

          {step === 2 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><TextInput type="number" min="1" value={form.minimumStayMonths} onChange={(event) => set('minimumStayMonths', event.target.value)} placeholder="Minimum stay months" /><TextInput type="number" min="0" value={form.bedrooms} onChange={(event) => set('bedrooms', event.target.value)} placeholder="Bedrooms" /><TextInput type="number" min="0" value={form.bathrooms} onChange={(event) => set('bathrooms', event.target.value)} placeholder="Bathrooms" /><TextInput type="number" value={form.floor} onChange={(event) => set('floor', event.target.value)} placeholder="Floor" /><TextInput type="number" min="0" value={form.totalAreaValue} onChange={(event) => set('totalAreaValue', event.target.value)} placeholder="Total area" /><Select value={form.totalAreaUnit} onChange={(event) => set('totalAreaUnit', event.target.value)}>{['sqft','sqm','kanal','marla'].map((value) => <option key={value} value={value}>{value}</option>)}</Select><Select value={form.furnishedStatus} onChange={(event) => set('furnishedStatus', event.target.value)}>{['furnished','semi_furnished','unfurnished'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</Select><TextInput type="number" min="1" value={form.maxOccupants} onChange={(event) => set('maxOccupants', event.target.value)} placeholder="Max occupants" /></div>}

          {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><TextInput value={form.area} onChange={(event) => set('area', event.target.value)} placeholder="Area / neighbourhood" /><TextInput value={form.street} onChange={(event) => set('street', event.target.value)} placeholder="Street" /><TextInput value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="City" /><TextInput value={form.landmark} onChange={(event) => set('landmark', event.target.value)} placeholder="Landmark" /><TextInput type="number" step="any" value={form.latitude} onChange={(event) => set('latitude', event.target.value)} placeholder="Latitude" /><TextInput type="number" step="any" value={form.longitude} onChange={(event) => set('longitude', event.target.value)} placeholder="Longitude" /><div className="sm:col-span-2 rounded-[22px] border border-cyan-300/15 bg-cyan-300/[0.055] p-4 text-sm leading-6 text-cyan-100/75"><MapPin className="mb-2 h-4 w-4 text-cyan-300" /> Coordinates are optional and power the property map when supplied. Leave them empty rather than guessing.</div></div>}

          {step === 4 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(amenityData?.amenities || []).map((amenity) => <button type="button" aria-pressed={form.amenities.includes(amenity._id)} key={amenity._id} onClick={() => toggleAmenity(amenity._id)} className={choiceClass(form.amenities.includes(amenity._id))}>{amenity.name}<p className="mt-1 text-[10px] font-semibold opacity-55">{pretty(amenity.category)}</p></button>)}</div>}

          {step === 5 && <div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['heatingAvailable','Heating'],['hotWaterAvailable','Hot water'],['electricityBackup','Power backup'],['winterAccessible','Winter accessible']].map(([key, label]) => <label key={key} className={choiceClass(form[key])}><span className="flex items-center gap-3"><input type="checkbox" checked={form[key]} onChange={(event) => set(key, event.target.checked)} className="accent-cyan-300" />{label}</span></label>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Select value={form.waterAvailability} onChange={(event) => set('waterAvailability', event.target.value)}>{['excellent','good','limited','unreliable','unknown'].map((value) => <option key={value} value={value}>Water: {pretty(value)}</option>)}</Select><Select value={form.roadAccess} onChange={(event) => set('roadAccess', event.target.value)}>{['excellent','good','limited','difficult','unknown'].map((value) => <option key={value} value={value}>Road: {pretty(value)}</option>)}</Select></div></div>}

          {step === 6 && <div>{!editing ? <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-9 text-center"><ImagePlus className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 font-black text-white">Save the listing first</p><p className="mt-1 text-sm text-slate-500">Images attach after the property record exists.</p></div> : <><div {...getRootProps()} className={`cursor-pointer rounded-[28px] border-2 border-dashed p-9 text-center transition ${isDragActive ? 'border-cyan-300/45 bg-cyan-300/[0.08]' : 'border-white/12 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'}`}><input {...getInputProps()} /><UploadCloud className="mx-auto h-8 w-8 text-cyan-300" /><p className="mt-3 font-black text-white">Drop JPG or PNG property photos here</p><p className="mt-1 text-xs text-slate-500">Up to 8 files per upload, 5 MB each</p></div>{newFiles.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] p-4"><p className="text-sm font-bold text-cyan-100">{newFiles.length} image(s) ready</p><PrimaryButton disabled={uploadState.isLoading} onClick={upload}>Upload images</PrimaryButton></div>}<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(property?.images || []).map((image) => <div key={image.id} className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]"><img src={image.url} alt={image.alt || property.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" /><div className="absolute inset-x-2 bottom-2 flex gap-2"><button type="button" disabled={coverState.isLoading || image.isCover} onClick={() => chooseCover(image.id)} className={`rounded-full px-3 py-2 text-[10px] font-black backdrop-blur-xl ${image.isCover ? 'bg-cyan-300 text-[#07101e]' : 'bg-[#07101e]/80 text-white ring-1 ring-white/15'}`}>{image.isCover ? 'Cover' : 'Set cover'}</button><button type="button" disabled={deleteState.isLoading} onClick={() => removeImage(image.id)} className="rounded-full bg-[#07101e]/80 px-3 py-2 text-[10px] font-black text-rose-300 ring-1 ring-white/15 backdrop-blur-xl">Delete</button></div></div>)}</div></>}</div>}

          {step === 7 && <div className="grid gap-5 lg:grid-cols-[1fr_.7fr]"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Listing preview</p><h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{form.title || 'Untitled property'}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{form.description || 'Add a property description.'}</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Rent',form.monthlyRent ? `PKR ${form.monthlyRent}` : '—'],['Type',pretty(form.propertyType)],['Area',form.area || '—'],['Amenities',form.amenities.length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}</div></div><div className="rounded-[26px] border border-cyan-300/15 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.13),transparent_35%),#0a111e] p-5 text-white"><ShieldCheck className="h-5 w-5 text-cyan-300" /><p className="mt-3 font-black">Before admin review</p><p className="mt-2 text-xs leading-6 text-slate-400">Save all details, add at least three images, choose exactly one cover image and select at least one amenity. Then submit from the properties page.</p></div></div>}
        </motion.div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <SecondaryButton disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</SecondaryButton>
          <div className="flex flex-col gap-2 sm:flex-row"><PrimaryButton disabled={createState.isLoading || updateState.isLoading} onClick={save}>{editing ? 'Save changes' : 'Create property'}</PrimaryButton>{step < steps.length - 1 && <SecondaryButton onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>Next step</SecondaryButton>}</div>
        </div>
      </Panel>
    </>
  )
}
