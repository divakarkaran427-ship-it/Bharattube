const { body } = require("express-validator");

const uploadVideoValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 120 })
    .withMessage("Title must be between 5 and 120 characters"),

  body("description")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("language")
    .optional()
    .trim(),

  body("visibility")
    .optional()
    .isIn(["public", "private", "unlisted"])
    .withMessage("Invalid visibility"),

  body("isShort")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isShort must be true or false"),
];

const updateVideoValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage("Title must be between 5 and 120 characters"),

  body("description")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("visibility")
    .optional()
    .isIn(["public", "private", "unlisted"])
    .withMessage("Invalid visibility"),
];

module.exports = {
  uploadVideoValidator,
  updateVideoValidator,
};