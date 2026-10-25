import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing license verification logic directly...');

  // Grab one 3D key and one 1W key
  const { data: keys3d } = await supabase
    .from('licenses')
    .select('*')
    .eq('tier', '3d')
    .eq('status', 'available')
    .limit(2);

  const { data: keys1w } = await supabase
    .from('licenses')
    .select('*')
    .eq('tier', '1w')
    .eq('status', 'available')
    .limit(1);

  if (!keys3d || keys3d.length < 2 || !keys1w || keys1w.length < 1) {
    console.error('Not enough test keys available in DB');
    return;
  }

  const testHwid = 'test_hwid_device_001_' + Date.now();
  const differentHwid = 'test_hwid_device_002_' + Date.now();

  console.log('Test HWID:', testHwid);
  console.log('Key 1 (3D Trial):', keys3d[0].key);
  console.log('Key 2 (3D Trial):', keys3d[1].key);
  console.log('Key 3 (1W Paid):', keys1w[0].key);

  // Helper to call our API handler logic directly or simulate
  const simulateVerify = async (key, hwid) => {
    // Check key
    const { data: license } = await supabase.from('licenses').select('*').eq('key', key).single();
    if (!license) return { valid: false, error: 'Not found' };

    const now = new Date();
    if (license.status === 'available' || license.status === 'claimed') {
      if (license.tier === '3d') {
        const { data: trial } = await supabase.from('hwid_trials').select('*').eq('hwid', hwid).maybeSingle();
        if (trial) return { valid: false, error: 'Hardware already used trial' };
      }
      const expiresAt = new Date(now.getTime() + license.duration_days * 86400000);
      await supabase.from('licenses').update({
        status: 'active',
        hwid,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }).eq('id', license.id);

      if (license.tier === '3d') {
        await supabase.from('hwid_trials').insert({ hwid, key });
      }
      return { valid: true, action: 'activated', expiresAt: expiresAt.toISOString() };
    }

    if (license.status === 'active') {
      if (license.hwid !== hwid) return { valid: false, error: 'HWID Mismatch' };
      if (new Date(license.expires_at) <= now) return { valid: false, error: 'Expired' };
      return { valid: true, action: 'verified', remainingMs: new Date(license.expires_at).getTime() - now.getTime() };
    }

    return { valid: false, error: 'Invalid status' };
  };

  // Test 1: Activate 3D key on testHwid
  console.log('\n--- 1. Activating 3D trial key on device 1 ---');
  const res1 = await simulateVerify(keys3d[0].key, testHwid);
  console.log('Result 1:', res1);

  // Test 2: Re-verify same key on device 1
  console.log('\n--- 2. Re-verifying same key on device 1 ---');
  const res2 = await simulateVerify(keys3d[0].key, testHwid);
  console.log('Result 2:', res2);

  // Test 3: Verify key on device 2 (HWID Mismatch)
  console.log('\n--- 3. Verifying key on device 2 (should fail HWID mismatch) ---');
  const res3 = await simulateVerify(keys3d[0].key, differentHwid);
  console.log('Result 3:', res3);

  // Test 4: Device 1 tries to activate a SECOND 3D trial key (should fail trial abuse)
  console.log('\n--- 4. Device 1 tries to activate another 3D trial key (should fail trial abuse) ---');
  const res4 = await simulateVerify(keys3d[1].key, testHwid);
  console.log('Result 4:', res4);

  // Test 5: Device 1 activates 1W paid key (should succeed)
  console.log('\n--- 5. Device 1 activates 1W paid key (should succeed) ---');
  const res5 = await simulateVerify(keys1w[0].key, testHwid);
  console.log('Result 5:', res5);

  // Cleanup test keys and trial entry
  await supabase.from('licenses').delete().in('key', [keys3d[0].key, keys3d[1].key, keys1w[0].key]);
  await supabase.from('hwid_trials').delete().eq('hwid', testHwid);
  console.log('\nTest completed and cleaned up.');
}

test();
