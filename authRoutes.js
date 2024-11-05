const express = require('express');
const bcrypt = require('bcrypt');
const SignupModel = require('./models/SignupModel'); // Ensure correct path
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email and password are for the admin
    if (email === 'admin@gmail.com' && password === 'Admin@123') {
      // Admin login successful
      return res.status(200).json({ message: 'Login successful', userType: 'admin', redirectTo: '/admin-dashboard' });
    }

    // For normal users, check in the database
    const user = await SignupModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Normal user login successful
    res.status(200).json({ message: 'Login successful', userType: 'user', redirectTo: '/user-dashboard' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
