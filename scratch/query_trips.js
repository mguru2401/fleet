const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const driverId = 'ef0515a4-fb11-41af-9cd5-940f8f052900';
  const { data: trips, error } = await supabase
    .from('trips')
    .select('pick_up_date, category')
    .eq('driver_id', driverId)
    .gte('pick_up_date', '2026-05-01')
    .lte('pick_up_date', '2026-05-31');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const dailyEarnings = {};
  trips.forEach(trip => {
    const date = trip.pick_up_date;
    if (!dailyEarnings[date]) {
      dailyEarnings[date] = [];
    }
    dailyEarnings[date].push(trip.category);
  });

  console.log('Total days with trips:', Object.keys(dailyEarnings).length);
  console.log('Breakdown by date:');
  Object.keys(dailyEarnings).sort().forEach(date => {
    console.log(`- ${date}: ${JSON.stringify(dailyEarnings[date])}`);
  });
}

main();
