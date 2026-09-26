const mongoose = require("mongoose");
const Property = require("../models/property.model");
const AppError = require("../utils/AppError");
const {
  HOSTEL_PRICING,
  MAX_SEATER,
  MEALS,
  MESS_PLANS,
  WEEK_DAYS,
} = require("../data/listingFields");

/*
|--------------------------------------------------------------------------
| Hostel seats
|--------------------------------------------------------------------------
|
| A hostel has seater options (1 seater, 2 seater...). Each has a monthly
| price, quoted per person or per whole room (hostelPricing), and a count
| of free places: beds for per-person pricing, rooms for per-room pricing.
|
| Accepting a student holds places from that count in one atomic update,
| so two owners' clicks (or two tabs) can't hand out the same last bed.
| The owner adds places back when someone moves out.
|--------------------------------------------------------------------------
*/

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Places an application takes: its people (per person) or one room.
const unitsFor = (pricing, occupants) =>
  pricing === "per_room" ? 1 : Math.max(1, Number(occupants) || 1);

// Monthly rent for the application's option and group size.
const hostelRentFor = (hostelRoom, units) =>
  hostelRoom.pricing === "per_room"
    ? hostelRoom.price
    : hostelRoom.price * units;

// Take `units` free places from one option, or return false if there
// aren't that many left.
const holdSeats = async (propertyId, roomId, units, session = null) => {
  const result = await Property.updateOne(
    {
      _id: propertyId,
      hostelRooms: {
        $elemMatch: { _id: roomId, available: { $gte: units } },
      },
    },
    { $inc: { "hostelRooms.$.available": -units } },
    { session }
  );

  return result.modifiedCount === 1;
};

const releaseSeats = (propertyId, roomId, units, session = null) =>
  Property.updateOne(
    { _id: propertyId, "hostelRooms._id": roomId },
    { $inc: { "hostelRooms.$.available": units } },
    { session }
  );

/*
| Seater options from the editor: keep the known fields and an existing
| _id (applications point at it).
|
| `available` may be left out for an existing option: the editor only sends
| it when the owner changed it, so an old page can't overwrite places that
| acceptances have taken since it loaded. It then keeps the current count.
*/
const cleanHostelRooms = (rooms, currentRooms = []) => {
  if (rooms === undefined) {
    return undefined;
  }

  if (!Array.isArray(rooms)) {
    throw new AppError("Seater options must be a list", 400);
  }

  if (rooms.length > 10) {
    throw new AppError("A hostel can have at most 10 seater options", 400);
  }

  const cleaned = rooms.map((room) => {
    if (!room || typeof room !== "object") {
      throw new AppError("Each seater option needs a size, price and free places", 400);
    }

    const current =
      room._id &&
      (currentRooms || []).find((item) => String(item._id) === String(room._id));

    const value = {
      seater: Number(room.seater),
      price: room.price === "" || room.price === null ? NaN : Number(room.price),
      available:
        room.available === undefined && current
          ? current.available
          : Number(room.available),
    };

    if (!Number.isInteger(value.seater) || value.seater < 1 || value.seater > MAX_SEATER) {
      throw new AppError(`Seater must be a whole number from 1 to ${MAX_SEATER}`, 400);
    }

    if (!(value.price >= 0)) {
      throw new AppError("Enter a monthly price for every seater option", 400);
    }

    if (!Number.isInteger(value.available) || value.available < 0 || value.available > 1000) {
      throw new AppError("Free places must be a whole number from 0 to 1000", 400);
    }

    if (room._id && mongoose.isValidObjectId(room._id)) {
      value._id = room._id;
    }

    return value;
  });

  const seaters = cleaned.map((room) => room.seater);

  if (new Set(seaters).size !== seaters.length) {
    throw new AppError("Each seater option can be listed once", 400);
  }

  // Order is kept: the editor matches saved rooms to its rows by position.
  return cleaned;
};

const cleanHostelPricing = (pricing) => {
  if (pricing === undefined) {
    return undefined;
  }

  if (!HOSTEL_PRICING.includes(pricing)) {
    throw new AppError("Price must be per person or per room", 400);
  }

  return pricing;
};

const text = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const time = (value) =>
  typeof value === "string" && TIME.test(value) ? value : null;

const cleanMess = (mess) => {
  if (mess === undefined) {
    return undefined;
  }

  if (mess === null || typeof mess !== "object") {
    return { plan: null, monthlyCharge: null, timings: {}, menu: [], notes: null };
  }

  const plan = mess.plan == null ? null : mess.plan;

  if (plan !== null && !MESS_PLANS.includes(plan)) {
    throw new AppError("Mess must be included, optional or none", 400);
  }

  const charge =
    plan === "optional" && mess.monthlyCharge !== null && mess.monthlyCharge !== "" && mess.monthlyCharge !== undefined
      ? Number(mess.monthlyCharge)
      : null;

  if (charge !== null && !(charge >= 0)) {
    throw new AppError("Mess charge must be a valid amount", 400);
  }

  const hasMess = plan === "included" || plan === "optional";
  const menuByDay = new Map(
    (Array.isArray(mess.menu) ? mess.menu : [])
      .filter((row) => row && WEEK_DAYS.includes(row.day))
      .map((row) => [row.day, row])
  );

  return {
    plan,
    monthlyCharge: charge,
    timings: Object.fromEntries(
      MEALS.map((meal) => [meal, hasMess ? time(mess.timings?.[meal]) : null])
    ),
    // Only days with something written are kept, in week order.
    menu: hasMess
      ? WEEK_DAYS.filter((day) => menuByDay.has(day))
          .map((day) => ({
            day,
            ...Object.fromEntries(
              MEALS.map((meal) => [meal, text(menuByDay.get(day)[meal], 120)])
            ),
          }))
          .filter((row) => MEALS.some((meal) => row[meal]))
      : [],
    notes: hasMess ? text(mess.notes, 300) || null : null,
  };
};

module.exports = {
  unitsFor,
  hostelRentFor,
  holdSeats,
  releaseSeats,
  cleanHostelRooms,
  cleanHostelPricing,
  cleanMess,
};
