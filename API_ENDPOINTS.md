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

## 🚗 TRIP MANAGEMENT ENDPOINTS (All Authenticated Users Can Access)

### 1. Create Trip - `/api/trips`
**POST** `http://localhost:3000/api/trips`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "pick_up_date": "2026-04-28",
  "pick_up_time": "09:30:00",
  "start_km": 1500.50,
  "end_km": 1650.75,
  "drop_location": "Airport Terminal 3",
  "mileage": 150.25,
  "trip_rate": 2500.00,
  "category": "uber"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440100",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "car_no": "ABC123",
    "driver_name": "Admin",
    "pick_up_date": "2026-04-28",
    "pick_up_time": "09:30:00",
    "start_km": 1500.50,
    "end_km": 1650.75,
    "drop_location": "Airport Terminal 3",
    "mileage": 150.25,
    "trip_rate": 2500.00,
    "category": "uber",
    "status": "completed",
    "created_at": "2026-04-28T15:30:00Z",
    "updated_at": "2026-04-28T15:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "All fields are required (pick_up_date, pick_up_time, start_km, end_km, drop_location, mileage, trip_rate, category)"
}
```

---

### 2. Get All Trips - `/api/trips`
**GET** `http://localhost:3000/api/trips?limit=50&offset=0&category=uber&pick_up_date=2026-04-28`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Query Parameters (Optional):**
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)
- `category` - Filter by category (amazon, ola, uber, other, it)
- `driver_id` - Filter by driver ID
- `pick_up_date` - Filter by pickup date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "count": 2,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440100",
      "driver_id": "550e8400-e29b-41d4-a716-446655440000",
      "car_no": "ABC123",
      "driver_name": "Admin",
      "pick_up_date": "2026-04-28",
      "pick_up_time": "09:30:00",
      "start_km": 1500.50,
      "end_km": 1650.75,
      "drop_location": "Airport Terminal 3",
      "mileage": 150.25,
      "trip_rate": 2500.00,
      "category": "uber",
      "status": "completed",
      "created_at": "2026-04-28T15:30:00Z",
      "updated_at": "2026-04-28T15:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440101",
      "driver_id": "550e8400-e29b-41d4-a716-446655440001",
      "car_no": "XYZ789",
      "driver_name": "John Driver",
      "pick_up_date": "2026-04-28",
      "pick_up_time": "14:15:00",
      "start_km": 2000.00,
      "end_km": 2150.50,
      "drop_location": "Downtown Mall",
      "mileage": 150.50,
      "trip_rate": 1800.00,
      "category": "amazon",
      "status": "completed",
      "created_at": "2026-04-28T14:00:00Z",
      "updated_at": "2026-04-28T14:00:00Z"
    }
  ]
}
```

---

### 3. Get Trip by ID - `/api/trips/:tripId`
**GET** `http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip retrieved successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440100",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "car_no": "ABC123",
    "driver_name": "Admin",
    "pick_up_date": "2026-04-28",
    "pick_up_time": "09:30:00",
    "start_km": 1500.50,
    "end_km": 1650.75,
    "drop_location": "Airport Terminal 3",
    "mileage": 150.25,
    "trip_rate": 2500.00,
    "category": "uber",
    "status": "completed",
    "created_at": "2026-04-28T15:30:00Z",
    "updated_at": "2026-04-28T15:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Trip not found"
}
```

---

### 4. Get Trips by Driver ID - `/api/trips/driver/:driverId`
**GET** `http://localhost:3000/api/trips/driver/550e8400-e29b-41d4-a716-446655440000?limit=50&offset=0&month=1&year=2026&category=uber`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Query Parameters (Optional):**
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)
- `month` - Filter by month (1-12)
- `year` - Filter by year (YYYY format)
- `category` - Filter by category (amazon, ola, uber, other, it)

**Response (200):**
```json
{
  "success": true,
  "message": "Driver trips retrieved successfully",
  "count": 3,
  "filters": {
    "month": 1,
    "year": 2026,
    "category": "uber"
  },
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440100",
      "driver_id": "550e8400-e29b-41d4-a716-446655440000",
      "car_no": "ABC123",
      "driver_name": "Admin",
      "pick_up_date": "2026-01-15",
      "pick_up_time": "09:30:00",
      "start_km": 1500.50,
      "end_km": 1650.75,
      "drop_location": "Airport Terminal 3",
      "mileage": 150.25,
      "trip_rate": 2500.00,
      "category": "uber",
      "status": "completed",
      "created_at": "2026-01-15T15:30:00Z",
      "updated_at": "2026-01-15T15:30:00Z"
    }
  ]
}
```

---

### 5. Update Trip - `/api/trips/:tripId`
**PUT** `http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body (Send Only Fields to Update):**
```json
{
  "end_km": 1700.50,
  "drop_location": "Airport Terminal 2",
  "mileage": 200.00,
  "trip_rate": 3000.00,
  "status": "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip updated successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440100",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "car_no": "ABC123",
    "driver_name": "Admin",
    "pick_up_date": "2026-04-28",
    "pick_up_time": "09:30:00",
    "start_km": 1500.50,
    "end_km": 1700.50,
    "drop_location": "Airport Terminal 2",
    "mileage": 200.00,
    "trip_rate": 3000.00,
    "category": "uber",
    "status": "completed",
    "created_at": "2026-04-28T15:30:00Z",
    "updated_at": "2026-04-28T15:45:00Z"
  }
}
```

---

### 6. Get Car Revenue Statistics - `/api/trips/stats/revenue`
**GET** `http://localhost:3000/api/trips/stats/revenue?month=4&year=2026`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Query Parameters (Optional):**
- `month` - Filter by month (1-12). Defaults to current month.
- `year` - Filter by year (YYYY). Defaults to current year.

**Response (200):**
```json
{
  "success": true,
  "message": "Car revenue statistics retrieved successfully",
  "data": {
    "period": {
      "month": 4,
      "year": 2026,
      "startDate": "2026-04-01",
      "endDate": "2026-04-30"
    },
    "overall_summary": {
      "total_revenue": 7300.00,
      "total_expense": 2500.00,
      "net_profit": 4800.00,
      "total_trips": 5
    },
    "by_category": {
      "uber": {
        "total_revenue": 2500.00,
        "trip_count": 1
      }
    },
    "by_car": {
      "ABC123": {
        "total_revenue": 5500.00,
        "total_expense": 1500.00,
        "net_profit": 4000.00,
        "trip_count": 3
      }
    }
  }
}
```

---

### 7. Delete Trip - `/api/trips/:tripId`
**DELETE** `http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

## 💸 EXPENSE MANAGEMENT ENDPOINTS

### 1. Create Expense - `/api/expenses`
**POST** `http://localhost:3000/api/expenses`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2026-04-28",
  "reason": "Fuel Refill",
  "description": "Full tank at Shell station",
  "amount": 4500.50
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440200",
    "driver_id": "550e8400-e29b-41d4-a716-446655440001",
    "car_no": "ABC123",
    "driver_name": "John Driver",
    "date": "2026-04-28",
    "reason": "Fuel Refill",
    "description": "Full tank at Shell station",
    "amount": 4500.50,
    "status": "pending",
    "created_at": "2026-04-28T15:30:00Z"
  }
}
```

---

### 2. Get All Expenses - `/api/expenses`
**GET** `http://localhost:3000/api/expenses?status=pending&driver_id=...`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

---

### 3. Get Expense Breakdown by Car - `/api/expenses/stats/breakdown`
**GET** `http://localhost:3000/api/expenses/stats/breakdown?month=4&year=2026`

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Query Parameters (Optional):**
- `month` - Filter by month (1-12). Defaults to current month.
- `year` - Filter by year (YYYY). Defaults to current year.

**Response (200):**
```json
{
  "success": true,
  "message": "Expense and Revenue breakdown retrieved successfully",
  "period": {
    "month": 4,
    "year": 2026,
    "startDate": "2026-04-01",
    "endDate": "2026-04-30"
  },
  "summary": {
    "total_revenue": 25000.00,
    "total_expense": 15000.50,
    "net_profit": 9999.50,
    "car_count": 2
  },
  "data": [
    {
      "car_no": "ABC123",
      "total_revenue": 10000.00,
      "total_expense": 3000.00,
      "net_profit": 7000.00,
      "expense_entries": [
        {
          "id": "...",
          "date": "2026-04-28",
          "reason": "Fuel",
          "amount": 3000.00,
          "status": "pending"
        }
      ]
    }
  ]
}
```

---

### 3. Update Expense - `/api/expenses/:expenseId`
**PUT** `http://localhost:3000/api/expenses/770e8400-e29b-41d4-a716-446655440200`

---

### 4. Delete Expense - `/api/expenses/:expenseId`
**DELETE** `http://localhost:3000/api/expenses/770e8400-e29b-41d4-a716-446655440200`

---

## 💰 SALARY ADVANCE ENDPOINTS (ADMIN ONLY)

### 1. Create Salary Advance - `/api/advances`
**POST** `http://localhost:3000/api/advances`

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "driver_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 5000.00,
  "date": "2026-04-28",
  "description": "Advance for medical emergency"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Salary advance created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440300",
    "driver_id": "550e8400-e29b-41d4-a716-446655440001",
    "driver_name": "John Driver",
    "car_no": "ABC123",
    "amount": 5000.00,
    "date": "2026-04-28",
    "description": "Advance for medical emergency",
    "status": "unpaid",
    "created_at": "2026-04-28T15:30:00Z"
  }
}
```

---

### 2. Get All Advances - `/api/advances`
**GET** `http://localhost:3000/api/advances`

---

### 3. Update Advance Status - `/api/advances/:advanceId`
**PUT** `http://localhost:3000/api/advances/880e8400-e29b-41d4-a716-446655440300`
*(Example: Update status to 'deducted' when processing salary)*

**Request Body:**
```json
{
  "status": "deducted"
}
```

---

### 4. Delete Advance - `/api/advances/:advanceId`
**DELETE** `http://localhost:3000/api/advances/880e8400-e29b-41d4-a716-446655440300`

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

### Create Trip
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pick_up_date": "2026-04-28",
    "pick_up_time": "09:30:00",
    "start_km": 1500.50,
    "end_km": 1650.75,
    "drop_location": "Airport Terminal 3",
    "mileage": 150.25,
    "trip_rate": 2500.00,
    "category": "uber"
  }'
```

### Get All Trips
```bash
curl -X GET "http://localhost:3000/api/trips?limit=50&offset=0&category=uber" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Get Trip by ID
```bash
curl -X GET http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100 \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Get Trips by Driver
```bash
curl -X GET "http://localhost:3000/api/trips/driver/550e8400-e29b-41d4-a716-446655440000?limit=50&offset=0&month=1&year=2026&category=uber" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Update Trip
```bash
curl -X PUT http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100 \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "end_km": 1700.50,
    "drop_location": "Airport Terminal 2",
    "mileage": 200.00,
    "trip_rate": 3000.00
  }'
```

### Delete Trip
```bash
curl -X DELETE http://localhost:3000/api/trips/660e8400-e29b-41d4-a716-446655440100 \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Get Car Revenue Statistics
```bash
curl -X GET http://localhost:3000/api/trips/stats/revenue \
  -H "Authorization: Bearer JWT_TOKEN"
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
| POST | `/api/trips` | ✅ | ❌ | Create trip |
| GET | `/api/trips` | ✅ | ❌ | Get all trips |
| GET | `/api/trips/:tripId` | ✅ | ❌ | Get trip by ID |
| GET | `/api/trips/driver/:driverId` | ✅ | ❌ | Get trips by driver |
| PUT | `/api/trips/:tripId` | ✅ | ❌ | Update trip |
| GET | `/api/trips/stats/revenue` | ✅ | ❌ | Car revenue statistics |

---

## 🔑 Key Changes

✅ **Email-based Login**: Use email instead of username for login
✅ **Admin-Only User Management**: Only admins can create/delete users
✅ **Full CRUD Operations**: Create, Read, Update, Delete users
✅ **Health Endpoints**: Multiple health check endpoints
✅ **Role-based Access Control**: Permissions based on user role
✅ **Plain Text Passwords**: No hashing (development only)
✅ **Trip Management**: Complete CRUD for trips with auto-filled driver details
✅ **All Roles Can Access Trips**: All authenticated users can create, read, update, delete trips

---

## 🛣️ Trips Endpoint Notes

### Features:
- **Auto-filled Fields**: `driver_id`, `car_no`, `driver_name` are automatically filled from authenticated user
- **Category Validation**: Only `amazon`, `ola`, `uber`, `other`, `it` are allowed
- **Numeric Fields**: `start_km`, `end_km`, `mileage`, `trip_rate` are stored as decimals
- **Filtering**: Get trips by date, category, or driver ID
- **All Roles Access**: Any authenticated user (admin, driver, manager) can manage trips
- **Pagination**: Built-in pagination with `limit` and `offset` query parameters

### Required Fields for Trip Creation:
- `pick_up_date` (YYYY-MM-DD)
- `pick_up_time` (HH:MM:SS)
- `start_km` (decimal)
- `end_km` (decimal)
- `drop_location` (string)
- `mileage` (decimal) - actual distance traveled in km
- `trip_rate` (decimal) - cost/rate for the trip
- `category` (amazon/ola/uber/other/it)

### Auto-Generated Fields:
- `driver_id` - From JWT token
- `driver_name` - From authenticated user
- `car_no` - From user profile
- `status` - Default: "completed"
- `created_at` - Timestamp
- `updated_at` - Timestamp

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
