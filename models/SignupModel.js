const mongoose = require('mongoose');

const SignupSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 20 },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // Flag to indicate if the user is an admin
});

// Create a model from the schema
const SignupModel = mongoose.model('User', SignupSchema);

module.exports = SignupModel;
