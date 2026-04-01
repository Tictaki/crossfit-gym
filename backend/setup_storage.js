import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupBuckets() {
  const buckets = ['members', 'products', 'settings', 'users'];
  try {
    console.log("Setting up Supabase Storage buckets...");

    // Insert buckets
    for (const bucket of buckets) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO storage.buckets (id, name, public, "file_size_limit", "allowed_mime_types")
        VALUES ($1, $1, true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
        ON CONFLICT (id) DO UPDATE SET public = true;
      `, bucket);
      console.log(`✅ Upserted bucket: ${bucket}`);
    }

    // Set RLS Policies (Drop if exists, then create)
    const policies = [
      { name: "Public Uploads", cmd: "INSERT", check: "WITH CHECK" },
      { name: "Public Select", cmd: "SELECT", check: "USING" },
      { name: "Public Update", cmd: "UPDATE", check: "USING" },
      { name: "Public Delete", cmd: "DELETE", check: "USING" }
    ];

    for (const policy of policies) {
      try {
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`);
        await prisma.$executeRawUnsafe(`
          CREATE POLICY "${policy.name}" ON storage.objects 
          FOR ${policy.cmd} TO public 
          ${policy.check} (bucket_id IN ('members', 'products', 'settings', 'users'));
        `);
        console.log(`✅ Upserted policy: ${policy.name}`);
      } catch (err) {
         console.log(`⚠️ Policy ${policy.name} issue: ${err.message}`);
      }
    }

    console.log("Storage setup complete!");
  } catch (error) {
    console.error("Error setting up storage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBuckets();
