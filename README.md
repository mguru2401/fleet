# Fleet API - Node.js with Supabase

A complete Node.js REST API with Supabase integration, JWT authentication, and user management.

## Features

✅ User registration and login with JWT authentication  
✅ Password hashing and verification  
✅ Session management  
✅ Protected API routes with auth middleware  
✅ User profile management  
✅ CORS enabled  
✅ Comprehensive error handling  

## Prerequisites

- Node.js (v14 or higher)
- Supabase account (https://supabase.com)
- npm or yarn

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd fleet-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Supabase database:**
   - Create a new Supabase project
   - Go to SQL Editor
   - Copy and run the SQL query from [supabase/migrations/001_create_users_table.sql](supabase/migrations/001_create_users_table.sql)

## Supabase Table Creation Query

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  mobile_no VARCHAR(15),
  car_no VARCHAR(20),
  location VARCHAR(255),
  session_id VARCHAR(100),
  jwt_token TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (optional)
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## Environment Setup

1. **Copy .env.example to .env:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_super_secret_jwt_key_12345
   JWT_EXPIRE=7d
   PORT=3000
   NODE_ENV=development
   ```

## Running the Server

```bash
# Development (with hot reload using nodemon)
npm run dev

# Production
npm start

# Health check
curl http://localhost:3000/health
```

## API Endpoints

### Authentication Endpoints

#### 1. Register User
**POST** `/api/auth/register`

Request body:
```json
{
  "username": "john_doe",
  "password": "secure_password",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user",
  "mobile_no": "+1234567890",
  "car_no": "ABC123",
  "location": "New York"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "New York"
  }
}
```

#### 2. Login User
**POST** `/api/auth/login`

Request body:
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "New York",
    "session_id": "hex_string",
    "jwt_token": "eyJhbGc..."
  }
}
```

#### 3. Get User Profile (Protected)
**GET** `/api/auth/profile`

Headers:
```
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "New York",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 4. Logout User (Protected)
**POST** `/api/auth/logout`

Headers:
```
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Project Structure

```
fleet-api/
├── src/
│   ├── config/
│   │   ├── supabase.js          # Supabase client configuration
│   │   └── jwt.js               # JWT token generation and verification
│   ├── controllers/
│   │   └── authController.js    # Login, register, profile handlers
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   └── authRoutes.js        # Auth API routes
│   ├── utils/
│   │   └── password.js          # Password hashing utilities
│   └── server.js                # Express server setup
├── supabase/
│   └── migrations/
│       └── 001_create_users_table.sql  # Database schema
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Database Schema

### Users Table Columns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(100) | Unique email address |
| password_hash | VARCHAR(255) | Hashed password |
| name | VARCHAR(100) | User's full name |
| role | VARCHAR(20) | User role (e.g., 'user', 'admin') |
| mobile_no | VARCHAR(15) | Phone number |
| car_no | VARCHAR(20) | Vehicle registration number |
| location | VARCHAR(255) | User's location |
| session_id | VARCHAR(100) | Current session identifier |
| jwt_token | TEXT | Current JWT token |
| last_login | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Error Handling

All endpoints return a consistent error response:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (optional)"
}
```

Common status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., username exists)
- `500` - Internal Server Error

## Security Considerations

⚠️ **Important for Production:**

1. **Password Hashing:** Currently uses SHA256. For production, use **bcrypt**:
   ```bash
   npm install bcrypt
   ```
   Then update [src/utils/password.js](src/utils/password.js) to use bcrypt.

2. **JWT Secret:** Change the `JWT_SECRET` in .env to a strong random string

3. **HTTPS:** Always use HTTPS in production

4. **Environment Variables:** Never commit .env file to git

5. **Rate Limiting:** Consider adding rate limiting middleware

6. **CORS:** Configure CORS appropriately for your frontend domain

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123","email":"test@test.com","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# Get Profile (use token from login response)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

1. **"Missing Supabase credentials"** - Make sure .env file is properly filled
2. **"Invalid username or password"** - Check username and password in login request
3. **"Invalid or expired token"** - Token may have expired, login again
4. **CORS errors** - Check CORS configuration in [src/server.js](src/server.js)

## Dependencies

- `express` - Web framework
- `@supabase/supabase-js` - Supabase client
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `jsonwebtoken` - JWT creation and verification
- `nodemon` - Development server with hot reload

## License

MIT
