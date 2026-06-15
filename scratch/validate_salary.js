const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_SALARY_PER_DAY = 1136.36;
const INCENTIVE_PERCENTAGE = 0.30;

async function main() {
  const driverId = 'ef0515a4-fb11-41af-9cd5-940f8f052900';

  const { data: user } = await supabase
    .from('users')
    .select('name, revenue_per_day')
    .eq('id', driverId)
    .single();

  const revenuePerDay = parseFloat(user.revenue_per_day) || 0;

  const { data: trips } = await supabase
    .from('trips')
    .select('pick_up_date, trip_rate, category, net_amount')
    .eq('driver_id', driverId)
    .gte('pick_up_date', '2026-05-01')
    .lte('pick_up_date', '2026-05-31');

  // Group by date
  const dailyEarnings = {};
  (trips || []).forEach(trip => {
    const date = trip.pick_up_date;
    if (!dailyEarnings[date]) {
      dailyEarnings[date] = { total_revenue: 0, ola_uber_revenue: 0, other_revenue: 0 };
    }
    const amount = (trip.net_amount != null) ? parseFloat(trip.net_amount) : parseFloat(trip.trip_rate);
    const val = amount || 0;
    dailyEarnings[date].total_revenue += val;
    const cat = trip.category ? trip.category.toLowerCase() : '';
    if (cat === 'ola' || cat === 'uber') {
      dailyEarnings[date].ola_uber_revenue += val;
    } else {
      dailyEarnings[date].other_revenue += val;
    }
  });

  let totalRevenue = 0;
  let totalBase = 0;
  let totalTargetedRevenue = 0;
  let totalDays = 0;

  Object.keys(dailyEarnings).sort().forEach(date => {
    const d = dailyEarnings[date];
    totalRevenue += d.total_revenue;
    totalBase += BASE_SALARY_PER_DAY;
    totalTargetedRevenue += revenuePerDay;
    totalDays++;
    console.log(`${date}: revenue=${d.total_revenue.toFixed(2)}, ola_uber=${d.ola_uber_revenue.toFixed(2)}, other=${d.other_revenue.toFixed(2)}`);
  });

  const eligible = Math.max(0, totalRevenue - totalTargetedRevenue);
  const incentive = eligible * INCENTIVE_PERCENTAGE;
  const totalSalary = totalBase + incentive;

  console.log('\n========== RESULT ==========');
  console.log(`Driver:               ${user.name}`);
  console.log(`Revenue Per Day:      ₹${revenuePerDay}`);
  console.log(`Total Days:           ${totalDays}`);
  console.log(`Base Salary:          ₹${totalBase.toFixed(4)}  (expected: ₹23863.6)`);
  console.log(`Total Target:         ₹${totalTargetedRevenue.toFixed(2)}  (expected: ₹78750)`);
  console.log(`Total Revenue:        ₹${totalRevenue.toFixed(2)}`);
  console.log(`Eligible for Incentive: ₹${eligible.toFixed(2)}  (expected: ₹-8570.21 → 0)`);
  console.log(`Incentive:            ₹${incentive.toFixed(2)}  (expected: ₹0)`);
  console.log(`Total Salary:         ₹${totalSalary.toFixed(4)}  (expected: ₹23863.6)`);
}

main().catch(console.error);
