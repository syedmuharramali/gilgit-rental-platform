import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ur from './locales/ur.json'

export const LANGUAGE_KEY = 'gilgit_rental_language'

export const languages = [
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'ur', label: 'اردو', short: 'اردو', dir: 'rtl' },
]

export const getDirection = (code) =>
  languages.find((language) => language.code === code)?.dir || 'ltr'

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    return languages.some((language) => language.code === stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

/**
 * Puts the language and text direction on <html> so CSS can react to it,
 * and so screen readers announce the page in the right language.
 */
export const applyDocumentLanguage = (code) => {
  const direction = getDirection(code)
  const root = document.documentElement
  root.setAttribute('lang', code)
  root.setAttribute('dir', direction)
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: readStoredLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  })

applyDocumentLanguage(i18n.language)

i18n.on('languageChanged', (code) => {
  applyDocumentLanguage(code)

  try {
    localStorage.setItem(LANGUAGE_KEY, code)
  } catch {
    // A blocked localStorage only means the choice is not remembered.
  }
})

export default i18n
