# 🚀 Fleet API - Complete Endpoints Documentation

## 📋 BASE URL
```
http://localhost:3000
```

---

## ✅ HEALTH CHECK ENDPOINTS (Public - No Auth Required)

### 1. Server Health - `/health`
**GET** `http://localhost:3000/health`

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-28T15:30:00Z"
}
```

---

### 2. API Health - `/api/auth/health`
**GET** `http://localhost:3000/api/auth/health`

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-28T15:30:00Z"
}
```

---

### 3. Detailed Health Check - `/api/auth/health/detailed`
**GET** `http://localhost:3000/api/auth/health/detailed`

**Response (200):**
```json
{
  "success": true,
  "message": "Server health check",
  "status": "healthy",
  "timestamp": "2026-04-28T15:30:00Z",
  "services": {
    "server": "running",
    "supabase": "connected",
    "database": "connected"
  },
  "uptime": 3600,
  "nodeVersion": "v16.0.0",
  "environment": "development"
}
```

---

## 🔐 AUTHENTICATION ENDPOINTS

### 1. Login - `/api/auth/login`
**POST** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body (EMAIL as username):**
```json
{
  "email": "admin@2f.com",
  "password": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@2f.com",
    "name": "Admin",
    "role": "admin",
    "mobile_no": "9876543210",
    "car_no": null,
    "location": "India",
    "session_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 2. Get Profile - `/api/auth/profile`
**GET** `http://localhost:3000/api/auth/profile`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@2f.com",
    "username": "Admin",
    "name": "Admin",
    "role": "admin",
    "mobile_no": "9876543210",
    "car_no": null,
    "location": "India",
    "created_at": "2026-04-28T10:00:00Z"
  }
}
```

---

### 3. Logout - `/api/auth/logout`
**POST** `http://localhost:3000/api/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👥 USER MANAGEMENT ENDPOINTS (ADMIN ONLY)

### 1. Create User - `/api/auth/users`
**POST** `http://localhost:3000/api/auth/users`

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "driver@fleet.com",
  "password": "driver123",
  "name": "John Driver",
  "role": "driver",
  "mobile_no": "+1234567890",
  "car_no": "ABC123",
  "location": "Mumbai",
  "username": "john_driver"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully by admin",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "driver@fleet.com",
    "username": "john_driver",
    "name": "John Driver",
    "role": "driver",
    "mobile_no": "+1234567890",
    "car_no": "ABC123",
    "location": "Mumbai",
    "created_at": "2026-04-28T15:30:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

---

### 2. Get All Users - `/api/auth/users`
**GET** `http://localhost:3000/api/auth/users`

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "count": 3,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@2f.com",
      "username": "Admin",
      "name": "Admin",
      "role": "admin",
      "mobile_no": "9876543210",
      "car_no": null,
      "location": "India",
      "last_login": "2026-04-28T15:25:00Z",
      "created_at": "2026-04-28T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "driver@fleet.com",
      "username": "john_driver",
      "name": "John Driver",
      "role": "driver",
      "mobile_no": "+1234567890",
      "car_no": "ABC123",
      "location": "Mumbai",
      "last_login": null,
      "created_at": "2026-04-28T15:30:00Z"
    }
  ]
}
```

---

### 3. Get User by ID - `/api/auth/users/:userId`
**GET** `http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440000`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@2f.com",
    "username": "Admin",
    "name": "Admin",
    "role": "admin",
    "mobile_no": "9876543210",
    "car_no": null,
    "location": "India",
    "last_login": "2026-04-28T15:25:00Z",
    "created_at": "2026-04-28T10:00:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Access denied. You can only view your own profile"
}
```

---

### 4. Update User - `/api/auth/users/:userId`
**PUT** `http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440001`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "mobile_no": "+9876543210",
  "car_no": "XYZ789",
  "location": "Pune",
  "role": "manager",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "driver@fleet.com",
    "username": "john_driver",
    "name": "John Updated",
    "role": "manager",
    "mobile_no": "+9876543210",
    "car_no": "XYZ789",
    "location": "Pune",
    "created_at": "2026-04-28T15:30:00Z",
    "updated_at": "2026-04-28T15:45:00Z"
  }
}
```

---

### 5. Delete User - `/api/auth/users/:userId`
**DELETE** `http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440001`

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete your own account"
}
```

---

## 🧪 cURL EXAMPLES

### Login with Email
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@2f.com",
    "password": "123456"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create User (Admin Only)
```bash
curl -X POST http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdriver@fleet.com",
    "password": "pass123",
    "name": "New Driver",
    "role": "driver",
    "mobile_no": "+1111111111",
    "car_no": "NEW001",
    "location": "Bangalore"
  }'
```

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get User by ID
```bash
curl -X GET http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "mobile_no": "+9999999999",
    "location": "NewCity"
  }'
```

### Delete User (Admin Only)
```bash
curl -X DELETE http://localhost:3000/api/auth/users/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Detailed Health
```bash
curl http://localhost:3000/api/auth/health/detailed
```

---

## 📊 ENDPOINT SUMMARY TABLE

| Method | Endpoint | Auth Required | Admin Only | Description |
|--------|----------|---------------|-----------|-------------|
| GET | `/health` | ❌ | ❌ | Server health |
| GET | `/api/auth/health` | ❌ | ❌ | API health |
| GET | `/api/auth/health/detailed` | ❌ | ❌ | Detailed health |
| POST | `/api/auth/login` | ❌ | ❌ | Login with email |
| GET | `/api/auth/profile` | ✅ | ❌ | Get own profile |
| POST | `/api/auth/logout` | ✅ | ❌ | Logout |
| POST | `/api/auth/users` | ✅ | ✅ | Create user |
| GET | `/api/auth/users` | ✅ | ✅ | Get all users |
| GET | `/api/auth/users/:userId` | ✅ | ❌ | Get user by ID |
| PUT | `/api/auth/users/:userId` | ✅ | ❌ | Update user |
| DELETE | `/api/auth/users/:userId` | ✅ | ✅ | Delete user |

---

## 🔑 Key Changes

✅ **Email-based Login**: Use email instead of username for login
✅ **Admin-Only User Management**: Only admins can create/delete users
✅ **Full CRUD Operations**: Create, Read, Update, Delete users
✅ **Health Endpoints**: Multiple health check endpoints
✅ **Role-based Access Control**: Permissions based on user role
✅ **Plain Text Passwords**: No hashing (development only)

---

## ⚠️ Authentication Header Format

Always use JWT token in requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💡 Notes

- JWT tokens expire in **7 days** (configurable in `.env` as `JWT_EXPIRE`)
- Admin users can update any user profile
- Regular users can only update their own profile
- Admin users can only be deleted by other admins
- Use email for login (not username)
- All dates returned in ISO 8601 format
