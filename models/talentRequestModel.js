// models/talentRequestModel.js

const mongoose = require('mongoose');   // Require mongoose
// Note: name of client, country, skillSet, level, Gender - Required inputs
 
// Create a schema
const talentRequestSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  clientWnum: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  skillSet: {
    type: [String],
    required: true
  },
  level: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

// Collection part
const collection = new mongoose.model("talentRequest", talentRequestSchema);

// Export model
module.exports = collection;