import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin#Master2026", 10);

  const admin = await prisma.user.upsert({
    where: { email: "gerente@crosstraininggym.com" },
    update: {},
    create: {
      name: "Gerente",
      email: "gerente@crosstraininggym.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create receptionist user
  const receptionistPassword = await bcrypt.hash("Staff@Gym2026", 10);

  const receptionist = await prisma.user.upsert({
    where: { email: "equipa@crosstraininggym.com" },
    update: {},
    create: {
      name: "Equipa Crosstraining",
      email: "equipa@crosstraininggym.com",
      password: receptionistPassword,
      role: "RECEPTIONIST",
    },
  });

  console.log("✅ Receptionist user created:", receptionist.email);

  // Create official plans from catalog
  const plans = [
    {
      id: "plan-mensal-individual",
      name: "Mensal (individual)",
      price: 2000,
      durationDays: 30,
      description: "Plano mensal individual com acompanhamento personal.",
      status: true,
    },
    {
      id: "plan-trimestral-individual",
      name: "Trimestral (individual)",
      price: 4500,
      durationDays: 90,
      description: "Plano trimestral individual com acompanhamento personal.",
      status: true,
    },
    {
      id: "plan-anual-individual",
      name: "Anual (individual)",
      price: 24000,
      durationDays: 365,
      description: "Plano anual individual com acesso total.",
      status: true,
    },
    {
      id: "plan-mensal-casal",
      name: "Mensal Casal/Amigos",
      price: 3000,
      durationDays: 30,
      description: "Plano mensal para casal ou amigos (2 pessoas) com acompanhamento personal.",
      status: true,
    },
    {
      id: "plan-familia",
      name: "Plano Família",
      price: 5000,
      durationDays: 30,
      description: "Plano mensal para família (até 4 pessoas).",
      status: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        price: plan.price,
        description: plan.description,
        durationDays: plan.durationDays,
      },
      create: plan,
    });
  }

  console.log("✅ Plans created");

  console.log("\n📝 Login credentials:");
  console.log("Admin: gerente@crosstraininggym.com / Admin#Master2026");
  console.log("Staff: equipa@crosstraininggym.com / Staff@Gym2026");
  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
