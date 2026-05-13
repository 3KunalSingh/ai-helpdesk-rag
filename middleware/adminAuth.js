const jwt = require('jsonwebtoken');

/**
 * Middleware to protect admin-only routes.
 * Reads JWT from the Authorization header (Bearer <token>),
 * verifies it, and attaches the decoded admin info to req.admin.
 */
const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = adminAuth;
