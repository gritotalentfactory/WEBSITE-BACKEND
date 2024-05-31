// Require Modules
const mongoose = require('mongoose');   // Require mongoose
const express = require('express');     // Require express
const dotenv = require('dotenv');       // Require dotenv
const multer = require('multer'); // Require multer
const path = require('path'); // Require path for file paths
const cors = require('cors'); // Require path for file paths


// Configure env
dotenv.config();



// Require Models
const Talent = require('./models/talentModel'); // Require model for storing talent requests
const TalentRequest = require('./models/talentRequestModel'); // Model for storing talent requests

// Require Middleware
const { validateTalent, validationResult } = require('./validators/talentValidator');
const { validateTalentRequest } = require('./validators/talentRequestValidator');


// Initialize express application
const app = express();

// Use modules
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory
app.use(cors()); // Use the CORS middleware

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

// ----------------- TALENT REQUEST ------------------

// API to Handle Talent Requests // Tested
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
app.get('/talent-request', async (req, res) => {
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











