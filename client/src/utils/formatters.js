import i18n from '../i18n/config'

const localeFor = (code) => (code === 'ur' ? 'ur-PK' : 'en-PK')

export const money = (value) =>
  `${i18n.t('common.currency')} ${new Intl.NumberFormat('en-PK').format(Number(value || 0))}`

const titleCase = (value = '') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

/**
 * Turns a database enum value into a human label in the active language.
 * Falls back to the English title-cased value when no translation exists.
 */
export const pretty = (value = '') =>
  i18n.t(`enums.${value}`, { defaultValue: titleCase(value) })

/** Amenity names come from the database; translate by slug where we can. */
export const amenityLabel = (amenity) =>
  i18n.t(`amenities.${amenity?.slug || ''}`, { defaultValue: amenity?.name || '' })

export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat(localeFor(i18n.language), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'

export const shortDate = (value) =>
  value
    ? new Intl.DateTimeFormat(localeFor(i18n.language), {
        dateStyle: 'medium',
      }).format(new Date(value))
    : '—'

// Check-in / check-out are calendar dates stored as midnight UTC; format
// them in UTC so they never shift to the day before in another timezone.
export const stayDate = (value) =>
  value
    ? new Intl.DateTimeFormat(localeFor(i18n.language), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value))
    : '—'

// Today's date as YYYY-MM-DD in the viewer's own timezone. toISOString()
// alone gives the UTC date, which in Pakistan is yesterday until 5 AM.
export const localToday = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
