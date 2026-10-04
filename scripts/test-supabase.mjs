import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.POSTGRES_URL_NON_POOLING;

console.log('Testing Supabase Client...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 });
    if (error) {
      console.error('Supabase Auth check failed:', error);
    } else {
      console.log('✅ Supabase Auth connection SUCCESS! Users count:', data.users.length);
    }
  } catch (err) {
    console.error('Supabase Auth error:', err.message);
  }

  const cleanDbUrl = dbUrl.split('?')[0];
  const pool = new pg.Pool({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, version() as version;');
    console.log('✅ Postgres Direct Connection SUCCESS!');
    console.log('Current DB Time:', res.rows[0].now);
    console.log('Postgres Version:', res.rows[0].version);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Postgres connection failed:', err.message);
  }
}

test();
