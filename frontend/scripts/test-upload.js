import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testUpload() {
  const supabase = createClient(url, key);
  
  const fileContent = "Hello World PDF or Image Mock";
  
  // Convert string to blob for upload
  const blob = new Blob([fileContent], { type: 'text/plain' });

  console.log('Testing upload to members bucket...');
  const { data, error } = await supabase.storage
    .from('members')
    .upload('test-file.txt', blob, { upsert: true });

  if (error) {
    console.error('❌ Upload failed:', error.message);
  } else {
    console.log('✅ Upload succeeded:', data);
    
    // Test get public URL
    const { data: publicData } = supabase.storage.from('members').getPublicUrl('test-file.txt');
    console.log('Public URL:', publicData.publicUrl);
  }
}

testUpload();
