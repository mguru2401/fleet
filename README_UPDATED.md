# 🚀 Fleet API - Final Complete Version

## ✨ LATEST UPDATES

### ✅ Key Features (Updated)
- 🔐 **Email-based Authentication** - Use email instead of username for login
- 👤 **Admin-Only User Management** - Only admins can create and delete users
- 📚 **Full CRUD Operations** - Create, Read, Update, Delete user management
- 🏥 **Health Endpoints** - Multiple health check endpoints for monitoring
- 🔑 **Role-based Access Control** - Permissions based on user roles (admin/driver/manager/user)
- ⏱️ **JWT Authentication** - Secure token-based authentication
- 📝 **Plain Text Passwords** - Simple password storage (development only)

---

## 🎯 QUICK START

### 1. Install Dependencies
```bash
yarn install
# or
npm install
```

### 2. Create Supabase Table
Go to Supabase SQL Editor and run:
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50),
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
```

### 3. Add Test Users
```sql
INSERT INTO users (username, email, password_hash, name, role, mobile_no, car_no, location) VALUES
('admin', 'admin@fleet.com', 'admin123', 'Admin User', 'admin', '+919876543210', 'ADMIN-001', 'Mumbai'),
('driver_raj', 'raj@fleet.com', 'raj123', 'Raj Kumar', 'driver', '+918765432109', 'DL-01-AB-9876', 'Delhi'),
('manager_priya', 'priya@fleet.com', 'priya123', 'Priya Singh', 'manager', '+917654321098', 'MH-02-CD-5432', 'Pune');
```

### 4. Configure .env
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
```

### 5. Start Server
```bash
yarn dev
# or
npm run dev
```

✅ Server running on http://localhost:3000

---

## 📚 API ENDPOINTS

### Health Checks (No Auth Required)
```
GET  /health                    - Server health
GET  /api/auth/health           - API health
GET  /api/auth/health/detailed  - Detailed health with services status
```

### Authentication
```
POST /api/auth/login            - Login with email & password
GET  /api/auth/profile          - Get own profile (Protected)
POST /api/auth/logout           - Logout (Protected)
```

### User Management (Admin Only)
```
POST /api/auth/users            - Create new user
GET  /api/auth/users            - Get all users
GET  /api/auth/users/:userId    - Get specific user
PUT  /api/auth/users/:userId    - Update user
DELETE /api/auth/users/:userId  - Delete user
```

---

## 🧪 LOGIN TEST

### Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "admin123"
  }'
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@fleet.com",
    "name": "Admin User",
    "role": "admin",
    "mobile_no": "+919876543210",
    "car_no": "ADMIN-001",
    "location": "Mumbai",
    "session_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👤 CREATE USER (Admin Only)

### Request
```bash
curl -X POST http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdriver@fleet.com",
    "password": "pass123",
    "name": "New Driver",
    "role": "driver",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "Mumbai"
  }'
```

### Response
```json
{
  "success": true,
  "message": "User created successfully by admin",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "newdriver@fleet.com",
    "name": "New Driver",
    "role": "driver",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "Mumbai",
    "created_at": "2026-04-28T15:30:00Z"
  }
}
```

---

## 📋 TEST CREDENTIALS

| Email | Password | Role | Location |
|-------|----------|------|----------|
| admin@fleet.com | admin123 | admin | Mumbai |
| raj@fleet.com | raj123 | driver | Delhi |
| priya@fleet.com | priya123 | manager | Pune |

---

## 📄 DOCUMENTATION FILES

- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - Complete endpoint documentation with all payloads
- **[SQL_QUERIES.md](SQL_QUERIES.md)** - All SQL queries for table creation and data insertion
- **[PLAIN_TEXT_PASSWORDS.md](PLAIN_TEXT_PASSWORDS.md)** - Password handling and test data
- **[postman_collection.json](postman_collection.json)** - Postman collection ready to import

---

## 🔄 WORKFLOW

1. **Admin Login** → Get JWT token
2. **Admin Creates User** → POST `/api/auth/users`
3. **New User Logs In** → Gets session & JWT token
4. **User Access Profile** → GET `/api/auth/profile` with JWT
5. **Admin Updates User** → PUT `/api/auth/users/:userId`
6. **Admin Deletes User** → DELETE `/api/auth/users/:userId`
7. **User Logout** → POST `/api/auth/logout`

---

## 🔐 Authorization Header

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

Example:
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 PROJECT STRUCTURE

```
fleet-api/
├── src/
│   ├── config/
│   │   ├── supabase.js          # Supabase client
│   │   └── jwt.js               # JWT token handling
│   ├── controllers/
│   │   └── authController.js    # All endpoint handlers
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── routes/
│   │   └── authRoutes.js        # Route definitions
│   ├── utils/
│   │   └── password.js          # Password & admin check
│   └── server.js                # Express app
├── supabase/
│   └── migrations/
│       └── 001_create_users_table.sql
├── .env                         # Environment config
├── .env.example                 # Template
├── package.json                 # Dependencies
├── API_ENDPOINTS.md             # Endpoint docs
├── SQL_QUERIES.md               # SQL queries
├── postman_collection.json      # Postman collection
└── README.md                    # This file
```

---

## 🛠️ ENVIRONMENT VARIABLES

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development
```

---

## 🧪 TEST IN POSTMAN

1. Import `postman_collection.json` into Postman
2. Set variables:
   - `base_url` = `http://localhost:3000`
3. First, run **Login** request
4. JWT token will auto-save to `{{jwt_token}}`
5. Use token in other protected endpoints

---

## ⚠️ IMPORTANT NOTES

- ✅ JWT expires in **7 days**
- ✅ Only **ADMIN** can create/delete users
- ✅ Users can update their own profile
- ✅ Emails must be **UNIQUE**
- ✅ Passwords stored as **plain text** (development only!)
- ✅ Use **email** for login (not username)
- ✅ Session IDs auto-generated on login
- ✅ All timestamps in ISO 8601 format

---

## 🚀 PRODUCTION CHECKLIST

Before deploying to production:

- [ ] Hash passwords with bcrypt instead of plain text
- [ ] Use HTTPS only
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS for your frontend domain
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Enable RLS in Supabase
- [ ] Use environment-specific .env files
- [ ] Add request logging
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable CSURF protection
- [ ] Use secure session storage

---

## 📞 API RESPONSE CODES

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Admin required)
- `404` - Not Found
- `409` - Conflict (Email exists)
- `500` - Server Error

---

## 💡 QUICK LINKS

- [Supabase Dashboard](https://supabase.com/dashboard)
- [JWT Decoder](https://jwt.io)
- [Postman](https://www.postman.com)
- [API Documentation](API_ENDPOINTS.md)
- [SQL Queries](SQL_QUERIES.md)

---

## 📝 LICENSE

MIT

