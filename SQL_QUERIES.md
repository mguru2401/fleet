# 📝 SQL INSERT QUERIES - Email-based Login

## ✅ CREATE TABLE QUERY

```sql
-- Create users table
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## ➕ INSERT TEST USERS

### Single Admin User
```sql
INSERT INTO users (username, email, password_hash, name, role, mobile_no, car_no, location)
VALUES (
  'admin',
  'admin@2f.com',
  '123456',
  'Admin',
  'admin',
  '9876543210',
  NULL,
  'India'
);
```

### Multiple Test Users (Bulk Insert)
```sql
INSERT INTO users (username, email, password_hash, name, role, mobile_no, car_no, location) VALUES
('admin', 'admin@fleet.com', 'admin123', 'Admin User', 'admin', '+919876543210', 'ADMIN-001', 'Mumbai'),
('driver_raj', 'raj@fleet.com', 'raj123', 'Raj Kumar', 'driver', '+918765432109', 'DL-01-AB-9876', 'Delhi'),
('manager_priya', 'priya@fleet.com', 'priya123', 'Priya Singh', 'manager', '+917654321098', 'MH-02-CD-5432', 'Pune'),
('driver_amit', 'amit@fleet.com', 'amit123', 'Amit Patel', 'driver', '+916543210987', 'GJ-03-EF-1234', 'Ahmedabad'),
('testuser', 'test@fleet.com', 'test123', 'Test User', 'user', '+915432109876', 'TS-04-GH-5678', 'Hyderabad');
```

---

## 🔍 VIEW ALL USERS

```sql
SELECT id, username, email, name, role, mobile_no, car_no, location, created_at 
FROM users;
```

---

## ✏️ UPDATE QUERIES

### Update User Email
```sql
UPDATE users 
SET email = 'newemail@fleet.com'
WHERE username = 'admin';
```

### Update User Password
```sql
UPDATE users 
SET password_hash = 'newpassword123'
WHERE email = 'admin@fleet.com';
```

### Update User Role
```sql
UPDATE users 
SET role = 'manager'
WHERE email = 'raj@fleet.com';
```

### Update Multiple Fields
```sql
UPDATE users 
SET 
  mobile_no = '+919999999999',
  car_no = 'NEW-CAR-001',
  location = 'Bangalore',
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'raj@fleet.com';
```

---

## ❌ DELETE QUERIES

### Delete Single User
```sql
DELETE FROM users WHERE email = 'test@fleet.com';
```

### Delete by Username
```sql
DELETE FROM users WHERE username = 'testuser';
```

### Delete Multiple Users
```sql
DELETE FROM users WHERE role = 'user';
```

### Clear All Users (CAUTION!)
```sql
DELETE FROM users;
```

---

## 📊 TEST USERS READY TO USE

| Email | Password | Name | Role | Mobile | Car | Location |
|-------|----------|------|------|--------|-----|----------|
| admin@fleet.com | admin123 | Admin User | admin | +919876543210 | ADMIN-001 | Mumbai |
| raj@fleet.com | raj123 | Raj Kumar | driver | +918765432109 | DL-01-AB-9876 | Delhi |
| priya@fleet.com | priya123 | Priya Singh | manager | +917654321098 | MH-02-CD-5432 | Pune |
| amit@fleet.com | amit123 | Amit Patel | driver | +916543210987 | GJ-03-EF-1234 | Ahmedabad |
| test@fleet.com | test123 | Test User | user | +915432109876 | TS-04-GH-5678 | Hyderabad |

---

## 🧪 LOGIN TEST DATA

### Admin Login
```json
{
  "email": "admin@fleet.com",
  "password": "admin123"
}
```

### Driver Login
```json
{
  "email": "raj@fleet.com",
  "password": "raj123"
}
```

### Manager Login
```json
{
  "email": "priya@fleet.com",
  "password": "priya123"
}
```

---

## 📋 COPY-PASTE COMMANDS

### Quick Setup (Run this entire block)
```sql
-- Create table
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

-- Insert test users
INSERT INTO users (username, email, password_hash, name, role, mobile_no, car_no, location) VALUES
('admin', 'admin@fleet.com', 'admin123', 'Admin User', 'admin', '+919876543210', 'ADMIN-001', 'Mumbai'),
('driver_raj', 'raj@fleet.com', 'raj123', 'Raj Kumar', 'driver', '+918765432109', 'DL-01-AB-9876', 'Delhi'),
('manager_priya', 'priya@fleet.com', 'priya123', 'Priya Singh', 'manager', '+917654321098', 'MH-02-CD-5432', 'Pune'),
('driver_amit', 'amit@fleet.com', 'amit123', 'Amit Patel', 'driver', '+916543210987', 'GJ-03-EF-1234', 'Ahmedabad'),
('testuser', 'test@fleet.com', 'test123', 'Test User', 'user', '+915432109876', 'TS-04-GH-5678', 'Hyderabad');
```

---

## ✨ NOTES

⚠️ **Important:**
- Emails are now **UNIQUE** and used for login
- Username is optional (can be created from email)
- Password stored as **plain text** (development only!)
- All new tables should use `email` for login, not `username`

---

## 🚀 EXPENSES & ADVANCES TABLES

### Expenses Table
```sql
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES users(id),
  car_no VARCHAR(20),
  driver_name VARCHAR(100),
  date DATE NOT NULL,
  description TEXT,
  reason VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_driver_id ON expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_car_no ON expenses(car_no);
```

### Salary Advances Table
```sql
CREATE TABLE IF NOT EXISTS advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES users(id),
  car_no VARCHAR(20),
  driver_name VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advances_driver_id ON advances(driver_id);

---

## 🏎️ CARS, REVENUE & SALARY TABLES

### Cars Table
```sql
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  car_no VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Alter Users Table (Add Driver Specifics)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_no VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS revenue_per_day DECIMAL(10, 2) DEFAULT 0.00;
```

### Revenue Table (Daily Tracking)
```sql
CREATE TABLE IF NOT EXISTS revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES users(id),
  car_id UUID REFERENCES cars(id),
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revenue_driver_id ON revenue(driver_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
```

### Salary History Table
```sql
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES users(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  working_days INTEGER NOT NULL,
  basic_pay DECIMAL(10, 2) NOT NULL,
  target_revenue DECIMAL(10, 2) NOT NULL,
  actual_revenue DECIMAL(10, 2) NOT NULL,
  incentive DECIMAL(10, 2) NOT NULL,
  advances_deducted DECIMAL(10, 2) NOT NULL,
  final_salary DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- UPI, Cash, Bank Transfer
  status VARCHAR(20) DEFAULT 'paid',
  settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_history_driver_id ON salary_history(driver_id);
```

---

## 🧪 TEST DATA FOR NEW TABLES

### 1. Insert Test Cars
```sql
INSERT INTO cars (name, car_no, model, year) VALUES
('Toyota Innova', 'MH-01-AB-1234', 'Crysta', 2023),
('Maruti Ertiga', 'KA-05-MN-5678', 'ZXI', 2022);
```

### 2. Update Driver with Car and Revenue Target
```sql
UPDATE users SET 
  car_id = (SELECT id FROM cars WHERE car_no = 'MH-01-AB-1234'),
  employee_no = 'DRV001',
  revenue_per_day = 3000
WHERE email = 'raj@fleet.com';
```

### 3. Insert Test Revenue (Actual Revenue)
```sql
INSERT INTO revenue (driver_id, car_id, date, amount) VALUES
((SELECT id FROM users WHERE email = 'raj@fleet.com'), (SELECT car_id FROM users WHERE email = 'raj@fleet.com'), '2026-05-01', 5000),
((SELECT id FROM users WHERE email = 'raj@fleet.com'), (SELECT car_id FROM users WHERE email = 'raj@fleet.com'), '2026-05-02', 4500),
((SELECT id FROM users WHERE email = 'raj@fleet.com'), (SELECT car_id FROM users WHERE email = 'raj@fleet.com'), '2026-05-03', 6000);
```

### 4. Monthly Working Days Table (Global) - DEPRECATED
-- Note: This table is no longer used. Working days are calculated from trips.
```sql
CREATE TABLE IF NOT EXISTS monthly_working_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  working_days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);
```

---

## 🏷️ CATEGORIES & TRIP UPDATES

### Categories Table
```sql
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Categories
INSERT INTO categories (name) VALUES ('ola'), ('uber'), ('amazon'), ('it'), ('other');
```

### Update Trips Table (Add commission and net amount)
```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Backfill net_amount for existing trips
UPDATE trips SET net_amount = trip_rate - COALESCE(commission_amount, 0) WHERE net_amount = 0;
```

### Update Users Table (Add desired salary)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS desired_salary DECIMAL(10, 2) DEFAULT 0.00;
```

```
