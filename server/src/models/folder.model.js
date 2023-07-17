const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const vault = new mongoose.Schema({
  organizationOwned: { type: Boolean, required: true, default: false },
  user: { type: ObjectId },
  key: { type: ObjectId, required: true },
  ciphertext: { type: String, required: true },
  version: { type: Number, required: true, default: 0 },
});

const secret = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  username: { type: String },
  version: { type: Number, required: true, default: 0 },
  strength: { type: Number, required: true, default: 0 },
  vaults: [vault],
  lastUpdated: { type: Date, required: false },
});

const folder = new mongoose.Schema({
  organization: { type: ObjectId, required: true },
  user: { type: ObjectId },
  name: { type: String, required: true },
  groups: [ObjectId],
  secrets: [secret],
});

module.exports = mongoose.model('Folder', folder);
