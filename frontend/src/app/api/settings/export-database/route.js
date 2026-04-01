import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check for ADMIN role
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Collect backup data (direct database access via Prisma)
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        users: await prisma.user.findMany(),
        members: await prisma.member.findMany(),
        plans: await prisma.plan.findMany(),
        payments: await prisma.payment.findMany(),
        invoices: await prisma.invoice.findMany(),
        paymentAudits: await prisma.paymentAudit.findMany(),
        expenses: await prisma.expense.findMany(),
        checkins: await prisma.checkin.findMany(),
        settings: await prisma.setting.findMany(),
        products: await prisma.product.findMany(),
        sales: await prisma.sale.findMany(),
        notifications: await prisma.notification.findMany(),
        notificationRecipients: await prisma.notificationRecipient.findMany(),
        fixedCosts: await prisma.fixedCost.findMany(),
      }
    };

    const fileName = `crossfit-gym-backup-${new Date().toISOString().split('T')[0]}.json`;

    // 4. Return as JSON response with appropriate headers
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error exporting database backup:', error);
    return NextResponse.json(
      { error: 'Failed to generate database export' }, 
      { status: 500 }
    );
  }
}
