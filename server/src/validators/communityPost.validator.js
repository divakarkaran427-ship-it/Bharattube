const { body } = require("express-validator");

const createCommunityPostValidator = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Content cannot exceed 5000 characters."),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Visibility must be public or private."),

  body("hashtags")
    .optional()
    .isArray()
    .withMessage("Hashtags must be an array."),

  body("hashtags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each hashtag must be between 1 and 50 characters."),

  body("poll.question")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Poll question must be between 3 and 300 characters."),

  body("poll.options")
    .optional()
    .isArray({ min: 2, max: 4 })
    .withMessage("Poll must contain 2 to 4 options."),

  body("poll.options.*.text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Poll option cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Poll option cannot exceed 100 characters."),

  body().custom((value, { req }) => {
    const content = req.body.content?.trim();
    const images = req.body.images;
    const poll = req.body.poll;

    const hasContent = !!content;
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasPoll =
      poll &&
      poll.question &&
      Array.isArray(poll.options) &&
      poll.options.length >= 2;

    if (!hasContent && !hasImages && !hasPoll) {
      throw new Error(
        "Post must contain content, images, or a poll."
      );
    }

    return true;
  }),
];

const updateCommunityPostValidator = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Content cannot exceed 5000 characters."),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Visibility must be public or private."),

  body("hashtags")
    .optional()
    .isArray()
    .withMessage("Hashtags must be an array."),

  body("hashtags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each hashtag must be between 1 and 50 characters."),

  body("poll.question")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Poll question must be between 3 and 300 characters."),

  body("poll.options")
    .optional()
    .isArray({ min: 2, max: 4 })
    .withMessage("Poll must contain 2 to 4 options."),

  body("poll.options.*.text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Poll option cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Poll option cannot exceed 100 characters."),
];

module.exports = {
  createCommunityPostValidator,
  updateCommunityPostValidator,
};