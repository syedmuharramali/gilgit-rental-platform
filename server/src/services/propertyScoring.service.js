/*
|--------------------------------------------------------------------------
| Gilgit Living / Winter Readiness Score
|--------------------------------------------------------------------------
| Maximum = 100
|--------------------------------------------------------------------------
*/

const calculateLivingScore = (
  property
) => {
  const living =
    property.livingInfo || {};

  let score = 0;

  if (
    living.heatingAvailable
  ) {
    score += 20;
  }

  if (
    living.hotWaterAvailable
  ) {
    score += 20;
  }

  if (
    living.electricityBackup
  ) {
    score += 15;
  }

  const waterScores = {
    excellent: 15,
    good: 12,
    limited: 6,
    unreliable: 2,
    unknown: 0,
  };

  score +=
    waterScores[
      living.waterAvailability
    ] || 0;

  const roadScores = {
    excellent: 15,
    good: 12,
    limited: 6,
    difficult: 2,
    unknown: 0,
  };

  score +=
    roadScores[
      living.roadAccess
    ] || 0;

  if (
    living.winterAccessible
  ) {
    score += 15;
  }

  let label;

  if (score >= 85) {
    label = "Excellent";
  } else if (score >= 70) {
    label = "Very Good";
  } else if (score >= 55) {
    label = "Good";
  } else if (score >= 40) {
    label = "Fair";
  } else {
    label = "Limited";
  }

  return {
    score,
    label,

    breakdown: {
      heating:
        living.heatingAvailable
          ? 20
          : 0,

      hotWater:
        living.hotWaterAvailable
          ? 20
          : 0,

      electricityBackup:
        living.electricityBackup
          ? 15
          : 0,

      waterAvailability:
        waterScores[
          living.waterAvailability
        ] || 0,

      roadAccess:
        roadScores[
          living.roadAccess
        ] || 0,

      winterAccessible:
        living.winterAccessible
          ? 15
          : 0,
    },
  };
};

/*
|--------------------------------------------------------------------------
| Smart Match Score
|--------------------------------------------------------------------------
|
| Only supplied preferences contribute to the denominator.
|--------------------------------------------------------------------------
*/

const calculateMatchScore = (
  property,
  preferences
) => {
  let earned = 0;
  let possible = 0;

  const breakdown = {};

  /*
  |--------------------------------------------------------------------------
  | Rent — 30
  |--------------------------------------------------------------------------
  */

  if (
    preferences.minRent !==
      null ||
    preferences.maxRent !==
      null
  ) {
    possible += 30;

    const rent =
      property.monthlyRent;

    const min =
      preferences.minRent;

    const max =
      preferences.maxRent;

    let rentScore = 30;

    if (
      min !== null &&
      rent < min
    ) {
      const difference =
        min - rent;

      rentScore =
        difference <=
        min * 0.2
          ? 15
          : 0;
    }

    if (
      max !== null &&
      rent > max
    ) {
      const difference =
        rent - max;

      rentScore =
        difference <=
        max * 0.2
          ? 15
          : 0;
    }

    earned += rentScore;

    breakdown.rent =
      rentScore;
  }

  /*
  |--------------------------------------------------------------------------
  | Property type — 20
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .propertyTypes
      ?.length
  ) {
    possible += 20;

    const value =
      preferences
        .propertyTypes
        .includes(
          property.propertyType
        )
        ? 20
        : 0;

    earned += value;

    breakdown.propertyType =
      value;
  }

  /*
  |--------------------------------------------------------------------------
  | Area — 15
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .preferredAreas
      ?.length
  ) {
    possible += 15;

    const propertyArea =
      property.address?.area
        ?.trim()
        .toLowerCase();

    const areas =
      preferences
        .preferredAreas
        .map((area) =>
          area
            .trim()
            .toLowerCase()
        );

    const value =
      areas.includes(
        propertyArea
      )
        ? 15
        : 0;

    earned += value;

    breakdown.area =
      value;
  }

  /*
  |--------------------------------------------------------------------------
  | Furnishing — 10
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .furnishedStatuses
      ?.length
  ) {
    possible += 10;

    const value =
      preferences
        .furnishedStatuses
        .includes(
          property
            .furnishedStatus
        )
        ? 10
        : 0;

    earned += value;

    breakdown.furnishing =
      value;
  }

  /*
  |--------------------------------------------------------------------------
  | Bedrooms — 10
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .minimumBedrooms !==
    null
  ) {
    possible += 10;

    const value =
      property.bedrooms >=
      preferences
        .minimumBedrooms
        ? 10
        : 0;

    earned += value;

    breakdown.bedrooms =
      value;
  }

  /*
  |--------------------------------------------------------------------------
  | Amenities — 10
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .amenities
      ?.length
  ) {
    possible += 10;

    const preferredIds =
      preferences.amenities.map(
        (amenity) =>
          (
            amenity._id ||
            amenity
          ).toString()
      );

    const propertyIds =
      (
        property.amenities ||
        []
      ).map((amenity) =>
        (
          amenity._id ||
          amenity
        ).toString()
      );

    const matched =
      preferredIds.filter(
        (id) =>
          propertyIds.includes(
            id
          )
      ).length;

    const value =
      Math.round(
        (matched /
          preferredIds.length) *
          10
      );

    earned += value;

    breakdown.amenities =
      value;
  }

  /*
  |--------------------------------------------------------------------------
  | Winter readiness — 5
  |--------------------------------------------------------------------------
  */

  if (
    preferences
      .prioritizeWinterReadiness
  ) {
    possible += 5;

    const living =
      calculateLivingScore(
        property
      );

    const value =
      Math.round(
        (living.score / 100) *
          5
      );

    earned += value;

    breakdown.winterReadiness =
      value;
  }

  const score =
    possible > 0
      ? Math.round(
          (earned / possible) *
            100
        )
      : 0;

  let label;

  if (score >= 85) {
    label = "Excellent Match";
  } else if (score >= 70) {
    label = "Strong Match";
  } else if (score >= 55) {
    label = "Good Match";
  } else if (score >= 40) {
    label = "Possible Match";
  } else {
    label = "Low Match";
  }

  return {
    score,
    label,
    breakdown,
  };
};

module.exports = {
  calculateLivingScore,
  calculateMatchScore,
};