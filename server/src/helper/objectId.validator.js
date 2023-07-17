/**
 * Validates if a value is a Mongo Object ID
 * Used by Joi custom validations
 */
const mongoose = require('mongoose');

function validateObjectId(value, helpers) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}

module.exports = validateObjectId;
