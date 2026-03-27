import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updateCredentials() {
  console.log("🔐 Updating credentials...");

  // Update Admin
  const adminPassword = await bcrypt.hash("Admin#Master2026", 10);
  await prisma.user.upsert({
    where: { email: "admin@crossfitgym.com" }, // Map from old email
    update: {
      email: "gerente@gymove.com",
      password: adminPassword,
      name: "Gerente Gymove"
    },
    create: {
      email: "gerente@gymove.com",
      password: adminPassword,
      name: "Gerente Gymove",
      role: "ADMIN"
    }
  });

  // Also try to upsert by the new email just in case it was already partially changed
  await prisma.user.upsert({
    where: { email: "gerente@gymove.com" },
    update: {
      password: adminPassword,
      name: "Gerente Gymove"
    },
    create: {
      email: "gerente@gymove.com",
      password: adminPassword,
      name: "Gerente Gymove",
      role: "ADMIN"
    }
  });

  // Update Receptionist
  const receptionistPassword = await bcrypt.hash("Staff@Gym2026", 10);
  await prisma.user.upsert({
    where: { email: "recepcao@crossfitgym.com" }, // Map from old email
    update: {
      email: "equipa@gymove.com",
      password: receptionistPassword,
      name: "Equipa Gymove"
    },
    create: {
      email: "equipa@gymove.com",
      password: receptionistPassword,
      name: "Equipa Gymove",
      role: "RECEPTIONIST"
    }
  });

  await prisma.user.upsert({
    where: { email: "equipa@gymove.com" },
    update: {
      password: receptionistPassword,
      name: "Equipa Gymove"
    },
    create: {
      email: "equipa@gymove.com",
      password: receptionistPassword,
      name: "Equipa Gymove",
      role: "RECEPTIONIST"
    }
  });

  console.log("✅ Credentials updated successfully!");
  console.log("Admin: gerente@gymove.com / Admin#Master2026");
  console.log("Staff: equipa@gymove.com / Staff@Gym2026");
}

updateCredentials()
  .catch((e) => {
    console.error("❌ Error updating credentials:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
