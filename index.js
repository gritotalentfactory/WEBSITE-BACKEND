// Require Modules
const mongoose = require('mongoose');   // Require mongoose
const express = require('express');     // Require express
const dotenv = require('dotenv');       // Require dotenv
const multer = require('multer'); // Require multer
const cors = require('cors'); // Require cors
const jwt = require('jsonwebtoken'); // Require jsonwebtoken
const cookieParser = require('cookie-parser'); // Require cookie-parser

// Configure env
dotenv.config();

// Require Models
const Talent = require('./models/talentModel'); // Require model for storing talent information
const TalentRequest = require('./models/talentRequestModel'); // Require Model for storing talent requests
const Admin = require('./models/adminModel'); // Require Model for admin login

// Require Middleware
const authMiddleware = require('./middleware/authRoute'); // Require middleware for protected routes
const { validateTalent, validationResult } = require('./middleware/talentValidator'); // Require middleware for talent validation
const { validateTalentRequest } = require('./middleware/talentRequestValidator'); // Require middleware for talent request validation

// Initialize express application
const app = express();

// Use modules
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory
app.use(cors()); // Use the CORS middleware
app.use(cookieParser()); // Use cookie-parser

// Connect mongoose to database
const connect = mongoose.connect(process.env.MONGODB_URL);

// Check if database is connected or not
connect.then(() => {
    console.log("Database connected successfully");
})
.catch(() => {
    console.log("Database not connected");
});

// Configure Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Configure CORS Middleware
app.use(cors());

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


// Admin Register API (should be used only once)
// app.post('/admin/register', async (req, res) => {
//   const { email, password, username } = req.body;

//   if (!email || !password || !username) {
//     return res.status(400).json({ message: 'Email, password and username are required' });
//   }

//   try {
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       return res.status(400).json({ message: 'Admin already exists' });
//     }

//     const newAdmin = new Admin({ email, password, username });
//     await newAdmin.save();

//     res.status(201).json({ message: 'Admin registered successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error registering admin', error });
//   }
// });

// Admin Logout API
app.post('/admin/logout', (req, res) => {
  res.clearCookie('adminData', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production' 
  });
  res.status(200).json({ message: 'Logout successful' });
});

//  ****************** CRUD OPERATION ******************  \\

// ----------------- CREATE TALENTS ------------------
// API to Create Talent   // Tested
app.post('/admin/talents', upload.single('image'), validateTalent, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, country, countryCode, skillSet, level, gender, portfolio  } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!image) {
    return res.status(400).json({ message: 'Image is required' });
  }

  try {
    // Create a new talent
    const newTalent = new Talent({
      name,
      country,
      countryCode,
      skillSet,
      level,
      gender,
      portfolio,
      image,
    });

    // Save to the database
    await newTalent.save();
    res.status(201).json({ message: 'Talent created successfully', talent: newTalent });
  } catch (error) {
    res.status(400).json({ message: 'Error creating talent', error });
  }
});
  
// ----------------- READ / DISPLAY TALENTS ------------------

// API to Fetch Talents for Carousel // Tested
app.get('/talents', async (req, res) => {
  try {
      const talents = await Talent.find();
      res.json(talents);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching talents', error });
  }
});

// API to Fetch Talents for Admin Dashboard // Tested
app.get('/admin/talents', authMiddleware, async (req, res) => {
  try {
    const talents = await Talent.find();
    res.json(talents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching talents', error });
  }
});

// ----------------- UPDATE / EDIT TALENTS ------------------

// API to Update Talent // Tested
app.patch('/admin/talents/:id', upload.single('image'), validateTalent, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, country, countryCode, skillSet, level, gender, portfolio } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

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

      // Update image if provided
      if (image) {
        talent.image = image;
      }

      // Save updated talent to the database
      await talent.save();

      res.json({ message : "Talent updated successfully", talent : talent });
    } catch (error) {
      res.status(400).json({ message: 'Error updating talent', error });
    }
});

// ----------------- DELETE TALENTS ------------------

// API to Delete Talent // Tested
app.delete('/admin/talents/:id', authMiddleware, async (req, res) => {
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



// ----------------- CREATE TALENT REQUEST ------------------

// API to Handle Talent Request // Tested
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
    res.status(201).json({ message: 'Talent request submitted successfully', data: { clientName, country,  clientEmail, clientWnum, skillSet, level, gender } });
  } catch (error) {
    res.status(400).json({ message: 'Error submitting talent request', error });
  }
});

// ----------------- READ / DISPLAY REQUESTED TALENT ------------------

// API to Fetch Talents for Admin Dashboard // Tested
app.get('/admin/talent-request', authMiddleware, async (req, res) => {
  try {
    const requestedTalents = await TalentRequest.find();
    res.json(requestedTalents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requested talents', error });
  }
});

// ----------------- LISTEN TO PORT ------------------

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});











