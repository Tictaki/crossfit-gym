import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Wait, to create buckets we might need the SERVICE_ROLE_KEY.
// Let's check what auth we have. With anon key and assuming RLS policies or just standard setup, we might hit permissions errors creating buckets if we use the client SDK without a service role key.
// But wait, if RLS allows or we use SQL, it's easier.
// A simpler way: The user can create them manually in the Supabase Dashboard, or we can see if we can use a SQL script via Prisma if we have db connection, but buckets are in `storage` schema.
// Let's try with the anon key first, sometimes it works on local or loosely configured projects.

async function createBuckets() {
  if (!url || !key) {
    console.error('Missing Supabase URL or Anon Key');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const requiredBuckets = ['members', 'products', 'settings', 'users'];

  console.log('Checking and creating Supabase Storage buckets...');

  for (const bucketName of requiredBuckets) {
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
    
    if (getError && getError.message.includes('not found') || !bucket) {
      console.log(`Creating bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make it public so images can be retrieved via public URL
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
      });

      if (error) {
        console.error(`❌ Failed to create ${bucketName}:`, error.message);
      } else {
        console.log(`✅ Created public bucket: ${bucketName}`);
      }
    } else if (bucket) {
      if (!bucket.public) {
         console.log(`⚠️ Bucket ${bucketName} exists but is private. Attempting to make public...`);
         const { error } = await supabase.storage.updateBucket(bucketName, {
            public: true
         });
         if (error) {
           console.error(`❌ Failed to update ${bucketName}:`, error.message);
         } else {
           console.log(`✅ Updated ${bucketName} to be public.`);
         }
      } else {
         console.log(`✅ Public bucket ${bucketName} already exists.`);
      }
    } else {
        console.log(`Error checking bucket ${bucketName}: ${getError}`);
    }
  }
}

createBuckets();
