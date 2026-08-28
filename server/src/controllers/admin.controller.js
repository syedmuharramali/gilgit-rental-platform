const asyncHandler = require("../utils/asyncHandler");

exports.getAdminDashboard = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",

    data: {
      admin: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});