export const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

export const errorHandler = (error, req, res, _next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  if (error.name === 'ValidationError') return res.status(422).json({ success: false, message: Object.values(error.errors).map((item) => item.message).join(' ') });
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource identifier.' });
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error.' });
};
