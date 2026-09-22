import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n/config'

/**
 * Two-state language toggle: English / اردو.
 * Changing the language also flips the whole page to right-to-left.
 */
export default function LanguageSwitcher({ className = '', compact = false }) {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 ${className}`}
    >
      {!compact && <Languages className="mx-1.5 h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />}
      {languages.map((language) => {
        const active = current === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            aria-pressed={active}
            onClick={() => i18n.changeLanguage(language.code)}
            className={`min-h-8 rounded-full px-3 text-xs font-black transition ${
              active ? 'bg-white text-[#07101e]' : 'text-white/60 hover:text-white'
            }`}
          >
            {compact ? language.short : language.label}
          </button>
        )
      })}
    </div>
  )
}
