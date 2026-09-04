const Settings = require("../models/settings.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// ==========================================
// Get Settings
// ==========================================

const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      settings,
      "Settings fetched successfully."
    )
  );
});

// ==========================================
// Update Settings
// ==========================================

const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  Object.assign(settings, req.body);

  await settings.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      settings,
      "Settings updated successfully."
    )
  );
});

module.exports = {
  getSettings,
  updateSettings,
};