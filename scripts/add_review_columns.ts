import pg from 'pg';

async function main() {
  const conn = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').replace('?sslmode=require', '');
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Adding review_banned_until and review_ban_reason to profiles...');
  await client.query(`
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS review_banned_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS review_ban_reason TEXT;
  `);

  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log('Updated profiles columns:', cols.rows);

  const revCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews'");
  console.log('Reviews columns:', revCols.rows);

  await client.end();
}

main().catch(console.error);
