// middleware/authRoute.js

const jwt = require('jsonwebtoken');  // Require jwt

// Authentication middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.cookies.adminData; // Get token from cookies
    if (token == null) {
        return res.status(401).json({ message: 'Access denied' }); // If no token, return 401
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
      if (err) return res.sendStatus(403); // If token is invalid, return 403
      console.log(admin)
      req.admin = admin; // Attach user to request
      next(); // Proceed to next middleware or route handler
    });
  };

// Export middleware
module.exports = authMiddleware;