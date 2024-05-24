# Grito Talents API Documentation
This document provides an overview of the API endpoints and instructions for setting up and using the Grito Talents API. The API allows clients to manage talents and talent requests.

## Table of Contents
- Setup Instructions
- Environment Variables
- API Endpoints
  - Create Talent
  - Get Talents
  - Get Talents for Admin
  - Update Talent
  - Delete Talent
  - Create Talent Request
- Validation
  
## Setup Instructions
### Prerequisites
- Node.js (version 12 or higher)
- MongoDB
- Cloudinary Account

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/your-repository-url.git
   cd your-repository-folder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory of your project and add the following environment variables:
   ```
   MONGODB_URL=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   PORT=5000
   ```

4. Start the server:
   ```
   npm start
   ```

The server should now be running on the port specified in your `.env` file.

## Environment Variables

- `MONGODB_URL`: MongoDB connection string
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `PORT`: Port number for the server

## API Endpoints

### Create Talent

**Endpoint:** `POST /admin/talents`

**Description:** Creates a new talent and uploads the provided image to Cloudinary.

**Request Body:**
```json
{
  "name": "Buzz brain",
  "country": "Nigeria",
  "skillSet": ["Fullstack Development", "Data Analytics"],
  "level": "Intermediate",
  "gender": "male",
  "portfolio": "http://portfolio.link",
  "imageUrl": "profile.jpeg"
 }
```

**Responses:**
- `201 Created`: Talent created successfully.
- `400 Bad Request`: Validation error or missing image.

### Get Talents

**Endpoint:** `GET /talents`

**Description:** Fetches all talents to be displayed on the carousel.

**Responses:**
- `200 OK`: Returns an array of talents.
- `500 Internal Server Error`: Error fetching talents.

### Get Talents for Admin

**Endpoint:** `GET /admin/talents`

**Description:** Fetches all talents for the admin dashboard.

**Responses:**
- `200 OK`: Returns an array of talents.
- `500 Internal Server Error`: Error fetching talents.

### Update Talent

**Endpoint:** `PATCH /admin/talents/:id`

**Description:** Updates an existing talent.

**Request Body:**
```json
{
  "name": "Favour",
  "country": "Ghana",
  "skillSet": ["UI Designer"],
  "level": "professional",
  "gender": "female",
  "portfolio": "http://portfolio.link",
  "imageUrl": "profile.jpeg"
}
```

**Responses:**
- `200 OK`: Talent updated successfully.
- `400 Bad Request`: Validation error.
- `404 Not Found`: Talent not found.

### Delete Talent

**Endpoint:** `DELETE /admin/talents/:id`

**Description:** Deletes a talent.

**Responses:**
- `200 OK`: Talent deleted successfully.
- `404 Not Found`: Talent not found.
- `400 Bad Request`: Error deleting talent.

### Create Talent Request

**Endpoint:** `POST /talent-request`

**Description:** Creates a new talent request.

**Request Body:**
```json
{
  "clientName": "Mr. peter pan",
  "country": "Nigeria",
  "skillSet": ["Fullstack Development", "Data Analytics"],
  "level": "intermediate",
  "gender": "male"
}
```

**Responses:**
- `201 Created`: Talent request submitted successfully.
- `400 Bad Request`: Validation error.

## Validation

The API uses `express-validator` for input validation. Below are the validation rules for each endpoint:

### Talent Validation
- `name`: Required
- `country`: Required
- `skillSet`: Required
- `level`: Required
- `gender`: Required
- `portfolio`: Required

### Talent Request Validation
- `clientName`: Required
- `country`: Required
- `skillSet`: Required
- `level`: Required
- `gender`: Required

---

By following the above documentation, you can set up, run, and use the Grito Talents API. If you have any further questions or issues, please refer to the issues section of the repository or contact the project maintainers.
