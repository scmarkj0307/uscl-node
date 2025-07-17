require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,         // e.g., db.abcd.supabase.co
  port: 5432,                        // default PostgreSQL port
  user: process.env.PG_USER,         // from Supabase
  password: process.env.PG_PASSWORD, // from Supabase
  database: process.env.PG_DATABASE, // from Supabase
  ssl: {
    rejectUnauthorized: false        // needed for Supabase
  }
});

module.exports = { pool };
