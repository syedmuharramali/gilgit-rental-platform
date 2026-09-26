import {
  ArrowDownToLine,
  ArrowUpToLine,
  BedDouble,
  BedSingle,
  Building2,
  Check,
  CheckCircle2,
  DoorOpen,
  Home,
  Hotel,
  ImagePlus,
  Info,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sofa,
  Store,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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
import {
  HEATING_TYPES,
  HOSTEL_FOR,
  POWER_BACKUPS,
  TENANT_TYPES,
  TYPE_GROUPS,
  WATER_SOURCES,
  amenityFitsType,
  fieldsFor,
} from '../../utils/listingFields'
import { PROPERTY_TYPES, isLegacyPropertyType, isStayType } from '../../utils/propertyTypes'

const LocationPicker = lazy(() => import('../../components/properties/LocationPicker'))

/*
 * Add / edit a listing, type first:
 *
 *   0 Type        what is being listed; decides every later question
 *   1 Location    area + map pin
 *   2 About       title, description and the details for this type
 *   3 Utilities   winter & utility facts (all optional)
 *   4 Price       monthly rent and terms, or room types for a stay
 *   5 Photos      needs a saved draft
 *   6 Review
 *
 * Which details each type asks for lives in utils/listingFields.js (the
 * server uses the same list to clear the rest and to check required ones).
 */
const STEP = { type: 0, location: 1, about: 2, utilities: 3, price: 4, photos: 5, review: 6 }
const stepKeys = ['type', 'location', 'about', 'utilities', 'price', 'photos', 'review']
const LAST_DETAILS_STEP = STEP.price

const ONE_MB = 1024 * 1024
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const TYPE_ICONS = {
  house: Home,
  upper_portion: ArrowUpToLine,
  lower_portion: ArrowDownToLine,
  apartment: Building2,
  studio: Sofa,
  hostel: BedDouble,
  hostel_bed: BedSingle,
  shop: Store,
  hotel: Hotel,
  guest_house: DoorOpen,
}

const blank = {
  propertyType: '',
  title: '',
  description: '',
  // Location
  area: '',
  street: '',
  city: 'Gilgit',
  landmark: '',
  latitude: '',
  longitude: '',
  // About (only the fields the type asks for are shown and sent)
  bedrooms: '',
  bathrooms: '',
  floor: '',
  totalAreaValue: '',
  totalAreaUnit: '',
  furnishedStatus: 'unfurnished',
  maxOccupants: '', // empty = no limit
  tenantTypes: [], // empty = anyone
  separateEntrance: null, // null = not said
  separateMeters: null,
  hostelFor: null,
  bedsPerRoom: '',
  mealsIncluded: null,
  marketName: '',
  amenities: [],
  // Winter & utilities: empty / null = not said
  heatingTypes: [],
  hotWaterAvailable: null,
  powerBackups: [],
  waterSources: [],
  waterAvailability: 'unknown',
  roadAccess: 'unknown',
  winterAccessible: null,
  // Monthly price & terms
  monthlyRent: '',
  securityDeposit: '0',
  negotiable: false,
  availableFrom: '', // the viewer's local today when the page opens
  minimumStayMonths: '1',
  // Stays (hotels, guest houses)
  roomTypes: [],
  checkInTime: '14:00',
  checkOutTime: '12:00',
}

const errorMessage = (error, t) => error?.data?.message || error?.error || t('common.somethingWrong')
const choiceClass = (active) => `rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-300/35 bg-cyan-300/[0.09] text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,.06)]' : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.045] hover:text-slate-200'}`
const chipClass = (active) => `inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-black transition ${active ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-100' : 'border-white/[0.09] bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-slate-200'}`
const formatBytes = (bytes = 0) => bytes < ONE_MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / ONE_MB).toFixed(2)} MB`
const numberOrNull = (value) => (value === '' || value == null ? null : Number(value))
const toggleIn = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
const isHostel = (type) => type === 'hostel' || type === 'hostel_bed'

// Shape the form into the API payload (also used to tell whether anything
// changed since the last save). Questions the type doesn't ask are sent
// empty, matching what the server keeps.
const buildPayload = (f) => {
  const stay = isStayType(f.propertyType)
  const fields = fieldsFor(f.propertyType)
  const asks = (field) => fields.about.includes(field)
  const util = (key) => fields.utilities.includes(key)
  const heatingTypes = util('heating') ? f.heatingTypes : []
  const powerBackups = util('power') ? f.powerBackups : []

  return {
    title: f.title.trim(),
    description: f.description.trim(),
    propertyType: f.propertyType,
    monthlyRent: stay ? 0 : Number(f.monthlyRent),
    securityDeposit: stay ? 0 : Number(f.securityDeposit || 0),
    negotiable: stay ? false : f.negotiable,
    availableFrom: f.availableFrom,
    minimumStayMonths: stay ? 1 : Number(f.minimumStayMonths),
    bedrooms: asks('bedrooms') ? Number(f.bedrooms || 0) : 0,
    bathrooms: asks('bathrooms') ? Number(f.bathrooms || 0) : 0,
    floor: asks('floor') ? numberOrNull(f.floor) : null,
    totalArea: {
      value: asks('size') ? numberOrNull(f.totalAreaValue) : null,
      unit: f.totalAreaUnit || fields.areaUnits[0] || 'sqft',
    },
    furnishedStatus: asks('furnishing') ? f.furnishedStatus : isHostel(f.propertyType) ? 'furnished' : 'unfurnished',
    maxOccupants: asks('maxOccupants') ? numberOrNull(f.maxOccupants) : f.propertyType === 'hostel_bed' || f.propertyType === 'shop' ? 1 : null,
    tenantTypes: asks('tenantTypes') ? f.tenantTypes : [],
    separateEntrance: asks('separateEntrance') ? f.separateEntrance : null,
    separateMeters: asks('separateMeters') ? f.separateMeters : null,
    hostelFor: asks('hostelFor') ? f.hostelFor : null,
    bedsPerRoom: asks('bedsPerRoom') ? numberOrNull(f.bedsPerRoom) : null,
    mealsIncluded: asks('mealsIncluded') ? f.mealsIncluded : null,
    marketName: asks('marketName') ? f.marketName.trim() || null : null,
    amenities: f.amenities,
    address: {
      area: f.area.trim(),
      street: f.street.trim() || null,
      city: f.city.trim() || 'Gilgit',
      landmark: f.landmark.trim() || null,
      latitude: numberOrNull(f.latitude),
      longitude: numberOrNull(f.longitude),
    },
    livingInfo: {
      heatingTypes,
      heatingAvailable: heatingTypes.some((value) => value !== 'none'),
      hotWaterAvailable: util('hotWater') ? f.hotWaterAvailable : false,
      powerBackups,
      electricityBackup: powerBackups.some((value) => value !== 'none'),
      waterSources: util('waterSources') ? f.waterSources : [],
      waterAvailability: f.waterAvailability,
      roadAccess: f.roadAccess,
      winterAccessible: f.winterAccessible,
    },
    ...(stay && {
      roomTypes: f.roomTypes.map((room) => ({
        ...(room._id && { _id: room._id }),
        name: room.name.trim(),
        description: room.description.trim() || null,
        nightlyPrice: Number(room.nightlyPrice),
        maxGuests: Number(room.maxGuests),
        quantity: Number(room.quantity),
      })),
      checkInTime: f.checkInTime,
      checkOutTime: f.checkOutTime,
    }),
  }
}

const fromServer = (property) => {
  const living = property.livingInfo || {}
  // Listings saved before the "kind of heating / backup" questions only have
  // a yes/no; show a yes as "Other" so saving doesn't turn it into a no.
  const legacyList = (list, flag) => (list?.length ? list : flag ? ['other'] : [])
  const text = (value) => (value == null ? '' : String(value))

  return {
    // A retired type (private/shared room) starts empty so the owner must choose.
    propertyType: isLegacyPropertyType(property.propertyType) ? '' : property.propertyType || '',
    title: property.title || '',
    description: property.description || '',
    area: property.address?.area || '',
    street: property.address?.street || '',
    city: property.address?.city || 'Gilgit',
    landmark: property.address?.landmark || '',
    latitude: text(property.address?.latitude),
    longitude: text(property.address?.longitude),
    bedrooms: property.bedrooms ? String(property.bedrooms) : '',
    bathrooms: property.bathrooms ? String(property.bathrooms) : '',
    floor: text(property.floor),
    totalAreaValue: text(property.totalArea?.value),
    totalAreaUnit: property.totalArea?.unit || '',
    furnishedStatus: property.furnishedStatus || 'unfurnished',
    maxOccupants: text(property.maxOccupants),
    tenantTypes: property.tenantTypes || [],
    separateEntrance: property.separateEntrance ?? null,
    separateMeters: property.separateMeters ?? null,
    hostelFor: property.hostelFor ?? null,
    bedsPerRoom: text(property.bedsPerRoom),
    mealsIncluded: property.mealsIncluded ?? null,
    marketName: property.marketName || '',
    amenities: (property.amenities || []).map((amenity) => amenity._id || amenity),
    heatingTypes: legacyList(living.heatingTypes, living.heatingAvailable),
    hotWaterAvailable: living.hotWaterAvailable ?? null,
    powerBackups: legacyList(living.powerBackups, living.electricityBackup),
    waterSources: living.waterSources || [],
    waterAvailability: living.waterAvailability || 'unknown',
    roadAccess: living.roadAccess || 'unknown',
    winterAccessible: living.winterAccessible ?? null,
    monthlyRent: property.monthlyRent ? String(property.monthlyRent) : '',
    securityDeposit: String(property.securityDeposit ?? 0),
    negotiable: Boolean(property.negotiable),
    availableFrom: property.availableFrom ? property.availableFrom.slice(0, 10) : localToday(),
    minimumStayMonths: String(property.minimumStayMonths ?? 1),
    roomTypes: (property.roomTypes || []).map((room) => ({
      _id: room._id,
      name: room.name || '',
      description: room.description || '',
      nightlyPrice: text(room.nightlyPrice),
      maxGuests: String(room.maxGuests ?? 1),
      quantity: String(room.quantity ?? 1),
    })),
    checkInTime: property.checkInTime || '14:00',
    checkOutTime: property.checkOutTime || '12:00',
  }
}

const blankRoomType = () => ({ _id: null, name: '', description: '', nightlyPrice: '', maxGuests: '2', quantity: '1' })

/* ---------- small form pieces ---------- */

// A <label> around one input. `group` is for sets of buttons (chips, yes/no,
// counters): a label would forward clicks on its text to the first button.
function Field({ label, hint, required = false, optional = false, optionalLabel = '', group = false, children, className = '' }) {
  const labelId = useId()
  const Wrapper = group ? 'div' : 'label'
  const groupProps = group ? { role: 'group', 'aria-labelledby': labelId } : {}

  return (
    <Wrapper className={`block ${className}`} {...groupProps}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span id={labelId} className="text-xs font-black text-slate-200">
          {label}
          {required && <span className="ml-1 text-cyan-300">*</span>}
        </span>
        {optional && <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">{optionalLabel}</span>}
      </div>
      {children}
      {hint && <p className="mt-2 text-[11px] leading-5 text-slate-500">{hint}</p>}
    </Wrapper>
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

function SectionTitle({ children }) {
  return <p className="mb-3 mt-8 text-[10px] font-black uppercase tracking-[.17em] text-slate-500 first:mt-0">{children}</p>
}

// − 3 +. Starts empty ("—"); the first + gives `start`. With an emptyLabel
// the field is optional: going below `min` empties it again.
function Counter({ value, onChange, min = 0, max = 20, start = Math.max(min, 1), emptyLabel = null, format = (number) => number, label }) {
  const number = value === '' ? null : Number(value)
  const step = (delta) => {
    if (number === null) {
      if (delta > 0) onChange(String(start))
      return
    }
    const next = number + delta
    if (next < min) onChange(emptyLabel === null ? String(min) : '')
    else onChange(String(Math.min(max, next)))
  }

  return (
    <div className="flex h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-1.5" role="group" aria-label={label}>
      <button type="button" onClick={() => step(-1)} disabled={number === null} aria-label={`− ${label}`} className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-30"><Minus className="h-4 w-4" /></button>
      <span className="min-w-12 text-center text-sm font-black text-white">{number === null ? emptyLabel ?? '—' : format(number)}</span>
      <button type="button" onClick={() => step(1)} disabled={number !== null && number >= max} aria-label={`+ ${label}`} className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-30"><Plus className="h-4 w-4" /></button>
    </div>
  )
}

// Yes / No, tap the chosen one again to go back to "not said".
function YesNo({ value, onChange, yes, no }) {
  return (
    <div className="flex gap-2">
      {[[true, yes], [false, no]].map(([option, label]) => (
        <button key={label} type="button" aria-pressed={value === option} onClick={() => onChange(value === option ? null : option)} className={chipClass(value === option)}>
          {value === option && <Check className="h-3.5 w-3.5" />}{label}
        </button>
      ))}
    </div>
  )
}

function Chips({ options, selected, onToggle, labelFor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button key={option} type="button" aria-pressed={active} onClick={() => onToggle(option)} className={chipClass(active)}>
            {active && <Check className="h-3.5 w-3.5" />}{labelFor(option)}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- page ---------- */

export default function PropertyEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const requestedStep = Number(new URLSearchParams(location.search).get('step'))
  const initialStep = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < stepKeys.length ? requestedStep : 0

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
    const hydrated = fromServer(property)
    // What the server has, so edit mode knows whether there is anything to save.
    savedPayload.current = JSON.stringify(buildPayload(hydrated))
    setForm(hydrated)
  }, [property])

  const payload = useMemo(() => buildPayload(form), [form])
  const payloadKey = useMemo(() => JSON.stringify(payload), [payload])
  const isDirty = editing && savedPayload.current !== null && payloadKey !== savedPayload.current

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: toggleIn(current[key], value) }))

  const type = form.propertyType
  const fields = fieldsFor(type)
  const asks = (field) => fields.about.includes(field)
  const requires = (field) => fields.required.includes(field)
  const util = (key) => fields.utilities.includes(key)
  const isStay = isStayType(type)
  const isShop = type === 'shop'
  const areaUnit = form.totalAreaUnit || fields.areaUnits[0] || 'sqft'

  const stepLabelKey = (key) => (isStay && key === 'price' ? 'rooms' : key)
  const steps = stepKeys.map((key) => ({ key, title: t(`ed.step.${stepLabelKey(key)}`), text: t(`ed.step.${stepLabelKey(key)}Text`) }))

  const chooseType = (value) => setForm((current) => {
    if (value === current.propertyType) return current
    const before = fieldsFor(current.propertyType)
    const unit = current.totalAreaUnit || before.areaUnits[0] || ''
    const unitFits = fieldsFor(value).areaUnits.includes(unit)
    return {
      ...current,
      propertyType: value,
      // A shop or hostel bed is saved with room for 1; don't carry that
      // hidden value into a house's "most people allowed".
      maxOccupants: before.about.includes('maxOccupants') ? current.maxOccupants : '',
      // Each type has its own size units (marla for a house, sq ft for a
      // shop); "10 kanal" must not quietly become "10 sq ft".
      totalAreaUnit: unitFits ? unit : '',
      totalAreaValue: unitFits ? current.totalAreaValue : '',
    }
  })

  const setRoom = (index, key, value) => setForm((current) => ({ ...current, roomTypes: current.roomTypes.map((room, roomIndex) => (roomIndex === index ? { ...room, [key]: value } : room)) }))
  const addRoom = () => setForm((current) => ({ ...current, roomTypes: [...current.roomTypes, blankRoomType()] }))
  const removeRoom = (index) => setForm((current) => ({ ...current, roomTypes: current.roomTypes.filter((_, roomIndex) => roomIndex !== index) }))

  // "No heating" / "No backup" can't be picked together with a kind.
  const toggleWithNone = (key, value) => setForm((current) => {
    if (value === 'none') return { ...current, [key]: current[key].includes('none') ? [] : ['none'] }
    return { ...current, [key]: toggleIn(current[key].filter((item) => item !== 'none'), value) }
  })

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

  // Amenities that fit this type, plus any the listing already has.
  const amenityOptions = (amenityData?.amenities || []).filter((amenity) => amenityFitsType(amenity, type) || form.amenities.includes(amenity._id))

  const inRange = (value, min, max) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max)

  const getStepError = (index) => {
    if (index === STEP.type) {
      if (!PROPERTY_TYPES.includes(type)) return t('ed.err.type')
    }

    if (index === STEP.location) {
      if (!form.area.trim()) return t('ed.err.areaRequired')
      if (!form.city.trim()) return t('ed.err.cityRequired')
      if (form.latitude === '' || form.longitude === '') return t('ed.err.pin')
      if (Number(form.latitude) < -90 || Number(form.latitude) > 90 || Number(form.longitude) < -180 || Number(form.longitude) > 180) return t('ed.err.pinInvalid')
    }

    if (index === STEP.about) {
      if (form.title.trim().length < 5) return t('ed.err.title')
      if (form.description.trim().length < 20) return t('ed.err.description')
      if (requires('bedrooms') && !(Number(form.bedrooms) >= 1)) return t('ed.err.bedroomsRequired')
      if (requires('bathrooms') && !(Number(form.bathrooms) >= 1)) return t('ed.err.bathroomsRequired')
      if (requires('hostelFor') && !form.hostelFor) return t('ed.err.hostelFor')
      if (requires('size') && !(Number(form.totalAreaValue) > 0)) return t('ed.err.shopArea')
      if (asks('size') && !inRange(form.totalAreaValue, 0, 1000000)) return t('ed.err.area')
      if (asks('bedsPerRoom') && !inRange(form.bedsPerRoom, 1, 20)) return t('ed.err.bedsPerRoom')
      if (asks('maxOccupants') && !(inRange(form.maxOccupants, 1, 100) && (form.maxOccupants === '' || Number.isInteger(Number(form.maxOccupants))))) return t('ed.err.occupants')
      if (asks('floor') && !inRange(form.floor, -2, 50)) return t('ed.err.floor')
    }

    if (index === STEP.price && isStay) {
      if (form.roomTypes.length === 0) return t('ed.err.noRooms')
      for (const room of form.roomTypes) {
        if (room.name.trim().length < 2) return t('ed.err.roomName')
        if (room.nightlyPrice === '' || !(Number(room.nightlyPrice) >= 0)) return t('ed.err.roomPrice', { name: room.name.trim() })
        if (!(Number(room.maxGuests) >= 1 && Number(room.maxGuests) <= 20)) return t('ed.err.roomGuests', { name: room.name.trim() })
        if (!(Number.isInteger(Number(room.quantity)) && Number(room.quantity) >= 1 && Number(room.quantity) <= 500)) return t('ed.err.roomQuantity', { name: room.name.trim() })
      }
      if (!TIME.test(form.checkInTime) || !TIME.test(form.checkOutTime)) return t('ed.err.times')
    }

    if (index === STEP.price && !isStay) {
      if (form.monthlyRent === '' || !(Number(form.monthlyRent) >= 0)) return t('ed.err.rent')
      if (!(Number(form.securityDeposit || 0) >= 0)) return t('ed.err.deposit')
      if (!form.availableFrom) return t('ed.err.availableFrom')
      const months = Number(form.minimumStayMonths)
      if (!Number.isInteger(months) || months < 1 || months > 120) return t('ed.err.stay')
    }

    if (index === STEP.photos && editing && (property?.images?.length || 0) < 3) {
      return t('ed.err.images')
    }

    return null
  }

  const detailsReady = () => [STEP.type, STEP.location, STEP.about, STEP.price].every((index) => !getStepError(index))

  const completion = [
    !getStepError(STEP.type),
    !getStepError(STEP.location),
    !getStepError(STEP.about),
    step > STEP.utilities || editing,
    !getStepError(STEP.price),
    editing && (property?.images?.length || 0) >= 3,
    false,
  ]

  const save = async ({ goToImages = false } = {}) => {
    for (let index = 0; index <= LAST_DETAILS_STEP; index += 1) {
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

      // Rooms added in this session get their ids from the server. Keep them,
      // or the next save would send those rooms as brand-new ones and
      // bookings pointing at them would look "removed".
      const savedRooms = result?.data?.property?.roomTypes || result?.property?.roomTypes
      if (editing && isStay && Array.isArray(savedRooms) && form.roomTypes.some((room) => !room._id)) {
        const synced = { ...form, roomTypes: form.roomTypes.map((room, index) => ({ ...room, _id: room._id || savedRooms[index]?._id || null })) }
        savedPayload.current = JSON.stringify(buildPayload(synced))
        setForm(synced)
      }
      toast.success(editing ? t('ed.toast.saved') : t('ed.toast.created'))

      if (!editing && propertyId) {
        navigate(`/owner/properties/${propertyId}/edit${goToImages ? `?step=${STEP.photos}` : ''}`, { replace: true })
        if (goToImages) setStep(STEP.photos)
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

    if (!editing && target >= STEP.photos) {
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

    if (!editing && step === LAST_DETAILS_STEP) {
      await save({ goToImages: true })
      return
    }

    // In edit mode, leaving the details steps saves them, so the photo and
    // review steps never sit on top of unsaved changes.
    if (editing && step === LAST_DETAILS_STEP && isDirty) {
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
  const optional = { optional: true, optionalLabel: t('ed.optional') }
  const rent = Number(form.monthlyRent) || 0

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
            const locked = !editing && index >= STEP.photos
            return (
              <button
                key={item.key}
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
          {step === STEP.type && (
            <div>
              {editing && property && isLegacyPropertyType(property.propertyType) && <StepNotice>{t('ed.err.type')}</StepNotice>}
              {TYPE_GROUPS.map((group) => (
                <div key={group.key}>
                  <SectionTitle>{t(`ed.group.${group.key}`)}</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.types.map((value) => {
                      const Icon = TYPE_ICONS[value] || Home
                      const active = type === value
                      return (
                        <button key={value} type="button" aria-pressed={active} onClick={() => chooseType(value)} className={`${choiceClass(active)} flex items-start gap-3`}>
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? 'bg-cyan-300 text-[#07101e]' : 'bg-white/[0.05] text-slate-300'}`}><Icon className="h-5 w-5" /></span>
                          <span>
                            <span className="block text-sm font-black">{pretty(value)}</span>
                            <span className="mt-1 block text-[11px] font-medium leading-5 opacity-65">{t(`ed.typeHint.${value}`)}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === STEP.location && (
            <div>
              <StepNotice>{t('ed.notice.location')}</StepNotice>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('ed.field.area')} required hint={t('ed.field.areaHint')}><TextInput value={form.area} onChange={(event) => set('area', event.target.value)} placeholder="Jutial" /></Field>
                <Field label={t('ed.field.street')} {...optional} hint={t('ed.field.streetHint')}><TextInput value={form.street} onChange={(event) => set('street', event.target.value)} placeholder="Main Jutial Road" /></Field>
                <Field label={t('ed.field.city')} required hint={t('ed.field.cityHint')}><TextInput value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Gilgit" /></Field>
                <Field label={t('ed.field.landmark')} {...optional} hint={t('ed.field.landmarkHint')}><TextInput value={form.landmark} onChange={(event) => set('landmark', event.target.value)} placeholder="Near Jutial Bus Stand" /></Field>
                <div className="sm:col-span-2">
                  <div className="mb-2 text-xs font-black text-slate-200">{t('ed.field.mapLocation')}<span className="ml-1 text-cyan-300">*</span></div>
                  <Suspense fallback={<div className="grid h-[340px] place-items-center rounded-[24px] border border-white/10 bg-white/[0.02] sm:h-[420px]"><LoadingState /></div>}>
                    <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={setPin} onAddressSuggestion={applyAddressSuggestion} />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {step === STEP.about && (
            <div>
              <div className="grid gap-5">
                <Field label={t('ed.field.title')} required hint={t('ed.field.titleTip')}>
                  <TextInput value={form.title} maxLength={120} onChange={(event) => set('title', event.target.value)} placeholder={t(`ed.titleExample.${isStay ? 'stays' : isShop ? 'shops' : isHostel(type) ? 'hostels' : 'homes'}`)} />
                </Field>
                <Field label={t('ed.field.description')} required hint={t('ed.field.descriptionHint', { count: form.description.trim().length })}>
                  <TextArea value={form.description} maxLength={3000} onChange={(event) => set('description', event.target.value)} placeholder={t('ed.field.descriptionPlaceholder')} />
                </Field>
              </div>

              {fields.about.length > 0 && <SectionTitle>{t('ed.aboutType', { type: pretty(type) })}</SectionTitle>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {asks('hostelFor') && (
                  <Field group label={t('ed.field.hostelFor')} required={requires('hostelFor')} className="sm:col-span-2 lg:col-span-3">
                    <div className="flex gap-2">{HOSTEL_FOR.map((value) => <button key={value} type="button" aria-pressed={form.hostelFor === value} onClick={() => set('hostelFor', value)} className={chipClass(form.hostelFor === value)}>{form.hostelFor === value && <Check className="h-3.5 w-3.5" />}{t(`ed.hostelFor.${value}`)}</button>)}</div>
                  </Field>
                )}
                {asks('bedrooms') && <Field group label={t('ed.field.bedrooms')} required={requires('bedrooms')}><Counter label={t('ed.field.bedrooms')} value={form.bedrooms} min={1} max={30} onChange={(value) => set('bedrooms', value)} /></Field>}
                {asks('bathrooms') && <Field group label={isShop ? t('ed.field.washrooms') : t('ed.field.bathrooms')} required={requires('bathrooms')} {...(requires('bathrooms') ? {} : optional)}><Counter label={isShop ? t('ed.field.washrooms') : t('ed.field.bathrooms')} value={form.bathrooms} min={1} max={20} emptyLabel={requires('bathrooms') ? null : t('ed.notSaid')} onChange={(value) => set('bathrooms', value)} /></Field>}
                {asks('bedsPerRoom') && <Field group label={t('ed.field.bedsPerRoom')} {...optional} hint={t('ed.field.bedsPerRoomHint')}><Counter label={t('ed.field.bedsPerRoom')} value={form.bedsPerRoom} min={1} max={20} emptyLabel={t('ed.notSaid')} onChange={(value) => set('bedsPerRoom', value)} /></Field>}
                {asks('maxOccupants') && <Field label={t('ed.field.maxOccupants')} {...optional} hint={t('ed.field.maxOccupantsHint')}><TextInput type="number" min="1" max="100" inputMode="numeric" value={form.maxOccupants} onChange={(event) => set('maxOccupants', event.target.value)} placeholder={t('ed.noLimit')} /></Field>}
                {asks('floor') && <Field group label={isShop ? t('ed.field.shopFloor') : t('ed.field.floor')} {...optional}><Counter label={t('ed.field.floor')} value={form.floor} min={0} start={0} max={50} emptyLabel={t('ed.notSaid')} format={(number) => (number === 0 ? t('ed.floorGround') : number)} onChange={(value) => set('floor', value)} /></Field>}
                {asks('size') && (
                  <Field label={isShop ? t('ed.field.shopArea') : t('ed.field.size')} required={requires('size')} {...(requires('size') ? {} : optional)} hint={isShop ? t('ed.field.shopAreaHint') : t('ed.field.sizeHint')} className="sm:col-span-2 lg:col-span-1">
                    <div className="flex gap-2">
                      <TextInput type="number" min="0" inputMode="decimal" value={form.totalAreaValue} onChange={(event) => set('totalAreaValue', event.target.value)} placeholder={areaUnit === 'sqft' ? '250' : '5'} className="min-w-0 flex-1" />
                      <Select aria-label={t('ed.field.areaUnit')} value={areaUnit} onChange={(event) => set('totalAreaUnit', event.target.value)} className="w-32">
                        {[...new Set([...fields.areaUnits, areaUnit])].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                      </Select>
                    </div>
                  </Field>
                )}
                {asks('furnishing') && (
                  <Field group label={t('ed.field.furnishing')} className="sm:col-span-2">
                    <div className="flex flex-wrap gap-2">{['unfurnished', 'semi_furnished', 'furnished'].map((value) => <button key={value} type="button" aria-pressed={form.furnishedStatus === value} onClick={() => set('furnishedStatus', value)} className={chipClass(form.furnishedStatus === value)}>{form.furnishedStatus === value && <Check className="h-3.5 w-3.5" />}{pretty(value)}</button>)}</div>
                  </Field>
                )}
                {asks('marketName') && <Field label={t('ed.field.marketName')} {...optional} hint={t('ed.field.marketNameHint')} className="sm:col-span-2"><TextInput maxLength={100} value={form.marketName} onChange={(event) => set('marketName', event.target.value)} placeholder={t('ed.field.marketNamePlaceholder')} /></Field>}
                {asks('tenantTypes') && (
                  <Field group label={t('ed.field.tenantTypes')} hint={t('ed.field.tenantTypesHint')} className="sm:col-span-2 lg:col-span-3">
                    <Chips options={TENANT_TYPES} selected={form.tenantTypes} onToggle={(value) => toggle('tenantTypes', value)} labelFor={(value) => t(`ed.tenant.${value}`)} />
                  </Field>
                )}
                {asks('separateEntrance') && <Field group label={t('ed.field.separateEntrance')} {...optional}><YesNo value={form.separateEntrance} onChange={(value) => set('separateEntrance', value)} yes={t('ed.yes')} no={t('ed.no')} /></Field>}
                {asks('separateMeters') && <Field group label={t('ed.field.separateMeters')} {...optional} hint={t('ed.field.separateMetersHint')}><YesNo value={form.separateMeters} onChange={(value) => set('separateMeters', value)} yes={t('ed.yes')} no={t('ed.no')} /></Field>}
                {asks('mealsIncluded') && <Field group label={t('ed.field.mealsIncluded')} {...optional}><YesNo value={form.mealsIncluded} onChange={(value) => set('mealsIncluded', value)} yes={t('ed.yes')} no={t('ed.no')} /></Field>}
              </div>

              <SectionTitle>{t('ed.alsoHas')}</SectionTitle>
              {amenitiesLoading ? (
                <div className="flex flex-wrap gap-2" aria-label={t('ed.loadingAmenities')}>
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 w-28 animate-pulse rounded-full border border-white/[0.06] bg-white/[0.03]" />)}
                </div>
              ) : amenitiesError ? (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-100">
                  {t('ed.amenitiesError')}
                  <SecondaryButton disabled={amenitiesFetching} onClick={() => refetchAmenities()}><RefreshCw className={`h-4 w-4 ${amenitiesFetching ? 'animate-spin' : ''}`} />{t('common.tryAgain')}</SecondaryButton>
                </div>
              ) : amenityOptions.length ? (
                <Chips options={amenityOptions.map((amenity) => amenity._id)} selected={form.amenities} onToggle={(value) => toggle('amenities', value)} labelFor={(value) => amenityLabel(amenityOptions.find((amenity) => amenity._id === value))} />
              ) : (
                <p className="text-sm text-slate-500">{t('ed.amenitiesEmpty')}</p>
              )}
            </div>
          )}

          {step === STEP.utilities && (
            <div>
              <StepNotice>{t('ed.notice.living')}</StepNotice>
              <div className="grid gap-6">
                {util('heating') && (
                  <Field group label={t('ed.field.heating')} {...optional}>
                    <Chips options={['none', ...HEATING_TYPES]} selected={form.heatingTypes} onToggle={(value) => toggleWithNone('heatingTypes', value)} labelFor={(value) => t(`ed.heating.${value}`)} />
                  </Field>
                )}
                {util('power') && (
                  <Field group label={t('ed.field.power')} {...optional} hint={t('ed.field.powerHint')}>
                    <Chips options={['none', ...POWER_BACKUPS]} selected={form.powerBackups} onToggle={(value) => toggleWithNone('powerBackups', value)} labelFor={(value) => t(`ed.power.${value}`)} />
                  </Field>
                )}
                {util('hotWater') && <Field group label={t('ed.field.hotWater')} {...optional}><YesNo value={form.hotWaterAvailable} onChange={(value) => set('hotWaterAvailable', value)} yes={t('ed.yes')} no={t('ed.no')} /></Field>}
                {util('waterSources') && (
                  <Field group label={t('ed.field.waterSources')} {...optional}>
                    <Chips options={WATER_SOURCES} selected={form.waterSources} onToggle={(value) => toggle('waterSources', value)} labelFor={(value) => t(`ed.waterSource.${value}`)} />
                  </Field>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  {util('waterReliability') && <Field label={t('ed.field.water')} hint={t('ed.field.waterHint')}><Select aria-label={t('ed.field.water')} value={form.waterAvailability} onChange={(event) => set('waterAvailability', event.target.value)}>{['unknown', 'excellent', 'good', 'limited', 'unreliable'].map((value) => <option key={value} value={value}>{t(`ed.water.${value}`)}</option>)}</Select></Field>}
                  {util('roadAccess') && <Field label={t('ed.field.road')} hint={t('ed.field.roadHint')}><Select aria-label={t('ed.field.road')} value={form.roadAccess} onChange={(event) => set('roadAccess', event.target.value)}>{['unknown', 'excellent', 'good', 'limited', 'difficult'].map((value) => <option key={value} value={value}>{value === 'unknown' ? t('ed.water.unknown') : t(`ed.road.${value}`)}</option>)}</Select></Field>}
                </div>
                {util('winterAccess') && <Field group label={t('ed.field.winterAccess')} {...optional} hint={t('ed.field.winterAccessHint')}><YesNo value={form.winterAccessible} onChange={(value) => set('winterAccessible', value)} yes={t('ed.yes')} no={t('ed.no')} /></Field>}
              </div>
            </div>
          )}

          {step === STEP.price && isStay && (
            <div>
              <StepNotice>{t('ed.notice.rooms')}</StepNotice>
              <div className="space-y-4">
                {form.roomTypes.map((room, index) => (
                  <div key={room._id || `new-${index}`} className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-white">{room.name.trim() || t('ed.room.untitled', { number: index + 1 })}</p>
                      <button type="button" onClick={() => removeRoom(index)} aria-label={t('ed.room.remove')} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:border-rose-300/30 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field className="lg:col-span-2" label={t('ed.room.name')} required hint={t('ed.room.nameHint')}><TextInput maxLength={80} value={room.name} onChange={(event) => setRoom(index, 'name', event.target.value)} placeholder={t('ed.room.namePlaceholder')} /></Field>
                      <Field label={t('ed.room.price')} required><TextInput type="number" min="0" inputMode="numeric" value={room.nightlyPrice} onChange={(event) => setRoom(index, 'nightlyPrice', event.target.value)} placeholder="8000" /></Field>
                      <Field group label={t('ed.room.guests')} required><Counter label={t('ed.room.guests')} value={room.maxGuests} min={1} max={20} onChange={(value) => setRoom(index, 'maxGuests', value)} /></Field>
                      <Field label={t('ed.room.quantity')} required hint={t('ed.room.quantityHint')}><TextInput type="number" min="1" max="500" value={room.quantity} onChange={(event) => setRoom(index, 'quantity', event.target.value)} /></Field>
                      <Field className="sm:col-span-2 lg:col-span-3" label={t('ed.room.description')} {...optional}><TextInput maxLength={300} value={room.description} onChange={(event) => setRoom(index, 'description', event.target.value)} placeholder={t('ed.room.descriptionPlaceholder')} /></Field>
                    </div>
                  </div>
                ))}
                <SecondaryButton onClick={addRoom} disabled={form.roomTypes.length >= 20}><Plus className="h-4 w-4" /> {t('ed.room.add')}</SecondaryButton>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label={t('ed.field.checkInTime')} required><TextInput type="time" value={form.checkInTime} onChange={(event) => set('checkInTime', event.target.value)} /></Field>
                <Field label={t('ed.field.checkOutTime')} required><TextInput type="time" value={form.checkOutTime} onChange={(event) => set('checkOutTime', event.target.value)} /></Field>
              </div>
            </div>
          )}

          {step === STEP.price && !isStay && (
            <div>
              <StepNotice>{t('ed.notice.pricing')}</StepNotice>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={type === 'hostel_bed' ? t('ed.field.rentPerBed') : t('ed.field.rent')} required hint={t('ed.field.rentHint')}><TextInput type="number" min="0" inputMode="numeric" value={form.monthlyRent} onChange={(event) => set('monthlyRent', event.target.value)} placeholder={isHostel(type) ? '12000' : '45000'} /></Field>
                <Field group label={t('ed.field.deposit')} hint={t('ed.field.depositHint')}>
                  <TextInput type="number" min="0" inputMode="numeric" aria-label={t('ed.field.deposit')} value={form.securityDeposit} onChange={(event) => set('securityDeposit', event.target.value)} placeholder="0" />
                  {rent > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map((months) => {
                        const amount = String(rent * months)
                        return <button key={months} type="button" onClick={() => set('securityDeposit', amount)} className={chipClass(form.securityDeposit === amount)}>{months === 0 ? t('ed.depositNone') : t('ed.depositMonths', { count: months })}</button>
                      })}
                    </div>
                  )}
                </Field>
                <Field group label={t('ed.field.minimumStay')} required>
                  <div className="flex flex-wrap items-center gap-2">
                    {['1', '3', '6', '12'].map((months) => <button key={months} type="button" aria-pressed={form.minimumStayMonths === months} onClick={() => set('minimumStayMonths', months)} className={chipClass(form.minimumStayMonths === months)}>{t('ed.months', { count: Number(months) })}</button>)}
                    <TextInput type="number" min="1" max="120" aria-label={t('ed.field.minimumStay')} value={form.minimumStayMonths} onChange={(event) => set('minimumStayMonths', event.target.value)} className="!h-10 w-24" />
                  </div>
                </Field>
                <Field label={t('ed.field.availableFrom')} required hint={t('ed.field.availableFromHint')}><TextInput type="date" value={form.availableFrom} onChange={(event) => set('availableFrom', event.target.value)} /></Field>
                <Field group label={t('ed.field.negotiation')}>
                  <button type="button" aria-pressed={form.negotiable} onClick={() => set('negotiable', !form.negotiable)} className={chipClass(form.negotiable)}>{form.negotiable && <Check className="h-3.5 w-3.5" />}{t('ed.field.negotiable')}</button>
                </Field>
              </div>
              {!editing && <div className="mt-6 rounded-2xl border border-violet-400/15 bg-violet-400/[0.055] p-4"><p className="text-sm font-black text-violet-100">{t('ed.nextPhotos')}</p><p className="mt-1 text-xs leading-5 text-slate-400">{t('ed.nextPhotosText')}</p></div>}
            </div>
          )}

          {step === STEP.photos && (
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

          {step === STEP.review && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{t('ed.preview')}</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{form.title || t('ed.untitled')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{form.description || t('ed.addDescription')}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    isStay
                      ? [t('ed.room.fromPrice'), form.roomTypes.length ? t('card.perNightFrom', { price: money(Math.min(...form.roomTypes.map((room) => Number(room.nightlyPrice) || 0))) }) : '—']
                      : [t('ed.field.rent'), form.monthlyRent ? money(form.monthlyRent) : '—'],
                    [t('ed.field.type'), pretty(type)],
                    [t('details.location'), form.area ? `${form.area}, ${form.city}` : '—'],
                    ...(isStay
                      ? [[t('ed.step.rooms'), form.roomTypes.reduce((total, room) => total + (Number(room.quantity) || 0), 0)], [t('ed.field.checkInTime'), `${form.checkInTime} / ${form.checkOutTime}`]]
                      : []),
                    ...(asks('hostelFor') ? [[t('ed.field.hostelFor'), form.hostelFor ? t(`ed.hostelFor.${form.hostelFor}`) : '—']] : []),
                    ...(asks('bedrooms') ? [[t('ed.field.bedrooms'), form.bedrooms || '—']] : []),
                    ...(asks('bathrooms') ? [[isShop ? t('ed.field.washrooms') : t('ed.field.bathrooms'), form.bathrooms || '—']] : []),
                    ...(asks('size') ? [[isShop ? t('ed.field.shopArea') : t('ed.field.size'), form.totalAreaValue ? `${form.totalAreaValue} ${pretty(areaUnit)}` : '—']] : []),
                    ...(asks('tenantTypes') ? [[t('ed.field.tenantTypes'), form.tenantTypes.length ? form.tenantTypes.map((value) => t(`ed.tenant.${value}`)).join(', ') : t('ed.tenant.anyone')]] : []),
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}
                </div>
              </div>

              <div className="rounded-[26px] border border-cyan-300/15 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.13),transparent_35%),#0a111e] p-5 text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 font-black">{t('ed.readyTitle')}</p>
                <div className="mt-4 space-y-3 text-xs">
                  {[
                    [t('ed.readyDetails'), detailsReady()],
                    [t('ed.readyImages', { count: images.length }), images.length >= 3],
                    [t('ed.readyCover'), hasCover && images.filter((image) => image.isCover).length === 1],
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
            {editing && step <= LAST_DETAILS_STEP && <SecondaryButton disabled={saving || !isDirty} onClick={() => save()}>{saving ? t('ed.saving') : t('ed.saveChanges')}</SecondaryButton>}
            {step < steps.length - 1 && <PrimaryButton disabled={saving || uploadState.isLoading} onClick={nextStep}>{!editing && step === LAST_DETAILS_STEP ? t('ed.saveDraftPhotos') : step === STEP.photos ? t('ed.reviewListing') : t('ed.continue')}</PrimaryButton>}
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
