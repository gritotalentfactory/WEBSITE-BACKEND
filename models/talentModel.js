// models/talentModel.js

const mongoose = require('mongoose');   // Require mongoose

// Create a schema
const talentSchema = new mongoose.Schema({
    name: {
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
    portfolio: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
// Collection part
const collection = new mongoose.model("talents", talentSchema);

// Export model
module.exports = collection;