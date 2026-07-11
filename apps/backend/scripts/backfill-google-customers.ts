/**
 * Script backfill: Tao ban ghi customers cho cac tai khoan Google OAuth
 * da dang nhap nhung chua co row trong bang customers.
 *
 * Chay: npx ts-node scripts/backfill-google-customers.ts
 * (chay tu thu muc apps/backend)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== Backfill: Tao customers cho tai khoan Google OAuth ===\n');

  // 1. Lay tat ca profiles co role='customer'
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, avatar_url')
    .eq('role', 'customer');

  if (profilesErr || !profiles) {
    console.error('Loi khi tai danh sach profiles:', profilesErr?.message);
    process.exit(1);
  }

  console.log(`Tim thay ${profiles.length} profile(s) co role=customer`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of profiles) {
    // 2. Kiem tra xem da co ban ghi customers chua
    const { data: existing } = await supabase
      .from('customers')
      .select('user_id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existing) {
      console.log(`  [SKIP] ${profile.email} — da co ban ghi customers`);
      skipped++;
      continue;
    }

    // 3. Tao ban ghi stub
    const stubCccd = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { error: insertErr } = await supabase
      .from('customers')
      .insert({
        user_id: profile.id,
        full_name: profile.full_name || 'Nguoi dung moi',
        phone: profile.phone || '',
        email: profile.email,
        avatar_url: profile.avatar_url || '',
        cccd: stubCccd,
        nationality: 'Viet Nam',
      });

    if (insertErr) {
      console.error(`  [FAIL] ${profile.email} — ${insertErr.message}`);
      failed++;
    } else {
      console.log(`  [OK]   ${profile.email} — Da tao ban ghi customers (cccd=${stubCccd})`);
      created++;
    }
  }

  console.log(`\n=== Ket qua ===`);
  console.log(`  Da tao moi : ${created}`);
  console.log(`  Bo qua      : ${skipped}`);
  console.log(`  That bai    : ${failed}`);
}

main().catch(console.error);
