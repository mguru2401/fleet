-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_no VARCHAR(20) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  pick_up_date DATE NOT NULL,
  pick_up_time TIME NOT NULL,
  start_km NUMERIC(10, 2) NOT NULL,
  end_km NUMERIC(10, 2) NOT NULL,
  drop_location VARCHAR(255) NOT NULL,
  mileage NUMERIC(10, 2) NOT NULL,
  trip_rate NUMERIC(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_pick_up_date ON trips(pick_up_date);
CREATE INDEX IF NOT EXISTS idx_trips_car_no ON trips(car_no);
CREATE INDEX IF NOT EXISTS idx_trips_category ON trips(category);

-- Optional: Enable Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Optional: Create policies for RLS
CREATE POLICY "Users can read all trips" ON trips
  FOR SELECT USING (true);

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update trips" ON trips
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete trips" ON trips
  FOR DELETE USING (true);
