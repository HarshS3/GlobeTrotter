#!/usr/bin/env node
// Advanced seed: multiple users, trips, stops, activities with randomness.
// Environment/config options (defaults in parentheses):
// USERS=5 TRIPS_PER_USER=2 STOPS_PER_TRIP=3-5 ACTIVITIES_PER_STOP=2-4 BASE_DATE=2025-01-01
// Example: USERS=3 TRIPS_PER_USER=1 STOPS_PER_TRIP=2-3 ACTIVITIES_PER_STOP=1-2 node src/scripts/seedAdvanced.js
import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { configDotenv } from 'dotenv';
configDotenv(); // Load .env for any custom config

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function dateAdd(base, days) { const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); }

const WORDS = ['Aurora','Summit','Voyage','Harbor','Saffron','Indigo','Cobalt','Nimbus','Sierra','Cascade','Vertex','Orbit'];
const CITIES = [
  { city: 'Paris', country: 'FR' }, { city: 'Berlin', country: 'DE' }, { city: 'Rome', country: 'IT' },
  { city: 'Madrid', country: 'ES' }, { city: 'Lisbon', country: 'PT' }, { city: 'Prague', country: 'CZ' },
  { city: 'Vienna', country: 'AT' }, { city: 'Budapest', country: 'HU' }
];
const ACT_TITLES = ['Museum', 'Dinner', 'Walking Tour', 'Concert', 'Gallery', 'Castle Visit', 'Café Stop', 'Market', 'Boat Ride', 'Cooking Class'];

function parseRange(value, defMin, defMax) {
  if (!value) return [defMin, defMax];
  const parts = value.split('-').map(Number).filter(n=>!isNaN(n));
  if (parts.length === 1) return [parts[0], parts[0]];
  if (parts.length >= 2) return [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
  return [defMin, defMax];
}

const USERS = parseInt(process.env.USERS || '5', 10);
const TRIPS_PER_USER = parseInt(process.env.TRIPS_PER_USER || '2', 10);
const [STOPS_MIN, STOPS_MAX] = parseRange(process.env.STOPS_PER_TRIP, 3, 5);
const [ACT_MIN, ACT_MAX] = parseRange(process.env.ACTIVITIES_PER_STOP, 2, 4);
const BASE_DATE = process.env.BASE_DATE || '2025-01-01';

async function ensureUser(i) {
  const email = `seeduser${i}@example.com`;
  const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.rowCount) return { id: existing.rows[0].id, email };
  const hash = await bcrypt.hash('Password123!', 10);
  const { rows } = await query(`INSERT INTO users (email, password, first_name, last_name, phone, city, country, additional_info, photo_url)
    VALUES ($1,$2,$3,$4,'N/A','Seed City','Seed Country','','') RETURNING id`, [email, hash, 'User'+i, 'Seed']);
  return { id: rows[0].id, email };
}

async function createTrip(userId, idx) {
  const name = `${pick(WORDS)} ${pick(WORDS)} Trip ${idx+1}`;
  const length = randInt(4, 9); // days
  const start = dateAdd(BASE_DATE, randInt(0, 40));
  const end = dateAdd(start, length);
  const startLoc = pick(CITIES).city + ' Start';
  const endLoc = pick(CITIES).city + ' End';
  const { rows } = await query(`INSERT INTO trips (user_id,name,start_date,end_date,start_location,end_location,description)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [userId, name, start, end, startLoc, endLoc, 'Generated trip']);
  return rows[0];
}

async function createStop(tripId, position) {
  const cityObj = pick(CITIES);
  // simplistic: each stop spans 2 days sequentially
  const baseTrip = await query('SELECT start_date FROM trips WHERE id=$1', [tripId]);
  const base = baseTrip.rows[0].start_date;
  const startOffset = (position - 1) * 2;
  const start = dateAdd(base, startOffset);
  const end = dateAdd(base, startOffset + 1);
  const { rows } = await query(`INSERT INTO trip_stops (trip_id, position, city, country, start_date, end_date)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [tripId, position, cityObj.city, cityObj.country, start, end]);
  return rows[0];
}

async function createActivity(stopId, userId) {
  const title = pick(ACT_TITLES);
  const cost = (Math.random() < 0.2) ? 0 : randInt(10, 120); // some free
  const startHour = randInt(8, 20);
  const start_time = `${String(startHour).padStart(2,'0')}:00:00`;
  const duration = randInt(45, 180);
  const day_offset = 0; // could compute relative to stop start
  const { rows } = await query(`INSERT INTO stop_activities (trip_stop_id,title,category,cost,duration_minutes,day_offset,start_time,notes,created_by)
    VALUES ($1,$2,NULL,$3,$4,$5,$6,NULL,$7) RETURNING id`, [stopId, title, cost, duration, day_offset, start_time, userId]);
  return rows[0];
}

async function run() {
  console.log('Seeding with config:', { USERS, TRIPS_PER_USER, STOPS_MIN, STOPS_MAX, ACT_MIN, ACT_MAX, BASE_DATE });
  for (let u = 0; u < USERS; u++) {
    const user = await ensureUser(u+1);
    console.log('User', user.id, user.email);
    for (let t = 0; t < TRIPS_PER_USER; t++) {
      const trip = await createTrip(user.id, t);
      const stopsCount = randInt(STOPS_MIN, STOPS_MAX);
      const stops = [];
      for (let s = 1; s <= stopsCount; s++) {
        stops.push(await createStop(trip.id, s));
      }
      for (const st of stops) {
        const actCount = randInt(ACT_MIN, ACT_MAX);
        for (let a = 0; a < actCount; a++) {
          await createActivity(st.id, user.id);
        }
      }
      console.log(` Trip ${trip.id} -> stops=${stopsCount}`);
    }
  }
  // Summary counts
  const tripCount = (await query('SELECT COUNT(*) FROM trips')).rows[0].count;
  const stopCount = (await query('SELECT COUNT(*) FROM trip_stops')).rows[0].count;
  const actCount = (await query('SELECT COUNT(*) FROM stop_activities')).rows[0].count;
  console.log('Totals:', { trips: tripCount, stops: stopCount, activities: actCount });
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });