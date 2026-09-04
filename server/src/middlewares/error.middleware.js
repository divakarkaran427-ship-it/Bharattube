const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error("❌ Error:", err);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",

    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;