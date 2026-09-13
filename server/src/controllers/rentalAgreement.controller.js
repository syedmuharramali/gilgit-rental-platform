const mongoose = require("mongoose");

const RentalAgreement = require(
  "../models/rentalAgreement.model"
);

const RentalTerms = require(
  "../models/rentalTerms.model"
);

const Tenancy = require(
  "../models/tenancy.model"
);

const Property = require(
  "../models/property.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  safeCreateNotification,
} = require(
  "../services/notification.service"
);

const DEFAULT_CLAUSES = [
  "The renter shall pay the agreed monthly rent on time.",
  "The property shall be used only for residential purposes.",
  "The renter shall take reasonable care of the property.",
  "The owner shall respect the renter's lawful use and privacy of the rented property.",
  "Any property damage beyond normal wear and tear may be adjusted against the security deposit.",
  "Both parties shall communicate regarding termination or major rental changes.",
];

const cleanClauses = (clauses) => {
  if (clauses === undefined) {
    return DEFAULT_CLAUSES;
  }

  if (!Array.isArray(clauses)) {
    throw new AppError(
      "Clauses must be an array",
      400
    );
  }

  if (clauses.length > 20) {
    throw new AppError(
      "Agreement cannot contain more than 20 clauses",
      400
    );
  }

  return clauses.map((clause) => {
    if (typeof clause !== "string") {
      throw new AppError(
        "Every agreement clause must be text",
        400
      );
    }

    const cleaned = clause.trim();

    if (!cleaned || cleaned.length > 500) {
      throw new AppError(
        "Each clause must contain between 1 and 500 characters",
        400
      );
    }

    return cleaned;
  });
};

const populateAgreement = async (agreement) => {
  await agreement.populate([
    {
      path: "property",
      select:
        "title slug address propertyType listingStatus reservationStatus",
    },
    {
      path: "owner",
      select:
        "name email",
    },
    {
      path: "renter",
      select:
        "name email",
    },
    {
      path: "rentalTerms",
      select:
        "status application startDate durationMonths monthlyRent securityDeposit occupants",
    },
    {
      path: "tenancy",
      select:
        "status startDate durationMonths agreedMonthlyRent securityDeposit occupants",
    },
  ]);

  return agreement;
};

/*
|--------------------------------------------------------------------------
| Create agreement from accepted rental terms
| POST /api/agreements/rental-terms/:termsId
|--------------------------------------------------------------------------
|
| A pending-agreement tenancy record is created internally to preserve data
| integrity and property availability. It is not exposed as a user workflow.
|--------------------------------------------------------------------------
*/
exports.createAgreementFromTerms = asyncHandler(
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.termsId)) {
      return next(
        new AppError(
          "Invalid rental terms ID",
          400
        )
      );
    }

    const terms = await RentalTerms.findOne({
      _id: req.params.termsId,
      owner: req.user._id,
      status: "accepted",
    });

    if (!terms) {
      return next(
        new AppError(
          "Accepted rental terms not found or you are not the owner",
          404
        )
      );
    }

    const existing = await RentalAgreement.findOne({
      rentalTerms: terms._id,
    });

    if (existing) {
      await populateAgreement(existing);

      return res.status(200).json({
        success: true,
        message: "Rental agreement already exists",
        data: { agreement: existing },
      });
    }

    const clauses = cleanClauses(req.body.clauses);
    const session = await mongoose.startSession();
    let agreement;

    try {
      await session.withTransaction(async () => {
        let tenancy = await Tenancy.findOne({
          application: terms.application,
        }).session(session);

        if (tenancy && ![
          "pending_agreement",
          "upcoming",
          "active",
        ].includes(tenancy.status)) {
          throw new AppError(
            "This application already has a completed tenancy record",
            409
          );
        }

        if (!tenancy) {
          const created = await Tenancy.create(
            [
              {
                application: terms.application,
                property: terms.property,
                owner: terms.owner,
                renter: terms.renter,
                startDate: terms.startDate,
                durationMonths: terms.durationMonths,
                agreedMonthlyRent: terms.monthlyRent,
                securityDeposit: terms.securityDeposit,
                occupants: terms.occupants,
                status: "pending_agreement",
              },
            ],
            { session }
          );

          tenancy = created[0];
        }

        const createdAgreement = await RentalAgreement.create(
          [
            {
              tenancy: tenancy._id,
              rentalTerms: terms._id,
              application: terms.application,
              property: terms.property,
              owner: terms.owner,
              renter: terms.renter,
              startDate: terms.startDate,
              durationMonths: terms.durationMonths,
              monthlyRent: terms.monthlyRent,
              securityDeposit: terms.securityDeposit,
              occupants: terms.occupants,
              clauses,
              createdBy: req.user._id,
            },
          ],
          { session }
        );

        agreement = createdAgreement[0];
      });
    } finally {
      await session.endSession();
    }

    await populateAgreement(agreement);

    await safeCreateNotification({
      user: agreement.renter._id,
      type: "agreement",
      title: "Rental Agreement Ready",
      message:
        `A rental agreement for ${agreement.property.title} is ready for your review and acceptance.`,
      resourceType: "agreement",
      resourceId: agreement._id,
    });

    res.status(201).json({
      success: true,
      message: "Rental agreement created successfully",
      data: { agreement },
    });
  }
);

/*
|--------------------------------------------------------------------------
| My agreements
| GET /api/agreements
|--------------------------------------------------------------------------
*/
exports.getMyAgreements = asyncHandler(
  async (req, res) => {
    const agreements = await RentalAgreement.find({
      $or: [
        { owner: req.user._id },
        { renter: req.user._id },
      ],
    })
      .populate(
        "property",
        "title slug address propertyType listingStatus reservationStatus"
      )
      .populate(
        "owner",
        "name email"
      )
      .populate(
        "renter",
        "name email"
      )
      .populate(
        "rentalTerms",
        "status application startDate durationMonths monthlyRent securityDeposit occupants"
      )
      .populate(
        "tenancy",
        "status startDate durationMonths agreedMonthlyRent securityDeposit occupants"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        count: agreements.length,
        agreements,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Single agreement
|--------------------------------------------------------------------------
*/
exports.getAgreementById = asyncHandler(
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(
        new AppError(
          "Invalid agreement ID",
          400
        )
      );
    }

    const agreement = await RentalAgreement.findById(
      req.params.id
    )
      .populate(
        "property",
        "title slug address propertyType listingStatus reservationStatus"
      )
      .populate(
        "owner",
        "name email"
      )
      .populate(
        "renter",
        "name email"
      )
      .populate(
        "rentalTerms",
        "status application startDate durationMonths monthlyRent securityDeposit occupants"
      )
      .populate(
        "tenancy",
        "status startDate durationMonths agreedMonthlyRent securityDeposit occupants"
      );

    if (!agreement) {
      return next(
        new AppError(
          "Rental agreement not found",
          404
        )
      );
    }

    const userId = req.user._id.toString();
    const isOwner = agreement.owner._id.toString() === userId;
    const isRenter = agreement.renter._id.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isRenter && !isAdmin) {
      return next(
        new AppError(
          "You are not authorized to view this agreement",
          403
        )
      );
    }

    res.status(200).json({
      success: true,
      data: { agreement },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Electronically accept agreement
| PATCH /api/agreements/:id/sign
|--------------------------------------------------------------------------
*/
exports.signAgreement = asyncHandler(
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(
        new AppError(
          "Invalid agreement ID",
          400
        )
      );
    }

    if (req.body.accepted !== true) {
      return next(
        new AppError(
          "You must explicitly accept the agreement before signing",
          400
        )
      );
    }

    const legalName =
      typeof req.body.legalName === "string"
        ? req.body.legalName.trim()
        : "";

    if (legalName.length < 2 || legalName.length > 120) {
      return next(
        new AppError(
          "A valid legal name is required",
          400
        )
      );
    }

    const session = await mongoose.startSession();
    let agreement;
    let otherParty;
    let becameExecuted = false;

    try {
      await session.withTransaction(async () => {
        agreement = await RentalAgreement.findById(
          req.params.id
        ).session(session);

        if (!agreement) {
          throw new AppError(
            "Rental agreement not found",
            404
          );
        }

        if (agreement.status === "cancelled") {
          throw new AppError(
            "Cancelled agreements cannot be signed",
            400
          );
        }

        const userId = req.user._id.toString();
        const isOwner = agreement.owner.toString() === userId;
        const isRenter = agreement.renter.toString() === userId;

        if (!isOwner && !isRenter) {
          throw new AppError(
            "You are not a party to this agreement",
            403
          );
        }

        const signature = isOwner
          ? agreement.ownerSignature
          : agreement.renterSignature;

        if (signature.signed) {
          throw new AppError(
            "You have already accepted this agreement",
            409
          );
        }

        signature.signed = true;
        signature.legalName = legalName;
        signature.signedAt = new Date();

        otherParty = isOwner
          ? agreement.renter
          : agreement.owner;

        if (
          agreement.ownerSignature.signed &&
          agreement.renterSignature.signed
        ) {
          agreement.status = "executed";
          agreement.executedAt = new Date();
          becameExecuted = true;

          if (agreement.rentalTerms) {
            const terms = await RentalTerms.findOne({
              _id: agreement.rentalTerms,
              status: "accepted",
            }).session(session);

            if (!terms) {
              throw new AppError(
                "Accepted rental terms are no longer available",
                409
              );
            }

            const tenancy = await Tenancy.findOne({
              _id: agreement.tenancy,
              application: terms.application,
            }).session(session);

            if (!tenancy) {
              throw new AppError(
                "Rental record could not be found",
                409
              );
            }

            if (tenancy.status === "pending_agreement") {
              const startsNow =
                new Date(terms.startDate).getTime() <= Date.now();

              tenancy.status = startsNow
                ? "active"
                : "upcoming";
              tenancy.activatedAt = startsNow
                ? new Date()
                : null;

              await tenancy.save({ session });
              if (startsNow) {
                const property = await Property.findById(
                  terms.property
                ).session(session);

                if (property) {
                  property.listingStatus = "rented";
                  property.reservationStatus = "available";
                  property.reservedAt = null;
                  property.publishedAt = null;
                  await property.save({ session });
                }
              }
            }
          }
        }

        await agreement.save({ session });
      });
    } finally {
      await session.endSession();
    }

    await populateAgreement(agreement);

    await safeCreateNotification({
      user: otherParty,
      type: "agreement",
      title: becameExecuted
        ? "Rental Agreement Confirmed"
        : "Rental Agreement Accepted",
      message: becameExecuted
        ? `Both parties accepted the rental agreement for ${agreement.property.title}.`
        : `${req.user.name} accepted the rental agreement.`,
      resourceType: "agreement",
      resourceId: agreement._id,
    });

    res.status(200).json({
      success: true,
      message: becameExecuted
        ? "Agreement accepted by both parties"
        : "Agreement accepted successfully",
      data: { agreement },
    });
  }
);
