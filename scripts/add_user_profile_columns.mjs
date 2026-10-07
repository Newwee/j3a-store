import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const conn = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').split('?')[0];
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to database, adding columns to public.profiles...');

    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
    `);

    console.log('Columns phone, bio, and social_links added successfully to public.profiles!');
    
    // Verify columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position;
    `);
    console.log('Updated profiles columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error adding columns to profiles:', err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
