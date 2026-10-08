import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const conn = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').split('?')[0];
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to database, adding Angpao columns...');

    // 1. Add columns to topups
    await client.query(`
      ALTER TABLE public.topups 
      ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'slip',
      ADD COLUMN IF NOT EXISTS voucher_hash TEXT;
    `);

    // 2. Add unique index for voucher_hash if not exists
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_topups_voucher_hash 
      ON public.topups(voucher_hash) 
      WHERE voucher_hash IS NOT NULL;
    `);

    // 3. Add truemoney_phone to settings
    await client.query(`
      ALTER TABLE public.settings 
      ADD COLUMN IF NOT EXISTS truemoney_phone TEXT DEFAULT '0983892996';
    `);

    // If store row already exists and truemoney_phone is null, update it to promptpay
    await client.query(`
      UPDATE public.settings 
      SET truemoney_phone = COALESCE(truemoney_phone, promptpay, '0983892996')
      WHERE id = 'store';
    `);

    console.log('Angpao columns and index added successfully!');

    // Verify
    const topupsCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topups' 
      ORDER BY ordinal_position;
    `);
    console.log('Updated topups columns:', topupsCols.rows.map(r => r.column_name));

    const settingsCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      ORDER BY ordinal_position;
    `);
    console.log('Updated settings columns:', settingsCols.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error adding Angpao columns:', err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
