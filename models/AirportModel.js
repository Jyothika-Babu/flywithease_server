const mongoose = require('mongoose');

// Define the schema for airports
const AirportSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,  // Each airport code should be unique
  },
  name: {
    type: String,
    required: true,
  },
  airport: {
    type: String,
    required: true,
  }
}, { timestamps: true });

// Create the Airport model using the schema
const Airport = mongoose.model('Airport', AirportSchema);

module.exports = Airport;
