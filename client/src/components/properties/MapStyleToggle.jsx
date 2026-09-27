import { Map as MapIcon, Satellite } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Map / Satellite switch that sits on top of a map.
export default function MapStyleToggle({ value, onChange, className = 'left-3 top-3' }) {
  const { t } = useTranslation()
  const options = [
    ['streets', MapIcon, t('map.styleStreets')],
    ['satellite', Satellite, t('map.styleSatellite')],
  ]

  return (
    <div role="radiogroup" aria-label={t('map.styleLabel')} className={`absolute z-10 flex gap-1 rounded-full border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur ${className}`}>
      {options.map(([key, Icon, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${value === key ? 'bg-[#07101e] text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  )
}

// Shown instead of a map when VITE_MAPBOX_TOKEN is missing.
export function MapNotConfigured({ className = '' }) {
  const { t } = useTranslation()
  return (
    <div className={`grid place-items-center rounded-[24px] border border-dashed border-amber-300/30 bg-amber-300/[0.05] p-6 text-center ${className}`}>
      <div>
        <p className="text-sm font-black text-amber-100">{t('map.noToken')}</p>
        <p className="mt-1 text-xs text-slate-400">{t('map.noTokenText')}</p>
      </div>
    </div>
  )
}
