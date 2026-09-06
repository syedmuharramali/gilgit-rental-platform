import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Snowflake } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const propertyTypes = [
  ['hostel', 'Hostel'],
  ['hostel_bed', 'Hostel bed'],
  ['shared_room', 'Shared room'],
  ['private_room', 'Private room'],
  ['apartment', 'Apartment'],
  ['house', 'House'],
  ['upper_portion', 'Upper portion'],
  ['lower_portion', 'Lower portion'],
  ['studio', 'Studio'],
]

const furnishing = [
  ['furnished', 'Furnished'],
  ['semi_furnished', 'Semi furnished'],
  ['unfurnished', 'Unfurnished'],
]

const schema = z.object({
  minRent: z.union([z.literal(''), z.coerce.number().min(0)]),
  maxRent: z.union([z.literal(''), z.coerce.number().min(0)]),
  minimumBedrooms: z.union([z.literal(''), z.coerce.number().int().min(0).max(20)]),
  preferredAreas: z.string().max(300),
  propertyTypes: z.array(z.string()),
  furnishedStatuses: z.array(z.string()),
  amenities: z.array(z.string()),
  prioritizeWinterReadiness: z.boolean(),
}).refine((values) => {
  if (values.minRent === '' || values.maxRent === '') return true
  return Number(values.minRent) <= Number(values.maxRent)
}, { message: 'Minimum rent cannot exceed maximum rent', path: ['maxRent'] })

const normalize = (preferences) => ({
  minRent: preferences?.minRent ?? '',
  maxRent: preferences?.maxRent ?? '',
  minimumBedrooms: preferences?.minimumBedrooms ?? '',
  preferredAreas: preferences?.preferredAreas?.join(', ') || '',
  propertyTypes: preferences?.propertyTypes || [],
  furnishedStatuses: preferences?.furnishedStatuses || [],
  amenities: (preferences?.amenities || []).map((amenity) => amenity._id || amenity),
  prioritizeWinterReadiness: preferences?.prioritizeWinterReadiness ?? true,
})

function PreferenceForm({ preferences, amenities = [], onSave, isSaving }) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: normalize(preferences),
  })

  useEffect(() => {
    reset(normalize(preferences))
  }, [preferences, reset])

  const submit = (values) => onSave({
    minRent: values.minRent === '' ? null : Number(values.minRent),
    maxRent: values.maxRent === '' ? null : Number(values.maxRent),
    minimumBedrooms: values.minimumBedrooms === '' ? null : Number(values.minimumBedrooms),
    preferredAreas: values.preferredAreas.split(',').map((area) => area.trim()).filter(Boolean),
    propertyTypes: values.propertyTypes,
    furnishedStatuses: values.furnishedStatuses,
    amenities: values.amenities,
    prioritizeWinterReadiness: values.prioritizeWinterReadiness,
  })

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-7">
      <div>
        <p className="text-sm font-black text-slate-900">Monthly budget</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-2"><span className="text-xs font-bold text-slate-500">Minimum PKR</span><input {...register('minRent')} type="number" min="0" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-600" placeholder="15000" /></label>
          <label className="space-y-2"><span className="text-xs font-bold text-slate-500">Maximum PKR</span><input {...register('maxRent')} type="number" min="0" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-600" placeholder="35000" /></label>
        </div>
        {errors.maxRent ? <p className="mt-2 text-xs font-bold text-rose-600">{errors.maxRent.message}</p> : null}
      </div>

      <Controller name="propertyTypes" control={control} render={({ field }) => (
        <div><p className="text-sm font-black text-slate-900">Property types</p><div className="mt-3 flex flex-wrap gap-2">{propertyTypes.map(([value, label]) => { const active = field.value.includes(value); return <button key={value} type="button" onClick={() => field.onChange(active ? field.value.filter((item) => item !== value) : [...field.value, value])} className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${active ? 'border-[#2f7d66] bg-[#eaf5f0] text-[#245545]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>{label}</button> })}</div></div>
      )} />

      <div>
        <label className="space-y-2"><span className="text-sm font-black text-slate-900">Preferred areas</span><input {...register('preferredAreas')} className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-600" placeholder="Konodas, Jutial, Danyore" /></label>
        <p className="mt-2 text-xs text-slate-400">Separate multiple areas with commas.</p>
      </div>

      <div>
        <label className="space-y-2"><span className="text-sm font-black text-slate-900">Minimum bedrooms</span><input {...register('minimumBedrooms')} type="number" min="0" max="20" className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-600" placeholder="1" /></label>
      </div>

      <Controller name="furnishedStatuses" control={control} render={({ field }) => (
        <div><p className="text-sm font-black text-slate-900">Furnishing</p><div className="mt-3 flex flex-wrap gap-2">{furnishing.map(([value, label]) => { const active = field.value.includes(value); return <button key={value} type="button" onClick={() => field.onChange(active ? field.value.filter((item) => item !== value) : [...field.value, value])} className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${active ? 'border-[#2f7d66] bg-[#eaf5f0] text-[#245545]' : 'border-slate-200 bg-white text-slate-500'}`}>{label}</button> })}</div></div>
      )} />

      <Controller name="amenities" control={control} render={({ field }) => (
        <div><p className="text-sm font-black text-slate-900">Amenities that matter</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{amenities.map((amenity) => { const id = amenity._id; const active = field.value.includes(id); return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-emerald-600/40 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600'}`}><input type="checkbox" checked={active} onChange={() => field.onChange(active ? field.value.filter((item) => item !== id) : [...field.value, id])} className="accent-emerald-700" />{amenity.name}</label> })}</div></div>
      )} />

      <Controller name="prioritizeWinterReadiness" control={control} render={({ field }) => (
        <button type="button" onClick={() => field.onChange(!field.value)} className={`flex w-full items-center justify-between rounded-[22px] border p-4 text-left transition ${field.value ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sky-700 shadow-sm"><Snowflake className="h-4.5 w-4.5" /></span><div><p className="text-sm font-black text-slate-900">Prioritize winter readiness</p><p className="mt-0.5 text-xs text-slate-500">Use heating, water, power and access quality in your matches.</p></div></div>
          <span className={`relative h-6 w-11 rounded-full transition ${field.value ? 'bg-[#2f7d66]' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${field.value ? 'left-6' : 'left-1'}`} /></span>
        </button>
      )} />

      <button type="submit" disabled={isSaving} className="flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#102f26] text-sm font-black text-white shadow-[0_16px_34px_rgba(16,47,38,.18)] transition hover:-translate-y-0.5 disabled:opacity-60">
        {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Save preferences & refresh matches
      </button>
    </form>
  )
}

export default PreferenceForm
