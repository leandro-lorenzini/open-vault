const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const group = new mongoose.Schema({
  name: { type: String, required: true },
  admin: { type: Boolean, required: true, default: false },
});

const sso = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  entryPoint: { type: String, required: true },
  issuer: { type: String, required: true },
  certificate: { type: String, required: true },
});

const smtp = new mongoose.Schema({
  server: { type: String, default: false },
  port: { type: Number, required: true },
  secure: { type: Boolean, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const tokens = new mongoose.Schema({
  type: { type: String, required: false, enum: ['sso'] },
  value: { type: String, required: true },
  user: { type: ObjectId, required: true },
  date: { type: Date, default: Date.now },
  consumed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'success', 'error'],
    default: 'pending',
  },
});

const organization = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true },
  groups: [group],
  sso: sso,
  smtp: smtp,
  tokens: [tokens],
});

module.exports = mongoose.model('Organization', organization);
