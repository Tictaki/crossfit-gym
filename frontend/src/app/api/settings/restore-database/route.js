import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    // 1. Authenticate user
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check for ADMIN role
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Get backup data from request
    const body = await request.json();
    if (!body || !body.data) {
      return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
    }

    const { data } = body;

    // 4. Perform clear and restore in a transaction
    // The order of clear/create is crucial to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      // CLEAR ALL DATA (Order: Children first)
      await tx.notificationRecipient.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.paymentAudit.deleteMany({});
      await tx.invoice.deleteMany({});
      await tx.sale.deleteMany({});
      await tx.payment.deleteMany({});
      await tx.checkin.deleteMany({});
      await tx.member.deleteMany({});
      await tx.expense.deleteMany({});
      await tx.fixedCost.deleteMany({});
      await tx.product.deleteMany({});
      await tx.plan.deleteMany({});
      await tx.user.deleteMany({});
      await tx.setting.deleteMany({});

      // RESTORE DATA (Order: Parents first)
      // Note: We use individual create calls if createMany is not available or to ensure ID preservation
      // Settings
      if (data.settings?.length > 0) {
        await tx.setting.createMany({ data: data.settings });
      }
      
      // Plans
      if (data.plans?.length > 0) {
        await tx.plan.createMany({ data: data.plans });
      }

      // Products
      if (data.products?.length > 0) {
        await tx.product.createMany({ data: data.products });
      }

      // Users
      if (data.users?.length > 0) {
        await tx.user.createMany({ data: data.users });
      }

      // Members
      if (data.members?.length > 0) {
        await tx.member.createMany({ data: data.members });
      }

      // Payments
      if (data.payments?.length > 0) {
        await tx.payment.createMany({ data: data.payments });
      }

      // Fixed Costs
      if (data.fixedCosts?.length > 0) {
        await tx.fixedCost.createMany({ data: data.fixedCosts });
      }

      // Checkins
      if (data.checkins?.length > 0) {
        await tx.checkin.createMany({ data: data.checkins });
      }

      // Sales
      if (data.sales?.length > 0) {
        await tx.sale.createMany({ data: data.sales });
      }

      // Invoices
      if (data.invoices?.length > 0) {
        await tx.invoice.createMany({ data: data.invoices });
      }

      // Payment Audits
      if (data.paymentAudits?.length > 0) {
        await tx.paymentAudit.createMany({ data: data.paymentAudits });
      }

      // Expenses
      if (data.expenses?.length > 0) {
        await tx.expense.createMany({ data: data.expenses });
      }

      // Notifications
      if (data.notifications?.length > 0) {
        await tx.notification.createMany({ data: data.notifications });
      }

      // Notification Recipients
      if (data.notificationRecipients?.length > 0) {
        await tx.notificationRecipient.createMany({ data: data.notificationRecipients });
      }
    });

    return NextResponse.json({ success: true, message: 'Database restored successfully' });

  } catch (error) {
    console.error('Error restoring database backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore database backup: ' + error.message }, 
      { status: 500 }
    );
  }
}
