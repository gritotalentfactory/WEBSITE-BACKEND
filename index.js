// Require Modules
const mongoose = require('mongoose');   // Require mongoose
const express = require('express');     // Require express
const dotenv = require('dotenv');       // Require dotenv
const multer = require('multer'); // Require multer
const cors = require('cors'); // Require cors
const jwt = require('jsonwebtoken'); // Require jsonwebtoken
const cookieParser = require('cookie-parser'); // Require cookie-parser
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

// Configure env
dotenv.config();

// Initialize express application
const app = express();

// Use modules
// app.use(cors()); // Use the CORS middleware
const allowedOrigins = ['http://localhost:3000'];

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
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory
app.use(cookieParser()); // Use cookie-parser

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Require Models
const Talent = require('./models/talentModel'); // Require model for storing talent information
const TalentRequest = require('./models/talentRequestModel'); // Require Model for storing talent requests
const Admin = require('./models/adminModel'); // Require Model for admin login

// Require Middleware
const authMiddleware = require('./middleware/authRoute'); // Require middleware for protected routes
const { validateTalent, validationResult } = require('./middleware/talentValidator'); // Require middleware for talent validation
const { validateTalentRequest } = require('./middleware/talentRequestValidator'); // Require middleware for talent request validation


// Connect mongoose to database
const connect = mongoose.connect(process.env.MONGODB_URL);

// Check if database is connected or not
connect.then(() => {
    console.log("Database connected successfully");
})
.catch(() => {
    console.log("Database not connected");
});

// Configure Local Storage for Multer
const localStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Initialize multer with local storage
const upload = multer({ storage: localStorage });

// Function to upload file to Cloudinary
const uploadToCloudinary = (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder: 'talents' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};


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
  const imageLocal = req.file ? `/uploads/${req.file.filename}` : null;

  if (!imageLocal) {
    return res.status(400).json({ message: 'Image is required' });
  }

  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path);


    // Create a new talent
    const newTalent = new Talent({
      name,
      country,
      countryCode,
      skillSet,
      level,
      gender,
      portfolio,
      image: cloudinaryResult.secure_url,
      imageLocal,
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
app.get('/admin/talents', async (req, res) => {
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
  const imageLocal = req.file ? `/uploads/${req.file.filename}` : null;

  try {
      // Check if talent exists
      let talent = await Talent.findById(req.params.id);
      if (!talent) {
        return res.status(404).json({ message: 'Talent not found' });
      }

      // Upload to Cloudinary if a new image is provided
    let cloudinaryResult = null;
    if (imageLocal) {
      cloudinaryResult = await uploadToCloudinary(req.file.path);
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
      if (cloudinaryResult) {
        talent.image = cloudinaryResult.secure_url;
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
app.get('/admin/talent-request', async (req, res) => {
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











