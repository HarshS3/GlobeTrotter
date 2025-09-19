#!/usr/bin/env node
// Seed demo data: creates one or more users, trips, stops, activities.
// Safe to run multiple times (basic idempotency by checking existing email patterns)
import { configDotenv } from 'dotenv';
import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
configDotenv(); // Load .env for DEMO_EMAIL, DEMO_PASSWORD
async function ensureUser(email, password) {
  const existing = await query('SELECT id FROM users WHERE email=LOWER($1)', [email]);
  if (existing.rowCount) return existing.rows[0].id;
  const hash = await bcrypt.hash(password, 10);
  // users table uses column name `password` (not password_hash)
  const { rows } = await query(`INSERT INTO users (email, password, first_name, last_name, phone, city, country, additional_info, photo_url)
    VALUES (LOWER($1), $2, 'Demo', 'User', 'N/A', 'Demo City', 'Demo Country', '', '') RETURNING id`, [email, hash]);
  return rows[0].id;
}

async function createTrip(userId, { name, start_date, end_date, start_location, end_location, description }) {
  const { rows } = await query(`INSERT INTO trips (user_id,name,start_date,end_date,start_location,end_location,description)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [userId, name, start_date, end_date, start_location, end_location, description || null]);
  return rows[0];
}

async function createStop(tripId, { position, city, country, start_date, end_date }) {
  const { rows } = await query(`INSERT INTO trip_stops (trip_id, position, city, country, start_date, end_date)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [tripId, position, city, country || null, start_date, end_date]);
  return rows[0];
}

async function createStopActivity(stopId, userId, { title, cost, category, duration_minutes, day_offset, start_time, notes }) {
  const { rows } = await query(`INSERT INTO stop_activities (trip_stop_id, title, category, cost, duration_minutes, day_offset, start_time, notes, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [stopId, title, category || null, cost, duration_minutes || null, day_offset || 0, start_time || null, notes || null, userId]);
  return rows[0];
}

function addDays(base, add) { const d = new Date(base); d.setDate(d.getDate()+add); return d.toISOString().slice(0,10); }

async function main() {
  const demoEmail = process.env.DEMO_EMAIL || 'demo@example.com';
  const demoPass = process.env.DEMO_PASSWORD || 'Password123!';
  const userId = await ensureUser(demoEmail, demoPass);
  console.log('Using demo user id', userId, 'email', demoEmail);

  // Create a sample trip
  const baseStart = '2025-01-01';
  const trip = await createTrip(userId, {
    name: 'Sample Itinerary',
    start_date: baseStart,
    end_date: addDays(baseStart, 6),
    start_location: 'Start City',
    end_location: 'End City',
    description: 'Seeded demo trip'
  });
  console.log('Trip created', trip.id);

  // Stops
  const stopsData = [
    { position: 1, city: 'Paris', country: 'FR', offset: 0, length: 2 },
    { position: 2, city: 'Berlin', country: 'DE', offset: 2, length: 2 },
    { position: 3, city: 'Rome', country: 'IT', offset: 4, length: 2 }
  ];
  const stops = [];
  for (const s of stopsData) {
    const stop = await createStop(trip.id, {
      position: s.position,
      city: s.city,
      country: s.country,
      start_date: addDays(baseStart, s.offset),
      end_date: addDays(baseStart, s.offset + s.length - 1)
    });
    stops.push(stop);
    console.log('Stop', stop.id, stop.city);
  }

  // Activities
  const activitiesSeed = [
    { stopIdx: 0, title: 'Museum Visit', cost: 40, start_time: '10:00:00', duration_minutes: 120 },
    { stopIdx: 0, title: 'Dinner', cost: 60, start_time: '19:00:00', duration_minutes: 90 },
    { stopIdx: 1, title: 'Walking Tour', cost: 0, start_time: '09:00:00', duration_minutes: 180 },
    { stopIdx: 1, title: 'Concert', cost: 80, start_time: '20:00:00', duration_minutes: 150 },
    { stopIdx: 2, title: 'Colosseum', cost: 55, start_time: '11:00:00', duration_minutes: 120 },
    { stopIdx: 2, title: 'Pasta Workshop', cost: 95, start_time: '16:00:00', duration_minutes: 150 }
  ];
  for (const a of activitiesSeed) {
    const stop = stops[a.stopIdx];
    const act = await createStopActivity(stop.id, userId, a);
    console.log('Activity', act.id, act.title, 'stop', stop.city);
  }

  // Print itinerary summary using same logic as API (lightweight inline)
  const sumRes = await query(`SELECT COUNT(*) AS stops_count FROM trip_stops WHERE trip_id=$1`, [trip.id]);
  const actRes = await query(`SELECT COALESCE(SUM(cost),0) AS total_cost, COUNT(*) AS activities_count FROM stop_activities sa JOIN trip_stops s ON sa.trip_stop_id=s.id WHERE s.trip_id=$1`, [trip.id]);
  console.log('Summary:', {
    tripId: trip.id,
    stops_count: parseInt(sumRes.rows[0].stops_count,10),
    activities_count: parseInt(actRes.rows[0].activities_count,10),
    total_cost: parseFloat(actRes.rows[0].total_cost)
  });

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });