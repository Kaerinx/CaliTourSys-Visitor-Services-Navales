function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.statusCode || 500;
  res.status(status).json({
    message: error.message || "Internal server error.",
    verificationUrl: error.verificationUrl,
  });
}

module.exports = { notFoundHandler, errorHandler };
