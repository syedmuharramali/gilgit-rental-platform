/*
|--------------------------------------------------------------------------
| Stay dates and room availability (pure functions, no database)
|--------------------------------------------------------------------------
|
| Check-in and check-out are calendar dates ("YYYY-MM-DD") stored as
| midnight UTC. A stay occupies every night from check-in up to, but not
| including, check-out — so one guest checking out on the 12th and another
| checking in on the 12th do not clash.
|--------------------------------------------------------------------------
*/

const DAY_MS = 24 * 60 * 60 * 1000;

// Gilgit is UTC+5 all year (no daylight saving).
const GILGIT_OFFSET_MS = 5 * 60 * 60 * 1000;

const MAX_NIGHTS = 30;
const MAX_DAYS_AHEAD = 365;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// Returns midnight UTC for a real calendar date, or null.
const parseStayDate = (value) => {
  if (typeof value !== "string") return null;

  const match = DATE_ONLY.exec(value.trim());
  if (!match) return null;

  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  // Rejects 2026-02-30 and similar, which Date would silently roll over.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return date;
};

const nightsBetween = (checkIn, checkOut) =>
  Math.round((new Date(checkOut) - new Date(checkIn)) / DAY_MS);

// The exact moment check-in happens in Gilgit, e.g. 2 PM on the check-in date.
const checkInMoment = (checkIn, checkInTime = "14:00") => {
  const [hours, minutes] = String(checkInTime || "14:00")
    .split(":")
    .map(Number);

  return new Date(
    new Date(checkIn).getTime() +
      ((hours || 0) * 60 + (minutes || 0)) * 60 * 1000 -
      GILGIT_OFFSET_MS
  );
};

/*
| The most rooms taken on any single night of [checkIn, checkOut) by the
| given bookings. Each booking needs { checkIn, checkOut, rooms }.
*/
const maxRoomsBookedPerNight = (bookings, checkIn, checkOut) => {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  let highest = 0;

  for (let night = start; night < end; night += DAY_MS) {
    let taken = 0;

    for (const booking of bookings) {
      const bookingStart = new Date(booking.checkIn).getTime();
      const bookingEnd = new Date(booking.checkOut).getTime();

      if (bookingStart <= night && night < bookingEnd) {
        taken += Number(booking.rooms) || 0;
      }
    }

    if (taken > highest) highest = taken;
  }

  return highest;
};

const freeRoomsFor = (quantity, bookings, checkIn, checkOut) =>
  Math.max(
    0,
    (Number(quantity) || 0) -
      maxRoomsBookedPerNight(bookings, checkIn, checkOut)
  );

/*
| Validates a requested range against "today in Gilgit". Returns
| { checkIn, checkOut, nights } or { error }.
*/
const validateStayRange = (checkInValue, checkOutValue, todayStart) => {
  const checkIn = parseStayDate(checkInValue);
  const checkOut = parseStayDate(checkOutValue);

  if (!checkIn || !checkOut) {
    return { error: "Check-in and check-out must be dates like 2026-10-01" };
  }

  if (checkIn < todayStart) {
    return { error: "Check-in cannot be in the past" };
  }

  const nights = nightsBetween(checkIn, checkOut);

  if (nights < 1) {
    return { error: "Check-out must be at least one day after check-in" };
  }

  if (nights > MAX_NIGHTS) {
    return { error: `A stay can be at most ${MAX_NIGHTS} nights` };
  }

  if (nightsBetween(todayStart, checkIn) > MAX_DAYS_AHEAD) {
    return { error: "Stays can be booked up to one year ahead" };
  }

  return { checkIn, checkOut, nights };
};

module.exports = {
  DAY_MS,
  MAX_NIGHTS,
  parseStayDate,
  nightsBetween,
  checkInMoment,
  maxRoomsBookedPerNight,
  freeRoomsFor,
  validateStayRange,
};
