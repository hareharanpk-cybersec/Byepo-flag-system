const { validationResult } = require('express-validator');

/**
 * Middleware: runs validationResult and returns 400 with errors array if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validate };
