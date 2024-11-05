const express = require('express');
const nodemailer = require('nodemailer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Signup = require('./models/SignupModel');
const Booking = require('./models/BookingModel');
const Flight = require('./models/FlightModel'); 
const Airport = require('./models/AirportModel'); // Correct path

const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Route: Signup
app.post('/signup', async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    let user = await Signup.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    user = new Signup({ username, email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User created successfully', user: { username, email, phone } });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).send('Server error');
  }
});

// Route: Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Signup.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JSON_WEB_TOKEN_SECRET_KEY);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route: Google Authentication
app.post('/authWithGoogle', async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await Signup.findOne({ email });

    if (!user) {
      user = await Signup.create({
        name,
        email,
        password: '',
      });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JSON_WEB_TOKEN_SECRET_KEY);
    res.status(200).json({ user, token, msg: 'User Login Successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during Google Auth' });
  }
});

// Route: Send Flight Ticket as PDF via Email
app.post('/send-ticket', async (req, res) => {
  const { email, firstName, lastName, flightNumber, departure, arrival, seatNumber, totalAmount } = req.body;

  try {
    // 1. Create PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage([600, 400]);
    const { height, width } = page.getSize();
    const fontSize = 12;

    // Add background color
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Add airline logo
    const logoUrl = 'https://w7.pngwing.com/pngs/503/7/png-transparent-airplane-logo-flight-attendant-air-travel-airplane-aviation-avion-text-logo-flight-thumbnail.png';
    const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
    const logoImage = await pdfDoc.embedPng(logoResponse.data);
    page.drawImage(logoImage, {
      x: 450,
      y: height - 80,
      width: 100,
      height: 40,
    });

    // Add title and passenger information
    page.drawText('Flight Ticket Confirmation', {
      x: 50,
      y: height - 40,
      size: 24,
      font: timesRomanFont,
      color: rgb(0, 0.53, 0.71),
    });
    page.drawText(`Name: ${firstName} ${lastName}`, { x: 50, y: height - 80, size: fontSize, font: timesRomanFont });
    page.drawText(`Flight Number: ${flightNumber}`, { x: 50, y: height - 100, size: fontSize, font: timesRomanFont });
    page.drawText(`Departure: ${departure}`, { x: 50, y: height - 120, size: fontSize, font: timesRomanFont });
    page.drawText(`Arrival: ${arrival}`, { x: 50, y: height - 140, size: fontSize, font: timesRomanFont });
    page.drawText(`Seat Number: ${seatNumber}`, { x: 50, y: height - 160, size: fontSize, font: timesRomanFont });
    page.drawText(`Total Amount: $${totalAmount}`, { x: 50, y: height - 180, size: fontSize, font: timesRomanFont });

    // Save the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // 2. Send Email with the PDF
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Flight Ticket Confirmation',
      text: `Dear ${firstName} ${lastName},\n\nYour flight ticket is confirmed.\n\nTotal Amount: $${totalAmount}`,
      attachments: [
        {
          filename: 'ticket.pdf',
          content: pdfBytes,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully with the flight ticket!');
  } catch (error) {
    console.error('Error sending email', error);
    res.status(500).send('Error sending email');
  }
});

// Route: Save Booking Data
app.post('/bookings', async (req, res) => {
  try {
    const bookingData = new Booking(req.body);
    await bookingData.save();
    res.status(201).send('Booking saved successfully!');
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).send('Error saving booking');
  }
});

// Route: Add a new flight
// Route: Add a new flight
app.post('/flights', async (req, res) => {
  try {
    const flightData = new Flight(req.body);
    await flightData.save();
    res.status(201).send('Flight saved successfully!');
  } catch (error) {
    console.error('Error saving flight:', error);
    res.status(500).send('Error saving flight');
  }
});

// Ensure this is in your index.js file
app.post('/airport', async (req, res) => {
  try {
    const airportData = new Airport(req.body);
    await airportData.save();
    res.status(201).send('Airports added successfully');
  } catch (error) {
    console.error('Error in adding airports:', error);
    res.status(500).send('Error in adding airports');
  }
});


// Route: Fetch Flights Data from DB
app.get('/flights', async (req, res) => {
  try {
    const flights = await Flight.find();  // Fetch all flights from the DB
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

// Route: Fetch Users Data
app.get('/users', async (req, res) => {
  try {
    const users = await Signup.find(); // Fetch all users
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Route: Get the number of users
app.get('/count/users', async (req, res) => {
  try {
    const userCount = await Signup.countDocuments();
    res.json({ count: userCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user count' });
  }
});

app.get('/count/bookings', async (req, res) => {
  try {
    const bookingCount = await Booking.countDocuments();
    res.json({ count: bookingCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking count' });
  }
});

// Route: Get the number of available flights
app.get('/count/flights', async (req, res) => {
  try {
    const flightCount = await Flight.countDocuments();
    res.json({ count: flightCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flight count' });
  }
});

// Route: Fetch Bookings Data
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find(); // Use Booking instead of BookingModel
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('Server error');
  }
});



// Start the server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
