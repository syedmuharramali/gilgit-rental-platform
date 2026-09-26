import { pretty } from './formatters'
import { fieldsFor } from './listingFields'

/*
 * Turns a listing into the [label, value] rows the details and admin pages
 * show. Only questions the listing's type asks are included; for the type
 * details, only the ones the owner answered.
 */

const yesNo = (value, t) => (value === true ? t('ed.yes') : value === false ? t('ed.no') : null)
const listOf = (values, prefix, t) => values.map((value) => t(`${prefix}.${value}`)).join(', ')

// Type-specific details: who it's for, entrance, meters, meals, market...
export function aboutFacts(property, t) {
  const { about } = fieldsFor(property.propertyType)
  const asks = (field) => about.includes(field)
  const rows = []
  const add = (label, value) => {
    if (value !== null && value !== undefined && value !== '') rows.push([label, value])
  }

  if (asks('hostelFor') && property.hostelFor) add(t('ed.field.hostelFor'), t(`ed.hostelFor.${property.hostelFor}`))
  if (asks('gateClosesAt')) add(t('ed.field.gateClosesAt'), property.gateClosesAt)
  if (asks('tenantTypes')) add(t('ed.field.tenantTypes'), property.tenantTypes?.length ? listOf(property.tenantTypes, 'ed.tenant', t) : t('ed.tenant.anyone'))
  if (asks('furnishing')) add(t('ed.field.furnishing'), pretty(property.furnishedStatus))
  if (asks('size') && property.totalArea?.value) add(property.propertyType === 'shop' ? t('ed.field.shopArea') : t('ed.field.size'), `${property.totalArea.value} ${pretty(property.totalArea.unit || 'sqft')}`)
  if (asks('floor') && property.floor != null) add(t('ed.field.floor'), property.floor === 0 ? t('ed.floorGround') : property.floor)
  if (asks('separateEntrance')) add(t('ed.field.separateEntrance'), yesNo(property.separateEntrance, t))
  if (asks('separateMeters')) add(t('ed.field.separateMeters'), yesNo(property.separateMeters, t))
  if (asks('marketName')) add(t('ed.field.marketName'), property.marketName)

  return rows
}

// Winter & utility facts. Unanswered ones say so rather than guessing.
export function utilityFacts(property, t) {
  const { utilities } = fieldsFor(property.propertyType)
  const living = property.livingInfo || {}
  const notSaid = t('details.notListed')
  const kinds = (list, flag, prefix) => {
    if (list?.length) return list.includes('none') ? t(`${prefix}.none`) : listOf(list, prefix, t)
    return flag ? t('details.available') : notSaid // listings saved before the "kind" questions
  }
  const rows = {
    heating: [t('ed.field.heating'), kinds(living.heatingTypes, living.heatingAvailable, 'ed.heating')],
    hotWater: [t('ed.field.hotWater'), yesNo(living.hotWaterAvailable, t) ?? notSaid],
    power: [t('ed.field.power'), kinds(living.powerBackups, living.electricityBackup, 'ed.power')],
    waterSources: [t('ed.field.waterSources'), living.waterSources?.length ? listOf(living.waterSources, 'ed.waterSource', t) : notSaid],
    waterReliability: [t('ed.field.water'), living.waterAvailability && living.waterAvailability !== 'unknown' ? pretty(living.waterAvailability) : notSaid],
    roadAccess: [t('ed.field.road'), living.roadAccess && living.roadAccess !== 'unknown' ? pretty(living.roadAccess) : notSaid],
    winterAccess: [t('ed.field.winterAccess'), yesNo(living.winterAccessible, t) ?? notSaid],
  }

  // Types without a field list (retired ones) show everything.
  const keys = utilities.length ? utilities : Object.keys(rows)
  return keys.map((key) => [key, ...rows[key]])
}

// Hostels: every seater option has 0 free places.
export const hostelIsFull = (property) =>
  (property.hostelRooms || []).length > 0 && property.hostelRooms.every((room) => !(room.available > 0))

// "1–4" for a hostel with 1 to 4 seater rooms.
export const seaterRange = (property) => {
  const sizes = (property.hostelRooms || []).map((room) => room.seater).sort((a, b) => a - b)
  if (!sizes.length) return null
  return sizes.length === 1 ? String(sizes[0]) : `${sizes[0]}–${sizes[sizes.length - 1]}`
}
