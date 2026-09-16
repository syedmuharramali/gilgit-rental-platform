const Tenancy = require("../models/tenancy.model");
const Property = require("../models/property.model");
const RentalAgreement = require("../models/rentalAgreement.model");
const { safeCreateNotifications } = require("./notification.service");

const GILGIT_TIME_ZONE = "Asia/Karachi";
const ONE_HOUR_MS = 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| Gilgit calendar date cutoff
|--------------------------------------------------------------------------
|
| Rental start dates are saved as calendar dates (midnight UTC). A rental
| starts on its start date in Gilgit, so compare against the end of "today"
| in the Asia/Karachi time zone.
|--------------------------------------------------------------------------
*/

const getGilgitDateCutoff = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GILGIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      23,
      59,
      59,
      999
    )
  );
};

const hasRentalStarted = (startDate, now = new Date()) =>
  new Date(startDate).getTime() <= getGilgitDateCutoff(now).getTime();

/*
|--------------------------------------------------------------------------
| Activate upcoming rentals whose start date has arrived
|--------------------------------------------------------------------------
|
| upcoming -> active, and the property is marked as rented so it leaves the
| public listings. The property update is idempotent and runs first, and the
| tenancy update is conditional, so a failed run is safely retried later.
|--------------------------------------------------------------------------
*/

const activateDueTenancies = async (filter = {}) => {
  const now = new Date();

  const dueTenancies = await Tenancy.find({
    ...filter,
    status: "upcoming",
    startDate: { $lte: getGilgitDateCutoff(now) },
  })
    .select("_id property owner renter")
    .lean();

  let activated = 0;

  for (const dueTenancy of dueTenancies) {
    try {
      const property = await Property.findOneAndUpdate(
        { _id: dueTenancy.property },
        {
          $set: {
            listingStatus: "rented",
            reservationStatus: "available",
            reservedAt: null,
            publishedAt: null,
          },
        },
        { returnDocument: "after" }
      ).select("title");

      const tenancy = await Tenancy.findOneAndUpdate(
        {
          _id: dueTenancy._id,
          status: "upcoming",
        },
        {
          $set: {
            status: "active",
            activatedAt: now,
          },
        },
        { returnDocument: "after" }
      );

      if (!tenancy) {
        continue;
      }

      activated += 1;

      const agreement = await RentalAgreement.findOne({
        tenancy: tenancy._id,
      }).select("_id");

      const propertyTitle = property?.title || "your rental";

      await safeCreateNotifications(
        [
          {
            user: tenancy.renter,
            message: `Your rental for ${propertyTitle} has started.`,
          },
          {
            user: tenancy.owner,
            message: `The rental for ${propertyTitle} has started.`,
          },
        ].map((notification) => ({
          ...notification,
          type: "agreement",
          title: "Rental Started",
          resourceType: "agreement",
          resourceId: agreement?._id || null,
        }))
      );
    } catch (error) {
      console.error("[Tenancy Activation Error]", {
        tenancy: String(dueTenancy._id),
        error: error?.message,
      });
    }
  }

  return activated;
};

/*
|--------------------------------------------------------------------------
| Background schedule
|--------------------------------------------------------------------------
|
| Reads also activate due rentals for the signed-in user, but this hourly
| sweep keeps public listings accurate even if nobody opens their dashboard.
|--------------------------------------------------------------------------
*/

let activationRunning = false;

const runActivationSweep = async () => {
  if (activationRunning) {
    return;
  }

  activationRunning = true;

  try {
    const activated = await activateDueTenancies();

    if (activated > 0) {
      console.log(`Activated ${activated} upcoming rental(s)`);
    }
  } catch (error) {
    console.error("[Tenancy Activation Sweep Error]", error?.message);
  } finally {
    activationRunning = false;
  }
};

const startTenancyActivationSchedule = (intervalMs = ONE_HOUR_MS) => {
  runActivationSweep();

  const timer = setInterval(runActivationSweep, intervalMs);

  timer.unref();

  return timer;
};

module.exports = {
  getGilgitDateCutoff,
  hasRentalStarted,
  activateDueTenancies,
  startTenancyActivationSchedule,
};
