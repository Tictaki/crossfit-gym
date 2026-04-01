export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Diagnostic endpoint to check Supabase Storage bucket availability.
 * GET /api/health/storage
 */
export async function GET() {
  const requiredBuckets = ['members', 'products', 'settings', 'users'];
  const results = {};

  try {
    const supabase = createClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to list buckets',
        error: error.message,
        hint: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      }, { status: 500 });
    }

    const existingBucketNames = (buckets || []).map(b => b.name);

    for (const bucket of requiredBuckets) {
      const exists = existingBucketNames.includes(bucket);
      const bucketInfo = exists ? buckets.find(b => b.name === bucket) : null;
      results[bucket] = {
        exists,
        public: bucketInfo?.public ?? false,
      };
    }

    const allOk = requiredBuckets.every(b => results[b].exists && results[b].public);

    return NextResponse.json({
      status: allOk ? 'ok' : 'missing_buckets',
      buckets: results,
      existing: existingBucketNames,
      missingOrPrivate: requiredBuckets.filter(b => !results[b].exists || !results[b].public),
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
