const { body } = require("express-validator");

const createChannelValidator = [
  body("channelName")
    .trim()
    .notEmpty()
    .withMessage("Channel name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Channel name must be between 3 and 50 characters"),

  body("handle")
    .trim()
    .notEmpty()
    .withMessage("Handle is required")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage(
      "Handle can contain only letters, numbers, dot (.), underscore (_) and hyphen (-)"
    )
    .isLength({ min: 3, max: 30 })
    .withMessage("Handle must be between 3 and 30 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

const updateChannelValidator = [
  body("channelName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Channel name must be between 3 and 50 characters"),

  body("handle")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage(
      "Handle can contain only letters, numbers, dot (.), underscore (_) and hyphen (-)"
    )
    .isLength({ min: 3, max: 30 })
    .withMessage("Handle must be between 3 and 30 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

module.exports = {
  createChannelValidator,
  updateChannelValidator,
};