/*
|--------------------------------------------------------------------------
| Calendar "today" in Gilgit
|--------------------------------------------------------------------------
|
| Dates picked from a date input arrive as "YYYY-MM-DD" and are stored as
| midnight UTC. To ask "is this date in the past?" compare against midnight
| UTC of today's date *in Gilgit* — not the server's clock, which is usually
| UTC and five hours behind.
|--------------------------------------------------------------------------
*/

const GILGIT_TIME_ZONE = "Asia/Karachi";

const startOfGilgitToday = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GILGIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return new Date(Date.UTC(values.year, values.month - 1, values.day));
};

const isBeforeGilgitToday = (date, now = new Date()) =>
  new Date(date).getTime() < startOfGilgitToday(now).getTime();

module.exports = {
  GILGIT_TIME_ZONE,
  startOfGilgitToday,
  isBeforeGilgitToday,
};
