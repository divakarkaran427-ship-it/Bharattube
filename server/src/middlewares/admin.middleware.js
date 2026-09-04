const ApiError = require("../utils/ApiError");

const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Unauthorized"));
    }

    if (req.user.role !== "admin") {
        return next(new ApiError(403, "Access denied. Admin only."));
    }

    next();
};

module.exports = adminMiddleware;