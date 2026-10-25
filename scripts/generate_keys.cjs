const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Safe characters without ambiguous 0/O, 1/I
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomSegment(length = 4) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

const TIER_CONFIG = {
  '3d': {
    prefix: 'J3ADQ-3D',
    durationDays: 3,
    name: '3 Days Trial (ทดลองใช้งาน 3 วัน)',
  },
  '1w': {
    prefix: 'J3ADQ-1W',
    durationDays: 7,
    name: '1 Week (7 วัน)',
  },
  '4w': {
    prefix: 'J3ADQ-4W',
    durationDays: 28,
    name: '4 Weeks (28 วัน)',
  },
  '6m': {
    prefix: 'J3ADQ-6M',
    durationDays: 180,
    name: '6 Months (180 วัน)',
  },
};

function generateKeyString(tier) {
  const cfg = TIER_CONFIG[tier];
  if (!cfg) throw new Error(`Invalid tier: ${tier}`);
  const seg1 = generateRandomSegment(4);
  const seg2 = generateRandomSegment(4);
  const seg3 = generateRandomSegment(4);
  return `${cfg.prefix}-${seg1}-${seg2}-${seg3}`;
}

async function generateBatch(tier, count, notes = 'CLI Batch Generator') {
  const cfg = TIER_CONFIG[tier];
  if (!cfg) {
    console.error(`Unknown tier: ${tier}. Available: 3d, 1w, 4w, 6m`);
    return [];
  }

  const keys = [];
  const rows = [];

  for (let i = 0; i < count; i++) {
    const key = generateKeyString(tier);
    const id = `lic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    keys.push(key);
    rows.push({
      id,
      key,
      product_slug: 'j3adiscordautoquest',
      tier,
      duration_days: cfg.durationDays,
      status: 'available',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from('licenses').insert(rows);
  if (error) {
    console.error(`Error inserting keys for tier ${tier}:`, error.message);
    throw error;
  }

  console.log(`\nSuccessfully generated & saved ${count} keys for tier: [${tier.toUpperCase()}] ${cfg.name}`);
  rows.forEach((r, idx) => {
    console.log(`  ${idx + 1}. ${r.key}`);
  });

  return keys;
}

async function main() {
  const args = process.argv.slice(2);
  let tier = '1w';
  let count = 5;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' && args[i + 1]) {
      tier = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10) || 5;
      i++;
    }
  }

  try {
    if (tier === 'all') {
      console.log(`\n--- Generating ${count} keys for all tiers ---`);
      for (const t of Object.keys(TIER_CONFIG)) {
        await generateBatch(t, count);
      }
    } else {
      await generateBatch(tier, count);
    }
  } catch (e) {
    console.error('Execution failed:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateBatch, generateKeyString, TIER_CONFIG };
