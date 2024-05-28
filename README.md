

# Grito Talents API

The Grito Talents API allows clients to manage talents and talent requests, including creating, fetching, updating, and deleting talents. It uses MongoDB for data storage and Multer for image uploads.

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
- Testing with Postman

## Setup Instructions

### Prerequisites

- Node.js (version 12 or higher)
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repository-url.git
   cd your-repository-folder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory of your project and add the following environment variables:
   ```plaintext
   MONGODB_URL=your_mongodb_connection_string
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server should now be running on the port specified in your `.env` file.

## Environment Variables

- `MONGODB_URL`: MongoDB connection string
- `PORT`: Port number for the server

## API Endpoints

### Create Talent

**Endpoint:** `POST /admin/talents`

**Description:** Creates a new talent and uploads the provided image using Multer.

**Request Body:**

- Form-data:
  - `name`: String
  - `country`: String
  - `skillSet`: Array of Strings
  - `level`: String
  - `gender`: String
  - `portfolio`: String
  - `image`: File

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

- Form-data:
  - `name`: String
  - `country`: String
  - `skillSet`: Array of Strings
  - `level`: String
  - `gender`: String
  - `portfolio`: String
  - `image`: File (optional)

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
  "clientName": "Acme Corp",
  "country": "Germany",
  "skillSet": ["Java", "Spring"],
  "level": "Junior",
  "gender": "Any"
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

## Testing with Postman

### Testing the API Endpoints

#### Create Talent

1. **Open Postman**.
2. **Create a New Request**:
   - Set the request method to `POST`.
   - Enter the URL: `http://localhost:5000/admin/talents`.
3. **Set Headers**:
   - Key: `Content-Type`, Value: `multipart/form-data`.
4. **Set Body**:
   - Select `form-data`.
   - Add the following fields:
     - `name`: `Buzz Brain`
     - `country`: `Nigeria`
     - `skillSet`: `Nodejs, MongoDB`
     - `level`: `Intermediate`
     - `gender`: `Male`
     - `portfolio`: `https://portfolio.example.com`
     - `image`: File (Choose a file from your computer).
5. **Send the Request**.
6. **Check the Response**: You should receive a `201 Created` response with the created talent.

#### Get Talents

1. **Create a New Request**:
   - Set the request method to `GET`.
   - Enter the URL: `http://localhost:5000/talents`.
2. **Send the Request**.
3. **Check the Response**: You should receive a `200 OK` response with an array of talents.

#### Get Talents for Admin

1. **Create a New Request**:
   - Set the request method to `GET`.
   - Enter the URL: `http://localhost:5000/admin/talents`.
2. **Send the Request**.
3. **Check the Response**: You should receive a `200 OK` response with an array of talents.

#### Update Talent

1. **Create a New Request**:
   - Set the request method to `PATCH`.
   - Enter the URL: `http://localhost:5000/admin/talents/:id` (replace `:id` with the actual talent ID).
2. **Set Headers**:
   - Key: `Content-Type`, Value: `multipart/form-data`.
3. **Set Body**:
   - Select `form-data`.
   - Add the fields to update (similar to the create talent request).
4. **Send the Request**.
5. **Check the Response**: You should receive a `200 OK` response with the updated talent.

#### Delete Talent

1. **Create a New Request**:
   - Set the request method to `DELETE`.
   - Enter the URL: `http://localhost:5000/admin/talents/:id` (replace `:id` with the actual talent ID).
2. **Send the Request**.
3. **Check the Response**: You should receive a `200 OK` response with a success message.

#### Create Talent Request

1. **Create a New Request**:
   - Set the request method to `POST`.
   - Enter the URL: `http://localhost:5000/talent-request`.
2. **Set Body**:
   - Select `raw` and `JSON`.
   - Add the following JSON:
     ```json
     {
       "clientName": "Mr Peter pan",
       "country": "Germany",
       "skillSet": ["Nodejs", "MongoDB"],
       "level": "Intermediate",
       "gender": "Male"
     }
     ```
3. **Send the Request**.
4. **Check the Response**: You should receive a `201 Created` response with the submitted talent request.

By following the above instructions, you can set up, run, and test the Grito Talents API. If you have any further questions or issues, please refer to the issues section of the repository or contact the project maintainers.

---
