import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const cs = process.env.POSTGRES_URL_NON_POOLING.split('?')[0];
const pool = new pg.Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.settings
        ADD COLUMN IF NOT EXISTS discord_webhook_slip TEXT DEFAULT 'https://discord.com/api/webhooks/1563838807369977917/zubkvc8V0t7i_-CLIbwMhN9yXsx65-yDw_tslKgiM0l9nHbD9xS_Ki4IFAzt1uOB-2Jp',
        ADD COLUMN IF NOT EXISTS discord_webhook_credits TEXT DEFAULT 'https://discord.com/api/webhooks/1563838697554710578/CPBlIplPAYSy9EV9FdIBxw_uoafvAiX-xR-y9DPUgHkRGdcSbaBzaTWxondvdVH46EuG',
        ADD COLUMN IF NOT EXISTS discord_webhook_welcome TEXT DEFAULT 'https://discord.com/api/webhooks/1563838727778730106/zmFHamxQ8WO5EGcO9uhSPOJES0ZLReSGmFa0DX0cqaMF9F7ECuKTGvPuqDJK4ZAMhZsx';
      
      UPDATE public.settings
      SET
        discord_webhook_slip = COALESCE(discord_webhook_slip, 'https://discord.com/api/webhooks/1563838807369977917/zubkvc8V0t7i_-CLIbwMhN9yXsx65-yDw_tslKgiM0l9nHbD9xS_Ki4IFAzt1uOB-2Jp'),
        discord_webhook_credits = COALESCE(discord_webhook_credits, 'https://discord.com/api/webhooks/1563838697554710578/CPBlIplPAYSy9EV9FdIBxw_uoafvAiX-xR-y9DPUgHkRGdcSbaBzaTWxondvdVH46EuG'),
        discord_webhook_welcome = COALESCE(discord_webhook_welcome, 'https://discord.com/api/webhooks/1563838727778730106/zmFHamxQ8WO5EGcO9uhSPOJES0ZLReSGmFa0DX0cqaMF9F7ECuKTGvPuqDJK4ZAMhZsx')
      WHERE id = 'store';
    `);
    console.log('✅ Settings table updated with discord webhook columns!');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
