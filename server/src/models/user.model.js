const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const key = new mongoose.Schema({
  device: { type: String, required: false },
  value: { type: String, required: true },
});

const tokens = new mongoose.Schema({
  type: { type: String, required: false, enum: ['activation', 'reset'] },
  value: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  consumed: { type: Boolean, default: false },
});

const user = new mongoose.Schema({
  organization: { type: ObjectId, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  admin: { type: Boolean, required: false, default: false },
  sso: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  groups: [ObjectId],
  password: { type: String },
  keys: [key],
  tokens: [tokens],
});

module.exports = mongoose.model('User', user);
