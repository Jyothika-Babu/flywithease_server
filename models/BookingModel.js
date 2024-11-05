const mongoose = require('mongoose');

// Define the Booking schema
const BookingSchema = new mongoose.Schema({
  prefix: { type: String, default: "" }, // optional field
  firstName: { type: String, required: true },
  middleName: { type: String, default: "" }, // optional field
  lastName: { type: String, required: true },
  passportNo: { type: String, required: true },
  nationality: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  issueDate: { type: Date, default: Date.now }, // optional field with default value
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
});

// Create the Booking model
const BookingModel = mongoose.model('Booking', BookingSchema);

// Export the Booking model
module.exports = BookingModel;
