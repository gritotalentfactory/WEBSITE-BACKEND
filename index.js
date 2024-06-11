// Require Modules
const mongoose = require('mongoose');   // Require mongoose
const express = require('express');     // Require express
const dotenv = require('dotenv');       // Require dotenv
const multer = require('multer');       // Require multer
const cors = require('cors');           // Require cors
const jwt = require('jsonwebtoken');    // Require jsonwebtoken
const cookieParser = require('cookie-parser'); // Require cookie-parser
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');    // Require streamifier to handle buffer streams

// Require Models
const Talent = require('./models/talentModel'); // Require model for storing talent information
const TalentRequest = require('./models/talentRequestModel'); // Require Model for storing talent requests
const Admin = require('./models/adminModel'); // Require Model for admin login

// Require Middleware
const authMiddleware = require('./middleware/authRoute'); // Require middleware for protected routes
const { validateTalent, validationResult } = require('./middleware/talentValidator'); // Require middleware for talent validation
const { validateTalentRequest } = require('./middleware/talentRequestValidator'); // Require middleware for talent request validation

// Configure env
dotenv.config();

// Initialize express application
const app = express();

// Configure multer for file upload
const storage = multer.memoryStorage(); // Use memory storage to handle file uploads in memory
const upload = multer({ storage });

// Use modules
const allowedOrigins = ['https://gritowebsite.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Enable credentials
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect mongoose to database
const connect = mongoose.connect(process.env.MONGODB_URL);

// Check if database is connected or not
connect.then(() => {
  console.log("Database connected successfully");
}).catch(() => {
  console.log("Database not connected");
});

// Admin Login API 
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid Login details' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Login details' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, email: admin.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    // Set the token as a cookie
    res.cookie('adminData', token, {
      httpOnly: true, // Prevents JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS
      sameSite: 'strict', // Helps mitigate CSRF attacks
      maxAge: 3600000 // 1 hour
    });

    res.json({ message: 'Login Successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Admin Logout API
app.post('/admin/logout', (req, res) => {
  res.clearCookie('adminData', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production' 
  });
  res.status(200).json({ message: 'Logout successful' });
});

// CRUD OPERATIONS

// Function to upload a stream to Cloudinary
const uploadStreamToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// CREATE TALENTS
app.post('/admin/talents', upload.single('image'), validateTalent, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, country, countryCode, skillSet, level, gender, portfolio } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(400).json({ message: 'Image is required' });
  }

  try {
    // Upload file to Cloudinary
    const result = await uploadStreamToCloudinary(image.buffer);

    // Create a new talent
    const newTalent = new Talent({
      name,
      country,
      countryCode,
      skillSet,
      level,
      gender,
      portfolio,
      image: result.secure_url
    });

    // Save to the database
    await newTalent.save();
    res.status(201).json({ message: 'Talent created successfully', talent: newTalent });
  } catch (error) {
    res.status(400).json({ message: 'Error creating talent', error });
  }
});

// READ / DISPLAY TALENTS

// Fetch Talents for Carousel
app.get('/talents', async (req, res) => {
  try {
    const talents = await Talent.find();
    res.json(talents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching talents', error });
  }
});

// Fetch Talents for Admin Dashboard
app.get('/admin/talents', async (req, res) => {
  try {
    const talents = await Talent.find();
    res.json(talents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching talents', error });
  }
});

// UPDATE / EDIT TALENTS

// Update Talent
app.patch('/admin/talents/:id', upload.single('image'), validateTalent, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, country, countryCode, skillSet, level, gender, portfolio } = req.body;
  const image = req.file;

  try {
    // Check if talent exists
    let talent = await Talent.findById(req.params.id);
    if (!talent) {
      return res.status(404).json({ message: 'Talent not found' });
    }

    // Update talent data
    talent.name = name;
    talent.country = country;
    talent.countryCode = countryCode;
    talent.skillSet = skillSet;
    talent.level = level;
    talent.gender = gender;
    talent.portfolio = portfolio;

    // Upload to Cloudinary if a new image is provided
    if (image) {
      const result = await uploadStreamToCloudinary(image.buffer);
      talent.image = result.secure_url;
    }

    // Save updated talent to the database
    await talent.save();

    res.json({ message: "Talent updated successfully", talent });
  } catch (error) {
    res.status(400).json({ message: 'Error updating talent', error });
  }
});

// DELETE TALENTS

// Delete Talent
app.delete('/admin/talents/:id', async (req, res) => {
  try {
    const talent = await Talent.findByIdAndDelete(req.params.id);
    if (!talent) {
      return res.status(404).json({ message: 'Talent not found' });
    }
    res.json({ message: 'Talent deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting talent', error });
  }
});

// CREATE TALENT REQUEST

// Handle Talent Request
app.post('/talent-request', validateTalentRequest, async (req, res) => {
  // Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientName, clientEmail, clientWnum, country, skillSet, level, gender } = req.body;
  try {
    const request = new TalentRequest(req.body);
    await request.save();
    res.status(201).json({ message: 'Talent request submitted successfully', data: { clientName, country, clientEmail, clientWnum, skillSet, level, gender } });
  } catch (error) {
    res.status(400).json({ message: 'Error submitting talent request', error });
  }
});

// ----------------- READ / DISPLAY REQUESTED TALENT ------------------

// API to Fetch Talents for Admin Dashboard // Tested
app.get('/admin/talent-request', async (req, res) => {
  try {
    const requestedTalents = await TalentRequest.find();
    res.json(requestedTalents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requested talents', error });
  }
});

// ----------------- DELETE TALENT REQUEST ------------------

// Delete Talent request
app.delete('/admin/talent-request/:id', async (req, res) => {
  try {
    const requestedTalents = await TalentRequest.findByIdAndDelete(req.params.id);
    if (!requestedTalents) {
      return res.status(404).json({ message: 'Talent request not found' });
    }
    res.json({ message: 'Talent Request deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting talent request', error });
  }
});

// ----------------- LISTEN TO PORT ------------------

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});











