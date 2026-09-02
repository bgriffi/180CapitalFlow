import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@180degreesolar.com" },
    update: {},
    create: {
      email: "admin@180degreesolar.com",
      name: "Admin User",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("Admin:", admin.email);

  // Create demo customer
  const customerHash = await bcrypt.hash("customer123!", 12);
  const customer = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      name: "John Smith",
      passwordHash: customerHash,
      role: "CUSTOMER",
    },
  });
  console.log("Customer:", customer.email);

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-1" },
    update: {},
    create: {
      id: "demo-project-1",
      name: "Residential Solar Install",
      address: "123 Sunny Lane, Phoenix, AZ 85001",
      systemSize: 8.5,
      installDate: new Date("2024-03-15"),
    },
  });

  // Create demo loan
  const existing = await prisma.loan.findFirst({ where: { userId: customer.id } });
  if (!existing) {
    const loan = await prisma.loan.create({
      data: {
        userId: customer.id,
        projectId: project.id,
        principalAmount: 28500,
        interestRate: 0.065,
        termMonths: 120,
        monthlyPayment: 322.16,
        startDate: new Date("2024-04-01"),
        status: "ACTIVE",
      },
    });

    // Seed some historical payments
    const payments = [];
    for (let i = 0; i < 6; i++) {
      const dueDate = new Date("2024-04-01");
      dueDate.setMonth(dueDate.getMonth() + i);
      payments.push({
        loanId: loan.id,
        amount: 322.16,
        status: "SUCCEEDED" as const,
        dueDate,
        paidAt: dueDate,
        stripePaymentIntentId: `pi_demo_${i}`,
      });
    }
    await prisma.payment.createMany({ data: payments });
    console.log("Demo loan created with 6 payments");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
